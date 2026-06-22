import { http, HttpResponse } from "msw";
import { buildDefaultPricingConfigDocument } from "@/features/settings/api/pricingConfig.defaults";
import type {
  ApiPricingConfigResponse,
  PricingConfigDocument,
  PricingCountryCode,
  PricingCountryLayer,
} from "@/features/settings/api/pricingConfig.api.types";

let pricingConfigState: PricingConfigDocument = buildDefaultPricingConfigDocument();

function mergeCountryLayers(
  global: PricingCountryLayer,
  country?: PricingCountryLayer
): PricingCountryLayer {
  if (!country) return structuredClone(global);
  const merged: PricingCountryLayer = {
    ...global,
    ...country,
    defaultApproach: { ...global.defaultApproach, ...country.defaultApproach },
    trafficMultipliers: { ...global.trafficMultipliers, ...country.trafficMultipliers },
    weatherMultipliers: { ...global.weatherMultipliers, ...country.weatherMultipliers },
    zonePolicy: { ...global.zonePolicy, ...country.zonePolicy },
    hotZonePolicy: {
      ...global.hotZonePolicy,
      ...country.hotZonePolicy,
      heatMultipliers: {
        ...global.hotZonePolicy?.heatMultipliers,
        ...country.hotZonePolicy?.heatMultipliers,
      },
    },
    supplyDemandPolicy: {
      ...global.supplyDemandPolicy,
      ...country.supplyDemandPolicy,
      ratioTiers:
        country.supplyDemandPolicy?.ratioTiers ??
        global.supplyDemandPolicy?.ratioTiers,
    },
    trafficPolicy: {
      ...global.trafficPolicy,
      ...country.trafficPolicy,
      peakHourProfiles:
        country.trafficPolicy?.peakHourProfiles ??
        global.trafficPolicy?.peakHourProfiles,
    },
    holidayPolicy: { ...global.holidayPolicy, ...country.holidayPolicy },
    tripBands: country.tripBands ?? global.tripBands,
  };
  return merged;
}

function buildResponse(countryCode: PricingCountryCode): ApiPricingConfigResponse {
  const countryLayer = pricingConfigState.countries[countryCode];
  return {
    status: "ok",
    settingKey: "pricing.config",
    schemaVersion: pricingConfigState.schemaVersion,
    document: structuredClone(pricingConfigState),
    fromDatabase: true,
    seedTemplate: buildDefaultPricingConfigDocument(),
    effective: mergeCountryLayers(pricingConfigState.global, countryLayer),
  };
}

function deepMergeCountry(
  target: PricingCountryLayer | undefined,
  patch: Partial<PricingCountryLayer>
): PricingCountryLayer {
  const base = target ?? {};
  return {
    ...base,
    ...patch,
    defaultApproach: { ...base.defaultApproach, ...patch.defaultApproach },
    trafficMultipliers: { ...base.trafficMultipliers, ...patch.trafficMultipliers },
    weatherMultipliers: { ...base.weatherMultipliers, ...patch.weatherMultipliers },
    zonePolicy: { ...base.zonePolicy, ...patch.zonePolicy },
    hotZonePolicy: {
      ...base.hotZonePolicy,
      ...patch.hotZonePolicy,
      heatMultipliers: {
        ...base.hotZonePolicy?.heatMultipliers,
        ...patch.hotZonePolicy?.heatMultipliers,
      },
    },
    supplyDemandPolicy: {
      ...base.supplyDemandPolicy,
      ...patch.supplyDemandPolicy,
      ratioTiers:
        patch.supplyDemandPolicy?.ratioTiers ??
        base.supplyDemandPolicy?.ratioTiers,
    },
    trafficPolicy: {
      ...base.trafficPolicy,
      ...patch.trafficPolicy,
      peakHourProfiles:
        patch.trafficPolicy?.peakHourProfiles ??
        base.trafficPolicy?.peakHourProfiles,
    },
    holidayPolicy: { ...base.holidayPolicy, ...patch.holidayPolicy },
    tripBands: patch.tripBands ?? base.tripBands,
  };
}

export const pricingConfigHandlers = [
  http.get("*/v1/admin/pricing-config", ({ request }) => {
    const url = new URL(request.url);
    const countryCode = (url.searchParams.get("countryCode") ?? "CI") as PricingCountryCode;
    return HttpResponse.json(buildResponse(countryCode));
  }),

  http.get("*/v1/admin/settings/pricing", ({ request }) => {
    const url = new URL(request.url);
    const countryCode = (url.searchParams.get("countryCode") ?? "CI") as PricingCountryCode;
    return HttpResponse.json(buildResponse(countryCode));
  }),

  http.put("*/v1/admin/pricing-config", async ({ request }) => {
    const body = (await request.json()) as PricingConfigDocument;
    pricingConfigState = body;
    return HttpResponse.json(buildResponse("CI"));
  }),

  http.patch("*/v1/admin/pricing-config/countries/:countryCode", async ({ params, request }) => {
    const code = String(params.countryCode) as PricingCountryCode;
    const patch = (await request.json()) as Partial<PricingCountryLayer>;
    pricingConfigState = {
      ...pricingConfigState,
      countries: {
        ...pricingConfigState.countries,
        [code]: deepMergeCountry(pricingConfigState.countries[code], patch),
      },
    };
    return HttpResponse.json(buildResponse(code));
  }),
];
