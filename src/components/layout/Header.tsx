
'use client';

import Link from 'next/link';
import { ShipShapeLogo } from '@/components/icons/ShipShapeLogo';
import { Button } from '@/components/ui/button';
import { Package, CalendarDays, Truck, LineChart, ClipboardList, HelpCircle, ListChecks, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

const Header = () => {
  const { user, logout, hasAccess } = useAuth();
  const pathname = usePathname();

  if (!user || pathname === '/login') {
    return null; // Don't render header on login page or if not authenticated
  }

  const navLinks = [
    { href: '/', label: 'Loads', icon: Truck, permissionKey: '/' },
    { href: '/shipments', label: 'All Shipments', icon: Package, permissionKey: '/shipments' },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays, permissionKey: '/calendar' },
    { href: '/reports', label: 'Reports', icon: LineChart, permissionKey: '/reports' },
    { href: '/labels/generate-shipment-labels', label: 'Shipment Labels', icon: ClipboardList, permissionKey: '/labels/generate-shipment-labels' },
    { href: '/quiz/stock-check', label: 'Stock Quiz', icon: HelpCircle, permissionKey: '/quiz/stock-check' },
    { href: '/quiz/reports', label: 'Quiz Reports', icon: ListChecks, permissionKey: '/quiz/reports' },
  ];

  return (
    <header className="bg-card border-b border-border shadow-sm no-print">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <ShipShapeLogo className="h-8 w-8" />
            <span>Bondzilla</span>
          </Link>
           {user && (
            <p className="text-sm text-muted-foreground mt-1">
              Welcome, <span className="font-semibold text-foreground">{user.profile}</span>! Good to see you again.
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            {navLinks.filter(link => hasAccess(link.permissionKey)).map(link => (
              <Button key={link.href} variant="ghost" asChild className="px-2 sm:px-3">
                <Link href={link.href} className="text-foreground hover:text-primary transition-colors text-xs sm:text-sm">
                  <link.icon className="mr-1 sm:mr-2 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
