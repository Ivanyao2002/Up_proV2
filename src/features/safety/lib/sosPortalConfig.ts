export interface SosPortalRoutes {
  guardian: string;
  incidents: string;
  incidentDetail: (id: string) => string;
  driverDetail?: (id: string) => string;
  orderDetail?: (id: string) => string;
}

export const ADMIN_SOS_ROUTES: SosPortalRoutes = {
  guardian: "/admin/ops/sos",
  incidents: "/admin/ops/sos/incidents",
  incidentDetail: (id) => `/admin/ops/sos/incidents/${id}`,
  driverDetail: (id) => `/admin/fleet/drivers/${id}`,
  orderDetail: (id) => `/admin/ops/trips/${id}`,
};

export const PARTNER_SOS_ROUTES: SosPortalRoutes = {
  guardian: "/partner/safety",
  incidents: "/partner/safety/incidents",
  incidentDetail: (id) => `/partner/safety/incidents/${id}`,
  driverDetail: (id) => `/partner/drivers/${id}`,
  orderDetail: (id) => `/partner/orders/${id}`,
};
