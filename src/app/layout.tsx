import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AppProviders } from "./providers/AppProviders";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "UpJunoo Pro",
  description: "Back-office UpJunoo — Admin, Partenaire, Franchise",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${poppins.variable} font-sans`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
