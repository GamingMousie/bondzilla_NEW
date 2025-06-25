
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import ShipmentCard from '@/components/shipment/ShipmentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { PackageSearch, Search, ListFilter, LayoutGrid, Package as PackageIcon, Truck } from 'lucide-react';
import type { Shipment } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function AllShipmentsPage() {
  const { shipments, trailers, deleteShipment } = useWarehouse();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [trailerIdFilter, setTrailerIdFilter] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        shipment.id.toLowerCase().includes(searchLower) || 
        shipment.trailerId.toLowerCase().includes(searchLower) || 
        shipment.stsJob.toString().toLowerCase().includes(searchLower) ||
        (shipment.customerJobNumber && shipment.customerJobNumber.toLowerCase().includes(searchLower)) ||
        shipment.importer.toLowerCase().includes(searchLower) ||
        shipment.exporter.toLowerCase().includes(searchLower) || 
        (shipment.locations && shipment.locations.some(loc => loc.name.toLowerCase().includes(searchLower)));

      const matchesTrailerId = trailerIdFilter === 'all' || shipment.trailerId === trailerIdFilter;

      return matchesSearch && matchesTrailerId;
    });
  }, [shipments, searchTerm, trailerIdFilter]);

  const ShipmentListSkeleton = () => (
    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
      {[1, 2, 3].map(i => (
        viewMode === 'grid' ? (
          <Card className="shadow-md flex flex-col h-full" key={i}>
            <CardContent className="p-6 flex-grow space-y-3">
              <div className="flex items-start justify-between">
                <div className='space-y-1'>
                  <Skeleton className="h-5 w-3/4" /> {/* STS Job */}
                  <Skeleton className="h-4 w-1/2" /> {/* Trailer ID */}
                </div>
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
              <Skeleton className="h-3 w-2/5" /> {/* Shipment ID */}
              <Skeleton className="h-3 w-1/3 mt-1" /> {/* Customer Job No. */}
              <Skeleton className="h-3 w-1/4 mt-1" /> {/* Quantity */}
              <Skeleton className="h-3 w-2/5 mt-1" /> {/* Exporter */}
              <Skeleton className="h-3 w-2/5 mt-1" /> {/* Importer */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Skeleton className="h-3 w-3/4" /> {/* Weight */}
                <Skeleton className="h-3 w-3/4" /> {/* Pallet Space */}
              </div>
              <div className="flex items-center mt-1">
                <Skeleton className="h-4 w-4 mr-1" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-5 w-20 ml-2" /> {/* Location Badge */}
              </div>
              <div className="flex items-center mt-2 space-x-2">
                <Skeleton className="h-4 w-4" /> <Skeleton className="h-3 w-20" /> {/* Released Status */}
              </div>
              <div className="flex items-center mt-1 space-x-2">
                <Skeleton className="h-4 w-4" /> <Skeleton className="h-3 w-20" /> {/* Cleared Status */}
              </div>
            </CardContent>
            <div className="p-4 pt-0 border-t mt-auto">
              <Skeleton className="h-9 w-full" /> {/* Manage Locations Button */}
            </div>
          </Card>
        ) : (
           <Card className="shadow-md w-full" key={i}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex-grow space-y-1.5">
                <Skeleton className="h-5 w-3/5" /> {/* STS Job */}
                <Skeleton className="h-4 w-2/5" /> {/* Trailer ID */}
                <Skeleton className="h-3 w-1/2" /> {/* Shipment ID */}
                <Skeleton className="h-3 w-1/3 mb-1" /> {/* Customer Job No. */}
                <div className="flex items-center gap-4 text-sm">
                  <Skeleton className="h-3 w-16" /> {/* Quantity */}
                  <Skeleton className="h-3 w-24" /> {/* Exporter */}
                  <Skeleton className="h-3 w-24" /> {/* Importer */}
                  <Skeleton className="h-5 w-20" /> {/* Location */}
                </div>
                <div className="flex items-center gap-4 text-sm mt-1">
                  <Skeleton className="h-3 w-20" /> {/* Weight */}
                  <Skeleton className="h-3 w-20" /> {/* Pallet Space */}
                </div>
                 <div className="flex items-center mt-1 space-x-2">
                    <Skeleton className="h-4 w-4" /> <Skeleton className="h-3 w-24" /> {/* Released */}
                 </div>
                 <div className="flex items-center mt-1 space-x-2">
                    <Skeleton className="h-4 w-4" /> <Skeleton className="h-3 w-24" /> {/* Cleared */}
                 </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </Card>
        )
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <PackageSearch className="mr-3 h-8 w-8 text-primary" /> All Shipments
        </h1>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          Total: {isClient ? shipments.length : <Skeleton className="h-5 w-10 inline-block" />}
        </Badge>
      </div>

      <div className="p-4 bg-card rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by ID, STS Job, Cust. Job, Trailer ID, Importer, Exporter, Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={trailerIdFilter} onValueChange={(value) => setTrailerIdFilter(value)}>
            <SelectTrigger className="w-full md:w-[220px]">
              <div className="flex items-center">
                <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by trailer ID" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trailers</SelectItem>
              {isClient && trailers.map(trailer => (
                <SelectItem key={trailer.id} value={trailer.id}>
                  {trailer.name} ({trailer.id})
                </SelectItem>
              ))}
              {!isClient && <Skeleton className="h-8 w-full my-1" />}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} aria-label="Grid view">
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} aria-label="List view">
              <ListFilter className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {!isClient ? (
        <ShipmentListSkeleton />
      ) : filteredShipments.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-lg shadow">
          <PackageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-xl text-muted-foreground">No shipments found.</p>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
         <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredShipments.map((shipment) => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              onDelete={() => deleteShipment(shipment.id)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
