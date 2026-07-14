import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://songmatch-production-6c95.up.railway.app"),
  title: {
    default: "SongMatch — Where lyrics find their voice.",
    template: "%s | SongMatch",
  },
  description:
    "SongMatch connects songwriters with artists. Upload your lyrics, aim them at the artists you dream of hearing them, or broadcast to everyone. Swipe, match, and connect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink-50 text-ink-900">
        <div className="bg-grain" />
        <NavBar />
        <div className="relative z-10 flex-1">{children}</div>
      </body>
    </html>
  );
}
