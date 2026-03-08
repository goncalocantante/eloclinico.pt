import { notFound } from "next/navigation";
import { getAppointmentForVideoCall } from "@/lib/db/queries/appointment-queries";
import { VideoCallConsent } from "@/components/video-call/video-call-consent";

/**
 * Public video call page for patients.
 * No authentication required — patients access via shared link.
 * No tracking, no cookies, no analytics.
 */
export default async function PublicVideoCallPage({
    params,
}: {
    params: Promise<{ appointmentId: string }>;
}) {
    const { appointmentId } = await params;

    // ─── Fetch minimal appointment data ──────────────────────────────────────────
    const appointment = await getAppointmentForVideoCall(appointmentId);

    if (!appointment) {
        notFound();
    }

    // ─── Validate video call is configured ───────────────────────────────────────
    if (!appointment.videoCallUrl || !appointment.videoCallRoomName) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-6">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <span className="text-2xl">📹</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Videochamada não disponível
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Esta consulta não tem videochamada configurada. Por favor, contacte o
                        seu profissional de saúde.
                    </p>
                </div>
            </div>
        );
    }

    // ─── Render consent screen ───────────────────────────────────────────────────
    return (
        <VideoCallConsent
            appointmentId={appointment.id}
            appointmentTitle={appointment.title || "Consulta"}
            startDateTime={appointment.startDateTime.toISOString()}
            endDateTime={appointment.endDateTime.toISOString()}
        />
    );
}
