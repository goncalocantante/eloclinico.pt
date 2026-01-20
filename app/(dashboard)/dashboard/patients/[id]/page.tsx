import { getPatientById } from "@/lib/db/queries/patient-queries";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PatientPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const patient = await getPatientById(id);

    if (!patient) {
        notFound();
    }

    return (
        <div className="flex flex-col w-full gap-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/patients">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">{patient.name}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Informações Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{patient.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                                {patient.dateOfBirth
                                    ? formatDate(new Date(patient.dateOfBirth))
                                    : "Sem data de nascimento"}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Contactos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{patient.email}</span>
                        </div>
                        {patient.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{patient.phone}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
