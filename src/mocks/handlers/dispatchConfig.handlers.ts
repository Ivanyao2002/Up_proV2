import { http, HttpResponse } from "msw";
import {
  buildDefaultDispatchConfigDocument,
  buildDefaultDispatchServiceLayer,
  computeWaveSchedule,
} from "@/features/settings/api/dispatchConfig.defaults";
import type {
  ApiDispatchConfigResponse,
  DispatchConfigDocument,
  DispatchCountryCode,
  DispatchCountryPatch,
  DispatchServiceKey,
  DispatchServiceLayer,
} from "@/features/settings/api/dispatchConfig.api.types";

let dispatchConfigState: DispatchConfigDocument = buildDefaultDispatchConfigDocument();

function mergeServiceLayers(
  global: DispatchServiceLayer,
  country?: Partial<DispatchServiceLayer>
): DispatchServiceLayer {
  if (!country) return structuredClone(global);
  return {
    ...global,
    ...country,
    weights: { ...global.weights, ...country.weights },
    wave: { ...global.wave, ...country.wave },
    chain: { ...global.chain, ...country.chain },
    strategies: {
      ...global.strategies,
      ...country.strategies,
      routing: { ...global.strategies?.routing, ...country.strategies?.routing },
      scoring: {
        ...global.strategies?.scoring,
        ...country.strategies?.scoring,
        dynamic: {
          ...global.strategies?.scoring?.dynamic,
          ...country.strategies?.scoring?.dynamic,
        },
      },
      offers: { ...global.strategies?.offers, ...country.strategies?.offers },
      autoAssign: {
        ...global.strategies?.autoAssign,
        ...country.strategies?.autoAssign,
      },
      heatmap: { ...global.strategies?.heatmap, ...country.strategies?.heatmap },
      fairness: { ...global.strategies?.fairness, ...country.strategies?.fairness },
      penalties: { ...global.strategies?.penalties, ...country.strategies?.penalties },
      urgency: {
        ...global.strategies?.urgency,
        ...country.strategies?.urgency,
        metadataFlags:
          country.strategies?.urgency?.metadataFlags ??
          global.strategies?.urgency?.metadataFlags,
      },
      scheduled: { ...global.strategies?.scheduled, ...country.strategies?.scheduled },
      reposition: { ...global.strategies?.reposition, ...country.strategies?.reposition },
      batchMatching: {
        ...global.strategies?.batchMatching,
        ...country.strategies?.batchMatching,
      },
      geoIndex: { ...global.strategies?.geoIndex, ...country.strategies?.geoIndex },
      traffic: {
        ...global.strategies?.traffic,
        ...country.strategies?.traffic,
        levels: {
          ...global.strategies?.traffic?.levels,
          ...country.strategies?.traffic?.levels,
        },
        zoneProfiles:
          country.strategies?.traffic?.zoneProfiles ??
          global.strategies?.traffic?.zoneProfiles,
        weather: {
          ...global.strategies?.traffic?.weather,
          ...country.strategies?.traffic?.weather,
        },
      },
    },
  };
}

function buildEffective(countryCode: DispatchCountryCode) {
  const country = dispatchConfigState.countries[countryCode];
  const ride = mergeServiceLayers(
    dispatchConfigState.global.RIDE,
    country?.RIDE
  );
  const cargo = mergeServiceLayers(
    dispatchConfigState.global.DELIVERY_CARGO,
    country?.DELIVERY_CARGO
  );
  return { countryCode, RIDE: ride, DELIVERY_CARGO: cargo };
}

function buildResponse(countryCode: DispatchCountryCode): ApiDispatchConfigResponse {
  const effective = buildEffective(countryCode);
  return {
    status: "ok",
    settingKey: "dispatch.config",
    schemaVersion: dispatchConfigState.schemaVersion,
    document: structuredClone(dispatchConfigState),
    seedTemplate: buildDefaultDispatchConfigDocument(),
    effective,
    waveSchedule: {
      RIDE: computeWaveSchedule(effective.RIDE),
      DELIVERY_CARGO: computeWaveSchedule(effective.DELIVERY_CARGO),
    },
  };
}

function deepMergeCountryPatch(
  target: DispatchCountryPatch | undefined,
  patch: DispatchCountryPatch
): DispatchCountryPatch {
  const base = target ?? {};
  return {
    RIDE: patch.RIDE
      ? mergeServiceLayers(
          mergeServiceLayers(dispatchConfigState.global.RIDE, base.RIDE),
          patch.RIDE
        )
      : base.RIDE,
    DELIVERY_CARGO: patch.DELIVERY_CARGO
      ? mergeServiceLayers(
          mergeServiceLayers(dispatchConfigState.global.DELIVERY_CARGO, base.DELIVERY_CARGO),
          patch.DELIVERY_CARGO
        )
      : base.DELIVERY_CARGO,
  };
}

export const dispatchConfigHandlers = [
  http.get("*/v1/admin/dispatch-config", ({ request }) => {
    const url = new URL(request.url);
    const countryCode = (url.searchParams.get("countryCode") ?? "CI") as DispatchCountryCode;
    return HttpResponse.json(buildResponse(countryCode));
  }),

  http.put("*/v1/admin/dispatch-config", async ({ request }) => {
    dispatchConfigState = (await request.json()) as DispatchConfigDocument;
    return HttpResponse.json(buildResponse("CI"));
  }),

  http.patch("*/v1/admin/dispatch-config/countries/:countryCode", async ({ params, request }) => {
    const code = String(params.countryCode) as DispatchCountryCode;
    const patch = (await request.json()) as DispatchCountryPatch;
    dispatchConfigState = {
      ...dispatchConfigState,
      countries: {
        ...dispatchConfigState.countries,
        [code]: deepMergeCountryPatch(dispatchConfigState.countries[code], patch),
      },
    };
    return HttpResponse.json(buildResponse(code));
  }),

  http.get("*/v1/admin/dispatch-capacity", ({ request }) => {
    const url = new URL(request.url);
    const countryCode = url.searchParams.get("countryCode") ?? "CI";
    return HttpResponse.json({
      status: "ok",
      countryCode,
      onlineDrivers: 142,
      eligibleDrivers: 118,
      indexedDrivers: 136,
      byZone: [
        { zoneCode: "PLATEAU", online: 28, eligible: 24 },
        { zoneCode: "COCODY", online: 35, eligible: 30 },
        { zoneCode: "ADJAME", online: 22, eligible: 18 },
        { zoneCode: "YOPOUGON", online: 31, eligible: 26 },
      ],
    });
  }),
];
