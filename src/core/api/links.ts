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

export const appendQuery = (baseUrl: string, query: string) => {
  if (!query) return baseUrl;
  const normalizedQuery = query.startsWith("?") ? query.slice(1) : query;
  if (!normalizedQuery) return baseUrl;
  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${normalizedQuery}`;
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
      me: "/v1/drivers/me",
      getById: (id: string) => `${DRIVERS_V1_BASE}/${id}`,
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
      assignDriver: (partnerId: string, vehicleId: string) =>
        `/v1/partners/${partnerId}/vehicles/${vehicleId}/assign-driver`,
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
      franchiseLogin: `${AUTH_V1_BASE}/franchise/login`,
      franchiseRegister: `${AUTH_V1_BASE}/franchise/register`,
      me: `${AUTH_V1_BASE}/me`,
      logout: `${AUTH_V1_BASE}/logout`,
      refresh: `${AUTH_V1_BASE}/refresh`,
      forgotPassword: `${AUTH_V1_BASE}/forgot-password`,
      otpSend: `${AUTH_V1_BASE}/otp/send`,
      otpVerify: `${AUTH_V1_BASE}/otp/verify`,
      driverResendOtp: `${AUTH_V1_BASE}/driver/resend-otp`,
      driverVerifyOtp: `${AUTH_V1_BASE}/driver/verify-otp`,
      devOtpLast: "/v1/dev/otp/last",
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
      withdrawalApprove: (id: string) =>
        `${ADMIN_V1_BASE}/withdrawals/${id}/approve`,
      withdrawalReject: (id: string) =>
        `${ADMIN_V1_BASE}/withdrawals/${id}/reject`,
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
      commissionRules: `${ADMIN_V1_BASE}/commission-rules`,
      commissionRuleById: (id: string) => `${ADMIN_V1_BASE}/commission-rules/${id}`,
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
      chatConversations: "/v1/chat/conversations",
      chatMessages: (id: string) => `/v1/chat/conversations/${id}/messages`,
      safety: {
        sos: `${ADMIN_V1_BASE}/safety/sos`,
        sosDashboard: `${ADMIN_V1_BASE}/safety/sos/dashboard`,
        sosById: (id: string) => `${ADMIN_V1_BASE}/safety/sos/${id}`,
        sosAcknowledge: (id: string) =>
          `${ADMIN_V1_BASE}/safety/sos/${id}/acknowledge`,
        sosResolve: (id: string) => `${ADMIN_V1_BASE}/safety/sos/${id}/resolve`,
      },
    },

    /** Franchises — /v1/admin/franchises (Swagger § 11 - Admin) */
    franchises: {
      list: `${ADMIN_V1_BASE}/franchises`,
      getById: (id: string) => `${ADMIN_V1_BASE}/franchises/${id}`,
      reports: `${ADMIN_V1_BASE}/reports/franchises`,
      // Note: Les sous-routes /partners, /drivers, /orders, /revenue n'existent pas dans Swagger
      // Utiliser les endpoints admin généraux avec paramètre de requête franchiseId
    },

    partners: {
      getById: (id: string) => `/v1/partners/${id}`,
      drivers: (id: string) => `/v1/partners/${id}/drivers`,
      vehicleById: (partnerId: string, vehicleId: string) =>
        `/v1/partners/${partnerId}/vehicles/${vehicleId}`,
      assignDriver: (partnerId: string, vehicleId: string) =>
        `/v1/partners/${partnerId}/vehicles/${vehicleId}/assign-driver`,
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
      // Contextuels (token franchise suffit)
      me: "/v1/franchises/me",
      dashboard: "/v1/franchise/dashboard",
      drivers: "/v1/franchise/drivers",
      driverByIdCtx: (driverId: string) => `/v1/franchise/drivers/${driverId}`,
      kycModeration: "/v1/franchise/drivers/moderation",
      partners: (id: string) => `/v1/franchises/${id}/partners`,
      partnerById: (franchiseId: string, partnerId: string) => `/v1/franchises/${franchiseId}/partners/${partnerId}`,
      partnerDrivers: (franchiseId: string, partnerId: string) => `/v1/franchises/${franchiseId}/partners/${partnerId}/drivers`,
      partnerOrders: (franchiseId: string, partnerId: string) => `/v1/franchises/${franchiseId}/partners/${partnerId}/orders`,
      partnerCommissions: (franchiseId: string, partnerId: string) => `/v1/franchises/${franchiseId}/partners/${partnerId}/commissions`,
      createPartner: (franchiseId: string) => `/v1/franchises/${franchiseId}/partners`,
      orders: (id: string) => `/v1/franchises/${id}/orders`,
      orderById: (franchiseId: string, orderId: string) => `/v1/franchises/${franchiseId}/orders/${orderId}`,
      liveMap: (id: string) => `/v1/franchises/${id}/livemap`,
      liveMapCtx: "/v1/franchise/livemap",
      territory: "/v1/franchise/territory",
      extensionRequest: "/v1/franchise/territory/extension-request",
      // Finance
      finance: "/v1/franchise/finance",
      driverTransfers: "/v1/franchise/finance/driver-transfers",
      driverTransfersStats: "/v1/franchise/finance/driver-transfers/stats",
      driverRecharge: "/v1/franchise/finance/driver-recharge",
      partnerTransfers: "/v1/franchise/finance/partner-transfers",
      partnerTransfersStats: "/v1/franchise/finance/partner-transfers/stats",
      partnerRecharge: "/v1/franchise/finance/partner-recharge",
      commissions: "/v1/franchise/finance/commissions",
      reconciliation: "/v1/franchise/finance/reconciliation",
      // Clients
      clients: "/v1/franchise/clients",
      // Support
      supportTickets: "/v1/franchise/support/tickets",
      supportTicketById: (id: string) => `/v1/franchise/support/tickets/${id}`,
      supportTicketReply: (id: string) => `/v1/franchise/support/tickets/${id}/messages`,
      supportChats: "/v1/franchise/support/chat",
      supportChatById: (id: string) => `/v1/franchise/support/chat/${id}`,
      supportChatReply: (id: string) => `/v1/franchise/support/chat/${id}/messages`,
      // Marketing / Promos / Pricing
      promos: "/v1/franchise/promos",
      promoById: (id: string) => `/v1/franchise/promos/${id}`,
      marketing: {
        banners: "/v1/franchise/marketing/banners",
        campaigns: "/v1/franchise/marketing/campaigns",
      },
      pricing: "/v1/franchise/pricing",
      pricingRules: (franchiseId: string) => `/v1/franchises/${franchiseId}/pricing-rules`,
      // Dispatch
      dispatchOrders: "/v1/franchise/dispatch/orders",
      dispatchAssign: (tripId: string) => `/v1/franchise/dispatch/orders/${tripId}/assign`,
      // Drivers (par ID franchise)
      driverById: (franchiseId: string, driverId: string) => `/v1/franchises/${franchiseId}/drivers/${driverId}`,
      // Safety / SOS Guardian
      sos: {
        dashboard: "/v1/franchise/safety/sos/dashboard",
        list: "/v1/franchise/safety/sos",
        byId: (id: string) => `/v1/franchise/safety/sos/${id}`,
        acknowledge: (id: string) => `/v1/franchise/safety/sos/${id}/acknowledge`,
        resolve: (id: string) => `/v1/franchise/safety/sos/${id}/resolve`,
      },
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
      vehicles: {
        ...createCrudEndpoints("/v1/franchise/fleet/vehicles"),
        byId: (id: string | number) => `/v1/franchise/fleet/vehicles/${id}`,
        approve: (id: string | number) => `/v1/franchise/fleet/vehicles/${id}/approve`,
        reject: (id: string | number) => `/v1/franchise/fleet/vehicles/${id}/reject`,
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

    settings: {
      weatherConfig: "/v1/franchise/settings/weather-config",
      weatherRefresh: "/v1/franchise/settings/weather/refresh",
      general: "/v1/franchise/settings/general",
    },

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
    dashboard: (id: string | number) => `/v1/partners/${id}/dashboard`,
    profile: {
      get: (id: string | number) => `/v1/partners/${id}`,
      update: (id: string | number) => `/v1/partners/${id}`,
      me: "/v1/partners/me",
      documents: {
        list: (id: string | number) => `/v1/partners/${id}/documents`,
        create: (id: string | number) => `/v1/partners/${id}/documents`,
      },
    },

    drivers: {
      list: (id: string | number) => `/v1/partners/${id}/drivers`,
      members: {
        list: (id: string | number) => `/v1/partners/${id}/members`,
        create: (id: string | number) => `/v1/partners/${id}/members`,
        update: (id: string | number, memberId: string | number) =>
          `/v1/partners/${id}/members/${memberId}`,
        delete: (id: string | number, memberId: string | number) =>
          `/v1/partners/${id}/members/${memberId}`,
      },
      create: (id: string | number) => `/v1/partners/${id}/drivers`,
      getById: (id: string | number, driverId: string | number) =>
        `/v1/partners/${id}/drivers/${driverId}`,
      documents: (id: string | number, driverId: string | number) =>
        `/v1/partners/${id}/drivers/${driverId}/documents`,
      trips: (id: string | number, driverId: string | number) =>
        `/v1/partners/${id}/drivers/${driverId}/trips`,
      walletTransactions: (id: string | number, driverId: string | number) =>
        `/v1/partners/${id}/drivers/${driverId}/wallet/transactions`,
      live: (id: string | number, driverId: string | number) =>
        `/v1/partners/${id}/drivers/${driverId}/live`,
    },

    vehicles: {
      list: (id: string | number) => `/v1/partners/${id}/vehicles`,
      performance: (id: string | number) => `/v1/partners/${id}/vehicle-performance`,
      driverPerformance: (id: string | number) => `/v1/partners/${id}/driver-performance`,
      gpsDevices: {
        list: (id: string | number) => `/v1/partners/${id}/gps-devices`,
        create: (id: string | number) => `/v1/partners/${id}/gps-devices`,
        update: (id: string | number, deviceId: string | number) =>
          `/v1/partners/${id}/gps-devices/${deviceId}`,
        delete: (id: string | number, deviceId: string | number) =>
          `/v1/partners/${id}/gps-devices/${deviceId}`,
      },
      create: (id: string | number) => `/v1/partners/${id}/vehicles`,
      getById: (id: string | number, vehicleId: string | number) =>
        `/v1/partners/${id}/vehicles/${vehicleId}`,
      registration: (id: string | number, vehicleId: string | number) =>
        `/v1/partners/${id}/vehicles/${vehicleId}/registration`,
      documents: (id: string | number, vehicleId: string | number) =>
        `/v1/partners/${id}/vehicles/${vehicleId}/documents`,
      assignDriver: (id: string | number, vehicleId: string | number) =>
        `/v1/partners/${id}/vehicles/${vehicleId}/assign-driver`,
    },

    wallet: {
      get: (id: string | number) => `/v1/partners/${id}/wallet`,
      ledger: (id: string | number) => `/v1/partners/${id}/ledger`,
      settlements: (id: string | number) => `/v1/partners/${id}/settlements`,
      cashReconciliations: (id: string | number) =>
        `/v1/partners/${id}/cash-reconciliations`,
      revenue: (id: string | number) => `/v1/partners/${id}/revenue`,
      withdraw: (id: string | number) => `/v1/partners/${id}/wallet/withdraw`,
      driverTransfers: {
        stats: (id: string | number) =>
          `/v1/partners/${id}/wallet/driver-transfers/stats`,
        list: (id: string | number) => `/v1/partners/${id}/wallet/driver-transfers`,
      },
      driverRecharge: (id: string | number) =>
        `/v1/partners/${id}/wallet/driver-recharge`,
    },

    freight: {
      list: (id: string | number) => `/v1/partners/${id}/freight-offers`,
      create: (id: string | number) => `/v1/partners/${id}/freight-offers`,
      update: (id: string | number, offerId: string | number) =>
        `/v1/partners/${id}/freight-offers/${offerId}`,
      delete: (id: string | number, offerId: string | number) =>
        `/v1/partners/${id}/freight-offers/${offerId}`,
    },

    safety: {
      sos: {
        list: (id: string | number) => `/v1/partners/${id}/safety/sos`,
        getById: (id: string | number, sosId: string | number) =>
          `/v1/partners/${id}/safety/sos/${sosId}`,
        acknowledge: (id: string | number, sosId: string | number) =>
          `/v1/partners/${id}/safety/sos/${sosId}/acknowledge`,
        dashboard: (id: string | number) => `/v1/partners/${id}/safety/sos/dashboard`,
      },
    },

    bookings: {
      list: (id: string | number) => `/v1/partners/${id}/bookings`,
      create: (id: string | number) => `/v1/partners/${id}/bookings`,
      getById: (id: string | number, bookingId: string | number) =>
        `/v1/partners/${id}/bookings/${bookingId}`,
      cancel: (id: string | number, bookingId: string | number) =>
        `/v1/partners/${id}/bookings/${bookingId}/cancel`,
      recurring: {
        list: (id: string | number) => `/v1/partners/${id}/bookings/recurring`,
      },
    },

    trips: {
      list: (id: string | number) => `/v1/partners/${id}/trips`,
      getById: (id: string | number, tripId: string | number) =>
        `/v1/partners/${id}/trips/${tripId}`,
    },

    shifts: {
      list: (id: string | number) => `/v1/partners/${id}/shifts`,
    },

    reports: {
      list: (id: string | number) => `/v1/partners/${id}/reports`,
    },

    ops: {
      map: (id: string | number) => `/v1/partners/${id}/ops/map`,
    },

    support: {
      chat: {
        list: (id: string | number) => `/v1/partners/${id}/support/chat`,
        getById: (id: string | number, chatId: string | number) =>
          `/v1/partners/${id}/support/chat/${chatId}`,
        reply: (id: string | number, chatId: string | number) =>
          `/v1/partners/${id}/support/chat/${chatId}/messages`,
      },
    },

    catalog: {
      vehicleCategories: "/v1/catalog/vehicle-categories",
      vehicleColors: "/v1/catalog/vehicle-colors",
      vehicleBrands: "/v1/catalog/vehicle-brands",
      vehicleBrandModels: (brandCode: string) =>
        `/v1/catalog/vehicle-brands/${brandCode}/models`,
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
