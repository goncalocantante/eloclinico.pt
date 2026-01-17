import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { getUser } from "@/lib/db/queries/queries";
import { SWRConfig } from "swr";
import { getAppointments } from "@/lib/db/queries/appointment-queries";
import { getEvents } from "@/server/actions/events";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Elo - Gestão de Consultório de Psicologia",
  description:
    "Otimize a sua prática de psicologia com o Elo. Agendamento, notas de pacientes e muito mais.",
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const manrope = Manrope({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here
              // Only components that read this data will suspend
              "/api/user": getUser(),
              "/api/appointments": getAppointments(),
              "/api/events": getEvents(),
            },
          }}
        >
          {children}
          <Toaster />
          <SpeedInsights />
        </SWRConfig>
      </body>
    </html>
  );
}
