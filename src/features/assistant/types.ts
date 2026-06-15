import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";

export type { AdminEntityKey };

export type AssistantActionType =
  | "NAVIGATE"
  | "LIST_ENTITY"
  | "FIND_ENTITY"
  | "OPEN_ENTITY"
  | "OPEN_RELATED"
  | "OPEN_DRIVER_DETAIL"
  | "OPEN_TRIP_DETAIL"
  | "OPEN_CLIENT_DETAIL"
  | "OPEN_VEHICLE_DETAIL"
  | "LIST_TRIPS"
  | "LIST_DRIVERS"
  | "LIST_VEHICLES"
  | "FIND_DRIVER"
  | "FIND_TRIP"
  | "FIND_VEHICLE";

export interface AssistantNavigateAction {
  type: "NAVIGATE";
  path: string;
}

export interface AssistantListEntityAction {
  type: "LIST_ENTITY";
  entity: AdminEntityKey;
}

export interface AssistantFindEntityAction {
  type: "FIND_ENTITY";
  entity: AdminEntityKey;
  query: string;
}

export interface AssistantOpenEntityAction {
  type: "OPEN_ENTITY";
  entity: AdminEntityKey;
  id: string;
}

export interface AssistantOpenRelatedAction {
  type: "OPEN_RELATED";
  targetEntity: AdminEntityKey;
  sourceEntity: AdminEntityKey;
  sourceQuery: string;
}

export interface AssistantOpenDriverAction {
  type: "OPEN_DRIVER_DETAIL";
  driverId: string;
}

export interface AssistantOpenTripAction {
  type: "OPEN_TRIP_DETAIL";
  tripId: string;
}

export interface AssistantOpenClientAction {
  type: "OPEN_CLIENT_DETAIL";
  clientId: string;
}

export interface AssistantOpenVehicleAction {
  type: "OPEN_VEHICLE_DETAIL";
  vehicleId: string;
}

export interface AssistantListTripsAction {
  type: "LIST_TRIPS";
  status?: string;
}

export interface AssistantListDriversAction {
  type: "LIST_DRIVERS";
}

export interface AssistantListVehiclesAction {
  type: "LIST_VEHICLES";
}

export interface AssistantFindDriverAction {
  type: "FIND_DRIVER";
  query: string;
}

export interface AssistantFindTripAction {
  type: "FIND_TRIP";
  query: string;
}

export interface AssistantFindVehicleAction {
  type: "FIND_VEHICLE";
  query: string;
}

export type AssistantAction =
  | AssistantNavigateAction
  | AssistantListEntityAction
  | AssistantFindEntityAction
  | AssistantOpenEntityAction
  | AssistantOpenRelatedAction
  | AssistantOpenDriverAction
  | AssistantOpenTripAction
  | AssistantOpenClientAction
  | AssistantOpenVehicleAction
  | AssistantListTripsAction
  | AssistantListDriversAction
  | AssistantListVehiclesAction
  | AssistantFindDriverAction
  | AssistantFindTripAction
  | AssistantFindVehicleAction;

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantPageContext {
  pathname: string;
  entity?: AdminEntityKey;
  entityId?: string;
  entityLabel?: string;
  isListPage?: boolean;
}

export type AssistantExecuteType =
  | "suspend_driver"
  | "activate_driver"
  | "set_driver_offline"
  | "set_driver_online"
  | "approve_kyc_document"
  | "approve_all_kyc_documents"
  | "approve_driver_full"
  | "reject_kyc_document"
  | "approve_driver_kyc"
  | "recharge_driver";

export interface AssistantConfirmationPayload {
  driverId?: string;
  documentId?: string;
  partnerId?: string;
  amountFcfa?: number;
  rejectionReason?: string;
}

export interface AssistantConfirmation {
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  executeType: AssistantExecuteType;
  payload: AssistantConfirmationPayload;
}

export interface AssistantBriefingAlert {
  severity: "info" | "warning" | "critical";
  label: string;
  count?: number;
  href: string;
}

export interface AssistantResponse {
  message: string;
  action?: AssistantAction | null;
  confirmation?: AssistantConfirmation | null;
}

export interface AssistantApiResponse extends AssistantResponse {
  candidates?: Array<{
    id: string;
    label: string;
    kind: AdminEntityKey;
  }>;
  confirmation?: AssistantConfirmation | null;
  briefing?: {
    greeting: string;
    alerts: AssistantBriefingAlert[];
  };
}
