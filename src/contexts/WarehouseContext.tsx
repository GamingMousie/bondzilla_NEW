
// @ts-nocheck
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useCallback } from 'react';
import type { Trailer, Shipment, TrailerStatus, ShipmentUpdateData, TrailerUpdateData, LocationInfo, QuizReport } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique shipment IDs
import { addDays, subDays } from 'date-fns';

interface WarehouseContextType {
  trailers: Trailer[];
  addTrailer: (trailer: Omit<Trailer, 'status' | 'arrivalDate' | 'storageExpiryDate' | 'weight' | 'company' | 'customField1' | 'customField2' | 'outturnReportDocumentName' | 't1SummaryDocumentName' | 'manifestDocumentName' | 'acpDocumentName'> & { status?: TrailerStatus; company?: string; arrivalDate?: string; storageExpiryDate?: string; weight?: number; customField1?: string; customField2?: string; }) => void;
  updateTrailerStatus: (trailerId: string, status: TrailerStatus) => void;
  updateTrailer: (trailerId: string, data: TrailerUpdateData) => void;
  deleteTrailer: (trailerId: string) => void;
  shipments: Shipment[];
  getShipmentsByTrailerId: (trailerId: string) => Shipment[];
  addShipment: (shipment: Omit<Shipment, 'id' | 'locations' | 'released' | 'cleared' | 'importer' | 'exporter' | 'stsJob' | 'customerJobNumber' | 'releasedAt' | 'emptyPalletRequired' | 'mrn' | 'clearanceDate'> & { stsJob: number; customerJobNumber?: string; importer: string; exporter: string; initialLocationName?: string, initialLocationPallets?: number, releaseDocumentName?: string, clearanceDocumentName?: string, released?:boolean, cleared?: boolean, weight?: number, palletSpace?: number, emptyPalletRequired?: number, mrn?: string }) => void;
  deleteShipment: (shipmentId: string) => void;
  getTrailerById: (trailerId: string) => Trailer | undefined;
  getShipmentById: (shipmentId: string) => Shipment | undefined;
  updateShipmentReleasedStatus: (shipmentId: string, released: boolean) => void;
  updateShipmentClearedStatus: (shipmentId: string, cleared: boolean) => void;
  updateShipment: (shipmentId: string, data: ShipmentUpdateData) => void;
  markShipmentAsPrinted: (shipmentId: string) => void;
  quizReports: QuizReport[];
  addQuizReport: (reportData: Omit<QuizReport, 'id'>) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

const TRAILER_STATUSES: TrailerStatus[] = ['Scheduled', 'Arrived', 'Loading', 'Offloading', 'Devanned'];
const COMPANIES = ["LogiCorp", "FastHaul", "GlobalTrans", "ShipSwift", "CargoLink"];
const IMPORTERS = ["ImpAlpha Co", "ImpBeta Ltd", "ImpGamma Inc", "ImpDelta LLC", "ImpEpsilon Group"];
const EXPORTERS = ["ExpZeta Co", "ExpEta Ltd", "ExpTheta Inc", "ExpIota LLC", "ExpKappa Group"];
const LOCATION_PREFIXES = ["Bay ", "Shelf ", "Zone ", "Rack ", "Aisle ", "Area ", "Dock ", "Staging "];
const LOCATION_SUFFIXES = ["A1", "B2-Top", "C3-Low", "D4", "E5-Mid", "F6", "G7-East", "H8-West", "J9", "K10"];

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min: number, max: number, isInt = true): number => {
  const num = Math.random() * (max - min) + min;
  return isInt ? Math.floor(num) : parseFloat(num.toFixed(2));
};
const getRandomBoolean = (): boolean => Math.random() < 0.5;
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

const newInitialTrailers: Trailer[] = [];
const newInitialShipments: Shipment[] = [];
const baseTrailerIds = ["STS2990", "STS2991", "STS2992", "STS2993", "STS2994"];
let stsJobCounter = 10001;

