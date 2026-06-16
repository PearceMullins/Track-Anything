import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Track Anything Privacy Policy",
  description: "Privacy policy for the Track Anything Android app.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
