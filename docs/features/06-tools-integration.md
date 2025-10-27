# Tools Integration (Phase 2)

## Feature Purpose

Integrated, browser-based execution of common Linux security tools (Subfinder, Httpx, Nuclei, etc.) in isolated Docker containers, eliminating the need for Windows users to maintain VMs or WSL environments. Tools run server-side in sandboxed containers, parse results into structured JSON, and allow import into Findings.

## User Stories

- **As a Windows user**, I want to run Linux security tools from my browser without setting up VMs or WSL
- **As a bug hunter**, I want to run subdomain enumeration and discovery tools on my targets
- **As a pentester**, I want to queue multiple recon jobs and track their progress
- **As a researcher**, I want structured tool output (not raw text) that I can filter and analyze
- **As a user**, I want to import interesting tool results directly into my Findings

## System Architecture

### Components

1. **Frontend (Next.js)**:
   - Tools dashboard UI
   - Job submission forms
   - Job queue status view
   - Result viewer and importer

2. **Backend API (Next.js API Routes)**:
   - Job creation and validation
   - User authentication and authorization
   - Job status queries
   - Result retrieval

3. **Runner Service** (Separate Node.js service):
   - Accepts signed job requests from API
   - Orchestrates Docker container execution
   - Parses stdout/stderr into structured JSON
   - Stores results in database
   - Enforces rate limits and quotas
   - Cleans up containers and temp files

4. **Docker**:
   - Pre-built tool images (Subfinder, Httpx, etc.)
   - Ephemeral containers (destroyed after execution)
   - Resource limits (CPU, memory, network)
   - No persistent storage or network access (except specific APIs)

---

## Database Entities

### ToolJobs Table

```typescript
model ToolJob {
  id              String    @id @default(cuid())
  user_id         String
  target_id       String?   // Optional link to target
  tool_name       ToolName
  target_input    String    // Domain, URL, or IP to scan
  params_json     Json?     // Tool-specific parameters
  status          JobStatus @default(QUEUED)
  priority        Int       @default(5) // 1=High, 10=Low
  
  // Execution details
  started_at      DateTime?
  completed_at    DateTime?
  duration_ms     Int?      // Execution time in milliseconds
  exit_code       Int?
  
  // Results
  result_json     Json?     // Structured output
  result_count    Int?      // Number of results found
  raw_output      String?   @db.Text // Raw stdout (optional, for debugging)
  error_output    String?   @db.Text // stderr if failed
  
  // Metadata
  container_id    String?   // Docker container ID (for cleanup)
  runner_node     String?   // Which runner node executed this
  created_at      DateTime  @default(now())
  
  // Relations
  user            User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  target          Target?   @relation(fields: [target_id], references: [id], onDelete: SetNull)
  
  @@index([user_id])
  @@index([status])
  @@index([created_at])
  @@index([tool_name])
}

enum ToolName {
  SUBFINDER
  HTTPX
  GAU
  WAYBACKURLS
  FFUF
  DIRSEARCH
  NUCLEI
  NMAP         // Future
  AMASS        // Future
  MASSCAN      // Future
}

enum JobStatus {
  QUEUED       // Waiting to execute
  RUNNING      // Currently executing
  COMPLETED    // Finished successfully
  FAILED       // Execution error
  TIMEOUT      // Exceeded time limit
  CANCELLED    // User cancelled
}
```

### UserQuotas Table (Rate Limiting)

