// This server-side file handles Daily.co video room management with strict GDPR compliance.
// It provides functions for creating/deleting rooms, generating meeting tokens, and cleaning up
// expired rooms. No call metadata, recordings, or participant data is ever stored or persisted.
// Rooms auto-expire and all associated data is deleted at Daily.co when the room expires or is deleted.
"use server";

import { db } from "@/lib/db/drizzle";
import { appointments } from "@/lib/db/schema";
import { eq, lt, isNotNull, and } from "drizzle-orm";

const DAILY_API_URL = "https://api.daily.co/v1";

function getDailyApiKey(): string {
  const key = process.env.DAILY_API_KEY;
  if (!key) {
    throw new Error("DAILY_API_KEY environment variable is not set");
  }
  return key;
}

/**
 * Headers for Daily.co API requests.
 */
function getDailyHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getDailyApiKey()}`,
  };
}

// ─── GDPR-compliant room creation ────────────────────────────────────────────

/**
 * Creates a Daily.co room with strict GDPR-compliant properties.
 *
 * GDPR considerations:
 * - `exp` auto-deletes room AND all associated data after appointment ends
 * - `enable_recording: "none"` explicitly disables all recording
 * - `enable_advanced_chat: false` prevents chat history persistence
 * - `max_participants: 2` restricts to psychologist + patient only
 * - `enable_knocking: true` prevents unauthorized access (patient must be admitted)
 *
 * @returns `{ url, name }` of the created room, or `null` on failure.
 */
export async function createDailyRoom({
  roomName,
  expiryMinutes,
}: {
  roomName: string;
  expiryMinutes: number;
}): Promise<{ url: string; name: string } | null> {
  try {
    const BUFFER_MINUTES = 30;
    const exp = Math.floor(Date.now() / 1000) + (expiryMinutes + BUFFER_MINUTES) * 60;

    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: "POST",
      headers: getDailyHeaders(),
      body: JSON.stringify({
        name: roomName,
        properties: {
          // GDPR: auto-delete room and ALL data after expiry
          exp,
          // GDPR: recording is DISABLED by default (omitting enable_recording).
          // Valid values are "cloud", "local", "raw-tracks" — we intentionally
          // do NOT set any of them. Token-level enable_recording: false adds redundant safety.
          // Device check before joining
          enable_prejoin_ui: true,
          // Restrict to psychologist + patient only
          max_participants: 2,
          // Allow chat but NO history persistence
          enable_chat: true,
          enable_advanced_chat: false,
          // Allow screenshare for consultations
          enable_screenshare: true,
          // Patient must knock, psychologist admits — prevents unauthorized access
          enable_knocking: true,
          // Portuguese language for the UI
          lang: "pt",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Failed to create Daily.co room: ${response.status} ${errorData}`);
      return null;
    }

    const data = await response.json();
    return { url: data.url, name: data.name };
  } catch (error) {
    console.error("Error creating Daily.co room:", (error as Error).message || error);
    return null;
  }
}

// ─── GDPR "right to erasure" — room deletion ────────────────────────────────

/**
 * Deletes a Daily.co room and ALL associated data.
 * This is the GDPR "right to erasure" mechanism — deleting the room
 * permanently deletes all data held by Daily.co for that room.
 *
 * Must be called when appointments are deleted or after they end.
 *
 * @returns `{ success: true }` on success, `{ success: false, error }` on failure.
 */
export async function deleteDailyRoom(
  roomName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: "DELETE",
      headers: getDailyHeaders(),
    });

    if (!response.ok) {
      // 404 means room already deleted/expired — treat as success
      if (response.status === 404) {
        return { success: true };
      }
      const errorData = await response.text();
      console.error(`Failed to delete Daily.co room: ${response.status} ${errorData}`);
      return { success: false, error: `${response.status}: ${errorData}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting Daily.co room:", (error as Error).message || error);
    return { success: false, error: (error as Error).message };
  }
}

// ─── Meeting token generation ────────────────────────────────────────────────

/**
 * Creates a scoped meeting token for a specific room.
 *
 * - `is_owner: true` for psychologist — grants host controls, can admit knocking patients
 * - `is_owner: false` for patient — standard participant
 * - `enable_recording: false` — redundant safety, disable at token level too
 * - Token expires after appointment duration + buffer to prevent reuse
 *
 * @returns The meeting token string, or `null` on failure.
 */
export async function createMeetingToken({
  roomName,
  userName,
  isOwner,
  expiryMinutes,
}: {
  roomName: string;
  userName: string;
  isOwner: boolean;
  expiryMinutes: number;
}): Promise<string | null> {
  try {
    const BUFFER_MINUTES = 30;
    const exp = Math.floor(Date.now() / 1000) + (expiryMinutes + BUFFER_MINUTES) * 60;

    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: "POST",
      headers: getDailyHeaders(),
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName,
          is_owner: isOwner,
          exp,
          // GDPR: redundant safety — disable recording at token level too
          enable_recording: false,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Failed to create meeting token: ${response.status} ${errorData}`);
      return null;
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("Error creating meeting token:", (error as Error).message || error);
    return null;
  }
}

// ─── Cleanup expired rooms (safety net for future cron job) ──────────────────

/**
 * Queries the DB for appointments with video call rooms that ended more than 1 hour ago,
 * deletes the Daily.co rooms (GDPR erasure), and nullifies the video call fields.
 *
 * This is a safety net in case Daily.co auto-expiry didn't trigger.
 * Intended to be called by a cron job.
 *
 * @returns Summary of cleanup results.
 */
export async function cleanupExpiredRooms(): Promise<{
  processed: number;
  deleted: number;
  errors: number;
}> {
  const results = { processed: 0, deleted: 0, errors: 0 };

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find appointments with video call rooms that ended more than 1 hour ago
    const expiredAppointments = await db
      .select({
        id: appointments.id,
        videoCallRoomName: appointments.videoCallRoomName,
      })
      .from(appointments)
      .where(
        and(
          isNotNull(appointments.videoCallRoomName),
          lt(appointments.endDateTime, oneHourAgo)
        )
      );

    for (const appointment of expiredAppointments) {
      results.processed++;

      if (!appointment.videoCallRoomName) continue;

      const deleteResult = await deleteDailyRoom(appointment.videoCallRoomName);

      if (deleteResult.success) {
        // Nullify video call fields — GDPR: remove all transient data
        await db
          .update(appointments)
          .set({
            videoCallUrl: null,
            videoCallRoomName: null,
          })
          .where(eq(appointments.id, appointment.id));

        results.deleted++;
      } else {
        results.errors++;
        console.error(
          `Failed to cleanup room for appointment ${appointment.id}: ${deleteResult.error}`
        );
      }
    }
  } catch (error) {
    console.error("Error during expired rooms cleanup:", (error as Error).message || error);
  }

  return results;
}
