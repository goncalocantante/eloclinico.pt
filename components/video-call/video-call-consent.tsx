"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import { VideoCallRoom } from "@/components/video-call/video-call-room";
import { generatePatientToken } from "@/server/video/generate-patient-token";

// ─── Component states ────────────────────────────────────────────────────────
type PageState = "consent" | "joining" | "in-call" | "ended" | "error";

interface VideoCallConsentProps {
    appointmentId: string;
    appointmentTitle: string;
    startDateTime: string; // ISO string
    endDateTime: string; // ISO string
}

export function VideoCallConsent({
    appointmentId,
    appointmentTitle,
    startDateTime,
    endDateTime,
}: VideoCallConsentProps) {
    const [pageState, setPageState] = useState<PageState>("consent");
    const [userName, setUserName] = useState("");
    const [consentChecked, setConsentChecked] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Token + room URL after consent
    const [token, setToken] = useState<string | null>(null);
    const [roomUrl, setRoomUrl] = useState<string | null>(null);

    const canJoin = consentChecked && userName.trim().length > 0;

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    // ─── Join handler ────────────────────────────────────────────────────────────
    const handleJoin = useCallback(async () => {
        if (!canJoin) return;

        setPageState("joining");
        setError(null);

        const result = await generatePatientToken(appointmentId, userName.trim());

        if (!result.success) {
            setError(result.error);
            setPageState("error");
            return;
        }

        setToken(result.token);
        setRoomUrl(result.roomUrl);
        setPageState("in-call");
    }, [appointmentId, userName, canJoin]);

    // ─── Leave handler (passed to VideoCallRoom) ────────────────────────────────
    const handleLeave = useCallback(() => {
        setPageState("ended");
    }, []);

    // ─── Call ended screen ──────────────────────────────────────────────────────
    if (pageState === "ended") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 px-4">
                <div className="flex flex-col items-center gap-5 text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                        <span className="text-4xl">✅</span>
                    </div>
                    <h1 className="text-2xl font-semibold">Chamada terminada</h1>
                    <p className="text-zinc-400 text-[15px] leading-relaxed">
                        Obrigado! A sua consulta terminou. Todos os dados da chamada são
                        automaticamente eliminados.
                    </p>
                    <p className="text-zinc-500 text-sm">
                        Pode fechar esta janela em segurança.
                    </p>
                </div>
            </div>
        );
    }

    // ─── In-call screen ─────────────────────────────────────────────────────────
    if (pageState === "in-call" && token && roomUrl) {
        return (
            <VideoCallRoom
                roomUrl={roomUrl}
                token={token}
                appointmentTitle={appointmentTitle}
                participantName={userName}
                isOwner={false}
                onLeave={handleLeave}
            />
        );
    }

    // ─── Consent / pre-join screen ──────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
            <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">📹</span>
                        <h1 className="text-xl font-semibold">Videochamada</h1>
                    </div>
                    <p className="text-blue-100 text-sm mt-1">
                        Consulta de saúde mental
                    </p>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Appointment info */}
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {appointmentTitle || "Consulta"}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>📅</span>
                            <span>
                                {format(startDate, "d 'de' MMMM 'de' yyyy", { locale: pt })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>🕐</span>
                            <span>
                                {format(startDate, "HH:mm", { locale: pt })} –{" "}
                                {format(endDate, "HH:mm", { locale: pt })}
                            </span>
                        </div>
                    </div>

                    {/* Name input */}
                    <div className="space-y-2">
                        <label
                            htmlFor="patient-name"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            O seu nome
                        </label>
                        <input
                            id="patient-name"
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Insira o seu nome..."
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                            maxLength={100}
                        />
                    </div>

                    {/* GDPR consent */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="text-blue-600 dark:text-blue-400 text-lg mt-0.5">
                                🔒
                            </span>
                            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    Aviso de Privacidade
                                </p>
                                <p>Ao entrar nesta videochamada, aceita que:</p>
                                <ul className="space-y-1.5 pl-1">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        <span>A chamada <strong>NÃO é gravada</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        <span>Os seus dados são processados na UE</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        <span>
                                            Apenas o seu nome (inserido acima) é partilhado com o
                                            profissional
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        <span>
                                            Após a consulta, todos os dados da chamada são
                                            automaticamente eliminados
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        <span>
                                            Pode consultar a nossa{" "}
                                            <Link
                                                href="/privacy"
                                                className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300"
                                                target="_blank"
                                            >
                                                Política de Privacidade
                                            </Link>
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <label
                            htmlFor="gdpr-consent"
                            className="flex items-center gap-3 cursor-pointer pt-2 border-t border-blue-200 dark:border-blue-800"
                        >
                            <input
                                id="gdpr-consent"
                                type="checkbox"
                                checked={consentChecked}
                                onChange={(e) => setConsentChecked(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Li e aceito o aviso de privacidade
                            </span>
                        </label>
                    </div>

                    {/* Error message */}
                    {(pageState === "error" && error) && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    {/* Join button */}
                    <button
                        onClick={handleJoin}
                        disabled={!canJoin || pageState === "joining"}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white disabled:text-gray-500 dark:disabled:text-gray-500 font-medium rounded-xl transition-all text-sm cursor-pointer"
                        type="button"
                    >
                        {pageState === "joining" ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                A entrar...
                            </span>
                        ) : (
                            "Entrar na Chamada"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
