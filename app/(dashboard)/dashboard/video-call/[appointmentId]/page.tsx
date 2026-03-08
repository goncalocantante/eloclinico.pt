import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { differenceInMinutes } from "date-fns";

import { db } from "@/lib/db/drizzle";
import { appointments, patients } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries/queries";
import { createMeetingToken } from "@/server/video/daily";
import { VideoCallRoom } from "@/components/video-call/video-call-room";

export default async function VideoCallPage({
    params,
}: {
    params: Promise<{ appointmentId: string }>;
}) {
    const { appointmentId } = await params;
    const user = await getUser();

    if (!user) {
        notFound();
    }

    // ─── Fetch appointment with ownership check ────────────────────────────────
    const [appointment] = await db
        .select()
        .from(appointments)
        .where(
            and(
                eq(appointments.id, appointmentId),
                eq(appointments.userId, user.id)
            )
        )
        .limit(1);

    if (!appointment) {
        notFound();
    }

    // ─── Validate video call is configured ─────────────────────────────────────
    if (!appointment.videoCallUrl || !appointment.videoCallRoomName) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 text-zinc-50">
                <div className="flex flex-col items-center gap-4 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="text-2xl">📹</span>
                    </div>
                    <h1 className="text-xl font-semibold">Videochamada não disponível</h1>
                    <p className="text-zinc-400 text-sm max-w-md">
                        Esta consulta não tem videochamada configurada.
                    </p>
                    <a
                        href="/dashboard/calendar"
                        className="mt-2 px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg border border-zinc-700 transition-colors"
                    >
                        Voltar ao calendário
                    </a>
                </div>
            </div>
        );
    }

    // ─── Fetch patient name ────────────────────────────────────────────────────
    const [patient] = await db
        .select({ name: patients.name })
        .from(patients)
        .where(eq(patients.id, appointment.patientId))
        .limit(1);

    const patientName = patient?.name || "Paciente";

    // ─── Generate meeting token ────────────────────────────────────────────────
    // Token expiry based on remaining time until appointment ends
    const now = new Date();
    const remainingMinutes = Math.max(
        differenceInMinutes(appointment.endDateTime, now),
        30 // minimum 30 minutes
    );

    const token = await createMeetingToken({
        roomName: appointment.videoCallRoomName,
        userName: user.name,
        isOwner: true,
        expiryMinutes: remainingMinutes,
    });

    if (!token) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 text-zinc-50">
                <div className="flex flex-col items-center gap-4 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h1 className="text-xl font-semibold">Erro ao entrar na chamada</h1>
                    <p className="text-zinc-400 text-sm max-w-md">
                        Não foi possível gerar o token de acesso à videochamada. Tente novamente.
                    </p>
                    <a
                        href="/dashboard/calendar"
                        className="mt-2 px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg border border-zinc-700 transition-colors"
                    >
                        Voltar ao calendário
                    </a>
                </div>
            </div>
        );
    }

    // ─── Render video call room ────────────────────────────────────────────────
    return (
        <VideoCallRoom
            roomUrl={appointment.videoCallUrl}
            token={token}
            appointmentTitle={appointment.title || "Consulta"}
            participantName={patientName}
            isOwner={true}
        />
    );
}
