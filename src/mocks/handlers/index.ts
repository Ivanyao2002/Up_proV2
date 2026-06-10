import { authHandlers } from "./auth.handlers";
import { dashboardHandlers } from "./dashboard.handlers";
import { opsHandlers } from "./ops.handlers";
import { fleetHandlers } from "./fleet.handlers";
import { networkHandlers } from "./network.handlers";
import { financeHandlers } from "./finance.handlers";
import { partnerHandlers } from "./partner.handlers";
import { franchiseHandlers } from "./franchise.handlers";
import { settingsHandlers } from "./settings.handlers";
import { supportHandlers } from "./support.handlers";
import { marketingHandlers } from "./marketing.handlers";
import { dispatchHandlers } from "./dispatch.handlers";
import { safetyHandlers } from "./safety.handlers";

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...opsHandlers,
  ...fleetHandlers,
  ...networkHandlers,
  ...financeHandlers,
  ...partnerHandlers,
  ...franchiseHandlers,
  ...settingsHandlers,
  ...supportHandlers,
  ...marketingHandlers,
  ...dispatchHandlers,
  ...safetyHandlers,
];
