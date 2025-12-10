"use client";

import * as React from "react";
import { SquareTerminal, Calendar, Sprout } from "lucide-react";

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

// This is sample data.
const data = {
  navMain: [
    {
      title: "Agenda",
      url: "/dashboard/calendar/week-view",
      icon: Calendar,
      isActive: true,
    },
    {
      title: "Pacientes",
      url: "/dashboard/patients",
      icon: SquareTerminal,
      isActive: true,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user } = useSWR<User>("/api/user", fetcher);

  if (!user) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
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
