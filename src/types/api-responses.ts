/**
 * TypeScript Type Definitions for API Responses
 * Standardized response formats for all API endpoints
 */

// ============================================================================
// GENERIC API RESPONSE WRAPPERS
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  statusCode: number;
  details?: any;
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface CursorPaginationMeta {
  cursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: CursorPaginationMeta;
}

// ============================================================================
// LIST RESPONSES (with optional pagination)
// ============================================================================

export interface ListResponse<T> {
  data: T[];
  count: number;
  filters?: Record<string, any>;
}

export interface PaginatedListResponse<T> extends PaginatedResponse<T> {
  filters?: Record<string, any>;
}

// ============================================================================
// DETAILED ENTITY RESPONSE (with relations)
// ============================================================================

export interface DetailedResponse<T> {
  data: T;
  related?: Record<string, any>;
  meta?: Record<string, any>;
}

// ============================================================================
// BULK OPERATION RESPONSES
// ============================================================================

export interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors?: Array<{
    id: number | string;
    error: string;
  }>;
}

export interface BulkCreateResponse<T> {
  created: T[];
  result: BulkOperationResult;
}

export interface BulkUpdateResponse {
  updated: number[];
  result: BulkOperationResult;
}

export interface BulkDeleteResponse {
  deleted: number[];
  result: BulkOperationResult;
}

// ============================================================================
// FILE UPLOAD RESPONSES
// ============================================================================

export interface FileUploadResponse {
  success: boolean;
  file?: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimeType: string;
    url: string;
  };
  error?: string;
}

export interface MultipleFileUploadResponse {
  success: boolean;
  files: Array<{
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimeType: string;
    url: string;
  }>;
  failed?: Array<{
    filename: string;
    error: string;
  }>;
}

// ============================================================================
// STATISTICS & ANALYTICS RESPONSES
// ============================================================================

export interface StatsResponse<T = Record<string, number>> {
  stats: T;
  period?: {
    from: Date | string;
    to: Date | string;
  };
  filters?: Record<string, any>;
}

export interface TimeSeriesData {
  timestamp: Date | string;
  value: number;
  label?: string;
}

export interface TimeSeriesResponse {
  data: TimeSeriesData[];
  aggregation: 'day' | 'week' | 'month' | 'quarter' | 'year';
  period: {
    from: Date | string;
    to: Date | string;
  };
}

export interface ChartDataResponse {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}

// ============================================================================
// EXPORT RESPONSES
// ============================================================================

export interface ExportResponse {
  success: boolean;
  format: 'xlsx' | 'csv' | 'pdf';
  filename: string;
  url: string;
  size: number;
  recordCount: number;
}

export interface ReportResponse {
  success: boolean;
  reportType: string;
  format: 'pdf' | 'xlsx';
  filename: string;
  url: string;
  generatedAt: Date | string;
  parameters: Record<string, any>;
}

// ============================================================================
// VALIDATION RESPONSES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: 'Validation failed';
  errors: ValidationError[];
}

// ============================================================================
// OPERATION STATUS RESPONSES
// ============================================================================

export interface OperationStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number; // 0-100
  message?: string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  error?: string;
}

export interface AsyncOperationResponse {
  operationId: string;
  status: OperationStatus;
  pollUrl?: string;
  resultUrl?: string;
}

// ============================================================================
// SEARCH RESPONSES
// ============================================================================

export interface SearchResult<T> {
  item: T;
  score: number; // Relevance score
  highlights?: Record<string, string[]>; // Highlighted matches
}

export interface SearchResponse<T> {
  results: SearchResult<T>[];
  query: string;
  total: number;
  took: number; // Milliseconds
  filters?: Record<string, any>;
}

// ============================================================================
// AUTOCOMPLETE / SUGGESTION RESPONSES
// ============================================================================

export interface SuggestionResponse {
  suggestions: Array<{
    value: string;
    label: string;
    category?: string;
    metadata?: Record<string, any>;
  }>;
  query: string;
}

// ============================================================================
// HEALTH CHECK / STATUS RESPONSES
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date | string;
  services: Record<string, {
    status: 'up' | 'down';
    responseTime?: number;
    message?: string;
  }>;
}

export interface SystemStatusResponse {
  version: string;
  environment: string;
  uptime: number; // seconds
  database: {
    connected: boolean;
    latency?: number;
  };
  cache?: {
    connected: boolean;
    hitRate?: number;
  };
}

// ============================================================================
// COMMON HTTP STATUS CODE TYPES
// ============================================================================

export type SuccessResponse<T> = {
  status: 200 | 201;
  data: T;
};

export type ErrorResponse = {
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503;
  error: string;
  message?: string;
};

// ============================================================================
// TYPED ERROR RESPONSES
// ============================================================================

export interface UnauthorizedError {
  status: 401;
  error: 'Unauthorized';
  message: 'Authentication required';
}

export interface ForbiddenError {
  status: 403;
  error: 'Forbidden';
  message: 'Insufficient permissions';
}

export interface NotFoundError {
  status: 404;
  error: 'Not Found';
  message: string;
  resource?: string;
  resourceId?: number | string;
}

export interface ConflictError {
  status: 409;
  error: 'Conflict';
  message: string;
  conflictingField?: string;
  existingValue?: any;
}

export interface RateLimitError {
  status: 429;
  error: 'Too Many Requests';
  message: string;
  retryAfter?: number; // seconds
}

export interface InternalServerError {
  status: 500;
  error: 'Internal Server Error';
  message: 'An unexpected error occurred';
  requestId?: string;
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isApiError(response: any): response is ApiError {
  return response && response.success === false && typeof response.error === 'string';
}

export function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return response && Array.isArray(response.data) && response.pagination && typeof response.pagination.page === 'number';
}

export function isValidationErrorResponse(response: any): response is ValidationErrorResponse {
  return response && response.success === false && Array.isArray(response.errors);
}

// ============================================================================
// RESPONSE BUILDER HELPERS (for API routes)
// ============================================================================

export class ResponseBuilder {
  static success<T>(data: T, status: 200 | 201 = 200) {
    return { success: true, data, status };
  }

  static error(error: string, status: number = 500) {
    return { success: false, error, status };
  }

  static paginated<T>(data: T[], page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  static notFound(resource: string, id?: number | string) {
    return {
      success: false,
      error: 'Not Found',
      message: id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      status: 404,
    };
  }

  static unauthorized(message: string = 'Authentication required') {
    return {
      success: false,
      error: 'Unauthorized',
      message,
      status: 401,
    };
  }

  static forbidden(message: string = 'Insufficient permissions') {
    return {
      success: false,
      error: 'Forbidden',
      message,
      status: 403,
    };
  }

  static validationError(errors: ValidationError[]) {
    return {
      success: false,
      error: 'Validation failed',
      errors,
      status: 422,
    };
  }

  static conflict(message: string, field?: string) {
    return {
      success: false,
      error: 'Conflict',
      message,
      conflictingField: field,
      status: 409,
    };
  }
}
