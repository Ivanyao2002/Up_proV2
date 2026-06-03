"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { usePermission } from "@/core/auth/usePermission";
import { useFranchisesList } from "@/features/network/api/franchises.queries";
import { useZonesList } from "@/features/network/api/zones.queries";
import {
  useActivateDispatcher,
  useCreateDispatcher,
  useDispatcherDetail,
  useSuspendDispatcher,
  useUpdateDispatcher,
} from "../api/dispatchers.queries";
import {
  DispatcherForm,
  dispatcherToForm,
  emptyDispatcherForm,
  validateDispatcherForm,
  type DispatcherFormValues,
} from "../components/DispatcherForm";
import type { DispatcherPayload } from "../api/dispatchers.service";

interface DispatcherDetailPageProps {
  dispatcherId: string;
}

function formToPayload(values: DispatcherFormValues): DispatcherPayload {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    password: values.password || undefined,
    franchise_id: values.franchise_id === "" ? undefined : values.franchise_id,
    zone_ids: values.zone_ids,
    shift_label: values.shift_label.trim() || undefined,
    status: values.status,
    permissions: values.permissions,
  };
}

export function DispatcherDetailPage({ dispatcherId }: DispatcherDetailPageProps) {
  const router = useRouter();
  const isNew = dispatcherId === "new";
  const canEdit = usePermission("settings.dispatchers.edit");

  const { data, isLoading, isError } = useDispatcherDetail(dispatcherId, !isNew);
  const { data: franchisesData } = useFranchisesList();
  const { data: zonesData } = useZonesList();

  const createMutation = useCreateDispatcher();
  const updateMutation = useUpdateDispatcher(dispatcherId);
  const suspendMutation = useSuspendDispatcher();
  const activateMutation = useActivateDispatcher();

  const [form, setForm] = useState<DispatcherFormValues>(emptyDispatcherForm());
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  useEffect(() => {
    if (data && !isNew) {
      setForm(dispatcherToForm(data));
    }
  }, [data, isNew]);

  const franchises = franchisesData?.data ?? [];
  const zones = zonesData?.data ?? [];

  if (!isNew && isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (!isNew && (isError || !data)) {
    return (
      <p className="text-sm text-red-600">
        Dispatcher introuvable.{" "}
        <Link href="/admin/settings/dispatchers" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const title = isNew ? "Nouveau dispatcher" : data!.name;

  const handleSave = () => {
    const validation = validateDispatcherForm(form, isNew ? "create" : "edit");
    setErrors(validation);
    if (validation.length > 0) return;

    const payload = formToPayload(form);
    if (isNew) {
      createMutation.mutate(payload, {
        onSuccess: (created) => {
          router.push(`/admin/settings/dispatchers/${created.id}`);
        },
      });
    } else {
      updateMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={title}
        breadcrumb={["Admin", "Paramètres", "Dispatchers", title]}
        actions={
          !isNew && canEdit ? (
            <div className="flex gap-2">
              {data!.status === "active" ? (
                <Button
                  variant="secondary"
                  onClick={() => setConfirmSuspend(true)}
                >
                  Suspendre
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => activateMutation.mutate(dispatcherId)}
                  disabled={activateMutation.isPending}
                >
                  Réactiver
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      <p className="mb-6 text-sm">
        <Link href="/admin/settings/dispatchers" className="text-teal hover:underline">
          ← Retour à la liste
        </Link>
      </p>

      {canEdit || isNew ? (
        <DispatcherForm
          mode={isNew ? "create" : "edit"}
          franchises={franchises}
          zones={zones}
          values={form}
          onChange={setForm}
          onSubmit={handleSave}
          onCancel={() => router.push("/admin/settings/dispatchers")}
          isSubmitting={isSubmitting}
          errors={errors}
        />
      ) : (
        <p className="text-sm text-muted">Vous n&apos;avez pas les droits d&apos;édition.</p>
      )}

      <ConfirmModal
        open={confirmSuspend}
        title="Suspendre ce dispatcher ?"
        message="Le compte ne pourra plus assigner de courses tant qu'il est suspendu."
        confirmLabel="Suspendre"
        onConfirm={() => {
          suspendMutation.mutate(dispatcherId, {
            onSuccess: () => setConfirmSuspend(false),
          });
        }}
        onCancel={() => setConfirmSuspend(false)}
      />
    </div>
  );
}
