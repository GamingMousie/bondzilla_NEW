
import Link from 'next/link';
import { ShipShapeLogo } from '@/components/icons/ShipShapeLogo';
import { Button } from '@/components/ui/button';
import { Package, CalendarDays, Truck, LineChart, ClipboardList, HelpCircle, ListChecks } from 'lucide-react'; // Added ListChecks for Quiz Reports

const Header = () => {
  return (
    <header className="bg-card border-b border-border shadow-sm no-print">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <ShipShapeLogo className="h-8 w-8" />
          <span>Bondzilla</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          <Button variant="ghost" asChild className="px-2 sm:px-3">
            <Link href="/" className="text-foreground hover:text-primary transition-colors text-xs sm:text-sm">
              <Truck className="mr-1 sm:mr-2 h-4 w-4" />
              Trailers
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2 sm:px-3">
            <Link href="/shipments" className="text-foreground hover:text-primary transition-colors text-xs sm:text-sm">
              <Package className="mr-1 sm:mr-2 h-4 w-4" />
              All Shipments
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2 sm:px-3">
            <Link href="/calendar" className="text-foreground hover:text-primary transition-colors text-xs sm:text-sm">
              <CalendarDays className="mr-1 sm:mr-2 h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2 sm:px-3">
            <Link href="/reports" className="text-foreground hover:text-primary transition-colors text-xs sm:text-sm">
              <LineChart className="mr-1 sm:mr-2 h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2 sm:px-3">
            <Link href="/labels/generate-shipment-labels" className="text-foreground hover:text-primary transition-colors text-xs sm:text-sm">
              <ClipboardList className="mr-1 sm:mr-2 h-4 w-4" />
              Shipment Labels
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2 sm:px-3">
            <Link href="/quiz/stock-check" className="text-foreground hover:text-primary transition-colors text-xs sm:text-sm">
              <HelpCircle className="mr-1 sm:mr-2 h-4 w-4" />
              Stock Quiz
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2 sm:px-3">
            <Link href="/quiz/reports" className="text-foreground hover:text-primary transition-colors text-xs sm:text-sm">
              <ListChecks className="mr-1 sm:mr-2 h-4 w-4" />
              Quiz Reports
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;

