import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/components/app-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Parkbad Members", template: "%s | Parkbad Members" },
  description: "Jouw verblijf. Jouw voordelen. Welkom bij Parkbad Members.",
  applicationName: "Parkbad Members",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Parkbad Members",
  },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#003e33",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
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
  );
}
