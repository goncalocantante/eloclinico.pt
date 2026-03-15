import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { getUser } from "@/lib/db/queries/queries";
import { SWRConfig } from "swr";
import { getAppointments } from "@/lib/db/queries/appointment-queries";
import { getEvents } from "@/server/actions/events";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes"; // Added: manages light/dark mode by changing the class on <html>
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
      suppressHydrationWarning // Prevents hydration mismatch warnings when theme is applied on the client
      className={`${manrope.className} bg-white text-black dark:bg-gray-950 dark:text-white`} // Base light/dark colors
    >
      <body>
        <ThemeProvider
          attribute="class" // Tells next-themes to add/remove "dark" on the html element
          defaultTheme="light" // Light mode is the default when the app loads
          enableSystem={false} // Ignores the device OS theme so it always starts in light mode
          disableTransitionOnChange // Avoids flickering when switching theme
        >
          <SWRConfig
            value={{
              fallback: {
                user: getUser(),
                appointments: getAppointments(),
                events: getEvents(),
              },
            }}
          >
            {children}
            <Toaster />
            <SpeedInsights />
          </SWRConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}