import React, { useState, useEffect } from 'react';
import { Filter, Plus } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { DataTable, ColumnDef } from '../components/data-table/DataTable';
import { DataTableRowActions } from '../components/data-table/DataTableRowActions';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { useAppStore } from '../store/useAppStore';
import { navigate, createProductPath } from '../lib/navigation';
import {
  useInventoryItemsQuery,
  useInventoryCategoriesQuery,
  useDeactivateInventoryItemMutation,
} from '../hooks/useInventoryQuery';
import { InventoryItem } from '../lib/api';
import { downloadCsv } from '../lib/csvExport';

export const CatalogProductsPage: React.FC = () => {
  const { showToast } = useAppStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categoriesList = [] } = useInventoryCategoriesQuery();
  const { data: inventoryResult, isLoading, refetch } = useInventoryItemsQuery({
    search: debouncedSearch,
    category: selectedCategoryFilter === 'All' ? undefined : selectedCategoryFilter,
    take: 100,
  });

  const deactivateMutation = useDeactivateInventoryItemMutation();

  const productsList = inventoryResult?.items || [];
  const totalCount = inventoryResult?.total || productsList.length;

  const handleExportProducts = (scope: 'all' | 'filtered' | 'selected') => {
    const rowsToExport = productsList;
    if (rowsToExport.length === 0) {
      showToast('No products available to export', 'warning');
      return;
    }

    const headers = ['ID', 'Name', 'Category', 'SKU', 'Brand', 'Price', 'CostPrice', 'CurrentStock', 'Status'];
    const rows = rowsToExport.map(p => [
      p.id,
      p.name,
      p.category || 'Uncategorized',
      p.sku || '',
      p.brand || '',
      String(p.sellingPrice),
      String(p.costPrice || 0),
      String(p.currentStock),
      p.currentStock > p.minimumStock ? 'IN_STOCK' : p.currentStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
    ]);

    downloadCsv(`products_catalog_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast(`Exported ${rows.length} products to CSV`, 'success');
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deactivateMutation.mutateAsync(productToDelete.id);
      showToast(`Product "${productToDelete.name}" deleted successfully`, 'info');
      refetch();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'warning');
    } finally {
      setProductToDelete(null);
    }
  };

  // Define Columns for generic DataTable<T>
  const columns: ColumnDef<InventoryItem>[] = [
    {
      key: 'name',
      header: 'PRODUCT NAME',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#eff6ff] text-[#116dff] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
            {p.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#1e293b] group-hover:text-[#116dff] transition-colors">
              {p.name}
            </p>
            {p.description && (
              <p className="text-[11px] text-[#64748b] line-clamp-1 max-w-xs">{p.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'CATEGORY',
      cell: (p) => <Badge variant="default">{p.category || 'Uncategorized'}</Badge>,
    },
    {
      key: 'sku',
      header: 'SKU / BRAND',
      cell: (p) => (
        <div>
          <p className="font-mono text-xs font-semibold text-[#1e293b]">{p.sku || 'N/A'}</p>
          {p.brand && <p className="text-[11px] text-[#64748b]">{p.brand}</p>}
        </div>
      ),
    },
    {
      key: 'price',
      header: 'PRICE',
      cell: (p) => (
        <span className="font-bold text-[#1e293b]">
          ₹ {parseFloat(p.sellingPrice.toString() || '0').toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'STOCK STATUS',
      cell: (p) => {
        const isInStock = p.currentStock > p.minimumStock;
        const isLowStock = p.currentStock > 0 && p.currentStock <= p.minimumStock;
        return isInStock ? (
          <Badge variant="in_stock">IN STOCK ({p.currentStock})</Badge>
        ) : isLowStock ? (
          <Badge variant="low_stock">LOW STOCK ({p.currentStock})</Badge>
        ) : (
          <Badge variant="out_of_stock">OUT OF STOCK</Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      cell: (p) => (
        <DataTableRowActions
          actions={[
            { label: 'Delete Product', variant: 'danger', onClick: () => setProductToDelete(p) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 min-h-screen">
      <PageHeader
        title="Products"
        count={totalCount}
        subtitle="Manage repair parts, service items, and products catalog"
        primaryAction={{
          label: 'New Product',
          onClick: () => navigate(createProductPath()),
        }}
        exportConfig={{
          allCount: totalCount,
          filteredCount: productsList.length,
          exportTitle: 'Export Products Catalog',
          exportDescription: 'Your products catalog data will be downloaded as a CSV file.',
          onExport: handleExportProducts,
        }}
        isExportModalOpen={isExportModalOpen}
        onExportModalOpenChange={setIsExportModalOpen}
      />

      {/* Reusable Generic DataTable<T> */}
      <DataTable
        data={productsList}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search products..."
        onSearchChange={setSearch}
        onExportCsv={() => setIsExportModalOpen(true)}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => navigate(`/catalog/products/${p.id}`)}
        emptyState={{
          title: 'No products found',
          description: search ? `No items matching "${search}"` : 'Click + New Product to add products.',
          action: (
            <button
              type="button"
              onClick={() => navigate(createProductPath())}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#116dff] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          ),
        }}
        filterComponent={
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center gap-2 px-4 h-9 rounded-full border border-[#cbd5e1] bg-white text-xs font-semibold text-[#1e293b] hover:bg-slate-50 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#116dff]" />
              <span>Filter</span>
            </button>
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute left-0 top-full mt-1.5 z-30 bg-white border border-[#dfe5eb] rounded-xl shadow-xl p-3 min-w-[200px] space-y-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedCategoryFilter('All'); setIsFilterOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    All Categories
                  </button>
                  {categoriesList.map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setSelectedCategoryFilter(cat); setIsFilterOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        }
      />

      {/* Reusable Dialog primitive for Delete Confirmation */}
      <Dialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Delete Product?"
        headerVariant="danger"
        footer={
          <>
            <button
              type="button"
              onClick={() => setProductToDelete(null)}
              className="px-5 py-2 rounded-full border border-[#ef4444] text-[#ef4444] text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-full bg-[#ef4444] text-white text-xs font-bold cursor-pointer"
            >
              Delete
            </button>
          </>
        }
      >
        <div className="flex items-center gap-5">
          <img src="/delete-trash-illustration.png" alt="Delete" className="w-20 h-20 object-contain shrink-0" />
          <p className="text-sm font-medium text-[#1e293b] leading-relaxed">
            Are you sure you want to delete &quot;{productToDelete?.name}&quot;? This action cannot be undone.
          </p>
        </div>
      </Dialog>
    </div>
  );
};
