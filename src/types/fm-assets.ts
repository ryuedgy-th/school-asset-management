/**
 * TypeScript Type Definitions for FM Asset Management System
 * Following ISO 55000 and CMMS Standards
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';
export type AssetStatus = 'active' | 'inactive' | 'maintenance' | 'retired';
export type PMScheduleType = 'time' | 'usage' | 'condition';
export type PMIntervalUnit = 'days' | 'weeks' | 'months' | 'years';
export type PMUsageMetric = 'kilometers' | 'hours' | 'cycles';
export type PMPriority = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceType = 'preventive' | 'corrective' | 'inspection' | 'calibration' | 'upgrade';
export type TransactionType = 'in' | 'out' | 'adjustment';
export type InspectionStatus = 'pass' | 'fail' | 'needs_attention';

// ============================================================================
// FM ASSET CATEGORY
// ============================================================================

export interface FMAssetCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  fmAssets?: FMAsset[];
  _count?: {
    fmAssets: number;
  };
}

export interface CreateFMAssetCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateFMAssetCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
}

// ============================================================================
// FM ASSET
// ============================================================================

export interface FMAsset {
  id: number;
  assetCode: string;
  name: string;
  description: string | null;
  categoryId: number;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string;
  building: string | null;
  floor: string | null;
  room: string | null;
  purchaseDate: Date | null;
  installDate: Date | null;
  warrantyExpiry: Date | null;
  specifications: Record<string, any> | null; // JSON
  condition: AssetCondition;
  status: AssetStatus;
  requiresMaintenance: boolean;
  parentAssetId: number | null;
  purchaseCost: number | null; // Decimal
  currentValue: number | null; // Decimal
  images: string[] | null; // JSON array
  qrCode: string | null;
  createdById: number | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  category?: FMAssetCategory;
  parentAsset?: FMAsset | null;
  childAssets?: FMAsset[];
  components?: AssetComponent[];
  pmSchedules?: PMSchedule[];
  maintenanceLogs?: MaintenanceLog[];
  tickets?: any[]; // Ticket type from tickets.ts
  inspectionRecords?: ACInspectionRecord[];
  createdBy?: any; // User type

  _count?: {
    childAssets: number;
    components: number;
    pmSchedules: number;
    maintenanceLogs: number;
    tickets: number;
    inspectionRecords: number;
  };
}

export interface CreateFMAssetInput {
  assetCode: string;
  name: string;
  description?: string;
  categoryId: number;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  location: string;
  building?: string;
  floor?: string;
  room?: string;
  purchaseDate?: Date | string;
  installDate?: Date | string;
  warrantyExpiry?: Date | string;
  specifications?: Record<string, any>;
  condition?: AssetCondition;
  status?: AssetStatus;
  requiresMaintenance?: boolean;
  parentAssetId?: number;
  purchaseCost?: number;
  currentValue?: number;
  images?: string[];
}

export interface UpdateFMAssetInput {
  assetCode?: string;
  name?: string;
  description?: string;
  categoryId?: number;
  type?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  building?: string;
  floor?: string;
  room?: string;
  purchaseDate?: Date | string;
  installDate?: Date | string;
  warrantyExpiry?: Date | string;
  specifications?: Record<string, any>;
  condition?: AssetCondition;
  status?: AssetStatus;
  requiresMaintenance?: boolean;
  parentAssetId?: number;
  purchaseCost?: number;
  currentValue?: number;
  images?: string[];
}

// ============================================================================
// ASSET COMPONENT
// ============================================================================

export interface AssetComponent {
  id: number;
  assetId: number;
  name: string;
  componentType: string;
  description: string | null;
  serialNumber: string | null;
  partNumber: string | null;
  lastServiceDate: Date | null;
  nextServiceDue: Date | null;
  serviceInterval: number | null; // Days
  expectedLifespan: number | null; // Days
  replacementCost: number | null; // Decimal
  installDate: Date | null;
  installedBy: string | null;
  condition: AssetCondition;
  status: AssetStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  asset?: FMAsset;
  serviceHistory?: ComponentService[];
  spareParts?: ComponentSparePart[];

  _count?: {
    serviceHistory: number;
    spareParts: number;
  };
}

export interface CreateComponentInput {
  assetId: number;
  name: string;
  componentType: string;
  description?: string;
  serialNumber?: string;
  partNumber?: string;
  lastServiceDate?: Date | string;
  nextServiceDue?: Date | string;
  serviceInterval?: number;
  expectedLifespan?: number;
  replacementCost?: number;
  installDate?: Date | string;
  installedBy?: string;
  condition?: AssetCondition;
  status?: AssetStatus;
  notes?: string;
  sparePartIds?: number[]; // For linking spare parts
}

export interface UpdateComponentInput {
  name?: string;
  componentType?: string;
  description?: string;
  serialNumber?: string;
  partNumber?: string;
  lastServiceDate?: Date | string;
  nextServiceDue?: Date | string;
  serviceInterval?: number;
  expectedLifespan?: number;
  replacementCost?: number;
  installDate?: Date | string;
  installedBy?: string;
  condition?: AssetCondition;
  status?: AssetStatus;
  notes?: string;
}

// ============================================================================
// COMPONENT SERVICE
// ============================================================================

export interface ComponentService {
  id: number;
  componentId: number;
  serviceDate: Date;
  serviceType: string;
  description: string | null;
  performedBy: string;
  cost: number | null; // Decimal
  partsReplaced: string | null;
  nextServiceDue: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  component?: AssetComponent;
}

export interface CreateServiceInput {
  componentId: number;
  serviceDate: Date | string;
  serviceType: string;
  description?: string;
  performedBy: string;
  cost?: number;
  partsReplaced?: string;
  nextServiceDue?: Date | string;
}

// ============================================================================
// PM SCHEDULE
// ============================================================================

export interface PMSchedule {
  id: number;
  assetId: number;
  name: string;
  description: string | null;
  scheduleType: PMScheduleType;
  frequency: string | null;
  intervalValue: number | null;
  intervalUnit: PMIntervalUnit | null;
  usageMetric: PMUsageMetric | null;
  usageInterval: number | null;
  lastPerformed: Date | null;
  nextDueDate: Date | null;
  nextDueUsage: number | null;
  autoCreateWO: boolean;
  leadTimeDays: number | null;
  priority: PMPriority;
  assignedToId: number | null;
  checklistItems: any[] | null; // JSON array
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  asset?: FMAsset;
  assignedTo?: any; // User type
}

export interface CreatePMScheduleInput {
  assetId: number;
  name: string;
  description?: string;
  scheduleType: PMScheduleType;
  frequency?: string;
  intervalValue?: number;
  intervalUnit?: PMIntervalUnit;
  usageMetric?: PMUsageMetric;
  usageInterval?: number;
  lastPerformed?: Date | string;
  nextDueDate?: Date | string;
  nextDueUsage?: number;
  autoCreateWO?: boolean;
  leadTimeDays?: number;
  priority?: PMPriority;
  assignedToId?: number;
  checklistItems?: any[];
  isActive?: boolean;
}

export interface UpdatePMScheduleInput {
  name?: string;
  description?: string;
  scheduleType?: PMScheduleType;
  frequency?: string;
  intervalValue?: number;
  intervalUnit?: PMIntervalUnit;
  usageMetric?: PMUsageMetric;
  usageInterval?: number;
  lastPerformed?: Date | string;
  nextDueDate?: Date | string;
  nextDueUsage?: number;
  autoCreateWO?: boolean;
  leadTimeDays?: number;
  priority?: PMPriority;
  assignedToId?: number;
  checklistItems?: any[];
  isActive?: boolean;
}

export interface ExecutePMInput {
  scheduleId: number;
  performedDate: Date | string;
  checklistResults: Record<string, 'pass' | 'fail' | 'n/a'>;
  notes?: string;
  partsUsed?: number[]; // SparePart IDs
  laborCost?: number;
  partsCost?: number;
  images?: string[];
}

// ============================================================================
// MAINTENANCE LOG
// ============================================================================

export interface MaintenanceLog {
  id: number;
  assetId: number;
  date: Date;
  type: MaintenanceType;
  performedBy: string;
  description: string | null;
  readings: Record<string, any> | null; // JSON for sensor data
  cost: number | null; // Decimal
  partsChanged: string | null;
  nextServiceDue: Date | null;
  images: string[] | null; // JSON array
  createdAt: Date;
  updatedAt: Date;

  // Relations
  asset?: FMAsset;
}

export interface CreateMaintenanceLogInput {
  assetId: number;
  date: Date | string;
  type: MaintenanceType;
  performedBy: string;
  description?: string;
  readings?: Record<string, any>;
  cost?: number;
  partsChanged?: string;
  nextServiceDue?: Date | string;
  images?: string[];
}

export interface UpdateMaintenanceLogInput {
  date?: Date | string;
  type?: MaintenanceType;
  performedBy?: string;
  description?: string;
  readings?: Record<string, any>;
  cost?: number;
  partsChanged?: string;
  nextServiceDue?: Date | string;
  images?: string[];
}

// ============================================================================
// SPARE PART
// ============================================================================

export interface SparePart {
  id: number;
  partNumber: string;
  name: string;
  description: string | null;
  category: string | null;
  supplier: string | null;
  supplierPartNo: string | null;
  unitCost: number | null; // Decimal
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  unit: string;
  storageLocation: string | null;
  binLocation: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  transactions?: InventoryTransaction[];
  components?: ComponentSparePart[];

  _count?: {
    transactions: number;
    components: number;
  };
}

export interface CreateSparePartInput {
  partNumber: string;
  name: string;
  description?: string;
  category?: string;
  supplier?: string;
  supplierPartNo?: string;
  unitCost?: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  unit: string;
  storageLocation?: string;
  binLocation?: string;
  isActive?: boolean;
}

export interface UpdateSparePartInput {
  partNumber?: string;
  name?: string;
  description?: string;
  category?: string;
  supplier?: string;
  supplierPartNo?: string;
  unitCost?: number;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  unit?: string;
  storageLocation?: string;
  binLocation?: string;
  isActive?: boolean;
}

// ============================================================================
// COMPONENT SPARE PART (Many-to-Many Relationship)
// ============================================================================

export interface ComponentSparePart {
  id: number;
  componentId: number;
  sparePartId: number;
  quantity: number;
  isRecommended: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  component?: AssetComponent;
  sparePart?: SparePart;
}

// ============================================================================
// INVENTORY TRANSACTION
// ============================================================================

export interface InventoryTransaction {
  id: number;
  sparePartId: number;
  type: TransactionType;
  quantity: number;
  referenceType: string | null; // e.g., "work_order", "purchase_order"
  referenceId: string | null;
  unitCost: number | null; // Decimal
  totalCost: number | null; // Decimal
  stockAfter: number;
  performedById: number | null;
  notes: string | null;
  createdAt: Date;

  // Relations
  sparePart?: SparePart;
  performedBy?: any; // User type
}

export interface CreateTransactionInput {
  sparePartId: number;
  type: TransactionType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  unitCost?: number;
  notes?: string;
}

// ============================================================================
// AC INSPECTION
// ============================================================================

export interface ACInspectionTemplate {
  id: number;
  name: string;
  description: string | null;
  checklistItems: any[] | null; // JSON array
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  inspectionRecords?: ACInspectionRecord[];

  _count?: {
    inspectionRecords: number;
  };
}

export interface ACInspectionRecord {
  id: number;
  fmAssetId: number;
  templateId: number;
  inspectionDate: Date;
  inspectedById: number;
  checklistResults: any | null; // JSON
  overallStatus: InspectionStatus;
  notes: string | null;
  images: string[] | null; // JSON array
  nextInspectionDue: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  fmAsset?: FMAsset;
  template?: ACInspectionTemplate;
  inspectedBy?: any; // User type
}

export interface CreateACInspectionInput {
  fmAssetId: number;
  templateId: number;
  inspectionDate: Date | string;
  checklistResults: any;
  overallStatus: InspectionStatus;
  notes?: string;
  images?: string[];
  nextInspectionDue?: Date | string;
}

// ============================================================================
// ANALYTICS & DASHBOARD TYPES
// ============================================================================

export interface FMDashboardStats {
  totalAssets: number;
  activeAssets: number;
  inMaintenance: number;
  retired: number;
  overduePMs: number;
  lowStockParts: number;
  totalInventoryValue: number;
  monthlyMaintenanceCost: number;
}

export interface AssetDistribution {
  categoryName: string;
  count: number;
  percentage: number;
}

export interface MaintenanceCostTrend {
  month: string;
  cost: number;
  pmCost: number;
  correctiveCost: number;
}

export interface PMComplianceData {
  month: string;
  scheduled: number;
  completed: number;
  complianceRate: number;
}
