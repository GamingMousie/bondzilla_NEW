'use client';

import { useState, useEffect } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import TrailerCard from '@/components/trailer/TrailerCard';
import AddTrailerDialog from '@/components/trailer/AddTrailerDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter, LayoutGrid, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TrailerStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function HomePage() {
  const { trailers, deleteTrailer, updateTrailerStatus } = useWarehouse();
  const [isClient, setIsClient] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TrailerStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredTrailers = trailers.filter(trailer => {
    const matchesSearch = trailer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trailer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trailer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const allStatuses: TrailerStatus[] = ['Docked', 'In-Transit', 'Empty', 'Loading', 'Unloading'];

  const TrailerListSkeleton = () => (
    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
      {[1, 2, 3].map(i => (
        viewMode === 'grid' ? (
          <Card className="shadow-md flex flex-col h-full" key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-20 self-start" />
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-4 w-1/2 mt-1 mb-1" /> {/* ID */}
              <Skeleton className="h-4 w-1/3 mt-1 mb-1" /> {/* Company */}
              <Skeleton className="h-3 w-2/5 mt-1 mb-1" /> {/* Arrival Date */}
              <Skeleton className="h-3 w-2/5 mt-1 mb-4" /> {/* Storage Expiry Date */}
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-8 w-[130px]" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <div className="flex items-center justify-between w-full">
                <Skeleton className="h-9 w-2/5" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardFooter>
          </Card>
        ) : (
          <Card className="shadow-md w-full" key={i}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex-grow">
                <Skeleton className="h-6 w-3/5 mb-1" />
                <Skeleton className="h-4 w-2/5 mb-1" /> {/* ID */}
                <Skeleton className="h-3 w-1/3 mt-1 mb-1" /> {/* Company */}
                <Skeleton className="h-3 w-1/4 mt-1 mb-1" /> {/* Arrival Date */}
                <Skeleton className="h-3 w-1/4 mt-1 mb-2" /> {/* Storage Expiry Date */}
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <Skeleton className="h-5 w-20" /> {/* Status Badge */}
                  <Skeleton className="h-4 w-28" /> {/* Shipment Count */}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-[130px] hidden sm:flex" /> {/* Status Select */}
                <Skeleton className="h-9 w-32" /> {/* Manage Shipments button */}
                <Skeleton className="h-8 w-8" /> {/* MoreVertical Dropdown */}
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
        <h1 className="text-3xl font-bold text-foreground">Trailer Dashboard</h1>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Trailer
        </Button>
      </div>

      <div className="p-4 bg-card rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TrailerStatus | 'all')}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {allStatuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
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
        <TrailerListSkeleton />
      ) : filteredTrailers.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-lg shadow">
          <p className="text-xl text-muted-foreground">No trailers found.</p>
          <p className="text-muted-foreground">Try adjusting your search or filter, or add a new trailer.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredTrailers.map((trailer) => (
            <TrailerCard 
              key={trailer.id} 
              trailer={trailer} 
              viewMode={viewMode}
              onDelete={() => deleteTrailer(trailer.id)}
              onStatusChange={(newStatus) => updateTrailerStatus(trailer.id, newStatus)}
            />
          ))}
        </div>
      )}

      <AddTrailerDialog isOpen={isAddDialogOpen} setIsOpen={setIsAddDialogOpen} />
    </div>
  );
}
