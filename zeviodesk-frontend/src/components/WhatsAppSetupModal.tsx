import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import whatsappLogo from '../assets/whatsapp.png';

interface WhatsAppSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

export const WhatsAppSetupModal: React.FC<WhatsAppSetupModalProps> = ({
  isOpen,
  onClose,
  onGetStarted,
}) => {
  const [expandedOption, setExpandedOption] = useState<'existing' | 'new'>('existing');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 p-8 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Subtitle */}
        <div className="space-y-2 pr-10">
          <h2 className="text-2xl font-bold text-[#1e293b] tracking-tight">
            Welcome to WhatsApp Business on ZevioDesk
          </h2>
          <p className="text-xs text-[#64748b] leading-relaxed">
            Connect to your WhatsApp Business app to view and reply to WhatsApp messages in ZevioDesk Inbox.{' '}
            <a href="#" onClick={(e) => e.preventDefault()} className="text-[#116dff] hover:underline font-medium">
              Learn more about WhatsApp on ZevioDesk
            </a>
          </p>
        </div>

        {/* Content Body: Grid of Accordion & Graphic */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
          {/* Left Column: Accordion Options (Col 7) */}
          <div className="md:col-span-7 space-y-4">
            {/* Option 1: Existing Account (Recommended) */}
            <div className="border-t border-[#e2e8f0] pt-4">
              <button
                type="button"
                onClick={() => setExpandedOption(expandedOption === 'existing' ? 'new' : 'existing')}
                className="w-full flex items-center gap-2 text-left font-bold text-xs text-[#1e293b] hover:text-[#116dff] transition-colors cursor-pointer"
              >
                {expandedOption === 'existing' ? (
                  <ChevronDown className="w-4 h-4 text-[#1e293b] shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#1e293b] shrink-0" />
                )}
                <span>Connecting a WhatsApp Business app <span className="font-semibold text-[#1e293b]">(Recommended)</span></span>
              </button>

              {expandedOption === 'existing' && (
                <ul className="mt-3 ml-6 space-y-2 text-xs text-[#64748b] list-disc list-outside leading-relaxed">
                  <li>Manage conversations and contacts from both ZevioDesk and WhatsApp</li>
                  <li>Send automated WhatsApp notifications about your business from your number</li>
                  <li>Existing conversations and contacts won't be affected</li>
                  <li>You'll need a connected WhatsApp Business app and access to a Facebook account</li>
                </ul>
              )}
            </div>

            {/* Option 2: Create New Account */}
            <div className="border-t border-[#e2e8f0] pt-4">
              <button
                type="button"
                onClick={() => setExpandedOption(expandedOption === 'new' ? 'existing' : 'new')}
                className="w-full flex items-center gap-2 text-left font-bold text-xs text-[#1e293b] hover:text-[#116dff] transition-colors cursor-pointer"
              >
                {expandedOption === 'new' ? (
                  <ChevronDown className="w-4 h-4 text-[#1e293b] shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#1e293b] shrink-0" />
                )}
                <span>Creating a new WhatsApp Business account</span>
              </button>

              {expandedOption === 'new' && (
                <ul className="mt-3 ml-6 space-y-2 text-xs text-[#64748b] list-disc list-outside leading-relaxed">
                  <li>Set up a new Meta Business WABA profile using a fresh phone number</li>
                  <li>Link your official business details directly through Meta Embedded Signup</li>
                </ul>
              )}
            </div>
            <div className="border-b border-[#e2e8f0]" />
          </div>

          {/* Right Column: Decorative Graphic (Col 5) */}
          <div className="md:col-span-5 relative flex items-center justify-center p-6 bg-[#e6f7f2] rounded-2xl min-h-[220px] overflow-hidden">
            {/* Dots Pattern */}
            <div className="absolute top-4 right-4 grid grid-cols-5 gap-1.5 opacity-25">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              ))}
            </div>

            {/* Graphic Mockup Card */}
            <div className="relative z-10 w-full max-w-[210px] bg-white rounded-xl shadow-md border border-[#e2e8f0] p-3.5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#f1f5f9]">
                <img src={whatsappLogo} alt="WhatsApp" className="w-5 h-5 object-contain" />
                <div className="w-16 h-2 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="w-3/4 h-2 bg-slate-100 rounded-full" />
                <div className="w-1/2 h-2 bg-slate-100 rounded-full" />
              </div>
              <div className="flex justify-end pt-1">
                <div className="w-10 h-3.5 bg-[#10b981]/15 rounded flex items-center justify-center">
                  <div className="w-5 h-1 bg-[#10b981] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onGetStarted}
            className="px-6 py-2 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-bold text-xs rounded-full transition-all cursor-pointer shadow-xs"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-50 border border-[#cbd5e1] text-[#1e293b] font-semibold text-xs rounded-full transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
