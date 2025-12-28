/**
 * TypeScript Type Definitions for Ticket System
 * Following ITIL and ISO 20000 Standards
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type TicketType = 'IT' | 'FM';
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SLAStatus = 'within_sla' | 'at_risk' | 'breached';
export type TicketActivityAction = 'created' | 'assigned' | 'status_changed' | 'commented' | 'resolved' | 'closed' | 'reopened';

// SLA Response Time (in hours) based on priority
export const SLA_RESPONSE_TIMES: Record<TicketPriority, number> = {
  urgent: 2,
  high: 8,
  medium: 24,
  low: 72,
};

// ============================================================================
// TICKET
// ============================================================================

export interface Ticket {
  id: number;
  ticketNumber: string; // e.g., "IT-2024-001", "FM-2024-001"
  type: TicketType;
  category: string | null;
  subCategory: string | null;
  itAssetId: number | null;
  fmAssetId: number | null;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  reportedById: number;
  assignedToId: number | null;
  reportedAt: Date;
  assignedAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  resolution: string | null;
  resolutionNotes: string | null;
  images: string[] | null; // JSON array
  documents: string[] | null; // JSON array
  slaDeadline: Date | null;
  slaStatus: SLAStatus | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  reportedBy?: {
    id: number;
    name: string | null;
    email: string | null;
  };
  assignedTo?: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
  itAsset?: {
    id: number;
    assetCode: string;
    name: string;
  } | null;
  fmAsset?: {
    id: number;
    assetCode: string;
    name: string;
  } | null;
  comments?: TicketComment[];
  activities?: TicketActivity[];

  _count?: {
    comments: number;
    activities: number;
  };
}

export interface CreateTicketInput {
  type: TicketType;
  category?: string;
  subCategory?: string;
  itAssetId?: number;
  fmAssetId?: number;
  title: string;
  description: string;
  priority?: TicketPriority;
  assignedToId?: number;
  images?: string[];
  documents?: string[];
}

export interface UpdateTicketInput {
  category?: string;
  subCategory?: string;
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToId?: number;
  resolution?: string;
  resolutionNotes?: string;
  images?: string[];
  documents?: string[];
}

export interface AssignTicketInput {
  ticketId: number;
  assignedToId: number;
  notes?: string;
}

export interface ChangeTicketStatusInput {
  ticketId: number;
  newStatus: TicketStatus;
  notes?: string;
}

export interface CloseTicketInput {
  ticketId: number;
  resolution: string;
  resolutionNotes: string;
}

// ============================================================================
// TICKET COMMENT
// ============================================================================

export interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  comment: string;
  images: string[] | null; // JSON array
  createdAt: Date;
  updatedAt: Date;

  // Relations
  ticket?: Ticket;
  user?: {
    id: number;
    name: string | null;
    email: string | null;
  };
}

export interface CreateCommentInput {
  ticketId: number;
  comment: string;
  images?: string[];
}

export interface UpdateCommentInput {
  comment?: string;
  images?: string[];
}

// ============================================================================
// TICKET ACTIVITY (Audit Trail)
// ============================================================================

export interface TicketActivity {
  id: number;
  ticketId: number;
  userId: number;
  action: TicketActivityAction;
  details: Record<string, any> | null; // JSON
  createdAt: Date;

  // Relations
  ticket?: Ticket;
  user?: {
    id: number;
    name: string | null;
    email: string | null;
  };
}

export interface CreateActivityInput {
  ticketId: number;
  userId: number;
  action: TicketActivityAction;
  details?: Record<string, any>;
}

// ============================================================================
// TICKET FILTERS & QUERIES
// ============================================================================

export interface TicketFilters {
  type?: TicketType;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedToId?: number;
  reportedById?: number;
  slaStatus?: SLAStatus;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  search?: string; // Search in title, description, ticketNumber
}

export interface TicketListQuery extends TicketFilters {
  page?: number;
  limit?: number;
  sortBy?: 'reportedAt' | 'priority' | 'status' | 'slaDeadline';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// TICKET STATISTICS & ANALYTICS
// ============================================================================

export interface TicketStats {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  overdue: number; // SLA breached
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    IT: number;
    FM: number;
  };
}

export interface TicketMetrics {
  averageResolutionTime: number; // in hours
  averageResponseTime: number; // in hours
  slaComplianceRate: number; // percentage
  ticketVolumeByMonth: Array<{
    month: string;
    count: number;
  }>;
  ticketsByCategory: Array<{
    category: string;
    count: number;
  }>;
  technicianPerformance: Array<{
    technicianId: number;
    technicianName: string;
    ticketsResolved: number;
    averageResolutionTime: number;
    slaComplianceRate: number;
  }>;
}

export interface TicketResolutionData {
  ticketId: number;
  ticketNumber: string;
  reportedAt: Date;
  resolvedAt: Date | null;
  resolutionTime: number | null; // in hours
  slaDeadline: Date | null;
  isWithinSLA: boolean;
}

// ============================================================================
// KANBAN BOARD TYPES
// ============================================================================

export interface KanbanColumn {
  id: TicketStatus;
  title: string;
  tickets: Ticket[];
  count: number;
  color: string;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  filters: TicketFilters;
}

// ============================================================================
// TICKET WORKFLOW
// ============================================================================

export interface TicketWorkflowTransition {
  from: TicketStatus;
  to: TicketStatus;
  label: string;
  requiresNotes: boolean;
  requiresResolution: boolean;
}

// Valid workflow transitions
export const TICKET_WORKFLOW: TicketWorkflowTransition[] = [
  { from: 'open', to: 'assigned', label: 'Assign', requiresNotes: false, requiresResolution: false },
  { from: 'open', to: 'in_progress', label: 'Start Work', requiresNotes: false, requiresResolution: false },
  { from: 'assigned', to: 'in_progress', label: 'Start Work', requiresNotes: false, requiresResolution: false },
  { from: 'assigned', to: 'open', label: 'Unassign', requiresNotes: true, requiresResolution: false },
  { from: 'in_progress', to: 'resolved', label: 'Resolve', requiresNotes: false, requiresResolution: true },
  { from: 'in_progress', to: 'assigned', label: 'Reassign', requiresNotes: true, requiresResolution: false },
  { from: 'resolved', to: 'closed', label: 'Close', requiresNotes: false, requiresResolution: false },
  { from: 'resolved', to: 'in_progress', label: 'Reopen', requiresNotes: true, requiresResolution: false },
  { from: 'closed', to: 'in_progress', label: 'Reopen', requiresNotes: true, requiresResolution: false },
];

// Helper function to get available transitions
export function getAvailableTransitions(currentStatus: TicketStatus): TicketWorkflowTransition[] {
  return TICKET_WORKFLOW.filter(t => t.from === currentStatus);
}

// Helper function to validate transition
export function isValidTransition(from: TicketStatus, to: TicketStatus): boolean {
  return TICKET_WORKFLOW.some(t => t.from === from && t.to === to);
}

// ============================================================================
// TICKET CATEGORIES (Common categories for IT and FM)
// ============================================================================

export interface TicketCategory {
  value: string;
  label: string;
  type: TicketType | 'both';
  subCategories?: string[];
}

export const TICKET_CATEGORIES: TicketCategory[] = [
  // IT Categories
  {
    value: 'hardware',
    label: 'Hardware Issue',
    type: 'IT',
    subCategories: ['Not powering on', 'Screen damage', 'Keyboard issue', 'Battery problem', 'Other'],
  },
  {
    value: 'software',
    label: 'Software Issue',
    type: 'IT',
    subCategories: ['Installation', 'Configuration', 'Update', 'License', 'Performance', 'Other'],
  },
  {
    value: 'network',
    label: 'Network/Connectivity',
    type: 'IT',
    subCategories: ['WiFi', 'VPN', 'Printer', 'Internet slow', 'Other'],
  },
  {
    value: 'account',
    label: 'Account/Access',
    type: 'IT',
    subCategories: ['Password reset', 'Account locked', 'Permission request', 'Other'],
  },
  {
    value: 'email',
    label: 'Email Issue',
    type: 'IT',
    subCategories: ['Cannot send', 'Cannot receive', 'Spam', 'Configuration', 'Other'],
  },

  // FM Categories
  {
    value: 'hvac',
    label: 'HVAC/Air Conditioning',
    type: 'FM',
    subCategories: ['Not cooling', 'Noisy', 'Leaking', 'Thermostat issue', 'Filter change', 'Other'],
  },
  {
    value: 'electrical',
    label: 'Electrical',
    type: 'FM',
    subCategories: ['Power outage', 'Light not working', 'Socket issue', 'Circuit breaker', 'Other'],
  },
  {
    value: 'plumbing',
    label: 'Plumbing',
    type: 'FM',
    subCategories: ['Leak', 'Clogged drain', 'No water', 'Low pressure', 'Other'],
  },
  {
    value: 'furniture',
    label: 'Furniture',
    type: 'FM',
    subCategories: ['Damaged', 'Missing parts', 'Replacement request', 'Other'],
  },
  {
    value: 'building',
    label: 'Building Maintenance',
    type: 'FM',
    subCategories: ['Door/Window', 'Floor', 'Ceiling', 'Wall', 'Paint', 'Other'],
  },
  {
    value: 'vehicle',
    label: 'Vehicle',
    type: 'FM',
    subCategories: ['Maintenance', 'Repair', 'Fuel', 'Cleaning', 'Other'],
  },

  // Common
  {
    value: 'general',
    label: 'General Request',
    type: 'both',
    subCategories: ['Information', 'Consultation', 'Other'],
  },
];

// Helper functions
export function getCategoriesByType(type: TicketType): TicketCategory[] {
  return TICKET_CATEGORIES.filter(cat => cat.type === type || cat.type === 'both');
}

export function getSubCategories(categoryValue: string): string[] {
  const category = TICKET_CATEGORIES.find(cat => cat.value === categoryValue);
  return category?.subCategories || [];
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface TicketNotification {
  ticketId: number;
  ticketNumber: string;
  type: 'created' | 'assigned' | 'status_changed' | 'commented' | 'resolved' | 'sla_breach';
  recipientId: number;
  recipientEmail: string;
  subject: string;
  message: string;
  data: Record<string, any>;
}
