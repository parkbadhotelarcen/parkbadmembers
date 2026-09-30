import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { nlNL } from "@clerk/localizations";
import { AppProvider } from "@/components/app-provider";
import "./globals.css";
import "./modern-theme.css";
export const metadata: Metadata = {
  title: { default: "Parkhotel Bad Arcen Members", template: "%s | Parkhotel Bad Arcen Members" },
  description: "Jouw verblijf. Jouw voordelen. Welkom bij Parkhotel Bad Arcen Members.",
  applicationName: "Parkhotel Bad Arcen Members",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Parkhotel Bad Arcen Members",
  },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#123047",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/register"
      localization={nlNL}
    >
      <html lang="nl">
        <body>
          <AppProvider
            mode={
              process.env.PARKBAD_DATA_MODE &&
              process.env.PARKBAD_DATA_MODE !== "demo"
                ? "sheets"
                : "demo"
            }
          >
            {children}
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
