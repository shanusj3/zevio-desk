import React, { useState } from 'react';
import { Search, UserCheck, Phone, Mail, Award, Trash2, Pencil, Key } from 'lucide-react';
import { TenantUser } from '../lib/api';
import { useUsersQuery } from '../hooks/useUsersQuery';
import { TableRowSkeleton } from './Skeleton';

interface EmployeesTableProps {
  onEditEmployee: (employee: TenantUser) => void;
  onDeleteEmployee: (employee: TenantUser) => void;
}

export const EmployeesTable: React.FC<EmployeesTableProps> = ({
  onEditEmployee,
  onDeleteEmployee,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const { data: employees = [], isLoading } = useUsersQuery(true);

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
        return 'bg-[#7F1D1D]/80 text-[#F87171] border border-[#DC2626]/30';
      case 'MANAGER':
        return 'bg-[#78350F]/80 text-[#FCD34D] border border-[#D97706]/30';
      case 'TECHNICIAN':
        return 'bg-[#1E3A8A]/80 text-[#93C5FD] border border-[#2563EB]/30';
      case 'ADVISOR':
      default:
        return 'bg-[#064E3B]/80 text-[#34D399] border border-[#059669]/30';
    }
  };

  const getStatusColor = (status: TenantUser['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-[#064E3B]/80 text-[#34D399] border border-[#059669]/30';
      case 'INACTIVE':
        return 'bg-[#1e293b]/80 text-[#94a3b8] border border-[#334155]/30';
      case 'SUSPENDED':
      default:
        return 'bg-[#7F1D1D]/80 text-[#F87171] border border-[#DC2626]/30';
    }
  };

  return (
    <div className="bg-[#101622] border border-[#1b2536] rounded-lg shadow-xl overflow-hidden">
      {/* Search Bar */}
      <div className="p-5 border-b border-[#1b2536] flex items-center justify-between">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Shop Staff & Employees
        </h3>
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-11 bg-[#162030] border border-[#22314a] rounded-lg pl-10 pr-4 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#D99B26] transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left text-xs min-w-[800px]">
          <thead>
            <tr className="border-b border-[#1b2536] bg-[#0c111a]/60 text-[#64748B] uppercase tracking-wider font-semibold whitespace-nowrap">
              <th className="py-3.5 px-5">Employee Name</th>
              <th className="py-3.5 px-5">Role</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5">Contact Details</th>
              <th className="py-3.5 px-5">Workload Capacity</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2536]/80 text-[#CBD5E1]">
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
                    <div className="w-16 h-16 bg-[#162030] rounded-full flex items-center justify-center border border-[#22314a]">
                      <UserCheck className="w-8 h-8 text-[#D99B26]" />
                    </div>
                    <div className="text-sm font-medium text-[#E2E8F0]">
                      No employees found
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-[#151d2d]/80 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#162030] border border-[#22314a] flex items-center justify-center text-[#94A3B8] font-bold">
                        {employee.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{employee.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getRoleBadgeColor(employee.role)}`}>
                      {employee.role.replace('TENANT_', '')}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(employee.status)}`}>
                      <span className={`w-1 h-1 rounded-full ${
                        employee.status === 'ACTIVE'
                          ? 'bg-[#34D399]'
                          : employee.status === 'INACTIVE'
                          ? 'bg-[#94A3B8]'
                          : 'bg-[#F87171]'
                      }`} />
                      {employee.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                        <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                        <span className="font-mono text-[11px]">{employee.email}</span>
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                          <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                          <span className="font-mono text-[11px]">{employee.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-[#94A3B8] font-mono">
                    {employee.maxConcurrentJobs ? `${employee.maxConcurrentJobs} Active Jobs` : 'Unlimited'}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEditEmployee(employee)}
                        className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1e2a40] rounded-lg transition-colors"
                        title="Edit Details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteEmployee(employee)}
                        className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-[#1b2536] text-xs text-[#64748B]">
        Showing <span className="font-semibold text-white">{filteredEmployees.length}</span> of{' '}
        <span className="font-semibold text-white">{employees.length}</span> employees
      </div>
    </div>
  );
};
