
import type { Metadata } from 'next';
// Import Geist fonts using named import syntax
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css'; // Ensure this path is correct
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/Header';
import { WarehouseProvider } from '@/contexts/WarehouseContext';

// This line helps ensure the font modules are processed by Next.js
// and their CSS variables (--font-geist-sans, --font-geist-mono) become globally available.
const M_ENSURE_FONT_IMPORTS = [GeistSans, GeistMono];

export const metadata: Metadata = {
  title: 'ShipShape - Warehouse Management',
  description: 'Efficiently manage trailers, shipments, and locations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // No className on <html> here. Font variables are globally available via import.
    // globals.css handles applying font-family and antialiasing to the html element.
    <html lang="en">
      {/* No className on <body> here. globals.css handles base body styling. */}
      <body>
        <WarehouseProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
        </WarehouseProvider>
      </body>
    </html>
  );
}
