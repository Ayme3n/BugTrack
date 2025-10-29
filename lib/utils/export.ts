import jsPDF from 'jspdf';

interface Finding {
  id: string;
  title: string;
  severity: string;
  cvss_score?: number;
  status: string;
  vulnerability_type?: string;
  endpoint?: string;
  description?: string;
  impact?: string;
  steps_to_reproduce?: string;
  remediation?: string;
  proof_of_concept?: string;
  references?: string;
  tags?: string[];
  reward_amount?: number;
  reward_currency?: string;
  reported_at?: string;
  created_at: string;
  target?: {
    name: string;
    url?: string;
    scope?: any;
  };
}

/**
 * Export finding as Markdown file
 */
export function exportAsMarkdown(finding: Finding): void {
  const markdown = generateMarkdownReport(finding);
  
  // Create blob and download
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(finding.title)}-report.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export finding as PDF file
 */
export function exportAsPDF(finding: Finding): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
  };

  const addSpace = (space: number = 5) => {
    yPosition += space;
  };

  // Title and Header
  pdf.setFillColor(37, 99, 235); // Blue background
  pdf.rect(0, 0, pageWidth, 40, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BUG BOUNTY REPORT', margin, 20);
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 30);

  // Reset text color
  pdf.setTextColor(0, 0, 0);
  yPosition = 50;

  // Finding Title
  addText(finding.title, 18, true);
  addSpace(8);

  // Severity Badge
  const severityColors: Record<string, [number, number, number]> = {
    CRITICAL: [220, 38, 38],
    HIGH: [234, 88, 12],
    MEDIUM: [234, 179, 8],
    LOW: [34, 197, 94],
    INFO: [59, 130, 246],
  };
  const color = severityColors[finding.severity] || [100, 100, 100];
  pdf.setFillColor(...color);
  pdf.roundedRect(margin, yPosition - 5, 30, 8, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(finding.severity, margin + 15, yPosition, { align: 'center' });
  
  // CVSS Score
  if (finding.cvss_score) {
    pdf.setTextColor(0, 0, 0);
    pdf.text(`CVSS: ${finding.cvss_score}`, margin + 35, yPosition);
  }
  
  pdf.setTextColor(0, 0, 0);
  yPosition += 12;

  // Separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Target Information
  addText('TARGET INFORMATION', 14, true);
  addSpace(3);
  if (finding.target) {
    addText(`Program: ${finding.target.name}`, 10, true);
    if (finding.target.url) {
      addText(`URL: ${finding.target.url}`);
    }
  }
  addSpace(8);

  // Vulnerability Details
  addText('VULNERABILITY DETAILS', 14, true);
  addSpace(3);
  
  if (finding.vulnerability_type) {
    addText(`Type: ${finding.vulnerability_type}`, 10, true);
  }
  if (finding.endpoint) {
    addText(`Endpoint: ${finding.endpoint}`);
  }
  addText(`Status: ${finding.status}`);
  addSpace(8);

  // Description
  if (finding.description) {
    addText('DESCRIPTION', 12, true);
    addSpace(3);
    addText(finding.description);
    addSpace(8);
  }

  // Impact
  if (finding.impact) {
    addText('IMPACT', 12, true);
    addSpace(3);
    addText(finding.impact);
    addSpace(8);
  }

  // Steps to Reproduce
  if (finding.steps_to_reproduce) {
    addText('STEPS TO REPRODUCE', 12, true);
    addSpace(3);
    addText(finding.steps_to_reproduce);
    addSpace(8);
  }

  // Proof of Concept
  if (finding.proof_of_concept) {
    addText('PROOF OF CONCEPT', 12, true);
    addSpace(3);
    addText(finding.proof_of_concept);
    addSpace(8);
  }

  // Remediation
  if (finding.remediation) {
    addText('REMEDIATION', 12, true);
    addSpace(3);
    addText(finding.remediation);
    addSpace(8);
  }

  // References
  if (finding.references) {
    addText('REFERENCES', 12, true);
    addSpace(3);
    addText(finding.references);
    addSpace(8);
  }

  // Tags
  if (finding.tags && finding.tags.length > 0) {
    addText('TAGS', 12, true);
    addSpace(3);
    addText(finding.tags.join(', '));
    addSpace(8);
  }

  // Reward Information
  if (finding.reward_amount) {
    addText('REWARD', 12, true);
    addSpace(3);
    addText(`${finding.reward_currency || '$'}${finding.reward_amount}`);
    addSpace(8);
  }

  // Footer
  const footerY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Generated by BugTrack - Bug Bounty Management Platform', pageWidth / 2, footerY, { align: 'center' });

  // Save PDF
  pdf.save(`${sanitizeFilename(finding.title)}-report.pdf`);
}

