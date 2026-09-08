import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Upload, Download, Plus } from 'lucide-react';
import { ExportScopeModal, ExportScope } from './ExportScopeModal';
import { ImportCsvModal } from './ImportCsvModal';

interface PageHeaderProps {
  title: string;
  count?: number;
  subtitle?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  exportConfig?: {
    exportTitle?: string;
    exportDescription?: string;
    exportNote?: string;
    allCount?: number;
    filteredCount?: number;
    selectedCount?: number;
    onExport?: (scope: any) => any;
  };
  importConfig?: {
    title: string;
    description: string;
    sampleHint?: string;
    onImport: (file: File) => Promise<void>;
  };
  exportLabel?: string;
  exportDescription?: string;
  importLabel?: string;
  importDescription?: string;
  isExportModalOpen?: boolean;
  onExportModalOpenChange?: (open: boolean) => void;
  onHeaderOutChange?: (isOut: boolean) => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  count,
  subtitle,
  primaryAction,
  exportConfig,
  importConfig,
  exportLabel = 'Export',
  exportDescription = 'Export your items to a CSV file.',
  importLabel = 'Import',
  importDescription = 'Import multiple items from a CSV file.',
  isExportModalOpen,
  onExportModalOpenChange,
  onHeaderOutChange,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localExportOpen, setLocalExportOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isExportOpen = isExportModalOpen !== undefined ? isExportModalOpen : localExportOpen;
  const setIsExportOpen = onExportModalOpenChange !== undefined ? onExportModalOpenChange : setLocalExportOpen;

  const hasMoreActions = Boolean(exportConfig || importConfig);

  const [isHeaderOut, setIsHeaderOut] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isOut = !entry.isIntersecting;
        setIsHeaderOut(isOut);
        onHeaderOutChange?.(isOut);
      },
      { threshold: 0 }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (scope: ExportScope) => {
    if (!exportConfig) return;
    setIsExporting(true);
    try {
      await exportConfig.onExport(scope);
      setIsExportOpen(false);
      setIsMenuOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    if (!importConfig) return;
    setIsImporting(true);
    try {
      await importConfig.onImport(file);
      setIsImportModalOpen(false);
      setIsMenuOpen(false);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      {/* Normal Main Page Header */}
      <div ref={headerRef} className="py-2 mb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#162d3d] tracking-tight flex items-baseline gap-2">
            {title}
            {count !== undefined && (
              <span className="text-lg font-normal text-[#64748B]">{count}</span>
            )}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasMoreActions && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center gap-1.5 px-5 h-10 border font-semibold rounded-full text-sm transition-all cursor-pointer ${
                  isMenuOpen
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-primary text-primary hover:bg-primary hover:text-white hover:border-primary'
                }`}
              >
                More Actions
                <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMenuOpen && (
                <>
                  <div className="absolute right-8 top-full mt-[5px] w-3 h-3 bg-white border-l border-t border-[#e2e8f0] rotate-45 z-[51]" />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="relative bg-white py-1.5">
                      {exportConfig && (
                        <button
                          onClick={() => {
                            setIsExportOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#f1f5f9] transition-colors cursor-pointer group"
                        >
                          <Upload className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-[#162d3d] group-hover:text-primary transition-colors">
                              {exportLabel}
                            </p>
                            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                              {exportDescription}
                            </p>
                          </div>
                        </button>
                      )}
                      {importConfig && (
                        <button
                          onClick={() => {
                            setIsImportModalOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#f1f5f9] transition-colors cursor-pointer group"
                        >
                          <Download className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-[#162d3d] group-hover:text-primary transition-colors">
                              {importLabel}
                            </p>
                            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                              {importDescription}
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="flex items-center gap-2 px-5 h-10 bg-primary hover:opacity-90 text-white font-semibold rounded-full text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>

      {exportConfig && (
        <ExportScopeModal
          isOpen={isExportOpen}
          title={exportConfig.exportTitle || 'Export Items'}
          description={exportConfig.exportDescription || 'Export items to CSV'}
          note={exportConfig.exportNote}
          allCount={exportConfig.allCount ?? 0}
          filteredCount={exportConfig.filteredCount ?? 0}
          selectedCount={exportConfig.selectedCount ?? 0}
          onClose={() => setIsExportOpen(false)}
          onExport={handleExport}
          isExporting={isExporting}
        />
      )}

      {importConfig && (
        <ImportCsvModal
          isOpen={isImportModalOpen}
          title={importConfig.title}
          description={importConfig.description}
          sampleHint={importConfig.sampleHint}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImport}
          isImporting={isImporting}
        />
      )}
    </>
  );
};