```typescript
model UserQuota {
  id              String    @id @default(cuid())
  user_id         String    @unique
  
  // Per-hour limits
  jobs_this_hour  Int       @default(0)
  jobs_hour_reset DateTime
  
  // Per-day limits
  jobs_today      Int       @default(0)
  jobs_day_reset  DateTime
  
  // Lifetime stats
  total_jobs      Int       @default(0)
  total_duration_ms BigInt  @default(0)
  
  updated_at      DateTime  @updatedAt
  
  // Relations
  user            User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

---

## Supported Tools

### 1. Subfinder (Subdomain Enumeration)

**Purpose**: Find subdomains using passive sources (APIs, search engines)

**Parameters**:
```json
{
  "domain": "example.com",
  "sources": ["all"], // or specific: ["virustotal", "shodan"]
  "recursive": false,
  "timeout": 300 // seconds
}
```

**Output Structure**:
```json
{
  "tool": "subfinder",
  "target": "example.com",
  "results": [
    {
      "subdomain": "api.example.com",
      "source": "virustotal"
    },
    {
      "subdomain": "dev.example.com",
      "source": "crtsh"
    }
  ],
  "total": 25,
  "duration_ms": 12500
}
```

---

### 2. Httpx (HTTP Probing)

**Purpose**: Probe subdomains/URLs for HTTP services, technologies, status codes

**Parameters**:
```json
{
  "targets": ["api.example.com", "dev.example.com"],
  "follow_redirects": true,
  "tech_detect": true,
  "status_code": true,
  "timeout": 10
}
```

**Output Structure**:
```json
{
  "tool": "httpx",
  "results": [
    {
      "url": "https://api.example.com",
      "status_code": 200,
      "title": "Example API",
      "technologies": ["nginx", "php"],
      "content_length": 4567,
      "response_time_ms": 234
    }
  ],
  "total": 15
}
```

---

### 3. Gau / Waybackurls (URL Discovery)

**Purpose**: Fetch known URLs from Internet Archive, Common Crawl, etc.

**Parameters**:
```json
{
  "domain": "example.com",
  "providers": ["wayback", "commoncrawl"],
  "blacklist": [".jpg", ".png", ".css"],
  "year_from": 2020
}
```

**Output Structure**:
```json
{
  "tool": "gau",
  "target": "example.com",
  "results": [
    {
      "url": "https://example.com/api/v1/users",
      "source": "wayback"
    }
  ],
  "total": 1523
}
```

---

### 4. FFUF (Directory/Endpoint Fuzzing)

**Purpose**: Discover hidden endpoints, files, parameters

**Parameters**:
```json
{
  "url": "https://example.com/FUZZ",
  "wordlist": "common.txt", // Pre-loaded wordlists
  "match_codes": [200, 301, 302],
  "threads": 40,
  "timeout": 600
}
```

**Output Structure**:
```json
{
  "tool": "ffuf",
  "target": "https://example.com/",
  "results": [
    {
      "url": "https://example.com/admin",
      "status": 200,
      "size": 1234,
      "words": 456,
      "lines": 78
    }
  ],
  "total": 42
}
```

---

### 5. Nuclei (Vulnerability Scanning)

**Purpose**: Run templated vulnerability checks

**Parameters**:
```json
{
  "targets": ["https://example.com"],
  "templates": ["cves", "exposures"], // or "all"
  "severity": ["critical", "high"],
  "timeout": 900
}
```

**Output Structure**:
```json
{
  "tool": "nuclei",
  "results": [
    {
      "template_id": "CVE-2021-12345",
      "name": "Example Vulnerability",
      "severity": "high",
      "url": "https://example.com/vulnerable",
      "matched_at": "https://example.com/vulnerable",
      "description": "Detailed description",
      "reference": ["https://cve.org/CVE-2021-12345"]
    }
  ],
  "total": 3
}
```

---

## API Endpoints

### Job Management

#### POST `/api/tools/jobs`
Create and queue a new tool job.

**Request Body**:
```json
{
  "tool_name": "SUBFINDER",
  "target_id": "clx...", // optional
  "target_input": "example.com",
  "params_json": {
    "sources": ["all"],
    "recursive": false
  }
}
```

**Response** (201):
```json
{
  "job": {
    "id": "job_clx...",
    "tool_name": "SUBFINDER",
    "target_input": "example.com",
    "status": "QUEUED",
    "created_at": "2025-01-27T10:00:00Z"
  },
  "message": "Job queued successfully",
  "estimated_start": "2025-01-27T10:00:30Z"
}
```

**Errors**:
- 429: Rate limit exceeded
- 400: Invalid parameters
- 403: Quota exceeded

---

#### GET `/api/tools/jobs`
List user's tool jobs.

**Query Parameters**:
- `status`: Filter by status
- `tool_name`: Filter by tool
- `target_id`: Filter by target
- `limit`: Page size
- `offset`: Pagination offset

**Response** (200):
```json
{
  "jobs": [
    {
      "id": "job_clx...",
      "tool_name": "SUBFINDER",
      "target_input": "example.com",
      "status": "COMPLETED",
      "result_count": 25,
      "duration_ms": 12500,
      "created_at": "2025-01-27T09:00:00Z",
      "completed_at": "2025-01-27T09:00:15Z"
    }
  ],
  "total": 42
}
```

---

#### GET `/api/tools/jobs/:id`
Get job details and results.

**Response** (200):
```json
{
  "id": "job_clx...",
  "tool_name": "SUBFINDER",
  "target_input": "example.com",
  "status": "COMPLETED",
  "result_json": {
    "tool": "subfinder",
    "results": [...]
  },
  "result_count": 25,
  "duration_ms": 12500,
  "started_at": "2025-01-27T09:00:00Z",
  "completed_at": "2025-01-27T09:00:15Z"
}
```

---

#### DELETE `/api/tools/jobs/:id`
Cancel a queued job or delete completed job.

**Response** (200):
```json
{
  "message": "Job cancelled successfully"
}
```

---

### Result Import

#### POST `/api/tools/jobs/:id/import-findings`
Convert tool results into findings.

**Request Body**:
```json
{
  "selected_results": [0, 2, 5], // Indices of results to import
  "severity": "INFO", // Default severity for imported findings
  "target_id": "clx..." // Which target to link findings to
}
```

**Response** (201):
```json
{
  "findings_created": 3,
  "finding_ids": ["find1...", "find2...", "find3..."],
  "message": "3 findings created from tool results"
}
```

---

### Quota Check

#### GET `/api/tools/quota`
Check current user's quota and usage.

**Response** (200):
```json
{
  "limits": {
    "jobs_per_hour": 10,
    "jobs_per_day": 50
  },
  "usage": {
    "jobs_this_hour": 3,
    "jobs_today": 15,
    "hour_resets_at": "2025-01-27T11:00:00Z",
    "day_resets_at": "2025-01-28T00:00:00Z"
  },
  "total_jobs": 127
}
```

---

## Runner Service Architecture

### Communication Flow

```
1. User submits job via frontend
2. Next.js API validates request, checks quota
3. API creates job record in DB (status=QUEUED)
4. API signs job request (JWT) and sends to Runner Service
5. Runner Service validates signature
6. Runner Service pulls job from queue
7. Runner Service spins up Docker container
8. Container executes tool, outputs to stdout
9. Runner Service parses stdout into JSON
10. Runner Service updates job record with results
11. Runner Service destroys container
12. Frontend polls job status, displays results
```

---

### Runner Service (`runner/`)

**Technology**: Node.js + Dockerode

**Structure**:
```
runner/
├── src/
│   ├── server.ts          # Express server
│   ├── queue.ts           # Job queue manager (Bull/BullMQ or custom)
│   ├── executor.ts        # Docker container orchestration
│   ├── parsers/           # Tool output parsers
│   │   ├── subfinder.ts
│   │   ├── httpx.ts
│   │   ├── gau.ts
│   │   ├── ffuf.ts
│   │   └── nuclei.ts
│   ├── security.ts        # JWT validation, sandboxing
│   └── cleanup.ts         # Container and temp file cleanup
├── docker/
│   ├── subfinder.Dockerfile
│   ├── httpx.Dockerfile
│   └── ... (one per tool)
├── package.json
└── tsconfig.json
```

---

### Docker Images

**Base Security Principles**:
- Minimal base images (Alpine Linux)
- Non-root user
- No network access (except tool-specific APIs)
- Read-only root filesystem
- Resource limits (CPU, memory)
- No persistent storage mounts

**Example Dockerfile** (Subfinder):
```dockerfile
FROM golang:1.21-alpine AS builder
RUN go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest

