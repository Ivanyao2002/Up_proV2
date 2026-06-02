import { apiClient } from "@/core/http/apiClient";
import type { Driver, DriverDetail, Paginated } from "@/shared/types";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { KycDocument } from "@/shared/types";

export interface CreateDriverPayload {
  first_name: string;
  last_name: string;
  phone: string;
  zone: string;
  email?: string;
}

export const partnerDriversService = {
  list: () => apiClient.get<Paginated<Driver>>("/partner/drivers"),

  getById: (id: string) => apiClient.get<DriverDetail>(`/partner/drivers/${id}`),

  create: (data: CreateDriverPayload) =>
    apiClient.post<DriverDetail>("/partner/drivers", data),

  uploadDocument: (driverId: number | string, type: KycDocument["type"], filename: string) =>
    apiClient.post<DriverDetail>(`/partner/drivers/${driverId}/documents`, {
      type,
      filename,
    }),

  createWithDocuments: async (
    data: CreateDriverPayload,
    documents: DriverDocumentFile[] = []
  ): Promise<DriverDetail> => {
    const driver = await partnerDriversService.create(data);
    let current = driver;
    for (const doc of documents) {
      current = await partnerDriversService.uploadDocument(
        driver.id,
        doc.type,
        doc.file.name
      );
    }
    return current;
  },
};
