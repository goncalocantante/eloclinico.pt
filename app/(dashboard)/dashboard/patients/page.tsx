import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddPatientDialog } from "@/components/dialogs/add-patient-dialog";
import { getPatients } from "@/server/actions/patients";

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div className="flex flex-col w-full items-end">
      <div className="flex justify-between items-center w-full mb-4">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <AddPatientDialog>
          <Button className="w-full sm:w-auto">
            <Plus />
            Novo Paciente
          </Button>
        </AddPatientDialog>
      </div>
      <DataTable columns={columns} data={patients} />
    </div>
  );
}