FROM alpine:latest
RUN adduser -D -u 1000 tooluser
COPY --from=builder /go/bin/subfinder /usr/local/bin/
USER tooluser
ENTRYPOINT ["/usr/local/bin/subfinder"]
```

---

### Execution & Sandboxing

**Docker Run Configuration**:
```typescript
const container = await docker.createContainer({
  Image: `bugtrack-${toolName}:latest`,
  Cmd: buildToolCommand(job),
  HostConfig: {
    Memory: 512 * 1024 * 1024, // 512MB limit
    CpuQuota: 50000, // 50% of one CPU
    NetworkMode: "none", // No network (or restricted)
    ReadonlyRootfs: true,
    AutoRemove: true, // Auto-cleanup
    CapDrop: ["ALL"], // Drop all capabilities
  },
  User: "1000:1000", // Non-root
  AttachStdout: true,
  AttachStderr: true,
});

await container.start();

// Timeout after max duration
const timeout = setTimeout(() => container.kill(), job.timeout_ms);

const output = await container.wait();
clearTimeout(timeout);

const stdout = await container.logs({ stdout: true, stderr: false });
const stderr = await container.logs({ stdout: false, stderr: true });
```

---

### Result Parsing

**Parser Interface**:
```typescript
interface ToolParser {
  parse(stdout: string, stderr: string): ParsedResult;
}

