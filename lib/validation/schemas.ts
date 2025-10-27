/**
 * Zod validation schemas for API requests
 */

import { z } from 'zod';

// ============================================================================
// Authentication Schemas
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().max(100).trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string(),
  two_fa_code: z.string().length(6).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  new_password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

// ============================================================================
// Target Schemas
// ============================================================================

export const scopeItemSchema = z.object({
  type: z.enum(['domain', 'ip', 'cidr', 'url', 'wildcard', 'other']),
  value: z.string(),
  description: z.string().optional(),
  eligible_vulnerabilities: z.array(z.string()).optional(),
});

export const targetScopeSchema = z.object({
  in_scope: z.array(scopeItemSchema),
  out_of_scope: z.array(scopeItemSchema),
  rules: z.string().optional(),
});

export const createTargetSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  program_type: z.enum(['BUG_BOUNTY', 'VDP', 'PENTEST', 'PERSONAL', 'CTF']),
  url: z.string().url().max(2048).optional(),
  platform: z.string().max(100).optional(),
  scope_json: targetScopeSchema,
  tags: z.array(z.string().max(50)).max(20).default([]),
  notes: z.string().max(10000).optional(),
  priority: z.number().int().min(1).max(3).default(2),
  reward_range: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
});

export const updateTargetSchema = createTargetSchema.partial();

// ============================================================================
// Finding Schemas
// ============================================================================

export const createFindingSchema = z.object({
  title: z.string().min(1).max(300).trim(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  target_id: z.string().cuid().optional(),
  vulnerability_type: z.string().max(50).optional(),
  cvss_score: z.number().min(0).max(10).optional(),
  description_md: z.string().max(100000),
  impact: z.string().max(10000).optional(),
  reproduction_steps: z.string().max(10000).optional(),
  remediation: z.string().max(10000).optional(),
  references: z.array(z.string().url()).max(20).default([]),
  tags: z.array(z.string().max(50)).max(20).default([]),
  workflow_state: z
    .enum([
      'DRAFT',
      'TESTING',
      'REPORTED',
      'TRIAGED',
      'ACCEPTED',
      'FIXED',
      'DUPLICATE',
      'NOT_APPLICABLE',
      'REWARDED',
    ])
    .default('DRAFT'),
});

export const updateFindingSchema = createFindingSchema.partial();

// ============================================================================
// Payload Schemas
// ============================================================================

export const createPayloadSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  category: z.enum([
    'XSS',
    'SQLI',
    'COMMAND_INJECTION',
    'SSRF',
    'XXE',
    'LFI_RFI',
    'IDOR',
    'CSRF',
    'AUTH_BYPASS',
    'DESERIALIZATION',
    'TEMPLATE_INJECTION',
    'LDAP_INJECTION',
    'NOSQL_INJECTION',
    'PROTOTYPE_POLLUTION',
    'RACE_CONDITION',
    'RECON_COMMAND',
    'FUZZING_WORDLIST',
    'CUSTOM_SCRIPT',
    'OTHER',
  ]),
  content: z.string().max(100000),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  is_encrypted: z.boolean().default(false),
  encryption_iv: z.string().optional(),
  source_url: z.string().url().max(2048).optional(),
  language: z.string().max(20).optional(),
});

export const updatePayloadSchema = createPayloadSchema.partial();

// ============================================================================
// Note Schemas
// ============================================================================

export const createNoteSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  encrypted_content: z.string().max(1000000), // Base64 encoded
  encryption_iv: z.string(),
  content_hash: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

// ============================================================================
// Tool Job Schemas (Phase 2)
// ============================================================================

export const createToolJobSchema = z.object({
  tool_name: z.enum([
    'SUBFINDER',
    'HTTPX',
    'GAU',
    'WAYBACKURLS',
    'FFUF',
    'DIRSEARCH',
    'NUCLEI',
    'NMAP',
    'AMASS',
    'MASSCAN',
  ]),
  target_id: z.string().cuid().optional(),
  target_input: z.string().min(1).max(500),
  params_json: z.record(z.any()).optional(),
  priority: z.number().int().min(1).max(10).default(5),
});

// ============================================================================
// Query Parameter Schemas
// ============================================================================

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
});

