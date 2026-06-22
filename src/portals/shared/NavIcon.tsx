import type { ReactNode, SVGProps } from "react";

export type NavIconName =
  | "dashboard"
  | "notifications"
  | "fleet"
  | "fleet-pending"
  | "drivers"
  | "drivers-pending"
  | "bookings"
  | "booking-new"
  | "recurring"
  | "shifts"
  | "reports"
  | "wallet"
  | "wallet-transfer"
  | "profile"
  | "map"
  | "territory"
  | "partners"
  | "finance"
  | "promo"
  | "support"
  | "chat"
  | "dispatch"
  | "book"
  | "trips"
  | "network"
  | "settings"
  | "marketing"
  | "crisis"
  | "clients"
  | "transactions"
  | "withdrawals"
  | "commissions"
  | "reconciliation"
  | "campaigns"
  | "banners"
  | "roles"
  | "integrations"
  | "chevron";

function IconBase({
  className,
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

const paths: Record<NavIconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  notifications: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  fleet: (
    <>
      <path d="M7 17h10" />
      <path d="M5 17l1-4h12l1 4" />
      <path d="M6 13V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </>
  ),
  "fleet-pending": (
    <>
      <path d="M7 17h10" />
      <path d="M5 17l1-4h12l1 4" />
      <circle cx="12" cy="8" r="3" />
      <path d="M12 5v1" />
    </>
  ),
  drivers: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </>
  ),
  "drivers-pending": (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
      <path d="M18 6l2 2" />
    </>
  ),
  bookings: (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </>
  ),
  "booking-new": (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  recurring: (
    <>
      <path d="M17 2v4h4" />
      <path d="M7 22v-4H3" />
      <path d="M20 8A8 8 0 0 0 6.3 6.3L3 10" />
      <path d="M4 16a8 8 0 0 0 13.7 1.7L21 14" />
    </>
  ),
  shifts: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-6" />
      <path d="M22 20H2" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path d="M18 12h2" />
    </>
  ),
  "wallet-transfer": (
    <>
      <path d="M7 10h10" />
      <path d="M12 5v10" />
      <path d="M5 19h14" />
      <circle cx="12" cy="15" r="2" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6" />
    </>
  ),
  map: (
    <>
      <path d="M9 18l-6-3V6l6 3 6-3 6 3v9l-6-3-6 3z" />
      <path d="M9 6v12" />
      <path d="M15 3v12" />
    </>
  ),
  territory: (
    <>
      <path d="M12 2 4 7v10l8 5 8-5V7z" />
    </>
  ),
  partners: (
    <>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 19c0-3 2.7-5 6-5" />
      <path d="M14 19c0-2.5 1.8-4 4-4" />
    </>
  ),
  finance: (
    <>
      <path d="M12 2v20" />
      <path d="M17 6H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H7" />
    </>
  ),
  promo: (
    <>
      <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </>
  ),
  support: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </>
  ),
  chat: (
    <>
      <path d="M8 10h8M8 14h5" />
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </>
  ),
  dispatch: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </>
  ),
  book: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
      <rect x="3" y="3" width="18" height="18" rx="2" opacity="0" />
    </>
  ),
  trips: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </>
  ),
  network: (
    <>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4M8.5 16.5 10 13M15.5 16.5 14 13" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  marketing: (
    <>
      <path d="M3 11l18-5v7l-18-5v3z" />
      <path d="M11 13v8l3-5" />
    </>
  ),
  crisis: (
    <>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 2.82 17a2 2 0 0 0 1.71 3h14.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </>
  ),
  clients: (
    <>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2" />
      <path d="M3 19c0-3 2.5-5 6-5" />
      <path d="M13 19c0-2 2-3.5 4-3.5" />
    </>
  ),
  transactions: (
    <>
      <path d="M4 6h16M4 12h10M4 18h6" />
      <path d="M18 12l2 2-4 4" />
    </>
  ),
  withdrawals: (
    <>
      <path d="M12 3v12" />
      <path d="M8 11l4 4 4-4" />
      <path d="M4 21h16" />
    </>
  ),
  commissions: (
    <>
      <path d="M12 2v20" />
      <path d="M17 6H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H7" />
    </>
  ),
  reconciliation: (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
      <path d="M16 9l3 3-3 3" />
    </>
  ),
  campaigns: (
    <>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </>
  ),
  banners: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15h4M7 11h10" />
    </>
  ),
  roles: (
    <>
      <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M6 20v-1a6 6 0 0 1 12 0v1" />
      <path d="M19 8l2 2" />
    </>
  ),
  integrations: (
    <>
      <path d="M12 2v6" />
      <path d="M12 16v6" />
      <circle cx="12" cy="12" r="3" />
      <path d="M2 12h3M19 12h3" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
};

export function NavIcon({
  name,
  className = "h-[18px] w-[18px] shrink-0",
}: {
  name: NavIconName;
  className?: string;
}) {
  return (
    <IconBase className={className}>
      {paths[name]}
    </IconBase>
  );
}
