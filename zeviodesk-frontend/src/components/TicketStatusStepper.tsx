import React from 'react';
import { Ticket } from '../lib/api';
import { XCircle } from 'lucide-react';

interface TicketStatusStepperProps {
  ticket: Ticket;
}

export const TicketStatusStepper: React.FC<TicketStatusStepperProps> = ({ ticket }) => {
  if (ticket.status === 'CANCELLED') {
    return (
      <div className="w-full bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-4 flex items-center gap-3 mb-2">
        <XCircle className="w-5 h-5 text-[#F87171]" />
        <span className="text-sm font-medium text-[#F87171]">Ticket cancelled</span>
      </div>
    );
  }

  // hasParts is currently derived from partsRequired.length — if a TicketStatusHistory 
  // table is added later, this can be swapped to check if the ticket ever 
  // entered WAITING_FOR_PARTS instead.
  let hasParts = Array.isArray(ticket.partsRequired) && ticket.partsRequired.length > 0;
  
  // Defensive check: if status is WAITING_FOR_PARTS but partsRequired is empty, force hasParts to true
  if (ticket.status === 'WAITING_FOR_PARTS' && !hasParts) {
    hasParts = true;
  }

  const baseSteps = [
    { key: 'RECEIVED', label: 'Received' },
    { key: 'DIAGNOSING', label: 'Diagnosing' },
    ...(hasParts ? [{ key: 'WAITING_FOR_PARTS', label: 'Waiting for parts' }] : []),
    { key: 'IN_PROGRESS', label: 'In progress' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for pickup' },
  ];

  const currentIndex = baseSteps.findIndex(s => s.key === ticket.status);
  const isCompleted = ticket.status === 'COMPLETED';
  
  // Fallback for an unknown state that isn't complete or cancelled
  const effectiveIndex = isCompleted ? baseSteps.length - 1 : (currentIndex > -1 ? currentIndex : -1);
  const currentStepLabel = isCompleted ? 'Completed' : (currentIndex > -1 ? baseSteps[currentIndex].label : 'Unknown Status');

  return (
    <div className="w-full py-4 mb-2 space-y-2.5">
      {/* Top Label Row */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-[#5B667A]">
          Ticket status
        </span>
        <span className="text-sm font-medium text-[#3B82F6]">
          {currentStepLabel}
        </span>
      </div>

      {/* Segments Row */}
      <div className="flex items-center w-full gap-1">
        {baseSteps.map((step, index) => {
          const isFilled = isCompleted || index <= effectiveIndex;
          return (
            <div 
              key={`bar-${step.key}`} 
              className={`flex-1 h-1.5 rounded-full ${isFilled ? 'bg-[#3B82F6]' : 'bg-[#1C2331]'}`}
            />
          );
        })}
      </div>

      {/* Bottom Labels Row */}
      <div className="flex items-start w-full gap-1">
        {baseSteps.map((step, index) => {
          const isCurrent = !isCompleted && index === effectiveIndex;
          return (
            <div key={`label-${step.key}`} className="flex-1">
              <span className={`block text-xs truncate ${
                isCurrent ? 'text-[#E8ECF3] font-medium' : 'text-[#5B667A] font-normal'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
