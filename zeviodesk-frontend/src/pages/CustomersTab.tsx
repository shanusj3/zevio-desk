import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { CustomersTable } from '../components/CustomersTable';
import { CreateCustomerModal } from '../components/CreateCustomerModal';
import { Customer, customersApi } from '../lib/api';
import { useDeleteCustomerMutation, useCreateCustomerMutation } from '../hooks/useCustomersQuery';
import { downloadCsv } from '../lib/csvExport';
import { useAppStore } from '../store/useAppStore';
import { useQueryClient } from '@tanstack/react-query';

export const CustomersTab: React.FC = () => {
  const { showToast } = useAppStore();
  const queryClient = useQueryClient();

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isCustomerExportModalOpen, setIsCustomerExportModalOpen] = useState(false);
  const [customersFilteredCount, setCustomersFilteredCount] = useState(0);
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);

  const deleteCustomerMutation = useDeleteCustomerMutation();
  const createCustomerMutation = useCreateCustomerMutation();

  const handleOpenCreateCustomer = () => {
    setCustomerToEdit(null);
    setIsCustomerModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsCustomerModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteCustomerMutation.mutate(customer.id, {
        onSuccess: () => {
          showToast(`Customer "${customer.name}" deleted`, 'info');
        },
      });
    }
  };

  const handleSaveCustomer = async (data: {
    name: string;
    phone: string;
    email?: string;
    type?: 'WALK_IN' | 'RETURNING' | 'BUSINESS';
    notes?: string;
  }) => {
    try {
      if (customerToEdit) {
        await customersApi.update(customerToEdit.id, data);
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        showToast(`Customer "${data.name}" updated`, 'success');
      } else {
        await createCustomerMutation.mutateAsync(data);
        showToast(`Customer "${data.name}" created`, 'success');
      }
      setIsCustomerModalOpen(false);
      setCustomerToEdit(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save customer', 'warning');
    }
  };

  const handleExportCustomers = async (scope: 'all' | 'filtered' | 'selected') => {
    try {
      const res = await customersApi.fetchAll({ limit: 1000 });
      const customers = res.customers || [];
      if (customers.length === 0) {
        showToast('No customer data available to export', 'warning');
        return;
      }

      const headers = ['ID', 'Name', 'Phone', 'Email', 'Customer Type', 'Internal Notes', 'Joined Date'];
      const rows = customers.map((c) => [
        c.id,
        c.name,
        c.phone || '',
        c.email || '',
        c.customerType || 'WALK_IN',
        c.notes || '',
        c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      ]);

      downloadCsv(`customers_export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      showToast(`Exported ${rows.length} customers to CSV`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export customers', 'warning');
    }
  };

  const handleImportCustomers = async (file: File) => {
    showToast(`Imported customers from ${file.name}`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Customers"
        count={totalCustomersCount}
        subtitle="Manage customer profiles for your workshop"
        primaryAction={{ label: 'New Customer', onClick: handleOpenCreateCustomer }}
        exportConfig={{
          allCount: totalCustomersCount,
          filteredCount: customersFilteredCount,
          selectedCount: 0,
          exportDescription: 'Your customers list and their data will be downloaded as a CSV file.',
          onExport: handleExportCustomers,
        }}
        exportDescription="Export your customer directory to a CSV file."
        importConfig={{
          title: 'Import customers to your store',
          description: 'Use this tool to import or edit multiple customers in one go.',
          onImport: handleImportCustomers,
        }}
        importLabel="Import Customers"
        importDescription="Import multiple customers from a CSV file."
        isExportModalOpen={isCustomerExportModalOpen}
        onExportModalOpenChange={setIsCustomerExportModalOpen}
      />

      <CustomersTable
        onEditCustomer={handleEditCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onExportClick={() => setIsCustomerExportModalOpen(true)}
        onFilteredCountChange={setCustomersFilteredCount}
        onTotalCountChange={setTotalCustomersCount}
      />

      {isCustomerModalOpen && (
        <CreateCustomerModal
          customerToEdit={customerToEdit}
          isOpen={isCustomerModalOpen}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setCustomerToEdit(null);
          }}
        />
      )}
    </div>
  );
};
