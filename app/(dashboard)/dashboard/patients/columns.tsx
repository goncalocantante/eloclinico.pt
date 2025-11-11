"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Patient } from "@/lib/db/schema";

export const columns: ColumnDef<Patient>[] = [
  // {
  //   accessorKey: "profileImage",
  //   header: "Profile Image",
  // },
  {
    accessorKey: "name",
    header: "Name",
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
