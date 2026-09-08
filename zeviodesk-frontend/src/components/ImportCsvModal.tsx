import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import csvDownloadIcon from '../assets/csv-download.png';
import csvUploadIcon from '../assets/csv-upload.png';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';

interface ImportCsvModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  accept?: string;
  onClose: () => void;
  onImport: (file: File) => void | Promise<void>;
  isImporting?: boolean;
  onDownloadTemplate?: () => void;
  sampleHint?: string;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  title = 'Import customers to your store',
  description = 'Use this tool to import or edit multiple customers in one go.',
  accept = '.csv',
  onClose,
  onImport,
  isImporting = false,
  onDownloadTemplate,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await onImport(selectedFile);
    setSelectedFile(null);
  };

  const handleDownloadDefaultTemplate = () => {
    if (onDownloadTemplate) {
      onDownloadTemplate();
      return;
    }
    // Generate default template CSV
    const headers = ['Name', 'Email', 'Phone', 'Customer Type', 'Notes'];
    const row = ['Jane Doe', 'jane@example.com', '9876543210', 'WALK_IN', 'Needs urgent care'];
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      headerVariant="primary"
      maxWidth="xl"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedFile}
            isLoading={isImporting}
          >
            Continue
          </Button>
        </>
      }
    >
      <p className="text-[13px] text-[#334155] font-medium leading-relaxed">
        {description}
      </p>

      <hr className="border-[#e2e8f0]" />

      {/* Step 1 Row */}
      <div className="flex gap-4 items-start">
        <img
          src={csvDownloadIcon}
          alt="Download CSV Template"
          className="w-14 h-14 object-contain shrink-0"
        />
        <div className="space-y-1.5 flex-1">
          <h4 className="text-sm font-bold text-[#1e293b]">Step 1. Download the CSV template file</h4>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Choose if you want to download a blank CSV template file, or a CSV file with all your current customers.
          </p>
          <button
            onClick={handleDownloadDefaultTemplate}
            className="mt-2 inline-flex items-center gap-1.5 px-4 h-9 border border-[#116dff] text-[#116dff] hover:bg-[#116dff] hover:text-white rounded-full text-xs font-semibold transition-all cursor-pointer bg-white"
          >
            Download CSV File
          </button>
        </div>
      </div>

      <hr className="border-[#e2e8f0]" />

      {/* Step 2 Row */}
      <div className="flex gap-4 items-start">
        <img
          src={csvUploadIcon}
          alt="Upload CSV"
          className="w-14 h-14 object-contain shrink-0"
        />
        <div className="space-y-1.5 flex-1">
          <h4 className="text-sm font-bold text-[#1e293b]">Step 2. Upload your customers</h4>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Add or edit your customer info in the CSV file, making sure you don't add or delete columns. Once your CSV file is ready to go, upload it here.
          </p>

          <div className="mt-2.5 flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-1.5 px-4 h-9 border border-[#cbd5e1] hover:border-[#116dff] hover:bg-gray-50 text-[#334155] rounded-full text-xs font-semibold transition-all cursor-pointer bg-white">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose File</span>
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {selectedFile && (
              <span className="text-xs font-semibold text-[#1e293b] bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1 animate-in fade-in">
                {selectedFile.name}
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-700 ml-1 font-bold text-xs"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
