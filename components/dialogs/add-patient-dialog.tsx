"use client";

import { useDisclosure } from "@/hooks/use-disclosure";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogHeader,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { PatientForm } from "../forms/patient-form";

interface IProps {
  children: React.ReactNode;
  startDate?: Date;
  startTime?: string | undefined;
  endTime?: string | undefined;
}

export function AddPatientDialog({ children }: IProps) {
  const { isOpen, onToggle, onClose } = useDisclosure();

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <PatientForm onClose={onClose} />

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button form="patient-form" type="submit">
            Criar Paciente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
