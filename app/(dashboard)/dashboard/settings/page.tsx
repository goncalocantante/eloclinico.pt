"use client";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DEMO_USER_EMAIL } from "@/constants";

export default function SettingsPage() {
    const [isLinking, setIsLinking] = useState(false);
    const { data: session } = authClient.useSession();

    // Check if user already has google linked - simplistic check based on provider
    // Better Auth session might not expose linked accounts deeply without active query
    // For now, we just show the button. 
    // Ideally, we'd list linked accounts.

    const handleLinkGoogle = async () => {
        setIsLinking(true);
        await authClient.linkSocial({
            provider: "google",
            callbackURL: "/dashboard/settings",
        }, {
            onSuccess: () => {
                toast.success("Conta Google conectada com sucesso!");
                setIsLinking(false);
            },
            onError: (ctx) => {
                toast.error(ctx.error.message);
                setIsLinking(false);
            }
        });
    };

    if (!session) {
        return null;
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Definições</h2>
            </div>
            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Contas Conectadas</CardTitle>
                        <CardDescription>
                            Gerencie as contas conectadas ao seu perfil.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-4">
                                <svg
                                    viewBox="0 0 18 18"
                                    aria-hidden="true"
                                    className="size-8"
                                    fill="none"
                                >
                                    <path
                                        d="M17.64 9.2c0-.64-.06-1.25-.18-1.84H9v3.48h4.86a4.16 4.16 0 0 1-1.8 2.73v2.27h2.91c1.7-1.56 2.67-3.86 2.67-6.64Z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M9 18c2.43 0 4.47-.8 5.96-2.16l-2.91-2.27c-.81.54-1.85.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.9v2.33A8.99 8.99 0 0 0 9 18Z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M3.95 10.72a5.4 5.4 0 0 1 0-3.45V4.94H.9a9 9 0 0 0 0 8.12l3.05-2.34Z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M9 3.54c1.32 0 2.5.45 3.43 1.33l2.57-2.57C13.46.88 11.42 0 9 0A8.99 8.99 0 0 0 .9 4.94l3.05 2.33C4.66 5.11 6.65 3.54 9 3.54Z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                <div className="space-y-1">
                                    <p className="font-medium leading-none">Google Calendar</p>
                                    <p className="text-sm text-muted-foreground">
                                        Sincronize seus eventos com o Google Calendar.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleLinkGoogle}
                                disabled={isLinking || session.user.email === DEMO_USER_EMAIL}
                            >
                                {isLinking ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : null}
                                {session.user.email === DEMO_USER_EMAIL ? "Indisponível em Demo" : "Conectar"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
