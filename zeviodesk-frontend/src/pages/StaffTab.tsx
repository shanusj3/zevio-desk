import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { EmployeesTable } from '../components/EmployeesTable';
import { CreateEmployeeModal } from '../components/CreateEmployeeModal';
import { TenantUser } from '../lib/api';
import { useDeleteUserMutation } from '../hooks/useUsersQuery';
import { useAppStore } from '../store/useAppStore';

export const StaffTab: React.FC = () => {
  const { showToast } = useAppStore();
  const [totalEmployeesCount, setTotalEmployeesCount] = useState(0);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<TenantUser | null>(null);

  const deleteUserMutation = useDeleteUserMutation();

  const handleOpenCreateEmployee = () => {
    setEmployeeToEdit(null);
    setIsEmployeeModalOpen(true);
  };

  const handleEditEmployee = (employee: TenantUser) => {
    setEmployeeToEdit(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleDeleteEmployee = (employee: TenantUser) => {
    if (window.confirm(`Are you sure you want to remove staff member ${employee.name || employee.email}?`)) {
      deleteUserMutation.mutate(employee.id, {
        onSuccess: () => {
          showToast(`Employee "${employee.name || employee.email}" deleted`, 'info');
        },
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight flex items-baseline gap-2">
            Shop Staff
            <span className="text-lg font-normal text-[#64748B]">{totalEmployeesCount}</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-1">Manage technicians, advisors, and other team members</p>
        </div>
        <button
          onClick={handleOpenCreateEmployee}
          className="flex items-center gap-2 px-5 h-10 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-semibold rounded-full text-sm transition-colors shadow-sm cursor-pointer animate-in fade-in"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      <EmployeesTable
        onEditEmployee={handleEditEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onTotalCountChange={setTotalEmployeesCount}
      />

      {isEmployeeModalOpen && (
        <CreateEmployeeModal
          employeeToEdit={employeeToEdit}
          isOpen={isEmployeeModalOpen}
          onClose={() => {
            setIsEmployeeModalOpen(false);
            setEmployeeToEdit(null);
          }}
        />
      )}
    </div>
  );
};
