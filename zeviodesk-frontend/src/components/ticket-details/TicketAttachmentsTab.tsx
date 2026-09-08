import React from 'react';
import { PlayCircle, Maximize2 } from 'lucide-react';

interface TicketAttachmentsTabProps {
  mediaAttachments: any[];
}

export const TicketAttachmentsTab: React.FC<TicketAttachmentsTabProps> = ({
  mediaAttachments,
}) => {
  return (
    <div className="p-5 sm:p-6 space-y-6">
      <div className="border-b border-[#e2e8f0] pb-4">
        <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
          Intake Files & Media ({mediaAttachments.length})
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Photos, videos & media captured during device intake or repair process
        </p>
      </div>

      {mediaAttachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-2xl border border-dashed border-[#cbd5e1] text-center">
          <img
            src="/assets/no-files.png"
            alt="No files attached"
            className="w-56 sm:w-64 h-auto mx-auto mb-3 object-contain"
          />
          <h4 className="text-base font-bold text-[#1e293b] mb-1">No files attached</h4>
          <p className="text-xs text-[#64748b] max-w-sm">
            No intake photos, videos, or media files were added when this ticket was created.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaAttachments.map((att: any, idx: number) => {
            const isVideo = att.type === 'video' || (att.mimeType && att.mimeType.startsWith('video/'));
            return (
              <div
                key={att.id || att.url || idx}
                className="group relative bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col"
              >
                <a
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-square bg-slate-100 block overflow-hidden"
                >
                  {isVideo ? (
                    <div className="w-full h-full relative">
                      <video src={att.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center group-hover:bg-slate-900/40 transition-colors">
                        <div className="bg-white/90 p-2.5 rounded-full shadow-md">
                          <PlayCircle className="w-5 h-5 text-[#116dff]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={att.url}
                      alt={att.fileName || `Photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-slate-900/70 backdrop-blur-xs text-white p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                    </span>
                  </div>
                </a>
                <div className="p-3 bg-white border-t border-[#f1f5f9] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#1e293b] truncate">
                    {att.fileName || (isVideo ? `Video #${idx + 1}` : `Photo #${idx + 1}`)}
                  </span>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="text-slate-400 hover:text-[#116dff] transition-colors p-1"
                    title="Open full size"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
