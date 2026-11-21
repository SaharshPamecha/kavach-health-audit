import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Kavach — Hospital Bill Audit",
  description:
    "Photograph your hospital bill. Kavach audits every line against IRDAI rules and your own policy schedule, flags the deductions with no clause behind them, and writes the dispute letter.",
  applicationName: "Kavach",
  authors: [{ name: "Kavach" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Kavach",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Kavach — the bill is not the final word",
    description:
      "Line-by-line hospital bill audit against IRDAI rules. Built for the discharge counter.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom deliberately left enabled — capping it would fail WCAG 1.4.4.
  viewportFit: "cover",
  themeColor: "#FAF9F6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
