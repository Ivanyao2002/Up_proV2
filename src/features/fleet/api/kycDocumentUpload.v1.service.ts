import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { LINKS } from "@/core/api/links";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { VehiclePieceFile } from "@/features/partner/components/VehicleCreatePiecesSection";
import {
  mapDriverDocumentTypeToApiCode,
  mapVehicleDocumentTypeToApiCode,
} from "./documentTypeCodes.v1";

interface SignedUrlUploadPayload {
  id?: string;
  uploadId?: string;
  storageRef?: string;
  path?: string;
  signedUrl?: string;
  signed_url?: string;
  url?: string;
}

interface SignedUrlApiResponse {
  uploadId?: string;
  id?: string;
  signedUrl?: string;
  signed_url?: string;
  uploadUrl?: string;
  url?: string;
  upload?: SignedUrlUploadPayload;
}

export interface KycUploadReference {
  uploadId: string;
  storageRef?: string;
}

function pickUploadPayload(response: SignedUrlApiResponse): SignedUrlUploadPayload {
  const upload = response.upload ?? response;
  return upload as SignedUrlUploadPayload;
}

function pickUploadId(payload: SignedUrlUploadPayload): string {
  const id = payload.uploadId ?? payload.id;
  if (!id?.trim()) {
    throw new Error("Upload : identifiant manquant dans la réponse signed-url.");
  }
  return id.trim();
}

function decodeUploadIdToStorageRef(uploadId: string): string | undefined {
  try {
    const decoded =
      typeof atob === "function"
        ? atob(uploadId)
        : typeof Buffer !== "undefined"
          ? Buffer.from(uploadId, "base64").toString("utf8")
          : "";
    if (decoded.includes("|")) {
      const [bucket, objectPath] = decoded.split("|");
      return `${bucket}/${objectPath}`;
    }
  } catch {
    // uploadId n'est pas encodé en base64
  }
  return undefined;
}

function pickStorageRef(payload: SignedUrlUploadPayload): string | undefined {
  if (payload.storageRef?.trim()) return payload.storageRef.trim();
  if (payload.path?.trim()) {
    return `upjunoo-kyc/${payload.path.replace(/^\//, "")}`;
  }
  const uploadId = payload.uploadId ?? payload.id;
  return uploadId ? decodeUploadIdToStorageRef(uploadId) : undefined;
}

function pickSignedUrl(payload: SignedUrlUploadPayload): string {
  const url =
    payload.signedUrl ?? payload.signed_url ?? payload.url;
  if (!url?.trim()) {
    throw new Error("Upload : URL signée manquante dans la réponse.");
  }
  return url.trim();
}

function buildSignedUrlBody(file: File, documentTypeCode: string) {
  const contentType = file.type?.trim() || "application/octet-stream";
  return {
    purpose: "kyc",
    fileName: file.name,
    filename: file.name,
    contentType,
    mimeType: contentType,
    documentTypeCode,
  };
}

async function putFileToSignedUrl(file: File, signedUrl: string): Promise<void> {
  const contentType = file.type?.trim() || "application/octet-stream";
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!response.ok) {
    throw new ApiError(response.status, {
      message: `Échec envoi du fichier (${response.status})`,
      status: response.status,
    });
  }
}

/**
 * Workflow API documenté : signed-url → PUT Supabase → rattachement document.
 * Pas d'appel à `/uploads/complete` (référence invalide sur cette version API).
 */
export async function uploadKycFile(
  file: File,
  documentTypeCode: string
): Promise<KycUploadReference> {
  const signed = await apiClient.post<SignedUrlApiResponse>(
    LINKS.v1.uploads.signedUrl,
    buildSignedUrlBody(file, documentTypeCode)
  );

  const payload = pickUploadPayload(signed);
  const uploadId = pickUploadId(payload);
  const storageRef = pickStorageRef(payload);

  await putFileToSignedUrl(file, pickSignedUrl(payload));

  return { uploadId, storageRef };
}

async function registerPartnerDocument(
  endpoint: string,
  reference: KycUploadReference,
  documentTypeCode: string
): Promise<void> {
  const { uploadId, storageRef } = reference;
  const bodies: Record<string, string>[] = [
    { uploadId, documentTypeCode },
    { upload_id: uploadId, document_type_code: documentTypeCode },
  ];

  if (storageRef) {
    bodies.push(
      { storageRef, documentTypeCode },
      { storage_ref: storageRef, document_type_code: documentTypeCode },
      { uploadId, storageRef, documentTypeCode }
    );
  }

  let lastError: unknown;
  for (const body of bodies) {
    try {
      await apiClient.post(endpoint, body);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Enregistrement du document impossible.");
}

export async function attachPartnerDriverDocument(
  partnerId: string,
  driverId: string,
  file: File,
  documentTypeCode: string
): Promise<void> {
  const reference = await uploadKycFile(file, documentTypeCode);
  await registerPartnerDocument(
    LINKS.partner.drivers.documents(partnerId, driverId),
    reference,
    documentTypeCode
  );
}

export async function attachPartnerVehicleDocument(
  partnerId: string,
  vehicleId: string,
  file: File,
  documentTypeCode: string
): Promise<void> {
  const reference = await uploadKycFile(file, documentTypeCode);
  await registerPartnerDocument(
    LINKS.partner.vehicles.documents(partnerId, vehicleId),
    reference,
    documentTypeCode
  );
}

export async function attachPartnerVehicleRegistration(
  partnerId: string,
  vehicleId: string,
  file: File
): Promise<void> {
  const documentTypeCode = mapVehicleDocumentTypeToApiCode("registration");
  const reference = await uploadKycFile(file, documentTypeCode);
  await registerPartnerDocument(
    LINKS.partner.vehicles.registration(partnerId, vehicleId),
    reference,
    documentTypeCode
  );
}

export async function uploadDriverDocumentsForPartner(
  partnerId: string,
  driverId: string,
  documents: DriverDocumentFile[]
): Promise<void> {
  for (const doc of documents) {
    const code = mapDriverDocumentTypeToApiCode(doc.type);
    await attachPartnerDriverDocument(partnerId, driverId, doc.file, code);
  }
}

export async function uploadVehiclePiecesForPartner(
  partnerId: string,
  vehicleId: string,
  pieces: VehiclePieceFile[]
): Promise<void> {
  for (const piece of pieces) {
    const code = mapVehicleDocumentTypeToApiCode(piece.type);
    await attachPartnerVehicleDocument(
      partnerId,
      vehicleId,
      piece.file,
      code
    );
  }
}
