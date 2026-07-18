import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Restate.ai — Land Development Studio",
  description:
    "Select real land on a high-definition 3D map and let AI design theme parks, hospitals, data centers, and communities directly on the terrain.",
  keywords: [
    "land development",
    "3D map",
    "AI",
    "Cesium",
    "photorealistic",
    "Meshy",
    "real estate",
  ],
  openGraph: {
    title: "Restate.ai — Land Development Studio",
    description:
      "AI-powered land development visualization on photorealistic 3D Earth.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster theme="dark" richColors position="top-center" />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
