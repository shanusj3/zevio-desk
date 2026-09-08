import React from 'react';
import { Plus } from 'lucide-react';

interface TicketActivityTabProps {
  comments: any[];
  onOpenAddCommentModal: () => void;
}

const tableShellClass = 'overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-xs';
const tableClass = 'w-full text-left text-sm';
const theadClass = 'bg-[#f8fafc] border-b border-[#e2e8f0]';
const thClass = 'px-4 py-3 font-bold text-xs tracking-wider uppercase text-[#64748b] whitespace-nowrap';
const tbodyDivide = 'divide-y divide-[#e2e8f0]';

export const TicketActivityTab: React.FC<TicketActivityTabProps> = ({
  comments,
  onOpenAddCommentModal,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Section Header with Title & Add Comment Button */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#1e293b]">Activity & Comments</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#116dff]">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAddCommentModal}
          className="px-3.5 py-2 bg-[#116dff] hover:bg-[#2563eb] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Comment
        </button>
      </div>

      {comments.length > 0 ? (
        <div className={tableShellClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={`${thClass} w-36`}>Author</th>
                <th className={`${thClass} w-44`}>Date</th>
                <th className={thClass}>Comment</th>
              </tr>
            </thead>
            <tbody className={tbodyDivide}>
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-[#f8fafc] align-top">
                  <td className="px-4 py-3.5 text-xs font-bold text-[#1e293b]">
                    {comment.author || 'Unknown'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#64748b] font-mono whitespace-nowrap">
                    {new Date(comment.uploadedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#1e293b] font-medium">{comment.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-2xl border border-dashed border-[#cbd5e1] text-center">
          <img
            src="/assets/no-activity.png"
            alt="No activity yet"
            className="w-56 sm:w-64 h-auto mx-auto mb-3 object-contain"
          />
          <h4 className="text-base font-bold text-[#1e293b] mb-1">No activity or comments yet</h4>
          <p className="text-xs text-[#64748b] max-w-sm mb-5">
            No activity updates or internal comments have been posted for this ticket yet. Click below to add a comment.
          </p>
          <button
            type="button"
            onClick={onOpenAddCommentModal}
            className="flex items-center gap-2 px-5 h-10 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-semibold rounded-full text-sm transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Comment
          </button>
        </div>
      )}
    </div>
  );
};
