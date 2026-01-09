import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DRCP | Disaster Response Coordination Protocol",
  description:
    "Transparent, on-chain disaster relief. Donate, track impact, and help disaster victims globally.",
  icons: {
    icon: "/DRCP_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased animated-bg min-h-screen overflow-x-hidden`}>
        <Providers>
          <Header />
          <main className="container mx-auto px-4 py-8 pt-25">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
