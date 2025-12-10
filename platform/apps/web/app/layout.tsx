import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";
import ClientRoot from "./client-root";

import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://campeveryday.com"),
  title: {
    template: "%s | Camp Everyday",
    default: "Camp Everyday - Find your perfect camping adventure"
  },
  description: "Discover and book the best camping spots, RV parks, and glamping experiences.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://campeveryday.com",
    siteName: "Camp Everyday",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Camp Everyday"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@campeveryday",
    creator: "@campeveryday"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <ClientRoot>{children}</ClientRoot>
        </Providers>
      </body>
    </html>
  );
}