baseTrailerIds.forEach((trailerId, index) => {
  const arrivalDate = getRandomDate(-5, 5);
  const newTrailer: Trailer = {
    id: trailerId,
    name: `${getRandomElement(["Alpha", "Bravo", "Charlie", "Delta", "Echo"])} Hauler ${index + 1}`,
    status: getRandomElement(TRAILER_STATUSES),
    company: getRandomElement(COMPANIES),
    arrivalDate: arrivalDate,
    storageExpiryDate: getRandomBoolean() ? getRandomDate(15, 45) : undefined,
    weight: getRandomNumber(2500, 5500, false),
    customField1: getRandomBoolean() ? `T1A-${getRandomNumber(100, 999)}` : undefined,
    customField2: getRandomBoolean() ? `T1B-${getRandomNumber(100, 999)}` : undefined,
    outturnReportDocumentName: getRandomBoolean() ? `${trailerId}_outturn.pdf` : null,
    t1SummaryDocumentName: getRandomBoolean() ? `${trailerId}_t1.pdf` : null,
    manifestDocumentName: getRandomBoolean() ? `${trailerId}_manifest.pdf` : null,
    acpDocumentName: getRandomBoolean() ? `ACP_${trailerId}_${new Date().getTime()}.pdf` : null,
  };
  newInitialTrailers.push(newTrailer);

  for (let j = 0; j < 5; j++) {
    const isReleased = getRandomBoolean();
    const isCleared = getRandomBoolean();
    const clearanceDate = isCleared ? getRandomDate(-2, 0) : null;

    const newShipment: Shipment = {
      id: uuidv4(),
      trailerId: newTrailer.id,
      stsJob: stsJobCounter++,
      customerJobNumber: getRandomBoolean() ? `CUST-${getRandomNumber(1000, 9999)}` : undefined,
      quantity: getRandomNumber(10, 300),
      importer: getRandomElement(IMPORTERS),
      exporter: getRandomElement(EXPORTERS),
      locations: generateRandomLocations(),
      releaseDocumentName: isReleased ? `release_doc_${stsJobCounter}.pdf` : undefined,
      clearanceDocumentName: isCleared ? `clearance_doc_${stsJobCounter}.pdf` : undefined,
      released: isReleased,
      cleared: isCleared,
      weight: getRandomNumber(100, 2000, false),
      palletSpace: getRandomNumber(1, 20),
      releasedAt: isReleased ? getRandomDate(-1, 0) : undefined,
      emptyPalletRequired: getRandomNumber(0, 5),
      mrn: isCleared ? `MRN${getRandomNumber(100000, 999999)}` : undefined,
      clearanceDate: clearanceDate,
    };
    newInitialShipments.push(newShipment);
  }
});


const initialQuizReports: QuizReport[] = [];


