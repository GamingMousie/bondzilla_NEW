

export type LoadStatus = 'Scheduled' | 'Arrived' | 'Loading' | 'Offloading' | 'Devanned';

export interface LocationInfo {
  name: string;
  pallets?: number;
}

export interface Load {
  id: string; // User-defined unique ID
  name: string; // Optional descriptive name
  status: LoadStatus;
  company?: string; // Optional: Company associated with the load
  sprattJobNumber?: string; // Optional: Spratt's internal job number
  arrivalDate?: string; // Optional: Date of arrival, ISO string format
  storageExpiryDate?: string; // Optional: Date when storage expires, ISO string format
  weight?: number; // Optional: Weight of the load in kg
  customField1?: string; // Represents T1.1
  customField2?: string; // Represents T1.2
  outturnReportDocumentName?: string | null;
  t1SummaryDocumentName?: string | null;
  manifestDocumentName?: string | null;
  acpDocumentName?: string | null;
}

export interface Shipment {
  id: string; // Auto-generated unique ID
  loadId: string;
  stsJob: number; // STS job number
  customerJobNumber?: string; // Optional: Customer's job number
  quantity: number;
  importer: string; // Consignee
  exporter: string; // Consignor
  locations: LocationInfo[];
  releaseDocumentName?: string; // Optional: Name of the release document
  clearanceDocumentName?: string; // Optional: Name of the clearance document
  released: boolean; // Indicates if the shipment has permission to be released
  cleared: boolean; // Indicates if the shipment is cleared
  onHold?: boolean; // Indicates if the shipment is on hold
  weight?: number; // Optional: Weight of the shipment in kg
  palletSpace?: number; // Optional: Pallet spaces occupied by the shipment (overall for shipment)
  releasedAt?: string; // Optional: Timestamp for when the shipment was printed/officially released
  emptyPalletRequired?: number;
  mrn?: string; // Movement Reference Number
  clearanceDate?: string | null; // Date when clearance document was uploaded/status set
  comments?: string;
}

// Used for the form data when creating or updating a shipment
export interface ShipmentFormData {
  stsJob: number;
  customerJobNumber?: string;
  quantity: number;
  importer: string; // Consignee
  exporter: string; // Consignor
  initialLocationName?: string;
  initialLocationPallets?: number;
  releaseDocument?: FileList | File | null;
  clearanceDocument?: FileList | File | null;
  released?: boolean;
  cleared?: boolean;
  onHold?: boolean;
  weight?: number | null;
  palletSpace?: number | null;
  emptyPalletRequired?: number | null;
  mrn?: string;
  clearanceDate?: Date | null; // Form handles Date object or null
  comments?: string;
}

// Specifically for updating an existing shipment via context
export interface ShipmentUpdateData {
  stsJob?: number;
  customerJobNumber?: string;
  quantity?: number;
  importer?: string; // Consignee
  exporter?: string; // Consignor
  locations?: LocationInfo[];
  releaseDocumentName?: string;
  clearanceDocumentName?: string;
  released?: boolean;
  cleared?: boolean;
  onHold?: boolean;
  weight?: number;
  palletSpace?: number;
  releasedAt?: string;
  emptyPalletRequired?: number;
  mrn?: string;
  clearanceDate?: string | null; // Context handles ISO string or null
  comments?: string;
}

// Specifically for updating an existing load via context
export interface LoadUpdateData {
  name?: string;
  company?: string;
  sprattJobNumber?: string;
  status?: LoadStatus;
  arrivalDate?: string | null;
  storageExpiryDate?: string | null;
  weight?: number;
  customField1?: string;
  customField2?: string;
  outturnReportDocumentName?: string | null; // Allow setting to null to clear
  t1SummaryDocumentName?: string | null;
  manifestDocumentName?: string | null;
  acpDocumentName?: string | null; // Allow setting to null to clear
}

// For AddLoadDialog form
export interface LoadFormData {
  id: string;
  name: string;
  company?: string;
  sprattJobNumber?: string;
  status: LoadStatus;
  arrivalDate?: Date | null;
  storageExpiryDate?: Date | null;
  weight?: number | null;
  customField1?: string;
  customField2?: string;
}

// For Stock Check Quiz
export interface QuizItem {
  id: string; // Combination of shipmentId and locationName for uniqueness
  shipmentId: string;
  stsJob: number;
  loadId: string;
  loadCompany?: string;
  loadArrivalDateFormatted: string;
  shipmentQuantity: number;
  locationName: string;
  locationPallets?: number;
}

export interface AnsweredQuizItem extends QuizItem {
  userAnswer: 'yes' | 'no';
}

export interface QuizReport {
  id: string;
  completedAt: string; // ISO string
  completedBy: string;
  items: AnsweredQuizItem[];
}
