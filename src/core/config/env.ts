export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "https://upjunoo-server-new.junooapps.com",
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === "true",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "UpJunoo Pro",
} as const;
