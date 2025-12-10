"use client";

import { usePathname } from "next/navigation";

import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { IUser } from "@/calendar/interfaces";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const users: IUser[] = [
  { id: "mock-id", name: "Mock User", picturePath: null },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CalendarProvider users={users}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </CalendarProvider>
  );
}
