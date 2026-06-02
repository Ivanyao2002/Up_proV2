const COOKIE_NAME = "upjunoo_auth";
const MAX_AGE_DAYS = 7;

export function setAuthCookie() {
  if (typeof document === "undefined") return;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export function hasAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
}
