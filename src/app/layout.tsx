import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadati di default — vengono sovrascritti lato client dal configComune
// Il server non può accedere al DB per generare metadata dinamici in static mode
export const metadata: Metadata = {
  title: "a 4 Zampe - Segnalazione Animali Randagi",
  description: "Applicazione per la segnalazione e gestione di animali randagi nel territorio comunale. Segnala avvistamenti e aiuta la comunità.",
  keywords: ["animali randagi", "segnalazione", "comune", "randagismo", "a 4 Zampe"],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
