"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Patient } from "@/lib/db/schema";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { formatDate } from "@/lib/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, CalendarClock, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePatient } from "@/server/actions/patients";
import { toast } from "sonner";

import { useConfirm } from "@/contexts/confirm-action-context";
import { useCalendar } from "@/calendar/contexts/calendar-context";

export const columns: ColumnDef<Patient>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
  },
  {
    accessorKey: "dateOfBirth",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data de Nascimento" />
    ),
    cell: ({ row }) => {
      const dateOfBirth = new Date(row.getValue("dateOfBirth"));
      const formatted = formatDate(dateOfBirth);

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "actions",
    header: () => <span>Ações</span>,
    cell: ({ row }) => <PatientActions patient={row.original} />,
  },
];

function PatientActions({ patient }: { patient: Patient }) {
  const confirm = useConfirm();
  const { openAddAppointmentDialog } = useCalendar();

  async function handleDelete() {
    const result = await confirm({
      title: "Eliminar Paciente",
      description:
        "Tem a certeza que deseja eliminar este paciente? Esta ação é irreversível.",
    });

    if (result) {
      // User confirmed — proceed with delete
      const deleteResult = await deletePatient(patient.id);

      if (deleteResult.success) {
        toast.success("Paciente eliminado com sucesso");
      } else {
        toast.error(deleteResult.error);
      }
    }
  }

  function handleSchedule() {
    openAddAppointmentDialog({
      patientId: patient.id,
    });
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="Open menu" size="icon-sm">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer w-full"
            onClick={handleSchedule}
          >
            <CalendarClock />
            Agendar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete}>
            <Trash2 />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

