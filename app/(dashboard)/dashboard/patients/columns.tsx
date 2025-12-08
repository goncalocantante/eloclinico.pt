"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Patient } from "@/lib/db/schema";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

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
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "information",
    header: "Information",
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of Birth",
  },
];
