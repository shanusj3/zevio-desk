import React, { useState, useEffect } from 'react';
import { Mail, Phone, Pencil, Trash2, MoreVertical, UserCheck } from 'lucide-react';
import { TenantUser } from '../lib/api';
import { useUsersQuery } from '../hooks/useUsersQuery';
import { DataTable, ColumnDef } from './data-table/DataTable';

interface EmployeesTableProps {
  onEditEmployee: (employee: TenantUser) => void;
  onDeleteEmployee: (employee: TenantUser) => void;
  onTotalCountChange?: (count: number) => void;
}

export const EmployeesTable: React.FC<EmployeesTableProps> = ({
  onEditEmployee,
  onDeleteEmployee,
  onTotalCountChange,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const { data: employees = [], isLoading } = useUsersQuery(true);

  useEffect(() => {
    onTotalCountChange?.(employees.length);
  }, [employees.length, onTotalCountChange]);

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchInput.toLowerCase();
    return (
      employee.name.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      (employee.phone || '').toLowerCase().includes(searchLower) ||
      employee.role.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadgeColor = (role: TenantUser['role']) => {
    switch (role) {
      case 'TENANT_ADMIN':
        return 'bg-red-50 text-red-700 border border-red-200/60';
      case 'MANAGER':
        return 'bg-amber-50 text-amber-700 border border-amber-200/60';
      case 'TECHNICIAN':
        return 'bg-blue-50 text-blue-700 border border-blue-200/60';
      case 'ADVISOR':
      default:
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
    }
  };

  const getStatusColor = (status: TenantUser['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
      case 'INACTIVE':
        return 'bg-slate-100 text-slate-600 border border-slate-200/60';
      case 'SUSPENDED':
      default:
        return 'bg-red-50 text-red-700 border border-red-200/60';
    }
  };

  const columns: ColumnDef<TenantUser>[] = [
    {
      key: 'name',
      header: 'EMPLOYEE NAME',
      cell: (employee) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#116dff]/10 border border-[#116dff]/20 flex items-center justify-center text-[#116dff] font-bold text-xs shrink-0">
            {employee.name.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-[#1e293b]">{employee.name}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'ROLE',
      cell: (employee) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getRoleBadgeColor(employee.role)}`}>
          {employee.role.replace('TENANT_', '')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      cell: (employee) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(employee.status)}`}>
          <span className={`w-1 h-1 rounded-full ${
            employee.status === 'ACTIVE'
              ? 'bg-emerald-500'
              : employee.status === 'INACTIVE'
              ? 'bg-slate-400'
              : 'bg-red-500'
          }`} />
          {employee.status}
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'CONTACT DETAILS',
      cell: (employee) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[#64748B]">
            <Mail className="w-3.5 h-3.5 text-[#116dff]" />
            <span className="font-semibold text-xs text-[#334155]">{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center gap-1.5 text-[#64748B]">
              <Phone className="w-3.5 h-3.5 text-[#116dff]" />
              <span className="font-mono font-semibold text-xs text-[#334155]">{employee.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'workload',
      header: 'WORKLOAD CAPACITY',
      cell: (employee) => (
        <span className="text-[#64748B] font-mono">
          {employee.maxConcurrentJobs ? `${employee.maxConcurrentJobs} Active Jobs` : 'Unlimited'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      cell: (employee) => (
        <div className="flex items-center justify-end gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveActionMenuId(
                  activeActionMenuId === employee.id ? null : employee.id
                );
              }}
              className="w-8 h-8 flex items-center justify-center border border-[#e2e8f0] hover:border-[#116dff] text-[#116dff] hover:bg-[#116dff]/5 rounded-full transition-colors cursor-pointer"
              title="More Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {activeActionMenuId === employee.id && (
              <div
                className="absolute right-0 mt-1 w-40 bg-white border border-[#e2e8f0] rounded-lg shadow-2xl z-50 p-1.5 text-left animate-in fade-in zoom-in-95"
                onMouseLeave={() => setActiveActionMenuId(null)}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEmployee(employee);
                    setActiveActionMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#475569] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-md transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Employee
                </button>
                <div className="my-1 border-t border-[#e2e8f0]" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEmployee(employee);
                    setActiveActionMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Employee
                </button>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={filteredEmployees}
      columns={columns}
      isLoading={isLoading}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Search..."
      keyExtractor={(employee) => employee.id}
      minHeightClassName="min-h-[360px]"
      emptyState={{
        icon: <UserCheck className="w-8 h-8 text-[#116dff]" />,
        title: 'No employees found',
        description: searchInput ? `No employees matching "${searchInput}"` : 'No employees available.',
      }}
      footer={
        <div className="p-4 border-t border-[#e2e8f0] text-xs text-[#64748B]">
          Showing <span className="font-semibold text-[#1e293b]">{filteredEmployees.length}</span> of{' '}
          <span className="font-semibold text-[#1e293b]">{employees.length}</span> employees
        </div>
      }
    />
  );
};