export const WarehouseProvider = ({ children }: { children: ReactNode }) => {
  const [trailers, setTrailers] = useLocalStorageState<Trailer[]>('trailers', newInitialTrailers);
  const [shipments, setShipments] = useLocalStorageState<Shipment[]>('shipments', newInitialShipments);
  const [quizReports, setQuizReports] = useLocalStorageState<QuizReport[]>('quizReports', initialQuizReports);

  const addTrailer = useCallback((trailerData: Omit<Trailer, 'status' | 'arrivalDate' | 'storageExpiryDate' | 'weight' | 'company' | 'customField1' | 'customField2' | 'outturnReportDocumentName' | 't1SummaryDocumentName' | 'manifestDocumentName' | 'acpDocumentName'> & { status?: TrailerStatus; company?: string; arrivalDate?: string; storageExpiryDate?: string; weight?: number; customField1?: string; customField2?: string; }) => {
    const newTrailer: Trailer = {
      id: trailerData.id,
      name: trailerData.name,
      status: trailerData.status || 'Scheduled',
      company: trailerData.company || undefined,
      arrivalDate: trailerData.arrivalDate || undefined,
      storageExpiryDate: trailerData.storageExpiryDate || undefined,
      weight: trailerData.weight || undefined,
      customField1: trailerData.customField1 || undefined,
      customField2: trailerData.customField2 || undefined,
      outturnReportDocumentName: undefined,
      t1SummaryDocumentName: undefined,
      manifestDocumentName: undefined,
      acpDocumentName: undefined,
    };
    setTrailers((prev) => [...prev, newTrailer]);
  }, [setTrailers]);

  const updateTrailerStatus = useCallback((trailerId: string, status: TrailerStatus) => {
    setTrailers((prev) =>
      prev.map((t) => (t.id === trailerId ? { ...t, status } : t))
    );
  }, [setTrailers]);

  const updateTrailer = useCallback((trailerId: string, data: TrailerUpdateData) => {
    setTrailers(prev =>
      prev.map(t =>
        t.id === trailerId ? { ...t, ...data } : t
      )
    );
  }, [setTrailers]);

  const deleteTrailer = useCallback((trailerId: string) => {
    setTrailers(prev => prev.filter(t => t.id !== trailerId));
    setShipments(prev => prev.filter(s => s.trailerId !== trailerId));
  }, [setTrailers, setShipments]);

  const getShipmentsByTrailerId = useCallback((trailerId: string) => {
    return shipments.filter((s) => s.trailerId === trailerId);
  }, [shipments]);

  const addShipment = useCallback((shipmentData: Omit<Shipment, 'id' | 'locations' | 'released' | 'cleared' | 'importer' | 'exporter' | 'stsJob' | 'customerJobNumber' | 'releasedAt' | 'emptyPalletRequired' | 'mrn' | 'clearanceDate'> & { stsJob: number; customerJobNumber?: string; importer: string; exporter: string; initialLocationName?: string, initialLocationPallets?: number, releaseDocumentName?: string, clearanceDocumentName?: string, released?:boolean, cleared?: boolean, weight?: number, palletSpace?: number, emptyPalletRequired?: number, mrn?: string }) => {

    let initialLocations: LocationInfo[];
    if (shipmentData.initialLocationName) {
      initialLocations = [{ name: shipmentData.initialLocationName, pallets: shipmentData.initialLocationPallets }];
    } else {
      initialLocations = [{ name: 'Pending Assignment' }];
    }

    const newShipment: Shipment = {
      ...shipmentData,
      id: uuidv4(),
      stsJob: shipmentData.stsJob,
      customerJobNumber: shipmentData.customerJobNumber || undefined,
      importer: shipmentData.importer,
      exporter: shipmentData.exporter,
      locations: initialLocations,
      releaseDocumentName: shipmentData.releaseDocumentName,
      clearanceDocumentName: shipmentData.clearanceDocumentName,
      released: shipmentData.released ?? false,
      cleared: shipmentData.cleared ?? false,
      weight: shipmentData.weight,
      palletSpace: shipmentData.palletSpace,
      releasedAt: undefined,
      emptyPalletRequired: shipmentData.emptyPalletRequired ?? 0,
      mrn: shipmentData.mrn || undefined,
      clearanceDate: (shipmentData.cleared || shipmentData.clearanceDocumentName) ? new Date().toISOString() : null,
    };
    setShipments((prev) => [...prev, newShipment]);
  }, [setShipments]);

  const updateShipmentReleasedStatus = useCallback((shipmentId: string, released: boolean) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === shipmentId ? { ...s, released } : s))
    );
  }, [setShipments]);

  const updateShipmentClearedStatus = useCallback((shipmentId: string, cleared: boolean) => {
     setShipments((prev) =>
      prev.map((s) => {
        if (s.id === shipmentId) {
          return {
            ...s,
            cleared,
            clearanceDate: cleared ? (s.clearanceDate || new Date().toISOString()) : null,
          };
        }
        return s;
      })
    );
  }, [setShipments]);

  const updateShipment = useCallback((shipmentId: string, data: ShipmentUpdateData) => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id === shipmentId) {
          const updatedShipment = { ...s, ...data };

          updatedShipment.customerJobNumber = data.customerJobNumber !== undefined ? data.customerJobNumber : s.customerJobNumber;
          updatedShipment.mrn = data.mrn !== undefined ? data.mrn : s.mrn;


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

  const getTrailerById = useCallback((trailerId: string) => {
    return trailers.find(t => t.id === trailerId);
  }, [trailers]);

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

  return (
    <WarehouseContext.Provider
      value={{
        trailers,
        addTrailer,
        updateTrailerStatus,
        updateTrailer,
        deleteTrailer,
        shipments,
        getShipmentsByTrailerId,
        addShipment,
        updateShipment,
        deleteShipment,
        getTrailerById,
        getShipmentById,
        updateShipmentReleasedStatus,
        updateShipmentClearedStatus,
        markShipmentAsPrinted,
        quizReports,
        addQuizReport,
      }}
    >
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
