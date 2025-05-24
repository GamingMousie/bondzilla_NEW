
import type { Metadata } from 'next';
// Import Geist fonts using named import syntax
import { GeistSans } from 'geist/font/sans';
// import { GeistMono } from 'geist/font/mono'; // Temporarily removed for diagnostics
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/Header';
import { WarehouseProvider } from '@/contexts/WarehouseContext';
// import { cn } from "@/lib/utils"; // Not currently used

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
    // Apply font variable classes directly to the <html> tag.
    // Temporarily removed GeistMono.variable for diagnostics
    <html lang="en" className={`${GeistSans.variable}`}>
      {/*
        Styling like antialiasing and base font-family is applied in globals.css to the html selector.
        The body tag below only needs to contain the application structure.
      */}
      <body> {/* Styled by globals.css */}
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