interface ParsedResult {
  results: any[];
  total: number;
  metadata?: any;
  errors?: string[];
}
```

**Example** (Subfinder Parser):
```typescript
class SubfinderParser implements ToolParser {
  parse(stdout: string, stderr: string): ParsedResult {
    const lines = stdout.trim().split('\n').filter(Boolean);
    
    const results = lines.map(subdomain => ({
      subdomain: subdomain.trim(),
      source: "subfinder" // Subfinder doesn't output source in basic mode
    }));
    
    return {
      results,
      total: results.length
    };
  }
}
```

---

## UI/UX Wireframes

### Tools Dashboard (`/tools`)

**Layout**:

**Header**:
- Page title "Security Tools"
- "Run New Tool" button
- Active jobs counter badge
- Link to "Job History"

**Tool Cards Grid**:
Each tool card shows:
- Tool icon/logo
- Tool name
- Short description
- "Run Tool" button
- Last used timestamp
- Usage count

**Available Tools**:
- Subfinder - Subdomain Discovery
- Httpx - HTTP Probing
- Gau - URL Discovery
- FFUF - Directory Fuzzing
- Nuclei - Vulnerability Scanner

---

### Run Tool Modal

**Header**: "Run [Tool Name]"

**Form**:
1. **Target** (required):
   - Text input or dropdown (select from targets)
   - Domain, URL, or IP depending on tool
   
2. **Link to Target** (optional):
   - Dropdown to select existing target
   
3. **Parameters** (tool-specific):
   - Subfinder: Sources, Recursive toggle
   - Httpx: Follow redirects, Tech detect toggles
   - FFUF: Wordlist selector, Match codes
   - etc.
   
4. **Advanced Options** (collapsible):
   - Timeout
   - Priority
   - Save results

**Actions**:
- "Run Tool" button (shows quota warning if near limit)
- "Cancel" button

**Quota Indicator** (bottom):
- "Jobs remaining today: 35/50"
- "Jobs remaining this hour: 7/10"

---

### Job Queue View (`/tools/queue`)

**Real-time Status List**:
Each job row shows:
- Tool name badge
- Target
- Status (color-coded)
  - Queued (gray)
  - Running (blue, with spinner)
  - Completed (green)
  - Failed (red)
- Progress bar (if running)
- Started time / Duration
- Result count (if completed)
- Actions: View Results, Cancel, Delete

**Filters**:
- Status filter
- Tool filter
- Date range

**Auto-refresh**: Poll every 3 seconds for updates

---

### Job Results Page (`/tools/jobs/:id`)

**Header**:
- Tool name
- Target
- Status badge
- Duration
- "Export Results" button (JSON, CSV)
- "Import to Findings" button

**Results Table** (tool-specific columns):

**Subfinder Results**:
- Subdomain
- Source
- Checkbox (for import)

**Httpx Results**:
- URL
- Status Code
- Title
- Technologies
- Response Time
- Checkbox

**Nuclei Results**:
- Template ID
- Severity badge
- Vulnerability Name
- Matched URL
- "Create Finding" button

**Bulk Actions**:
- "Select All" checkbox
- "Import Selected" button
- "Export Selected" button

---

### Import to Findings Flow

**Import Modal**:
1. Select results (checkboxes)
2. Choose target to link findings to
3. Set default severity
4. Preview findings to be created (titles, descriptions)
5. "Create [N] Findings" button

**Post-Import**:
- Toast: "3 findings created from tool results"
- Links to new findings

---

## Security Considerations

### Sandboxing & Isolation
- Containers run with minimal privileges (drop all capabilities)
- No persistent storage access
- Network isolation (or whitelist specific APIs only)
- Read-only root filesystem
- Resource limits prevent DoS (CPU, memory, disk I/O)

### Input Validation
- Validate target format (domain, URL, IP)
- Sanitize all parameters to prevent command injection
- Limit parameter values (timeouts, thread counts)
- Reject known malicious patterns

### Authentication & Authorization
- API → Runner communication uses signed JWTs
- Verify user owns the target they're scanning
- Enforce per-user rate limits and quotas
- Log all job executions for audit

### Rate Limiting & Quotas
- Default: 10 jobs/hour, 50 jobs/day per user
- Premium users: Higher limits (future)
- Block users who abuse system
- Exponential backoff for failed jobs

### Output Sanitization
- Parse and structure output (don't return raw)
- Strip potentially sensitive info from errors
- Limit result sizes (prevent giant outputs)
- Sanitize for XSS when displaying

### Container Security
- Pull images from trusted sources
- Scan images for vulnerabilities (Trivy)
- Auto-update tool versions
- Monitor for container escape attempts

### Abuse Prevention
- Detect and block scanning of non-owned targets
- IP reputation checks
- Report abuse feature
- Automatic suspension for ToS violations

---

## Acceptance Criteria

### Job Execution
- ✅ User can submit a tool job with valid parameters
- ✅ Job is queued and executed in order
- ✅ Job runs in isolated Docker container
- ✅ Job results are parsed into structured JSON
- ✅ Job completes within timeout or is killed
- ✅ Container is cleaned up after execution

### Result Management
- ✅ User can view job results in formatted table
- ✅ User can export results as JSON/CSV
- ✅ User can import results into Findings
- ✅ Large result sets are paginated

### Quota & Rate Limiting
- ✅ User cannot exceed hourly/daily quotas
- ✅ Quota resets at correct intervals
- ✅ User can view current quota usage
- ✅ Jobs are rejected with clear error if quota exceeded

### Security
- ✅ Containers cannot access host filesystem
- ✅ Containers cannot make arbitrary network requests
- ✅ Resource limits prevent runaway jobs
- ✅ Command injection attempts are blocked
- ✅ Only authenticated users can run jobs
- ✅ Users can only access their own jobs

### Monitoring
- ✅ Failed jobs are logged with error details
- ✅ Container escapes are detected and alerted
- ✅ Resource usage is tracked per user

---

## Testing Checklist

### Unit Tests
- [ ] Parameter validation for each tool
- [ ] Output parsers for each tool
- [ ] JWT signature validation
- [ ] Quota calculation logic

### Integration Tests
- [ ] Submit job → execute → parse → store results
- [ ] Job timeout enforcement
- [ ] Container cleanup
- [ ] Rate limit enforcement
- [ ] Import results to findings

### Security Tests
- [ ] Command injection attempts blocked
- [ ] Container escape attempts (test with security scanner)
- [ ] Unauthorized job access blocked
- [ ] Resource limits enforced (memory bomb, CPU spike)

### E2E Tests
- [ ] User runs Subfinder on domain
- [ ] User views results in real-time
- [ ] User imports subdomains to findings
- [ ] User runs Nuclei and creates findings from CVEs
- [ ] User exceeds quota and is blocked

---

## Deployment

### Runner Service Deployment
- Separate VPS or K8s cluster with Docker installed
- Auto-scaling based on queue length
- Monitoring: Prometheus + Grafana
- Alerts: Slack/Email for failures

### Docker Image Registry
- Private registry (Docker Hub, GitHub Packages, AWS ECR)
- Auto-build on tool version updates
- Vulnerability scanning in CI/CD

### Networking
- Runner Service behind firewall
- Only accepts requests from Next.js API (IP whitelist or VPN)
- No inbound access to containers

---

## Future Enhancements (Phase 3+)

- Custom wordlist uploads
- Scheduled recurring jobs (daily subdomain monitoring)
- Diff results between job runs (new subdomains found)
- Integration with Shodan/Censys APIs
- Custom tool scripts (user-provided Docker images)
- Distributed runner nodes for scaling
- Webhooks for job completion

