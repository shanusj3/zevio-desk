import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, Download } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onImportSuccess(5);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#0f1522] border border-[#1e2a40] rounded-lg shadow-2xl overflow-hidden z-10 p-6 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#1e2a40] pb-4">
          <h3 className="text-lg font-bold text-white">Import Tenants CSV</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-[#94A3B8]">
            Upload a CSV or JSON file containing bulk tenant data. Make sure
            it includes name, admin email, phone, and subdomain.
          </p>

          <label className="border-2 border-dashed border-[#23314a] hover:border-[#D99B26] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-[#141b2b] transition-colors text-center group min-h-[110px]">
            {selectedFile ? (
              <div className="flex items-center gap-2 text-white">
                <FileText className="w-6 h-6 text-[#D99B26]" />
                <span className="text-xs font-semibold">{selectedFile.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#64748B] group-hover:text-[#D99B26] mb-2 transition-colors" />
                <span className="text-xs font-semibold text-white">
                  Click to choose CSV file
                </span>
                <span className="text-[10px] text-[#64748B] mt-1">
                  Supports .csv or .json files
                </span>
              </>
            )}
            <input
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Sample CSV format downloaded.');
            }}
            className="text-[11px] text-[#D99B26] hover:underline flex items-center gap-1 mt-2"
          >
            <Download className="w-3 h-3" />
            Download sample CSV template
          </a>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2a40]">
          <button
            onClick={onClose}
            className="px-4 h-11 bg-[#182236] text-white rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleImportSubmit}
            disabled={!selectedFile || isProcessing}
            className="px-5 h-11 bg-[#D99B26] hover:bg-[#E5A93C] disabled:opacity-50 text-[#0d121c] font-bold rounded-lg text-xs flex items-center gap-2"
          >
            {isProcessing ? 'Importing...' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
