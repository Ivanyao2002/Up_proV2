import { buildListQuery, type ListParams } from "@/shared/types/listParams";

/**
 * Répertoire des chemins API.
 *
 * - Préfixe `/v1/` → `{apiUrl}/v1/...` (auth Supabase, Swagger live)
 * - Source routes : https://api.upjunoo-dev.tech/docs — voir docs/API-SWAGGER-CONTEXT.md
 * - Autres chemins → `{apiUrl}/api/v2/...` (back-office)
 *
 * @example
 * apiClient.post(LINKS.auth.v1.login, { email, password });
 * apiClient.get(withListQuery(LINKS.admin.ops.trips.list, params));
 */

/** CRUD standard : list / getById / create / update / delete */
export const createCrudEndpoints = <T extends string>(basePath: T) =>
  ({
    list: basePath,
    getById: (id: string | number) => `${basePath}/${id}`,
    create: basePath,
    update: (id: string | number) => `${basePath}/${id}`,
    delete: (id: string | number) => `${basePath}/${id}`,
  }) as const;

/** Ajoute les query params de liste (pagination, filtres). */
export const withListQuery = (path: string, params?: ListParams) =>
  `${path}${buildListQuery(params)}`;

/** Query string générique (hors ListParams). */
export const createUrl = (
  baseUrl: string,
  params?: Record<string, string | number | undefined | null>
) => {
  if (!params) return baseUrl;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
};

/** Auth Supabase — base `/v1` (voir SWAGGER.md § 02 - Auth) */
export const AUTH_V1_BASE = "/v1/auth" as const;

/** Admin plateforme — base `/v1` (voir SWAGGER.md § 10 - Admin) */
export const ADMIN_V1_BASE = "/v1/admin" as const;

/** Chauffeur — fiche publique admin (`GET /v1/drivers/:id`) */
export const DRIVERS_V1_BASE = "/v1/drivers" as const;

