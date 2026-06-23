import { PermissionGuard } from "@/core/auth/PermissionGuard";
import { SettingsAuditPage } from "@/features/settings/pages/SettingsAuditPage";

export default function Page() {
  return (
    <PermissionGuard permission="settings.audit.view">
      <SettingsAuditPage />
    </PermissionGuard>
  );
}
