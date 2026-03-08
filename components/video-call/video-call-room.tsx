"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

// ─── Props designed for reuse by both psychologist and patient pages ─────────
export interface VideoCallRoomProps {
    roomUrl: string;
    token: string;
    appointmentTitle: string;
    participantName: string; // the other participant's name
    isOwner?: boolean;
    onLeave?: () => void; // Optional callback — if not provided, redirects to /dashboard/calendar
}

// ─── Call states ─────────────────────────────────────────────────────────────
type CallState = "idle" | "joining" | "joined" | "left" | "error";

export function VideoCallRoom({
    roomUrl,
    token,
    appointmentTitle,
    participantName,
    isOwner = false,
    onLeave,
}: VideoCallRoomProps) {
    const router = useRouter();
    const callRef = useRef<DailyCall | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [callState, setCallState] = useState<CallState>("idle");
    const [error, setError] = useState<string | null>(null);

    // ─── Create and join the call ──────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || callState !== "idle") return;

        const joinCall = async () => {
            setCallState("joining");

            try {
                const callFrame = DailyIframe.createFrame(containerRef.current!, {
                    iframeStyle: {
                        width: "100%",
                        height: "100%",
                        border: "0",
                        borderRadius: "12px",
                    },
                    showLeaveButton: false, // We provide our own
                    showFullscreenButton: true,
                    // GDPR: Portuguese language
                    lang: "pt",
                });

                callRef.current = callFrame;

                callFrame.on("joined-meeting", () => setCallState("joined"));
                callFrame.on("left-meeting", () => setCallState("left"));
                callFrame.on("error", (event) => {
                    console.error("Daily call error:", event);
                    setError("Ocorreu um erro na videochamada.");
                    setCallState("error");
                });

                await callFrame.join({
                    url: roomUrl,
                    token: token,
                });
            } catch (err) {
                console.error("Failed to join call:", err);
                setError("Não foi possível entrar na videochamada.");
                setCallState("error");
            }
        };

        joinCall();

        // Cleanup on unmount
        return () => {
            if (callRef.current) {
                callRef.current.destroy();
                callRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Leave call handler ────────────────────────────────────────────────────
    const handleLeave = useCallback(async () => {
        if (callRef.current) {
            await callRef.current.leave();
            callRef.current.destroy();
            callRef.current = null;
        }
        if (onLeave) {
            onLeave();
        } else {
            router.push("/dashboard/calendar");
        }
    }, [router, onLeave]);

    // ─── Redirect after call ends ──────────────────────────────────────────────
    useEffect(() => {
        if (callState === "left") {
            if (onLeave) {
                onLeave();
            } else {
                router.push("/dashboard/calendar");
            }
        }
    }, [callState, router, onLeave]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-50">
            {/* ── GDPR Banner ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-green-500/10 border-b border-green-500/20 text-green-400 text-[13px] font-medium tracking-wide shrink-0">
                <span className="text-sm">🔒</span>
                <span>Esta chamada não é gravada</span>
            </div>

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <h1 className="text-base font-semibold truncate">
                        {appointmentTitle || "Videochamada"}
                    </h1>
                    <span className="text-[13px] text-zinc-400">
                        {isOwner ? "Paciente" : "Psicólogo(a)"}: {participantName}
                    </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {callState === "joining" && (
                        <span className="text-[13px] text-zinc-400 animate-pulse">
                            A entrar...
                        </span>
                    )}
                    <button
                        onClick={handleLeave}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
                        type="button"
                    >
                        Sair da chamada
                    </button>
                </div>
            </div>

            {/* ── Video area ──────────────────────────────────────────────────── */}
            <div className="flex-1 relative overflow-hidden p-2">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-red-300 text-[15px]">
                        <p>{error}</p>
                        <button
                            onClick={() => onLeave ? onLeave() : router.push("/dashboard/calendar")}
                            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[13px] font-medium rounded-lg border border-zinc-700 transition-colors cursor-pointer"
                            type="button"
                        >
                            {onLeave ? "Fechar" : "Voltar ao calendário"}
                        </button>
                    </div>
                ) : (
                    <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
                )}
            </div>
        </div>
    );
}
