import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';

// Initialize Inter
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // Defining a CSS variable for Tailwind
});

export const metadata: Metadata = {
  title: "Monad Lisa",
  description: "Collaborative pixel art canvas on Monad blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}