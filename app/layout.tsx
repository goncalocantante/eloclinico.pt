import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { getUserWithContext, getClinicForUser } from "@/lib/db/queries/queries";
import { SWRConfig } from "swr";
import { getAppointments } from "@/lib/db/queries/appointment-queries";

export const metadata: Metadata = {
  title: "Psychologist App",
  description:
    "Saas platform for psychologists to manage their practice with ease!",
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
              "/api/user": getUserWithContext(),
              "/api/clinic": getClinicForUser(),
              "/api/appointments": getAppointments(),
            },
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
