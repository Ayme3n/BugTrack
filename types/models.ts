// Domain model types (matching Prisma schema)

import type {
  User,
  Target,
  Finding,
  Attachment,
  Payload,
  Note,
  ToolJob,
  ProgramType,
  TargetStatus,
  Severity,
  FindingStatus,
  WorkflowState,
  AttachmentType,
  PayloadCategory,
  ToolName,
  JobStatus,
} from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Target,
  Finding,
  Attachment,
  Payload,
  Note,
  ToolJob,
  ProgramType,
  TargetStatus,
  Severity,
  FindingStatus,
  WorkflowState,
  AttachmentType,
  PayloadCategory,
  ToolName,
  JobStatus,
};

// Extended types with relations
export type UserWithRelations = User & {
  targets?: Target[];
  findings?: Finding[];
  payloads?: Payload[];
  notes?: Note[];
};

export type TargetWithRelations = Target & {
  user?: User;
  findings?: Finding[];
  findingCount?: number;
};

export type FindingWithRelations = Finding & {
  user?: User;
  target?: Target;
  attachments?: Attachment[];
};

export type PayloadWithUsage = Payload & {
  usage_count: number;
};

// Scope types (for Target scope_json field)
export interface TargetScope {
  in_scope: ScopeItem[];
  out_of_scope: ScopeItem[];
  rules?: string;
}

export interface ScopeItem {
  type: 'domain' | 'ip' | 'cidr' | 'url' | 'wildcard' | 'other';
  value: string;
  description?: string;
  eligible_vulnerabilities?: string[];
}

// Tool result types (for ToolJob result_json field)
export interface ToolResult {
  tool: string;
  target?: string;
  results: any[];
  total: number;
  duration_ms?: number;
  metadata?: Record<string, any>;
  errors?: string[];
}

