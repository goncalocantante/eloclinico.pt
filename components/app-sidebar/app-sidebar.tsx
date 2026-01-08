"use client";

import * as React from "react";
import { SquareTerminal, Calendar, Sprout } from "lucide-react";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/app-sidebar/nav-main";
import { NavUser } from "@/components/app-sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import { User } from "@/lib/db/schema";
import Logo from "@/components/logo";

// Navigation items configuration (without isActive - it's calculated dynamically)
const navItems = [
  {
    title: "Agenda",
    url: "/dashboard/calendar/week-view",
    icon: Calendar,
    subItems: [
      {
        title: "Disponibilidade",
        url: "/dashboard/calendar/availability",
      },
      {
        title: "Eventos",
        url: "/dashboard/calendar/events",
      },
    ],
  },
  {
    title: "Pacientes",
    url: "/dashboard/patients",
    icon: SquareTerminal,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user } = useSWR<User>("/api/user", fetcher);
  const pathname = usePathname();

  // Dynamically calculate isActive based on current pathname
  const navMain = navItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + "/"),
  }));

  if (!user) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.image ?? "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
