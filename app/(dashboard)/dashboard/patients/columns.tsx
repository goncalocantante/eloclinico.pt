"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Patient } from "@/lib/db/schema";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { formatDate } from "@/lib/formatters";

export const columns: ColumnDef<Patient>[] = [
  // {
  //   accessorKey: "profileImage",
  //   header: "Profile Image",
  // },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
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
  // {
  //   accessorKey: "address",
  //   header: "Address",
  // },
  // {
  //   accessorKey: "information",
  //   header: "Information",
  // },
  {
    accessorKey: "dateOfBirth",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date of Birth" />
    ),
    cell: ({ row }) => {
      const dateOfBirth = new Date(row.getValue("dateOfBirth"));
      const formatted = formatDate(dateOfBirth);

      return <div>{formatted}</div>;
    },
  },
];
