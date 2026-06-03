/** Détermine si un lien de navigation est actif selon le pathname courant. */
export function isNavItemActive(pathname: string, itemPath: string): boolean {
  // ——— Partenaire ———
  if (itemPath === "/partner/drivers") {
    return (
      pathname === "/partner/drivers" ||
      pathname === "/partner/drivers/new" ||
      /^\/partner\/drivers\/\d+$/.test(pathname)
    );
  }
  if (itemPath === "/partner/fleet") {
    return (
      pathname === "/partner/fleet" ||
      pathname === "/partner/fleet/new" ||
      /^\/partner\/fleet\/\d+$/.test(pathname)
    );
  }
  if (itemPath === "/partner/bookings") {
    return (
      pathname === "/partner/bookings" ||
      (/^\/partner\/bookings\/[^/]+$/.test(pathname) &&
        pathname !== "/partner/bookings/new" &&
        !pathname.startsWith("/partner/bookings/recurring"))
    );
  }
  if (itemPath === "/partner/bookings/new") {
    return pathname === "/partner/bookings/new";
  }
  if (itemPath === "/partner/map") {
    return pathname === "/partner/map";
  }
  if (itemPath === "/partner/wallet") {
    return pathname === "/partner/wallet";
  }
  if (itemPath === "/partner/wallet/driver-transfers") {
    return pathname.startsWith("/partner/wallet/driver-transfers");
  }

  // ——— Franchise ———
  if (itemPath === "/franchise/drivers") {
    return (
      pathname === "/franchise/drivers" ||
      /^\/franchise\/drivers\/\d+$/.test(pathname)
    );
  }
  if (itemPath === "/franchise/partners") {
    return (
      pathname === "/franchise/partners" ||
      /^\/franchise\/partners\/\d+$/.test(pathname)
    );
  }
  if (itemPath === "/franchise/map") {
    return pathname === "/franchise/map";
  }
  if (itemPath === "/franchise/territory") {
    return (
      pathname === "/franchise/territory" &&
      !pathname.startsWith("/franchise/territory/extension")
    );
  }
  if (itemPath === "/franchise/finance") {
    return pathname === "/franchise/finance";
  }
  if (itemPath === "/franchise/finance/driver-transfers") {
    return pathname.startsWith("/franchise/finance/driver-transfers");
  }

  // ——— Dispatch ———
  if (itemPath === "/dispatch/console") {
    return (
      pathname === "/dispatch/console" ||
      pathname === "/dispatch" ||
      pathname === "/dispatch/"
    );
  }
  if (itemPath === "/dispatch/book") {
    return pathname === "/dispatch/book";
  }

  // ——— Admin ———
  if (itemPath === "/admin/fleet/drivers") {
    return (
      pathname === "/admin/fleet/drivers" ||
      /^\/admin\/fleet\/drivers\/\d+$/.test(pathname)
    );
  }
  if (itemPath === "/admin/fleet/kyc") {
    return pathname === "/admin/fleet/kyc" || pathname.startsWith("/admin/fleet/kyc/");
  }
  if (itemPath === "/admin/network/franchises") {
    return (
      pathname === "/admin/network/franchises" ||
      /^\/admin\/network\/franchises\/\d+$/.test(pathname)
    );
  }
  if (itemPath === "/admin/network/zones") {
    return (
      pathname === "/admin/network/zones" ||
      /^\/admin\/network\/zones\/\d+$/.test(pathname)
    );
  }
  if (itemPath === "/admin/network/partners") {
    return (
      pathname === "/admin/network/partners" ||
      /^\/admin\/network\/partners\/\d+$/.test(pathname)
    );
  }
  if (itemPath === "/admin/finance/driver-transfers") {
    return pathname.startsWith("/admin/finance/driver-transfers");
  }
  if (itemPath === "/admin/settings/dispatchers") {
    return (
      pathname === "/admin/settings/dispatchers" ||
      /^\/admin\/settings\/dispatchers\/\d+$/.test(pathname)
    );
  }

  if (
    itemPath.endsWith("/pending") ||
    itemPath.endsWith("/moderation")
  ) {
    return pathname === itemPath;
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function isNavGroupActive(
  pathname: string,
  items: { path: string }[]
): boolean {
  return items.some((item) => isNavItemActive(pathname, item.path));
}
