import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadati dell'applicazione CaneRandagio Naro
export const metadata: Metadata = {
  title: "CaneRandagio Naro - Segnalazione Cani Randagi",
  description: "Applicazione del Comune di Naro per la segnalazione e gestione di cani randagi sul territorio. Segnala avvistamenti e aiuta la comunità.",
  keywords: ["Naro", "cani randagi", "segnalazione", "Comune di Naro", "Sicilia", "randagismo"],
  authors: [{ name: "Comune di Naro" }],
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
        <Toaster />
      </body>
    </html>
  );
}
