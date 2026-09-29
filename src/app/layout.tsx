import type { Metadata } from "next";
import { Providers } from "./providers";
import { EMBEDCAT_LOGO_URL } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: "embed.cat — Discord Embed Builder",
  description: "Build beautiful Discord embeds and Components V2 messages. AI-powered. Send via webhook instantly.",
  metadataBase: new URL("https://embed.cat"),
  openGraph: {
    title: "embed.cat — Discord Embed Builder",
    description: "Build beautiful Discord embeds and Components V2 messages. AI-powered. Send via webhook instantly.",
    url: "https://embed.cat",
    siteName: "embed.cat",
    type: "website",
    images: [{ url: EMBEDCAT_LOGO_URL, width: 1024, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "embed.cat — Discord Embed Builder",
    description: "Build beautiful Discord embeds and Components V2 messages. AI-powered. Send via webhook instantly.",
    images: [EMBEDCAT_LOGO_URL],
  },
  other: {
    "theme-color": "#5865f2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="darkreader-lock" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
