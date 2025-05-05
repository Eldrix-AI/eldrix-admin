import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eldrix Admin Dashboard",
  description: "Eldrix Admin Dashboard for managing the Eldrix app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="/icon.png"
        />
      </head>
      <body className={``}>{children}</body>
    </html>
  );
}
