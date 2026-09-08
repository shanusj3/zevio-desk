import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Phone, Mail, Trash2, Pencil, MoreVertical } from 'lucide-react';
import { TenantUser } from '../lib/api';
import { useUsersQuery } from '../hooks/useUsersQuery';
import { TableRowSkeleton } from './Skeleton';

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

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
      {/* Top Header Controls Bar (Matching Ready For Pickup table) */}
      <div className="p-3 px-4 border-b border-[#e2e8f0]">
        <div className="flex justify-end">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#116dff]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-48 md:w-64 h-9 bg-white border border-[#e2e8f0] rounded-full pl-9 pr-4 text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left text-xs min-w-[800px]">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] uppercase tracking-wider font-semibold whitespace-nowrap">
              <th className="py-3.5 px-5">Employee Name</th>
              <th className="py-3.5 px-5">Role</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5">Contact Details</th>
              <th className="py-3.5 px-5">Workload Capacity</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0] text-[#334155]">
            {isLoading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={6} />
                ))}
              </>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center border border-[#e2e8f0]">
                      <UserCheck className="w-8 h-8 text-[#116dff]" />
                    </div>
                    <div className="text-sm font-medium text-[#1e293b]">
                      No employees found
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-[#f8fafc] transition-colors whitespace-nowrap">
                  <td className="py-3.5 px-5 font-semibold text-[#1e293b]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#116dff]/10 border border-[#116dff]/20 flex items-center justify-center text-[#116dff] font-bold text-xs">
                        {employee.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-[#1e293b]">{employee.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getRoleBadgeColor(employee.role)}`}>
                      {employee.role.replace('TENANT_', '')}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
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
                  </td>
                  <td className="py-3.5 px-5">
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
                  </td>
                  <td className="py-3.5 px-5 text-[#64748B] font-mono">
                    {employee.maxConcurrentJobs ? `${employee.maxConcurrentJobs} Active Jobs` : 'Unlimited'}
                  </td>
                  
                  {/* Actions Dropdown (Matching CustomersTable) */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="relative">
                        <button
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-[#e2e8f0] text-xs text-[#64748B]">
        Showing <span className="font-semibold text-[#1e293b]">{filteredEmployees.length}</span> of{' '}
        <span className="font-semibold text-[#1e293b]">{employees.length}</span> employees
      </div>
    </div>
  );
};
