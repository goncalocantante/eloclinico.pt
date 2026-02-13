import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { AddAppointmentDialog } from "@/calendar/components/dialogs/add-appointment-dialog";
import { IUser } from "@/calendar/interfaces";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ConfirmProvider } from "@/contexts/confirm-action-context";
import { BreadcrumbComponent } from "@/components/breadcrumb-component";

const users: IUser[] = [
  { id: "mock-id", name: "Mock User", picturePath: null },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <CalendarProvider users={users}>
        <ConfirmProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:hidden">
              <SidebarTrigger className="-ml-1" />
            </header>
            <main className="flex-1 overflow-y-auto p-0 lg:p-4">
              <BreadcrumbComponent />
              {children}
            </main>
          </SidebarInset>
          <AddAppointmentDialog />
        </ConfirmProvider>
      </CalendarProvider>
    </SidebarProvider>
  );
}
