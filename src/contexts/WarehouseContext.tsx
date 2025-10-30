
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useCallback } from 'react';
import type { Load, Shipment, LoadStatus, ShipmentUpdateData, LoadUpdateData, LocationInfo, QuizReport, LoadFormData, ShipmentFormData } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';

type AddShipmentContextData = Omit<Shipment, 'id' | 'locations' | 'releasedAt' | 'clearanceDate'> & {
    initialLocationName?: string;
    initialLocationPallets?: number;
};


interface WarehouseContextType {
  loads: Load[];
  addLoad: (loadData: LoadFormData) => void;
  updateLoadStatus: (loadId: string, status: LoadStatus) => void;
  updateLoad: (loadId: string, data: LoadUpdateData) => void;
  deleteLoad: (loadId: string) => void;
  shipments: Shipment[];
  getShipmentsByLoadId: (loadId: string) => Shipment[];
  addShipment: (shipment: Omit<ShipmentFormData, 'releaseDocument' | 'clearanceDocument' | 'clearanceDate'> & { loadId: string }) => void;
  deleteShipment: (shipmentId: string) => void;
  getLoadById: (loadId: string) => Load | undefined;
  getShipmentById: (shipmentId: string) => Shipment | undefined;
  updateShipment: (shipmentId: string, data: ShipmentUpdateData) => void;
  markShipmentAsPrinted: (shipmentId: string) => void;
  quizReports: QuizReport[];
  addQuizReport: (reportData: Omit<QuizReport, 'id'>) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

const LOAD_STATUSES: LoadStatus[] = ['Scheduled', 'Arrived', 'Loading', 'Offloading', 'Devanned'];
const COMPANIES = ["TCB", "Cardinal Maritime"];
const IMPORTERS = ["ImpAlpha Co", "ImpBeta Ltd", "ImpGamma Inc", "ImpDelta LLC", "ImpEpsilon Group", "ImpZeta Corp", "ImpEta Solutions", "ImpTheta Global"];
const EXPORTERS = ["ExpZeta Co", "ExpEta Ltd", "ExpTheta Inc", "ExpIota LLC", "ExpKappa Group", "ExpLambda Exports", "ExpMu Trading", "ExpNu Intl."];
const LOCATION_PREFIXES = ["Bay ", "Shelf ", "Zone ", "Rack ", "Aisle ", "Area ", "Dock ", "Staging ", "Upper ", "Lower ", "East ", "West "];
const LOCATION_SUFFIXES = ["A1", "B2-Top", "C3-Low", "D4", "E5-Mid", "F6", "G7-East", "H8-West", "J9", "K10", "L11", "M12"];
const LOAD_NAMES_PREFIX = ["Titan", "Voyager", "Goliath", "Pioneer", "Sprinter", "Juggernaut", "Comet", "Stallion"];
const COMMENTS_POOL = ["Handle with care, item is fragile.", "Urgent, needs to be dispatched by EOD.", "Check for seal integrity before offloading.", "Keep in dry storage only.", "Re-palletize on arrival."];


const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min: number, max: number, isInt = true): number => {
  const num = Math.random() * (max - min) + min;
  return isInt ? Math.floor(num) : parseFloat(num.toFixed(2));
};
const getRandomBoolean = (trueProbability = 0.5): boolean => Math.random() < trueProbability;
const getRandomDate = (startOffsetDays: number, endOffsetDays: number): string => {
  const today = new Date();
  const offset = getRandomNumber(startOffsetDays, endOffsetDays);
  return addDays(today, offset).toISOString();
};

const generateRandomLocations = (): LocationInfo[] => {
  const numLocations = getRandomNumber(1, 3);
  const locations: LocationInfo[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < numLocations; i++) {
    let locName;
    do {
      locName = `${getRandomElement(LOCATION_PREFIXES)}${getRandomElement(LOCATION_SUFFIXES)}`;
    } while (usedNames.has(locName));
    usedNames.add(locName);
    locations.push({
      name: locName,
      pallets: getRandomNumber(1, 10)
    });
  }
  if (locations.length === 0) return [{ name: 'Pending Assignment' }]; // Ensure at least one location
  return locations;
};