/**
 * Generate markdown report content
 */
function generateMarkdownReport(finding: Finding): string {
  const sections: string[] = [];

  // Header
  sections.push('# BUG BOUNTY REPORT\n');
  sections.push(`**Generated:** ${new Date().toLocaleString()}\n`);
  sections.push('---\n');

  // Title
  sections.push(`# ${finding.title}\n`);

  // Metadata
  sections.push('## Summary\n');
  sections.push(`- **Severity:** ${finding.severity}`);
  if (finding.cvss_score) {
    sections.push(`- **CVSS Score:** ${finding.cvss_score}`);
  }
  sections.push(`- **Status:** ${finding.status}`);
  if (finding.vulnerability_type) {
    sections.push(`- **Vulnerability Type:** ${finding.vulnerability_type}`);
  }
  if (finding.endpoint) {
    sections.push(`- **Endpoint:** ${finding.endpoint}`);
  }
  sections.push('');

  // Target Information
  if (finding.target) {
    sections.push('## Target Information\n');
    sections.push(`- **Program:** ${finding.target.name}`);
    if (finding.target.url) {
      sections.push(`- **URL:** ${finding.target.url}`);
    }
    if (finding.target.scope) {
      sections.push(`- **Scope:** ${typeof finding.target.scope === 'string' ? finding.target.scope : JSON.stringify(finding.target.scope, null, 2)}`);
    }
    sections.push('');
  }

  // Description
  if (finding.description) {
    sections.push('## Description\n');
    sections.push(finding.description);
    sections.push('');
  }

  // Impact
  if (finding.impact) {
    sections.push('## Impact\n');
    sections.push(finding.impact);
    sections.push('');
  }

  // Steps to Reproduce
  if (finding.steps_to_reproduce) {
    sections.push('## Steps to Reproduce\n');
    sections.push(finding.steps_to_reproduce);
    sections.push('');
  }

  // Proof of Concept
  if (finding.proof_of_concept) {
    sections.push('## Proof of Concept\n');
    sections.push('```');
    sections.push(finding.proof_of_concept);
    sections.push('```');
    sections.push('');
  }

  // Remediation
  if (finding.remediation) {
    sections.push('## Remediation\n');
    sections.push(finding.remediation);
    sections.push('');
  }

  // References
  if (finding.references) {
    sections.push('## References\n');
    sections.push(finding.references);
    sections.push('');
  }

  // Tags
  if (finding.tags && finding.tags.length > 0) {
    sections.push('## Tags\n');
    sections.push(finding.tags.map(tag => `\`${tag}\``).join(', '));
    sections.push('');
  }

  // Reward
  if (finding.reward_amount) {
    sections.push('## Reward\n');
    sections.push(`${finding.reward_currency || '$'}${finding.reward_amount}`);
    sections.push('');
  }

  // Timeline
  sections.push('## Timeline\n');
  sections.push(`- **Created:** ${new Date(finding.created_at).toLocaleString()}`);
  if (finding.reported_at) {
    sections.push(`- **Reported:** ${new Date(finding.reported_at).toLocaleString()}`);
  }
  sections.push('');

  // Footer
  sections.push('---');
  sections.push('*Generated by BugTrack - Bug Bounty Management Platform*');

  return sections.join('\n');
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 100);
}