export const LINKS = {
  v1: {
    drivers: {
      getById: (id: string) => `${DRIVERS_V1_BASE}/${id}`,
      wallet: (id: string) => `${DRIVERS_V1_BASE}/${id}/wallet`,
      ledger: (id: string) => `${DRIVERS_V1_BASE}/${id}/ledger`,
      onboardingStart: "/v1/drivers/onboarding/start",
    },
    files: {
      getById: (id: string) => `/v1/files/${id}`,
    },
    vehicles: {
      create: "/v1/vehicles",
      me: "/v1/vehicles/me",
      getById: (id: string) => `/v1/vehicles/${id}`,
      assignDriver: (id: string) => `/v1/vehicles/${id}/assign-driver`,
    },
    partners: {
      create: "/v1/partners",
      vehicles: (partnerId: string) => `/v1/partners/${partnerId}/vehicles`,
      vehicleById: (partnerId: string, vehicleId: string) =>
        `/v1/partners/${partnerId}/vehicles/${vehicleId}`,
      drivers: (partnerId: string) => `/v1/partners/${partnerId}/drivers`,
      members: (partnerId: string) => `/v1/partners/${partnerId}/members`,
      wallet: (partnerId: string) => `/v1/partners/${partnerId}/wallet`,
      ledger: (partnerId: string) => `/v1/partners/${partnerId}/ledger`,
      driverRecharge: (partnerId: string) =>
        `/v1/partners/${partnerId}/wallet/driver-recharge`,
      driverTransfers: (partnerId: string) =>
        `/v1/partners/${partnerId}/wallet/driver-transfers`,
      driverTransferStats: (partnerId: string) =>
        `/v1/partners/${partnerId}/wallet/driver-transfers/stats`,
    },
    franchise: {
      finance: {
        driverRecharge: "/v1/franchise/finance/driver-recharge",
        driverTransfers: "/v1/franchise/finance/driver-transfers",
        driverTransferStats: "/v1/franchise/finance/driver-transfers/stats",
      },
      driverRecharge: (franchiseId: string) =>
        `/v1/franchises/${franchiseId}/driver-recharge`,
      driverTransfers: (franchiseId: string) =>
        `/v1/franchises/${franchiseId}/driver-transfers`,
      driverTransferStats: (franchiseId: string) =>
        `/v1/franchises/${franchiseId}/driver-transfers/stats`,
    },
    catalog: {
      bootstrap: "/v1/catalog/bootstrap",
      countryCities: (countryCode: string) =>
        `/v1/catalog/countries/${countryCode}/cities`,
      vehicleCategories: "/v1/catalog/vehicle-categories",
      vehicleBrands: "/v1/catalog/vehicle-brands",
      vehicleBrandModels: (brandCode: string) =>
        `/v1/catalog/vehicle-brands/${brandCode}/models`,
      vehicleColors: "/v1/catalog/vehicle-colors",
    },
  },

  auth: {
    v1: {
      /** Connexion back-office (admin, partenaire, franchise) — role via `profiles.user_type` */
      login: `${AUTH_V1_BASE}/login`,
      adminLogin: `${AUTH_V1_BASE}/admin/login`,
      clientLogin: `${AUTH_V1_BASE}/client/login`,
      driverLogin: `${AUTH_V1_BASE}/driver/login`,
      driverRegister: `${AUTH_V1_BASE}/driver/register`,
      me: `${AUTH_V1_BASE}/me`,
      logout: `${AUTH_V1_BASE}/logout`,
      refresh: `${AUTH_V1_BASE}/refresh`,
      forgotPassword: `${AUTH_V1_BASE}/forgot-password`,
      otpSend: `${AUTH_V1_BASE}/otp/send`,
      otpVerify: `${AUTH_V1_BASE}/otp/verify`,
      /** Inscription compte portail franchise (bootstrap membre — franchiseId requis) */
      franchiseRegister: `${AUTH_V1_BASE}/franchise/register`,
    },
    /** MSW / back-office legacy (`/api/v2`) */
    legacy: {
      login: "/auth/login",
      logout: "/auth/logout",
      forgotPassword: "/auth/forgot-password",
      me: "/me",
    },
  },

  admin: {
    dashboard: "/admin/dashboard",
    v1: {
      dashboard: `${ADMIN_V1_BASE}/dashboard`,
      dashboardRecentActivity: `${ADMIN_V1_BASE}/dashboard/recent-activity`,
      liveMap: `${ADMIN_V1_BASE}/live-map`,
      liveDrivers: `${ADMIN_V1_BASE}/live-drivers`,
      liveOrders: `${ADMIN_V1_BASE}/live-orders`,
      orders: `${ADMIN_V1_BASE}/orders`,
      orderById: (id: string) => `${ADMIN_V1_BASE}/orders/${id}`,
      orderEvents: (serviceType: string, orderId: string) =>
        `/v1/orders/${serviceType}/${orderId}/events`,
      dispatchStatus: (serviceType: string, orderId: string) =>
        `/v1/dispatch/${serviceType}/${orderId}/status`,
      dispatchLogs: (serviceType: string, orderId: string) =>
        `/v1/dispatch/${serviceType}/${orderId}/logs`,
      drivers: `${ADMIN_V1_BASE}/drivers`,
      kycDocuments: `${ADMIN_V1_BASE}/kyc/documents`,
      kycQueue: `${ADMIN_V1_BASE}/kyc/queue`,
      kycApprove: (id: string) =>
        `${ADMIN_V1_BASE}/kyc/documents/${id}/approve`,
      kycReject: (id: string) =>
        `${ADMIN_V1_BASE}/kyc/documents/${id}/reject`,
      franchises: `${ADMIN_V1_BASE}/franchises`,
      partners: `${ADMIN_V1_BASE}/partners`,
      withdrawals: `${ADMIN_V1_BASE}/withdrawals`,
      withdrawalById: (id: string) => `${ADMIN_V1_BASE}/withdrawals/${id}`,
      withdrawalApprove: (id: string) =>
        `${ADMIN_V1_BASE}/withdrawals/${id}/approve`,
      withdrawalReject: (id: string) =>
        `${ADMIN_V1_BASE}/withdrawals/${id}/reject`,
      partnerById: (id: string) => `${ADMIN_V1_BASE}/partners/${id}`,
      partnerActivate: (id: string) =>
        `${ADMIN_V1_BASE}/partners/${id}/activate`,
      partnerSuspend: (id: string) =>
        `${ADMIN_V1_BASE}/partners/${id}/suspend`,
      partnerDocuments: (id: string) =>
        `${ADMIN_V1_BASE}/partners/${id}/documents`,
      compliance: {
        summary: `${ADMIN_V1_BASE}/compliance/summary`,
        drivers: `${ADMIN_V1_BASE}/compliance/drivers`,
        vehicles: `${ADMIN_V1_BASE}/compliance/vehicles`,
      },
      marketing: {
        promos: `${ADMIN_V1_BASE}/marketing/promos`,
        campaigns: `${ADMIN_V1_BASE}/marketing/campaigns`,
        banners: `${ADMIN_V1_BASE}/marketing/banners`,
        promoById: (id: string) => `${ADMIN_V1_BASE}/marketing/promos/${id}`,
        campaignById: (id: string) =>
          `${ADMIN_V1_BASE}/marketing/campaigns/${id}`,
        bannerById: (id: string) => `${ADMIN_V1_BASE}/marketing/banners/${id}`,
      },
      users: `${ADMIN_V1_BASE}/users`,
      userById: (id: string) => `${ADMIN_V1_BASE}/users/${id}`,
      userSuspend: (id: string) => `${ADMIN_V1_BASE}/users/${id}/suspend`,
      userActivate: (id: string) => `${ADMIN_V1_BASE}/users/${id}/activate`,
      filterOptions: `${ADMIN_V1_BASE}/filter-options`,
      driverById: (id: string) => `${ADMIN_V1_BASE}/drivers/${id}`,
      driverApprove: (id: string) => `${ADMIN_V1_BASE}/drivers/${id}/approve`,
      driverReject: (id: string) => `${ADMIN_V1_BASE}/drivers/${id}/reject`,
      vehicles: `${ADMIN_V1_BASE}/vehicles`,
      franchiseById: (id: string) => `${ADMIN_V1_BASE}/franchises/${id}`,
      paydunyaConfig: `${ADMIN_V1_BASE}/paydunya-config`,
      weatherConfig: `${ADMIN_V1_BASE}/weather-config`,
      weatherRefresh: `${ADMIN_V1_BASE}/weather/refresh`,
      paymentReconcile: (id: string) => `${ADMIN_V1_BASE}/payments/${id}/reconcile`,
      paymentsReconcileBatch: `${ADMIN_V1_BASE}/payments/reconcile-batch`,
      pricingRules: `${ADMIN_V1_BASE}/pricing-rules`,
      pricingRuleById: (id: string) => `${ADMIN_V1_BASE}/pricing-rules/${id}`,
      franchiseDelete: (id: string) => `${ADMIN_V1_BASE}/franchises/${id}`,
      finance: {
        dashboard: `${ADMIN_V1_BASE}/finance/dashboard`,
        transactions: `${ADMIN_V1_BASE}/finance/transactions`,
        transactionById: (id: string) =>
          `${ADMIN_V1_BASE}/finance/transactions/${id}`,
        wallets: `${ADMIN_V1_BASE}/finance/wallets`,
        commissions: `${ADMIN_V1_BASE}/finance/commissions`,
        reconciliation: `${ADMIN_V1_BASE}/finance/reconciliation`,
        driverTransfers: `${ADMIN_V1_BASE}/finance/driver-transfers`,
        driverTransferStats: `${ADMIN_V1_BASE}/finance/driver-transfers/stats`,
      },
      /** @deprecated Préférer `marketing.promos` */
      promotions: `${ADMIN_V1_BASE}/promotions`,
      promotionById: (id: string) => `${ADMIN_V1_BASE}/promotions/${id}`,
      roles: `${ADMIN_V1_BASE}/roles`,
      roleById: (id: string) => `${ADMIN_V1_BASE}/roles/${id}`,
      auditLog: `${ADMIN_V1_BASE}/audit-log`,
      dispatchers: `${ADMIN_V1_BASE}/dispatchers`,
      dispatcherById: (id: string) => `${ADMIN_V1_BASE}/dispatchers/${id}`,
      settingsGeneral: `${ADMIN_V1_BASE}/settings/general`,
      supportTickets: "/v1/support/tickets",
      safety: {
        sos: `${ADMIN_V1_BASE}/safety/sos`,
        sosDashboard: `${ADMIN_V1_BASE}/safety/sos/dashboard`,
        sosById: (id: string) => `${ADMIN_V1_BASE}/safety/sos/${id}`,
        sosAcknowledge: (id: string) =>
          `${ADMIN_V1_BASE}/safety/sos/${id}/acknowledge`,
        sosResolve: (id: string) => `${ADMIN_V1_BASE}/safety/sos/${id}/resolve`,
      },
    },

    /** Franchises — détail module 99 ; liste via `admin.v1.franchises` */
    franchises: {
      getById: (id: string) => `/v1/franchises/${id}`,
      partners: (id: string) => `/v1/franchises/${id}/partners`,
      drivers: (id: string) => `/v1/franchises/${id}/drivers`,
      orders: (id: string) => `/v1/franchises/${id}/orders`,
      revenue: (id: string) => `/v1/franchises/${id}/revenue`,
      wallet: (id: string) => `/v1/franchises/${id}/wallet`,
      ledger: (id: string) => `/v1/franchises/${id}/ledger`,
    },

    partners: {
      getById: (id: string) => `/v1/partners/${id}`,
      drivers: (id: string) => `/v1/partners/${id}/drivers`,
      vehicleById: (partnerId: string, vehicleId: string) =>
        `/v1/partners/${partnerId}/vehicles/${vehicleId}`,
      wallet: (id: string) => `/v1/partners/${id}/wallet`,
      ledger: (id: string) => `/v1/partners/${id}/ledger`,
    },

    /** Zones géographiques — GET /v1/zones (Swagger § 99) */
    zones: {
      list: "/v1/zones",
      hot: "/v1/zones/hot",
      heatmap: "/v1/zones/heatmap",
      getById: (id: string) => `/v1/zones/${id}`,
      demand: (id: string) => `/v1/zones/${id}/demand`,
      geoHot: "/v1/geo/hot-zones",
    },

    drivers: {
      ...createCrudEndpoints("/admin/drivers"),
      kycApprove: (id: string | number) => `/admin/drivers/${id}/kyc/approve`,
      kycReject: (id: string | number) => `/admin/drivers/${id}/kyc/reject`,
      suspend: (id: string | number) => `/admin/drivers/${id}/suspend`,
      activate: (id: string | number) => `/admin/drivers/${id}/activate`,
      trips: (id: string | number) => `/admin/drivers/${id}/trips`,
      walletTransactions: (id: string | number) =>
        `/admin/drivers/${id}/wallet/transactions`,
    },

    fleet: {
      kyc: {
        list: "/admin/fleet/kyc",
      },
      clients: {
        ...createCrudEndpoints("/admin/fleet/clients"),
        suspend: (id: string | number) => `/admin/fleet/clients/${id}/suspend`,
        activate: (id: string | number) => `/admin/fleet/clients/${id}/activate`,
      },
    },

    ops: {
      trips: {
        ...createCrudEndpoints("/admin/ops/trips"),
        reassignCandidates: (id: string | number) =>
          `/admin/ops/trips/${id}/reassign-candidates`,
        reassign: (id: string | number) => `/admin/ops/trips/${id}/reassign`,
        forensic: (tripId: string | number) => `/admin/ops/trips/${tripId}/forensic`,
      },
      map: "/admin/ops/map",
      dispatch: {
        console: "/admin/ops/dispatch",
        assignTrip: (tripId: string | number) =>
          `/admin/ops/dispatch/trips/${tripId}/assign`,
      },
      crisis: {
        get: "/admin/ops/crisis",
        update: "/admin/ops/crisis",
      },
      sos: {
        dashboard: "/admin/ops/sos/dashboard",
        list: "/admin/ops/sos/incidents",
        getById: (id: string) => `/admin/ops/sos/incidents/${id}`,
        acknowledge: (id: string) => `/admin/ops/sos/incidents/${id}/acknowledge`,
        resolve: (id: string) => `/admin/ops/sos/incidents/${id}/resolve`,
      },
    },

    finance: {
      dashboard: "/admin/finance/dashboard",
      transactions: {
        list: "/admin/finance/transactions",
      },
      wallets: {
        list: "/admin/finance/wallets",
      },
      commissions: {
        list: "/admin/finance/commissions",
      },
      reconciliation: {
        list: "/admin/finance/reconciliation",
      },
      withdrawals: {
        list: "/admin/finance/withdrawals",
        approve: (id: string | number) => `/admin/finance/withdrawals/${id}/approve`,
        reject: (id: string | number) => `/admin/finance/withdrawals/${id}/reject`,
      },
      driverTransfers: {
        stats: "/admin/finance/driver-transfers/stats",
        list: "/admin/finance/driver-transfers",
      },
    },

    network: {
      franchises: {
        ...createCrudEndpoints("/admin/network/franchises"),
      },
      partners: {
        ...createCrudEndpoints("/admin/network/partners"),
      },
      zones: {
        ...createCrudEndpoints("/admin/network/zones"),
        mapOverview: "/admin/network/zones/map-overview",
        polygon: (id: string | number) => `/admin/network/zones/${id}/polygon`,
      },
    },

    marketing: {
      promos: createCrudEndpoints("/admin/marketing/promos"),
      campaigns: createCrudEndpoints("/admin/marketing/campaigns"),
      banners: createCrudEndpoints("/admin/marketing/banners"),
    },

    support: {
      tickets: {
        list: "/admin/support/tickets",
      },
      disputes: {
        getById: (id: string | number) => `/admin/support/disputes/${id}`,
        resolve: (id: string | number) => `/admin/support/disputes/${id}/resolve`,
      },
    },

    settings: {
      dispatchRules: {
        get: "/admin/settings/dispatch-rules",
        update: "/admin/settings/dispatch-rules",
      },
      roles: createCrudEndpoints("/admin/settings/roles"),
      pricing: createCrudEndpoints("/admin/settings/pricing"),
      integrations: {
        list: "/admin/settings/integrations",
        patch: (id: string | number) => `/admin/settings/integrations/${id}`,
      },
      audit: {
        list: "/admin/settings/audit",
      },
      general: {
        get: "/admin/settings/general",
        update: "/admin/settings/general",
      },
    },

    dispatchers: {
      ...createCrudEndpoints("/admin/dispatchers"),
      suspend: (id: string | number) => `/admin/dispatchers/${id}/suspend`,
      activate: (id: string | number) => `/admin/dispatchers/${id}/activate`,
    },
  },

  franchise: {
    v1: {
      dashboard: "/v1/franchise/dashboard",
      me: "/v1/franchises/me",
      pricingRules: (franchiseId: string) =>
        `/v1/franchises/${franchiseId}/pricing-rules`,
    },

    dashboard: "/franchise/dashboard",
    territory: "/franchise/territory",

    ops: {
      map: "/franchise/ops/map",
      trips: createCrudEndpoints("/franchise/ops/trips"),
      dispatch: {
        console: "/franchise/ops/dispatch",
        assignTrip: (tripId: string | number) =>
          `/franchise/ops/dispatch/trips/${tripId}/assign`,
      },
    },

    partners: createCrudEndpoints("/franchise/partners"),

    drivers: {
      ...createCrudEndpoints("/franchise/drivers"),
      kycQueue: {
        list: "/franchise/drivers/kyc-queue",
      },
      kycApprove: (id: string | number) => `/franchise/drivers/${id}/kyc/approve`,
      kycReject: (id: string | number) => `/franchise/drivers/${id}/kyc/reject`,
      documentApprove: (driverId: string | number, docId: string | number) =>
        `/franchise/drivers/${driverId}/documents/${docId}/approve`,
      documentReject: (driverId: string | number, docId: string | number) =>
        `/franchise/drivers/${driverId}/documents/${docId}/reject`,
    },

    fleet: {
      clients: {
        ...createCrudEndpoints("/franchise/fleet/clients"),
        suspend: (id: string | number) => `/franchise/fleet/clients/${id}/suspend`,
        activate: (id: string | number) => `/franchise/fleet/clients/${id}/activate`,
      },
    },

    finance: {
      overview: "/franchise/finance",
      commissions: {
        list: "/franchise/finance/commissions",
      },
      reconciliation: {
        list: "/franchise/finance/reconciliation",
      },
      driverTransfers: {
        stats: "/franchise/finance/driver-transfers/stats",
        list: "/franchise/finance/driver-transfers",
      },
      driverRecharge: "/franchise/finance/driver-recharge",
      partnerTransfers: {
        stats: "/franchise/finance/partner-transfers/stats",
        list: "/franchise/finance/partner-transfers",
      },
      partnerRecharge: "/franchise/finance/partner-recharge",
    },

    marketing: {
      campaigns: createCrudEndpoints("/franchise/marketing/campaigns"),
      banners: createCrudEndpoints("/franchise/marketing/banners"),
    },

    promos: createCrudEndpoints("/franchise/promos"),

    pricing: createCrudEndpoints("/franchise/pricing"),

    support: {
      tickets: {
        ...createCrudEndpoints("/franchise/support/tickets"),
        reply: (id: string | number) => `/franchise/support/tickets/${id}/messages`,
      },
      chat: {
        list: "/franchise/support/chat",
        getById: (id: string | number) => `/franchise/support/chat/${id}`,
        reply: (id: string | number) => `/franchise/support/chat/${id}/messages`,
      },
    },
  },

  partner: {
    dashboard: "/partner/dashboard",
    profile: {
      get: "/partner/profile",
      update: "/partner/profile",
    },

    drivers: {
      ...createCrudEndpoints("/partner/drivers"),
      documents: (driverId: string | number) => `/partner/drivers/${driverId}/documents`,
      trips: (id: string | number) => `/partner/drivers/${id}/trips`,
      walletTransactions: (id: string | number) =>
        `/partner/drivers/${id}/wallet/transactions`,
      live: (id: string | number) => `/partner/drivers/${id}/live`,
    },

    vehicles: {
      ...createCrudEndpoints("/partner/vehicles"),
      registration: (id: string | number) => `/partner/vehicles/${id}/registration`,
      documents: (id: string | number) => `/partner/vehicles/${id}/documents`,
      assignDriver: (vehicleId: string | number) =>
        `/partner/vehicles/${vehicleId}/assign-driver`,
    },

    bookings: {
      ...createCrudEndpoints("/partner/bookings"),
      cancel: (id: string | number) => `/partner/bookings/${id}/cancel`,
      recurring: {
        list: "/partner/bookings/recurring",
      },
    },

    shifts: {
      list: "/partner/shifts",
    },

    reports: {
      list: "/partner/reports",
    },

    wallet: {
      get: "/partner/wallet",
      withdraw: "/partner/wallet/withdraw",
      driverTransfers: {
        stats: "/partner/wallet/driver-transfers/stats",
        list: "/partner/wallet/driver-transfers",
      },
      driverRecharge: "/partner/wallet/driver-recharge",
    },

    ops: {
      map: "/partner/ops/map",
    },

    support: {
      chat: {
        list: "/partner/support/chat",
        getById: (id: string | number) => `/partner/support/chat/${id}`,
        reply: (id: string | number) => `/partner/support/chat/${id}/messages`,
      },
    },
  },

  dispatch: {
    ops: {
      console: "/dispatch/ops/console",
      map: "/dispatch/ops/map",
      assignTrip: (tripId: string | number) => `/dispatch/ops/trips/${tripId}/assign`,
    },
    bookings: {
      create: "/dispatch/bookings",
    },
  },
} as const;

export type ApiLinks = typeof LINKS;
