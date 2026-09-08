import React, { useState, useRef } from 'react';
import { X, CheckCircle2, Film, Image as ImageIcon, Plus, Pause, Play, Loader2, Lightbulb, Video } from 'lucide-react';
import { attachmentApi } from '../../services/attachment-api';
import { AttachmentCategory, AttachmentEntityType } from '../../types/attachment';

interface UploadingFileState {
  id: string;
  file: File;
  progress: number;
  status: 'UPLOADING' | 'PAUSED' | 'VERIFYING' | 'READY' | 'FAILED';
  attachmentId?: string;
  error?: string;
}

interface AttachmentUploaderProps {
  entityType: AttachmentEntityType;
  entityId: string;
  category: AttachmentCategory;
  accept: string;
  maxFiles?: number;
  label?: string;
  value?: string[]; // Array of attachmentIds
  onChange?: (attachmentIds: string[]) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  entityType,
  entityId,
  category,
  accept,
  maxFiles = 4,
  label,
  value = [],
  onChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFileState, setCurrentFileState] = useState<UploadingFileState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideo = category.includes('VIDEO');
  const unitLabel = isVideo ? 'videos' : 'photos';
  const itemTypeLabel = isVideo ? 'Video' : 'Photo';
  const supportsText = isVideo ? 'Supports: MP4, MOV, WEBM' : 'Supports: PNG, JPG, JPEG, WEBP';
  const icon3DPath = isVideo ? '/assets/video-3d-icon.png' : '/assets/photo-3d-icon.png';

  const canAddMore = value.length < maxFiles;

  const tipText = isVideo
    ? 'Short videos help us understand the issue better.'
    : 'Add photos from different angles for better assessment.';

  const handleOpenModal = () => {
    if (!canAddMore) return;
    setCurrentFileState(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentFileState(null);
  };

  const processSingleFile = async (file: File) => {
    const tempId = Math.random().toString(36).substring(7);
    const newFileState: UploadingFileState = {
      id: tempId,
      file,
      progress: 0,
      status: 'UPLOADING',
    };

    setCurrentFileState(newFileState);

    try {
      const attachmentId = await attachmentApi.uploadFile(
        file,
        entityType,
        entityId,
        category,
        (progress) => {
          setCurrentFileState((prev) => (prev ? { ...prev, progress } : null));
        }
      );

      setCurrentFileState((prev) =>
        prev ? { ...prev, status: 'READY', attachmentId, progress: 100 } : null
      );

      if (onChange) {
        onChange([...value, attachmentId]);
      }
    } catch (err: any) {
      setCurrentFileState((prev) =>
        prev ? { ...prev, status: 'FAILED', error: err.message || 'Upload failed' } : null
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    const singleFile = selectedFiles[0];
    processSingleFile(singleFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length === 0) return;
    processSingleFile(droppedFiles[0]);
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await attachmentApi.deleteAttachment(attachmentId);
    } catch {
      // Ignore if already deleted
    }
    if (onChange) {
      onChange(value.filter((id) => id !== attachmentId));
    }
  };

  const togglePauseUpload = () => {
    if (!currentFileState) return;
    if (currentFileState.status === 'UPLOADING') {
      setCurrentFileState({ ...currentFileState, status: 'PAUSED' });
    } else if (currentFileState.status === 'PAUSED') {
      setCurrentFileState({ ...currentFileState, status: 'UPLOADING' });
    }
  };

  const cancelCurrentUpload = () => {
    setCurrentFileState(null);
  };

  return (
    <div className="w-full">
      {/* ── STATE 1: NO FILES UPLOADED YET ─────────────────────────────────── */}
      {value.length === 0 ? (
        <div className="flex items-center justify-center py-6 px-4">
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 text-xs font-semibold rounded-2xl border border-dashed border-[#cbd5e1] bg-white text-[#1e293b] hover:border-[#116dff] hover:bg-[#eff6ff]/30 transition-all cursor-pointer shadow-2xs group"
          >
            {isVideo ? (
              <Video className="size-4 text-[#1e293b] group-hover:text-[#116dff] transition-colors" />
            ) : (
              <ImageIcon className="size-4 text-[#1e293b] group-hover:text-[#116dff] transition-colors" />
            )}
            <span>Add {isVideo ? 'Video' : 'Image'} +</span>
          </button>
        </div>
      ) : (
        /* ── STATE 2: FILES UPLOADED ────────────────────────────────────────── */
        <div className="space-y-3 p-1">
          {/* Top Header Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleOpenModal}
              disabled={!canAddMore}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#1e293b] hover:text-[#116dff] transition-colors cursor-pointer disabled:opacity-60"
            >
              {isVideo ? (
                <Video className="size-4 text-[#1e293b]" />
              ) : (
                <ImageIcon className="size-4 text-[#1e293b]" />
              )}
              <span>Add {isVideo ? 'Video' : 'Image'} +</span>
            </button>
            <span className="text-[11px] text-[#64748b] font-mono">
              {value.length}/{maxFiles} {unitLabel}
            </span>
          </div>

          {/* Grid of uploaded thumbnails + plus box */}
          <div className="flex flex-wrap items-center gap-3">
            {value.map((attId) => (
              <div
                key={attId}
                className="relative size-20 sm:size-24 rounded-2xl overflow-hidden border border-[#cbd5e1] bg-slate-900 group shadow-xs"
              >
                {isVideo ? (
                  <div className="size-full flex flex-col items-center justify-center bg-slate-900 text-white p-1 text-center relative">
                    <Film className="size-6 text-white/70" />
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                      <div className="size-7 rounded-full bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                        <Play className="size-3.5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={attachmentApi.getThumbnailUrl(attId)}
                    alt="Attachment"
                    className="size-full object-cover"
                  />
                )}

                {/* White circular close button top right */}
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(attId)}
                  className="absolute top-1.5 right-1.5 size-5 rounded-full bg-white text-slate-700 shadow-md flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                  title="Remove"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            {/* Plus slot box if slots remain */}
            {canAddMore && (
              <button
                type="button"
                onClick={handleOpenModal}
                className="flex size-20 sm:size-24 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[#cbd5e1] bg-white hover:bg-[#eff6ff] hover:border-[#116dff] text-slate-400 hover:text-[#116dff] transition-all"
                title={`Add ${itemTypeLabel}`}
              >
                <Plus className="size-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL POPUP FOR UPLOADING ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 text-left">
            {/* Modal Header */}
            <div className="p-5 px-6 border-b border-[#f1f5f9]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1e293b]">
                  Upload {isVideo ? 'Videos' : 'Photos'}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1 rounded-full text-[#94a3b8] hover:text-[#1e293b] hover:bg-[#f1f5f9] transition cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="text-xs text-[#64748b] mt-1 font-medium flex items-center gap-1.5">
                <Lightbulb className="size-3.5 text-[#eab308] shrink-0" />
                <span>{tipText}</span>
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Dashed Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-[#116dff] bg-[#eff6ff]'
                    : 'border-[#cbd5e1] bg-[#f8fafc] hover:border-[#116dff] hover:bg-[#eff6ff]/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple={false}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* 3D Graphic Icon */}
                <img
                  src={icon3DPath}
                  alt={itemTypeLabel}
                  className="size-20 mb-3 object-contain drop-shadow-sm pointer-events-none"
                />

                <p className="text-xs font-semibold text-[#1e293b]">
                  Drop your {isVideo ? 'video' : 'image'} here, or{' '}
                  <span className="text-[#116dff] font-bold underline hover:text-[#005be3]">browse</span>
                </p>
                <p className="text-[11px] text-[#94a3b8] font-medium mt-1">{supportsText}</p>
              </div>

              {/* Uploading File Progress Bar Card */}
              {currentFileState && (
                <div className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-xs space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {isVideo ? (
                          <Film className="size-5 text-[#116dff]" />
                        ) : (
                          <img
                            src={URL.createObjectURL(currentFileState.file)}
                            alt="preview"
                            className="size-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1e293b] truncate">
                          {currentFileState.file.name}
                        </p>
                        <p className="text-[11px] text-[#64748b] font-mono">
                          {formatFileSize(currentFileState.file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {currentFileState.status === 'READY' && (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      )}
                      {currentFileState.status === 'UPLOADING' && (
                        <button
                          type="button"
                          onClick={togglePauseUpload}
                          className="p-1 rounded-md text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] transition cursor-pointer"
                          title="Pause"
                        >
                          <Pause className="size-4" />
                        </button>
                      )}
                      {currentFileState.status === 'PAUSED' && (
                        <button
                          type="button"
                          onClick={togglePauseUpload}
                          className="p-1 rounded-md text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] transition cursor-pointer"
                          title="Resume"
                        >
                          <Play className="size-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={cancelCurrentUpload}
                        className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        title="Cancel"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
                      <div
                        className="h-full bg-[#116dff] transition-all duration-200"
                        style={{ width: `${currentFileState.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#64748b] font-mono">
                      <span>
                        {currentFileState.status === 'PAUSED'
                          ? 'Paused'
                          : currentFileState.status === 'FAILED'
                          ? 'Failed'
                          : ''}
                      </span>
                      <span>{currentFileState.progress}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-[#f1f5f9] bg-[#f8fafc]">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2 text-xs font-bold rounded-xl border border-[#cbd5e1] bg-white text-[#475569] hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={currentFileState?.status === 'UPLOADING'}
                className="px-6 py-2 text-xs font-bold rounded-xl bg-[#116dff] text-white hover:bg-[#005be3] transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
