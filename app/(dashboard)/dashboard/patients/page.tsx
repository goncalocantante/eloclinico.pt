"use client";

import useSWR from "swr";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Patient } from "@/lib/db/schema";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DemoPage() {
  const { data } = useSWR<Patient[]>("/api/patients", fetcher);

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data ?? []} />
    </div>
  );
}