const newInitialLoads: Load[] = [];
const newInitialShipments: Shipment[] = [];
const baseLoadIds = ["STS2990", "STS2991", "STS2992", "STS2993", "STS2994", "STS2995", "STS2996", "STS2997", "STS2998", "STS2999", "STS3034"];
let stsJobCounter = 10001;

baseLoadIds.forEach((loadId, index) => {
  const arrivalDate = getRandomDate(-10, 10);
  const newLoad: Load = {
    id: loadId,
    name: `${getRandomElement(LOAD_NAMES_PREFIX)} Hauler ${index + 1}`,
    status: getRandomElement(LOAD_STATUSES),
    company: getRandomElement(COMPANIES),
    sprattJobNumber: getRandomBoolean() ? `SJN-${getRandomNumber(10000, 99999)}` : undefined,
    arrivalDate: arrivalDate,
    storageExpiryDate: getRandomBoolean() ? getRandomDate(15, 45) : undefined,
    weight: getRandomNumber(2500, 5500, false),
    customField1: getRandomBoolean() ? `T1A-${getRandomNumber(100, 999)}` : undefined,
    customField2: getRandomBoolean() ? `T1B-${getRandomNumber(100, 999)}` : undefined,
    outturnReportDocumentName: getRandomBoolean() ? `${loadId}_outturn_${uuidv4().substring(0,4)}.pdf` : null,
    t1SummaryDocumentName: getRandomBoolean() ? `${loadId}_t1_${uuidv4().substring(0,4)}.pdf` : null,
    manifestDocumentName: getRandomBoolean() ? `${loadId}_manifest_${uuidv4().substring(0,4)}.pdf` : null,
    acpDocumentName: getRandomBoolean() ? `ACP_${loadId}_${new Date().getTime().toString().slice(-5)}.pdf` : null,
  };
  newInitialLoads.push(newLoad);

  for (let j = 0; j < 5; j++) {
    const isReleased = getRandomBoolean();
    const isCleared = getRandomBoolean();
    const clearanceDate = isCleared ? getRandomDate(-2, 0) : null;

    const newShipment: Shipment = {
      id: uuidv4(),
      loadId: newLoad.id,
      stsJob: stsJobCounter++,
      customerJobNumber: getRandomBoolean() ? `CUST-${getRandomNumber(1000, 9999)}` : undefined,
      quantity: getRandomNumber(10, 300),
      importer: getRandomElement(IMPORTERS),
      exporter: getRandomElement(EXPORTERS),
      locations: generateRandomLocations(),
      releaseDocumentName: isReleased ? `release_doc_${stsJobCounter}_${uuidv4().substring(0,4)}.pdf` : undefined,
      clearanceDocumentName: isCleared ? `clearance_doc_${stsJobCounter}_${uuidv4().substring(0,4)}.pdf` : undefined,
      released: isReleased,
      cleared: isCleared,
      onHold: getRandomBoolean(0.1), // 10% chance of being on hold
      weight: getRandomNumber(100, 2000, false),
      palletSpace: getRandomNumber(1, 20),
      releasedAt: isReleased ? getRandomDate(-1, 0) : undefined,
      emptyPalletRequired: getRandomNumber(0, 5),
      mrn: isCleared ? `MRN${getRandomNumber(100000, 999999)}` : undefined,
      clearanceDate: clearanceDate,
      comments: getRandomBoolean() ? getRandomElement(COMMENTS_POOL) : undefined,
    };
    newInitialShipments.push(newShipment);
  }
});


const initialQuizReports: QuizReport[] = [];


