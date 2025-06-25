
import type { Metadata } from 'next';
// Import Geist fonts using named import syntax
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css'; // Ensure this path is correct
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/Header';
import { WarehouseProvider } from '@/contexts/WarehouseContext';

// Applying font variables directly to the <html> tag below.
// This line can be removed if GeistSans.variable and GeistMono.variable are used directly.
// const M_ENSURE_FONT_IMPORTS = [GeistSans, GeistMono];

export const metadata: Metadata = {
  title: 'Bondzilla - Warehouse Management',
  description: 'Efficiently manage trailers, shipments, and locations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Apply font variable classes directly to the <html> tag.
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      {/*
        Styling like antialiasing and base font-family is applied in globals.css to the html selector.
        The body tag below only needs to contain the application structure.
      */}
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

