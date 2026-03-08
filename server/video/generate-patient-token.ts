"use server";

import { getAppointmentForVideoCall } from "@/lib/db/queries/appointment-queries";
import { createMeetingToken } from "@/server/video/daily";
import { differenceInMinutes } from "date-fns";

/**
 * Server action for the public video call page.
 * Generates a meeting token with isOwner: false for the patient.
 * No authentication required — patients access via shared link.
 *
 * GDPR: Only the entered name is used as userName in the token.
 * No PII is stored or logged.
 */
export async function generatePatientToken(
  appointmentId: string,
  userName: string
): Promise<
  | { success: true; token: string; roomUrl: string }
  | { success: false; error: string }
> {
  try {
    // Validate inputs
    if (!appointmentId || !userName.trim()) {
      return { success: false, error: "Dados inválidos." };
    }

    const appointment = await getAppointmentForVideoCall(appointmentId);

    if (!appointment) {
      return { success: false, error: "Consulta não encontrada." };
    }

    if (!appointment.videoCallUrl || !appointment.videoCallRoomName) {
      return {
        success: false,
        error: "Esta consulta não tem videochamada configurada.",
      };
    }

    // Calculate token expiry based on remaining time
    const now = new Date();
    const remainingMinutes = Math.max(
      differenceInMinutes(appointment.endDateTime, now),
      30 // minimum 30 minutes
    );

    const token = await createMeetingToken({
      roomName: appointment.videoCallRoomName,
      userName: userName.trim(),
      isOwner: false,
      expiryMinutes: remainingMinutes,
    });

    if (!token) {
      return {
        success: false,
        error: "Não foi possível gerar o token de acesso.",
      };
    }

    return {
      success: true,
      token,
      roomUrl: appointment.videoCallUrl,
    };
  } catch (error) {
    console.error(
      "Error generating patient token:",
      (error as Error).message || error
    );
    return {
      success: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}
