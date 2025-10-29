'use client';

import { useState } from 'react';
import { exportAsMarkdown, exportAsPDF } from '@/lib/utils/export';

interface ExportButtonsProps {
  finding: any;
}

export default function ExportButtons({ finding }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleMarkdownExport = () => {
    setIsExporting(true);
    try {
      exportAsMarkdown(finding);
    } catch (error) {
      console.error('Markdown export error:', error);
      alert('Failed to export as Markdown. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = () => {
    setIsExporting(true);
    try {
      exportAsPDF(finding);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export as PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleMarkdownExport}
        disabled={isExporting}
        className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        title="Export as Markdown"
      >
        <span>📄</span>
        <span>Markdown</span>
      </button>
      
      <button
        onClick={handlePDFExport}
        disabled={isExporting}
        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        title="Export as PDF"
      >
        <span>📑</span>
        <span>PDF</span>
      </button>
    </div>
  );
}

