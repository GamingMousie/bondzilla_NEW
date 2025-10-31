
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Load, LoadStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, Edit, Trash2, MoreVertical, ChevronRight, Briefcase, CalendarDays, Boxes, Weight, Tag, Hash } from 'lucide-react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EditLoadDialog from './EditLoadDialog';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';


interface LoadCardProps {
  load: Load;
  viewMode: 'grid' | 'list';
  onDelete: () => void;
  onStatusChange: (newStatus: LoadStatus) => void;
}

const statusColors: Record<LoadStatus, string> = {
  Scheduled: 'bg-orange-500',
  Arrived: 'bg-blue-500',
  Loading: 'bg-green-500',
  Offloading: 'bg-purple-500',
  Devanned: 'bg-gray-500',
};
const allStatuses: LoadStatus[] = ['Scheduled', 'Arrived', 'Loading', 'Offloading', 'Devanned'];


export default function LoadCard({ load, viewMode, onDelete, onStatusChange }: LoadCardProps) {
  const { getShipmentsByLoadId } = useWarehouse();
  const [isMounted, setIsMounted] = useState(false);

  const [shipmentCount, setShipmentCount] = useState<number>(0);
  const [totalPieces, setTotalPieces] = useState<number>(0);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const currentShipments = getShipmentsByLoadId(load.id);
    setShipmentCount(currentShipments.length);
    setTotalPieces(currentShipments.reduce((acc, s) => acc + s.quantity, 0));
  }, [load.id, getShipmentsByLoadId, load]);


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Invalid Date";
    }
  };

  const DateDisplay = ({ label, dateString, icon: Icon }: { label: string, dateString?: string, icon: React.ElementType }) => {
    if (!dateString) return null;
    return (
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        <Icon className="mr-1.5 h-3.5 w-3.5" />
        <span>{label}: {formatDate(dateString)}</span>
      </div>
    );
  }

  const CustomFieldDisplay = ({ label, value, icon: Icon }: { label: string, value?: string, icon?: React.ElementType }) => {
    if (!value) return null;
    return (
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
        <span>{label}: {value}</span>
      </div>
    );
  }

  const cardActions = (
    <div className="flex items-center justify-end gap-1 w-full">
       <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)} className="h-8">
        <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
      </Button>
      <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary-foreground hover:bg-primary h-8">
        <Link href={`/loads/${load.id}`}>
          Manage <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Load
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );


  const CardMainContent = () => (
    <>
      <div className="flex items-start justify-between">
        <CardTitle className="text-xl group-hover:text-primary transition-colors mb-1">
           {load.id}
        </CardTitle>
        <Truck className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
      <CardDescription className="text-sm text-muted-foreground mb-1">
        Name: {load.name}
      </CardDescription>

       <DateDisplay label="Arrived" dateString={load.arrivalDate} icon={CalendarDays} />

      {load.company && (
        <div className="flex items-center text-xs text-muted-foreground">
            <Briefcase className="mr-1.5 h-3.5 w-3.5" />
            <span>{load.company}</span>
        </div>
      )}
      
      {load.sprattJobNumber && (
        <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Hash className="mr-1.5 h-3.5 w-3.5" />
            <span>SJN: {load.sprattJobNumber}</span>
        </div>
      )}
      
      <DateDisplay label="Storage Exp" dateString={load.storageExpiryDate} icon={CalendarDays} />

      {load.weight !== undefined && load.weight !== null && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Weight className="mr-1.5 h-3.5 w-3.5" />
            <span>Weight: {load.weight} kg</span>
          </div>
      )}

      <CustomFieldDisplay label="T1.1" value={load.customField1} icon={Tag} />
      <CustomFieldDisplay label="T1.2" value={load.customField2} icon={Tag} />

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status:</span>
           <Select value={load.status} onValueChange={(newStatus) => onStatusChange(newStatus as LoadStatus)}>
            <SelectTrigger className="h-8 text-xs w-[130px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              {allStatuses.map(status => (
                <SelectItem key={status} value={status} className="text-xs">
                  <Badge className={`${statusColors[status]} text-white mr-2 w-3 h-3 p-0 inline-block rounded-full`} />
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Shipments:</span>
          {isMounted ? (
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{shipmentCount}</span>
            </div>
          ) : <Skeleton className="h-4 w-10" />}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Pieces:</span>
          {isMounted ? (
            <div className="flex items-center">
              <Boxes className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{totalPieces}</span>
            </div>
          ): <Skeleton className="h-4 w-10" />}
        </div>
      </div>
    </>
  );


  if (viewMode === 'list') {
    return (
      <>
        <Card className="group transition-all hover:shadow-lg w-full">
          <div className="p-4 flex items-center justify-between">
            <div className="flex-grow cursor-pointer">
              <Link href={`/loads/${load.id}`} legacyBehavior>
                <a className="block">
                  <CardMainContent />
                </a>
              </Link>
            </div>
            <div className="flex items-center gap-2 pl-4 flex-shrink-0">
              {cardActions}
            </div>
          </div>
        </Card>
        {isEditDialogOpen && (
          <EditLoadDialog
            isOpen={isEditDialogOpen}
            setIsOpen={setIsEditDialogOpen}
            loadToEdit={load}
          />
        )}
        {isDeleteDialogOpen && (
          <ConfirmationDialog
            isOpen={isDeleteDialogOpen}
            setIsOpen={setIsDeleteDialogOpen}
            onConfirm={onDelete}
            title="Delete Load?"
            description={`Are you sure you want to delete load ID: ${load.id} (${load.name || 'No Name'})? This will also delete all its ${isMounted ? shipmentCount : '...'} associated shipments. This action cannot be undone.`}
            confirmText="Delete"
            confirmButtonVariant="destructive"
          />
        )}
      </>
    );
  }

  // Grid View
  return (
    <>
      <Card className="group transition-all hover:shadow-lg flex flex-col h-full">
         <CardHeader className="pb-2">
            <Badge className={`${statusColors[load.status]} text-white text-xs px-1.5 py-0.5 self-start`}>{load.status}</Badge>
        </CardHeader>
        <CardContent className="flex-grow">
            <Link href={`/loads/${load.id}`} className="block">
                <CardMainContent />
            </Link>
        </CardContent>
        <CardFooter className="pt-4">
          {cardActions}
        </CardFooter>
      </Card>
      {isEditDialogOpen && (
        <EditLoadDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          loadToEdit={load}
        />
      )}
      {isDeleteDialogOpen && (
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          setIsOpen={setIsDeleteDialogOpen}
          onConfirm={onDelete}
          title="Delete Load?"
          description={`Are you sure you want to delete load ID: ${load.id} (${load.name || 'No Name'})? This will also delete all its ${isMounted ? shipmentCount : '...'} associated shipments. This action cannot be undone.`}
          confirmText="Delete"
          confirmButtonVariant="destructive"
        />
      )}
    </>
  );
}
