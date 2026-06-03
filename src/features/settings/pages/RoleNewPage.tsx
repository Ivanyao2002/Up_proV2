"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { RoleForm, type RoleFormValues } from "../components/RoleForm";
import { useCreateRole } from "../api/roles.queries";

export function RoleNewPage() {
  const router = useRouter();
  const createRole = useCreateRole();
  const [values, setValues] = useState<RoleFormValues>({
    name: "",
    description: "",
  });

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title="Nouveau rôle"
        breadcrumb={["Admin", "Paramètres", "Rôles", "Nouveau"]}
      />

      <RoleForm
        values={values}
        onChange={setValues}
        isSubmitting={createRole.isPending}
        onCancel={() => router.push("/admin/settings/roles")}
        onSubmit={() => {
          createRole.mutate(values, {
            onSuccess: (role) => router.push(`/admin/settings/roles/${role.id}`),
          });
        }}
      />
    </div>
  );
}