export const WarehouseProvider = ({ children }: { children: ReactNode }) => {
  const [loads, setLoads] = useLocalStorageState<Load[]>('loads', newInitialLoads);
  const [shipments, setShipments] = useLocalStorageState<Shipment[]>('shipments', newInitialShipments);
  const [quizReports, setQuizReports] = useLocalStorageState<QuizReport[]>('quizReports', initialQuizReports);

  const addLoad = useCallback((loadData: LoadFormData) => {
    const newLoad: Load = {
      id: loadData.id,
      name: loadData.name,
      status: loadData.status || 'Scheduled',
      company: loadData.company || undefined,
      sprattJobNumber: loadData.sprattJobNumber || undefined,
      arrivalDate: loadData.arrivalDate ? loadData.arrivalDate.toISOString() : undefined,
      storageExpiryDate: loadData.storageExpiryDate ? loadData.storageExpiryDate.toISOString() : undefined,
      weight: loadData.weight ?? undefined,
      customField1: loadData.customField1 || undefined,
      customField2: loadData.customField2 || undefined,
      outturnReportDocumentName: undefined,
      t1SummaryDocumentName: undefined,
      manifestDocumentName: undefined,
      acpDocumentName: undefined,
    };
    setLoads((prev) => [...prev, newLoad]);
  }, [setLoads]);

  const updateLoadStatus = useCallback((loadId: string, status: LoadStatus) => {
    setLoads((prev) =>
      prev.map((t) => (t.id === loadId ? { ...t, status } : t))
    );
  }, [setLoads]);

  const updateLoad = useCallback((loadId: string, data: LoadUpdateData) => {
    setLoads(prev =>
      prev.map(t =>
        t.id === loadId ? { ...t, ...data } : t
      )
    );
  }, [setLoads]);

  const deleteLoad = useCallback((loadId: string) => {
    setLoads(prev => prev.filter(t => t.id !== loadId));
    setShipments(prev => prev.filter(s => s.loadId !== loadId));
  }, [setLoads, setShipments]);

  const getShipmentsByLoadId = useCallback((loadId: string) => {
    return shipments.filter((s) => s.loadId.toLowerCase() === loadId.toLowerCase());
  }, [shipments]);

  const addShipment = useCallback((shipmentData: Omit<ShipmentFormData, 'releaseDocument' | 'clearanceDocument' | 'clearanceDate'> & { loadId: string; releaseDocumentName?: string; clearanceDocumentName?: string; }) => {

    let initialLocations: LocationInfo[];
    if (shipmentData.initialLocationName) {
      initialLocations = [{ name: shipmentData.initialLocationName, pallets: shipmentData.initialLocationPallets ?? undefined }];
    } else {
      initialLocations = [{ name: 'Pending Assignment' }];
    }

    const newShipment: Shipment = {
      id: uuidv4(),
      loadId: shipmentData.loadId,
      stsJob: shipmentData.stsJob,
      customerJobNumber: shipmentData.customerJobNumber || undefined,
      quantity: shipmentData.quantity,
      importer: shipmentData.importer,
      exporter: shipmentData.exporter,
      locations: initialLocations,
      releaseDocumentName: shipmentData.releaseDocumentName,
      clearanceDocumentName: shipmentData.clearanceDocumentName,
      released: shipmentData.released ?? false,
      cleared: shipmentData.cleared ?? false,
      onHold: shipmentData.onHold ?? false,
      weight: shipmentData.weight ?? undefined,
      palletSpace: shipmentData.palletSpace ?? undefined,
      releasedAt: undefined,
      emptyPalletRequired: shipmentData.emptyPalletRequired ?? 0,
      mrn: shipmentData.mrn || undefined,
      clearanceDate: (shipmentData.cleared || shipmentData.clearanceDocumentName) ? new Date().toISOString() : null,
      comments: shipmentData.comments || undefined,
    };
    setShipments((prev) => [...prev, newShipment]);
  }, [setShipments]);

  const updateShipment = useCallback((shipmentId: string, data: ShipmentUpdateData) => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id === shipmentId) {
          const updatedShipment = { ...s, ...data };

          updatedShipment.customerJobNumber = data.customerJobNumber !== undefined ? data.customerJobNumber : s.customerJobNumber;
          updatedShipment.mrn = data.mrn !== undefined ? data.mrn : s.mrn;
          updatedShipment.comments = data.comments !== undefined ? data.comments : s.comments;


          if (data.locations && data.locations.length > 0 && !(data.locations.length === 1 && data.locations[0].name === 'Pending Assignment')) {
            updatedShipment.locations = data.locations;
          } else if (!data.locations) { // If data.locations is undefined (not explicitly passed), keep existing
             updatedShipment.locations = s.locations && s.locations.length > 0 && !(s.locations.length ===1 && s.locations[0].name === 'Pending Assignment')
                                      ? s.locations
                                      : [{name: 'Pending Assignment'}];
          } else { // data.locations is an empty array or [{name: 'Pending Assignment'}]
            updatedShipment.locations = [{name: 'Pending Assignment'}];
          }

          if (data.releasedAt !== undefined) {
            updatedShipment.releasedAt = data.releasedAt;
          }

          updatedShipment.emptyPalletRequired = data.emptyPalletRequired ?? s.emptyPalletRequired ?? 0;

          // Handle clearanceDate
          let newClearanceDate = s.clearanceDate;

          // If clearanceDate is explicitly passed in data, use that value.
          // This allows manual setting or clearing of the date from the edit dialog.
          if (Object.prototype.hasOwnProperty.call(data, 'clearanceDate')) {
            newClearanceDate = data.clearanceDate;
          } else {
            // If clearanceDate is not in data, then derive it based on 'cleared' status.
            if (data.cleared === true) {
              if (!s.clearanceDate) { // Only set a new date if one wasn't already there
                newClearanceDate = new Date().toISOString();
              }
            } else if (data.cleared === false) {
              newClearanceDate = null; // Clearing the 'cleared' status also clears the date
            }
          }
          
          // If it becomes cleared via a document upload AND no date is set or passed, set one.
          if ((data.cleared === true || (data.cleared === undefined && updatedShipment.cleared)) &&
              data.clearanceDocumentName && !s.clearanceDocumentName && newClearanceDate === null) {
            newClearanceDate = new Date().toISOString();
          }


          updatedShipment.clearanceDate = newClearanceDate;

          return updatedShipment;
        }
        return s;
      })
    );
  }, [setShipments]);

  const markShipmentAsPrinted = useCallback((shipmentId: string) => {
    const nowISO = new Date().toISOString();
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId ? { ...s, releasedAt: nowISO } : s
      )
    );
  }, [setShipments]);

  const deleteShipment = useCallback((shipmentId: string) => {
    setShipments(prev => prev.filter(s => s.id !== shipmentId));
  }, [setShipments]);

  const getLoadById = useCallback((loadId: string) => {
    return loads.find(t => t.id.toLowerCase() === loadId.toLowerCase());
  }, [loads]);

  const getShipmentById = useCallback((shipmentId: string) => {
    return shipments.find(s => s.id === shipmentId);
  }, [shipments]);

  const addQuizReport = useCallback((reportData: Omit<QuizReport, 'id'>) => {
    const newReport: QuizReport = {
      ...reportData,
      id: uuidv4(),
    };
    setQuizReports(prev => [newReport, ...prev]); // Add to the beginning for recency
  }, [setQuizReports]);

  const value = {
    loads,
    addLoad,
    updateLoadStatus,
    updateLoad,
    deleteLoad,
    shipments,
    getShipmentsByLoadId,
    addShipment,
    updateShipment,
    deleteShipment,
    getLoadById,
    getShipmentById,
    markShipmentAsPrinted,
    quizReports,
    addQuizReport,
  }

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = (): WarehouseContextType => {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};
