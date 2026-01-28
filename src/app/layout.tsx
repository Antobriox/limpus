import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../contexts/ThemeContext";
import { QueryClientProviderWrapper } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Limpus",
  description: "Sistema de gestión de torneos y olimpiadas universitarias",
  icons: {
    icon: [
      { url: "/img/LImpus.png", type: "image/png" },
    ],
    shortcut: "/img/LImpus.png",
    apple: "/img/LImpus.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryClientProviderWrapper>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
