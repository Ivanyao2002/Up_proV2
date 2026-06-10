import type { DriverKycDocumentType } from "./driverDocuments";
import type { VehicleDocumentType } from "./vehicleDocuments";
import type { DriverDocumentFile } from "./driverDocuments";
import type { VehiclePieceFile } from "@/features/partner/components/VehicleCreatePiecesSection";

export type DocumentSide = "recto" | "verso";

export interface DriverDocumentUpload {
  type: DriverKycDocumentType;
  side?: DocumentSide;
  file: File;
}

export interface VehicleDocumentUpload {
  type: VehicleDocumentType;
  side?: DocumentSide;
  file: File;
}

/** État recto/verso pour CNI et permis dans le wizard. */
export interface RectoVersoFiles {
  recto: File | null;
  verso: File | null;
}

export const EMPTY_RECTO_VERSO: RectoVersoFiles = { recto: null, verso: null };

export function driverUploadsFromWizard(state: {
  cni: RectoVersoFiles;
  license: RectoVersoFiles;
  selfie: File | null;
}): DriverDocumentUpload[] {
  const out: DriverDocumentUpload[] = [];
  if (state.cni.recto) out.push({ type: "cni", side: "recto", file: state.cni.recto });
  if (state.cni.verso) out.push({ type: "cni", side: "verso", file: state.cni.verso });
  if (state.license.recto)
    out.push({ type: "license", side: "recto", file: state.license.recto });
  if (state.license.verso)
    out.push({ type: "license", side: "verso", file: state.license.verso });
  if (state.selfie) out.push({ type: "selfie", file: state.selfie });
  return out;
}

export function vehicleUploadsFromWizard(state: {
  registration: RectoVersoFiles;
  insurance: File | null;
  technicalInspection: File | null;
}): VehicleDocumentUpload[] {
  const out: VehicleDocumentUpload[] = [];
  if (state.registration.recto)
    out.push({ type: "registration", side: "recto", file: state.registration.recto });
  if (state.registration.verso)
    out.push({ type: "registration", side: "verso", file: state.registration.verso });
  if (state.insurance) out.push({ type: "insurance", file: state.insurance });
  if (state.technicalInspection)
    out.push({ type: "technical_inspection", file: state.technicalInspection });
  return out;
}

/** Compatibilité flux création existant — recto prioritaire par type. */
export function flattenDriverDocuments(
  uploads: DriverDocumentUpload[]
): DriverDocumentFile[] {
  const byType = new Map<DriverKycDocumentType, DriverDocumentUpload[]>();
  for (const u of uploads) {
    const list = byType.get(u.type) ?? [];
    list.push(u);
    byType.set(u.type, list);
  }

  const result: DriverDocumentFile[] = [];
  for (const [type, list] of byType) {
    const recto = list.find((x) => x.side === "recto");
    const verso = list.find((x) => x.side === "verso");
    const single = list.find((x) => !x.side);
    if (recto) result.push({ type, file: recto.file });
    if (verso) result.push({ type, file: verso.file });
    if (single && !recto && !verso) result.push({ type, file: single.file });
  }
  return result;
}

export function flattenVehiclePieces(
  uploads: VehicleDocumentUpload[]
): VehiclePieceFile[] {
  const seen = new Set<VehicleDocumentType>();
  const result: VehiclePieceFile[] = [];
  for (const u of uploads) {
    if (seen.has(u.type)) continue;
    const recto = uploads.find((x) => x.type === u.type && x.side === "recto");
    const any = uploads.find((x) => x.type === u.type);
    const file = recto?.file ?? any?.file;
    if (file) {
      result.push({ type: u.type, file });
      seen.add(u.type);
    }
  }
  return result;
}

export function wizardFilesForExtraction(uploads: {
  cni: RectoVersoFiles;
  license: RectoVersoFiles;
  registration: RectoVersoFiles;
}): { type: "cni" | "license" | "registration"; files: File[] }[] {
  const groups: { type: "cni" | "license" | "registration"; files: File[] }[] = [];
  const push = (type: "cni" | "license" | "registration", rv: RectoVersoFiles) => {
    const files = [rv.recto, rv.verso].filter((f): f is File => f != null);
    if (files.length) groups.push({ type, files });
  };
  push("cni", uploads.cni);
  push("license", uploads.license);
  push("registration", uploads.registration);
  return groups;
}
