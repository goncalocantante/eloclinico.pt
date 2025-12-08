"use client";

import useSWR from "swr";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { Patient } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddPatientDialog } from "@/components/dialogs/add-patient-dialog";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PatientsPage() {
  const { data } = useSWR<Patient[]>("/api/patients", fetcher);

  return (
    <div className="flex flex-col w-full items-end">
      <AddPatientDialog>
        <Button className="w-full sm:w-auto">
          <Plus />
          Patient
        </Button>
      </AddPatientDialog>
      <DataTable columns={columns} data={data ?? []} />
    </div>
  );
}
