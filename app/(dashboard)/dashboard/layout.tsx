"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Settings, Shield, Activity, Menu } from "lucide-react";
import { UserContext } from "@/lib/db/schema";
import useSWR from "swr";

import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { IUser, IEvent } from "@/calendar/interfaces";
import { fetcher } from "@/lib/utils";

// Fetch your events and users data
// const events = await getEvents();
// const users = await getUsers();
const events: IEvent[] = [
  {
    id: 123456,
    title: "Team Meeting",
    description:
      "Monthly sync with the product team to discuss progress and blockers.",
    startDate: "2025-11-26T10:00:00.000Z",
    endDate: "2025-11-27T11:00:00.000Z",
    color: "blue",
    user: { id: "mock-id", name: "Mock User", picturePath: null },
  },
];

const users: IUser[] = [
  { id: "mock-id", name: "Mock User", picturePath: null },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: user } = useSWR<UserContext>("/api/user", fetcher);
  const { data: events } = useSWR<IEvent>("/api/appointments", fetcher);
  const isPsychologist =
    user?.effectiveRole === "owner" || user?.role === "psychologist";

  const navItems = [
    { href: "/dashboard", icon: Users, label: "Clinic" },
    ...(isPsychologist
      ? [
          {
            href: "/dashboard/patients",
            icon: Users,
            label: "Patients",
          },
        ]
      : []),
    { href: "/dashboard/calendar", icon: Settings, label: "Calendar" },
    { href: "/dashboard/general", icon: Settings, label: "General" },
    { href: "/dashboard/activity", icon: Activity, label: "Activity" },
    { href: "/dashboard/security", icon: Shield, label: "Security" },
  ];

  return (
    <CalendarProvider users={users} events={events}>
      <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
          <div className="flex items-center">
            <span className="font-medium">Settings</span>
          </div>
          <Button
            className="-mr-3"
            variant="ghost"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden h-full">
          {/* Sidebar */}
          <aside
            className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
              isSidebarOpen ? "block" : "hidden"
            } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <nav className="h-full overflow-y-auto p-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className={`shadow-none my-1 w-full justify-start ${
                      pathname === item.href ? "bg-gray-100" : ""
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
        </div>
      </div>
    </CalendarProvider>
  );
}
