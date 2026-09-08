import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Search, Filter, History, AlertTriangle, ArrowUpDown,
  Wrench, Layers, MapPin, IndianRupee, Trash2, Edit3, X, Check, Eye
} from 'lucide-react';
import {
  useInventoryItemsQuery, useInventoryCategoriesQuery,
  useCreateInventoryItemMutation, useUpdateInventoryItemMutation,
  useDeactivateInventoryItemMutation, useAdjustStockMutation,
  useInventoryMovementsQuery
} from '../hooks/useInventoryQuery';
import { useAppStore } from '../store/useAppStore';
import { TableRowSkeleton } from '../components/Skeleton';
import { PageHeader } from '../components/PageHeader';
import { ExportScope } from '../components/ExportScopeModal';
import { InventoryItem, StockMovement, inventoryApi } from '../lib/api';
import { downloadCsv } from '../lib/csvExport';
import { formatCurrency } from '../utils/formatters';
import { SearchInput } from '../components/ui/SearchInput';
import { Pagination } from '../components/common/Pagination';

const INVENTORY_CSV_HEADERS = [
  'Name', 'SKU', 'Barcode', 'Brand', 'Category', 'Description',
  'Cost Price', 'Selling Price', 'Current Stock', 'Minimum Stock', 'Location',
];

function inventoryToCsvRow(item: InventoryItem): string[] {
  return [
    item.name,
    item.sku ?? '',
    item.barcode ?? '',
    item.brand ?? '',
    item.category ?? '',
    item.description ?? '',
    item.costPrice ?? '',
    item.sellingPrice,
    String(item.currentStock),
    String(item.minimumStock),
    item.location ?? '',
  ];
}

const money = (val: string | number | null | undefined) =>
  formatCurrency(val, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const InventoryPage: React.FC = () => {
  const { currentUser, showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Selected item for stock adjustments / movement history
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isMovementsDrawerOpen, setIsMovementsDrawerOpen] = useState(false);

  // Selected item for Create/Edit item modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemBarcode, setItemBarcode] = useState('');
  const [itemBrand, setItemBrand] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemStock, setItemStock] = useState('0');
  const [itemMinStock, setItemMinStock] = useState('0');
  const [itemLoc, setItemLoc] = useState('');

  // Adjustment states
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('Stock check');

  // Queries - fetch all inventory items for instant client-side searching, filtering, and delete operations
  const { data: categories = [] } = useInventoryCategoriesQuery();
  const { data: inventoryData, isLoading } = useInventoryItemsQuery({
    take: 1000,
  });

  const rawItems = useMemo(() => {
    return (inventoryData?.items ?? []).filter(item => !item.name?.startsWith('Unassigned Item ('));
  }, [inventoryData]);

  // Instant client-side filtering without network latency or re-fetch spinners
  const filteredItems = useMemo(() => {
    return rawItems.filter(item => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchSku = item.sku?.toLowerCase().includes(q);
        const matchBrand = item.brand?.toLowerCase().includes(q);
        const matchBarcode = item.barcode?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBrand && !matchBarcode && !matchCategory) return false;
      }
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }
      if (lowStockFilter && item.currentStock > item.minimumStock) {
        return false;
      }
      return true;
    });
  }, [rawItems, search, categoryFilter, lowStockFilter]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    return filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  }, [filteredItems, page, itemsPerPage]);

  const allCount = rawItems.length;
  const hasActiveFilters = Boolean(search.trim()) || categoryFilter !== 'All' || lowStockFilter;
  const filteredCount = hasActiveFilters ? totalItems : 0;

  // Mutations
  const createMutation = useCreateInventoryItemMutation();
  const updateMutation = useUpdateInventoryItemMutation();
  const deactivateMutation = useDeactivateInventoryItemMutation();
  const adjustMutation = useAdjustStockMutation();

  const isManagerOrAdmin = currentUser?.role === 'TENANT_ADMIN' || currentUser?.role === 'MANAGER';

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemSku('');
    setItemBarcode('');
    setItemBrand('');
    setItemCategory('');
    setItemDesc('');
    setItemCost('');
    setItemPrice('');
    setItemStock('0');
    setItemMinStock('0');
    setItemLoc('');
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemSku(item.sku || '');
    setItemBarcode(item.barcode || '');
    setItemBrand(item.brand || '');
    setItemCategory(item.category || '');
    setItemDesc(item.description || '');
    setItemCost(item.costPrice || '');
    setItemPrice(item.sellingPrice);
    setItemStock(String(item.currentStock));
    setItemMinStock(String(item.minimumStock));
    setItemLoc(item.location || '');
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice.trim()) {
      showToast('Name and Selling Price are required', 'warning');
      return;
    }

    const payload = {
      name: itemName.trim(),
      sku: itemSku.trim() || undefined,
      barcode: itemBarcode.trim() || undefined,
      brand: itemBrand.trim() || undefined,
      category: itemCategory.trim() || undefined,
      description: itemDesc.trim() || undefined,
      costPrice: itemCost ? parseFloat(itemCost) : undefined,
      sellingPrice: parseFloat(itemPrice),
      minimumStock: parseInt(itemMinStock) || 0,
      location: itemLoc.trim() || undefined,
    };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: payload,
        });
        showToast('Part updated successfully', 'success');
      } else {
        await createMutation.mutateAsync({
          ...payload,
          currentStock: parseInt(itemStock) || 0,
        });
        showToast('Part created successfully', 'success');
      }
      setIsItemModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save part', 'warning');
    }
  };

  const handleExport = async (scope: ExportScope) => {
    let exportItems: InventoryItem[] = [];

    if (scope === 'all') {
      exportItems = rawItems;
    } else if (scope === 'filtered') {
      exportItems = filteredItems;
    }

    if (exportItems.length === 0) {
      showToast('No items to export', 'warning');
      return;
    }

    downloadCsv(
      `inventory-${new Date().toISOString().slice(0, 10)}.csv`,
      INVENTORY_CSV_HEADERS,
      exportItems.map(inventoryToCsvRow),
    );
    showToast(`Exported ${exportItems.length} item${exportItems.length === 1 ? '' : 's'}`, 'success');
  };

  const handleDeactivate = async (item: InventoryItem) => {
    if (!window.confirm(`Deactivate "${item.name}"? Techs won't be able to search for it.`)) return;
    try {
      await deactivateMutation.mutateAsync(item.id);
      showToast('Part deactivated', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate part', 'warning');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !adjQty) return;
    const qty = parseInt(adjQty);
    if (!qty || qty === 0) {
      showToast('Quantity adjustment cannot be zero', 'warning');
      return;
    }

    try {
      await adjustMutation.mutateAsync({
        id: selectedItem.id,
        quantity: qty,
        reason: adjReason,
      });
      showToast('Stock adjusted successfully', 'success');
      setIsAdjustModalOpen(false);
      setAdjQty('');
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust stock', 'warning');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Spare Parts Inventory"
        count={allCount}
        subtitle="Manage repair parts, track stock levels, and view adjustments"
        primaryAction={isManagerOrAdmin ? { label: 'New Part', onClick: handleOpenCreateModal } : undefined}
        exportConfig={isManagerOrAdmin ? {
          allCount,
          filteredCount,
          selectedCount: 0,
          exportDescription: 'Your spare parts and all their data will be downloaded as a CSV file.',
          exportNote: 'Inactive parts are not exported.',
          onExport: handleExport,
        } : undefined}
        exportDescription="Export your spare parts to a CSV file."
        importConfig={isManagerOrAdmin ? {
          title: 'Import Spare Parts',
          description: 'Upload a CSV file to import multiple spare parts at once.',
          sampleHint: 'Use the exported CSV format as a template for bulk imports.',
          onImport: async () => {
            showToast('Bulk import coming soon', 'info');
          },
        } : undefined}
        importDescription="Import multiple spare parts from a CSV file."
      />

      {/* Table controls */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <SearchInput
            containerClassName="flex-1 md:max-w-md"
            placeholder="Search part name, brand, SKU..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-40">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-11 pl-4 pr-10 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#1e293b] focus:border-[#116dff] outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
            </div>

            <button
              onClick={() => {
                setLowStockFilter(!lowStockFilter);
                setPage(1);
              }}
              className={`px-4 h-11 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-colors cursor-pointer ${
                lowStockFilter
                  ? 'bg-amber-500/20 text-amber-600 border-amber-500/40'
                  : 'bg-[#f8fafc] text-[#64748B] border-[#e2e8f0] hover:text-[#1e293b]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Alerts</span>
            </button>
          </div>
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] uppercase tracking-wider font-semibold whitespace-nowrap">
                <th className="py-3.5 px-5">Part Details</th>
                <th className="py-3.5 px-5">Brand &amp; Category</th>
                <th className="py-3.5 px-5">Cost Price</th>
                <th className="py-3.5 px-5">Selling Price</th>
                <th className="py-3.5 px-5">Stock Level</th>
                <th className="py-3.5 px-5">Location</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-[#334155]">
              {isLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))}
                </>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center border border-[#e2e8f0] shadow-inner">
                        <Package className="w-8 h-8 text-[#116dff]" />
                      </div>
                      <div className="text-sm font-semibold text-[#1e293b]">
                        {hasActiveFilters ? 'No inventory items match your search' : 'No inventory items found'}
                      </div>
                      <p className="text-xs text-[#64748B] max-w-[280px]">
                        {hasActiveFilters
                          ? 'Try adjusting or clearing your search term, category filter, or low stock alert filter.'
                          : 'Add spare parts, batteries, or screens to track stock levels dynamically.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setCategoryFilter('All');
                            setLowStockFilter(false);
                            setPage(1);
                          }}
                          className="mt-1 px-3 py-1.5 text-xs font-semibold text-[#116dff] bg-[#eff6ff] hover:bg-[#dbeafe] rounded-lg border border-[#bfdbfe] transition cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isOutOfStock = item.currentStock <= 0;
                  const isLowStock = item.currentStock <= item.minimumStock;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#f8fafc] transition-colors whitespace-nowrap ${
                        isOutOfStock
                          ? 'border-l-2 border-l-red-500'
                          : isLowStock
                          ? 'border-l-2 border-l-amber-500'
                          : ''
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[#1e293b] font-semibold text-xs truncate max-w-[200px]" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-[#64748B] mt-0.5 font-mono">
                            {item.sku || 'No SKU'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-[#334155] font-medium">{item.brand || 'Generic'}</span>
                          <span className="text-[10px] text-[#64748B] mt-0.5">{item.category || 'Uncategorized'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono text-[#475569]">
                        {item.costPrice ? money(item.costPrice) : <span className="text-[#94a3b8]">N/A</span>}
                      </td>

                      <td className="py-4 px-5 font-mono text-[#1e293b] font-bold">
                        {money(item.sellingPrice)}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              isOutOfStock
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : isLowStock
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            }`}
                          >
                            {item.currentStock} in stock
                          </span>
                          {isOutOfStock && <span className="text-[10px] text-red-500 font-medium">⚠️ Empty</span>}
                          {!isOutOfStock && isLowStock && <span className="text-[10px] text-amber-600 font-medium">⚠️ Low</span>}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-[#64748B]">
                          <MapPin className="w-3.5 h-3.5 text-[#94a3b8]" />
                          <span>{item.location || '—'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setIsMovementsDrawerOpen(true);
                            }}
                            className="p-1.5 text-[#94A3B8] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg transition-colors cursor-pointer"
                            title="Stock Movements History"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {isManagerOrAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setAdjQty('');
                                  setAdjReason('Manual inventory update');
                                  setIsAdjustModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] text-[#116dff] rounded-lg transition-colors cursor-pointer"
                              >
                                Adjust
                              </button>

                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 text-[#94A3B8] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg transition-colors cursor-pointer"
                                title="Edit Item"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeactivate(item)}
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Deactivate Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={itemsPerPage}
          onPageChange={setPage}
          showingLabel="items"
        />
      </div>

      {/* Adjust Stock Modal - Light Theme with Primary Accent */}
      {isAdjustModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleAdjustStock}
            className="w-full max-w-md bg-white border border-[#dfe5eb] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="px-6 py-4 border-b border-[#dfe5eb] flex items-center justify-between bg-white">
              <h3 className="text-base font-bold text-[#1e293b] flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#116dff]" /> Stock Adjustment
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-[#64748b] hover:text-[#1e293b] cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div>
                <p className="text-xs text-[#64748b]">Adjusting stock count for:</p>
                <p className="text-sm font-bold text-[#1e293b] mt-0.5">{selectedItem.name}</p>
                <p className="text-xs text-[#116dff] font-semibold font-mono mt-1">Current Stock: {selectedItem.currentStock} units</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">
                  Quantity Adjustment <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5 to add, -2 to remove"
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] focus:bg-white outline-none transition-colors"
                  required
                />
                <span className="text-[10px] text-[#64748b] mt-1 block">
                  Positive values add to stock, negative values subtract.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">
                  Reason for Adjustment <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stock received, Damaged part, Correcting error"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] focus:bg-white outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#dfe5eb] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#1e293b] transition cursor-pointer bg-transparent border-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjustMutation.isPending}
                className="px-5 py-2 text-xs font-bold bg-[#116dff] hover:bg-[#0052cc] text-white rounded-xl transition cursor-pointer shadow-xs"
              >
                {adjustMutation.isPending ? 'Saving...' : 'Apply Stock Change'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create / Edit Item Modal - Light Theme */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleSaveItem}
            className="w-full max-w-xl bg-white border border-[#dfe5eb] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-[#dfe5eb] flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-base font-bold text-[#1e293b] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#116dff]" /> {editingItem ? 'Edit Part' : 'Add New Inventory Part'}
              </h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="text-[#64748b] hover:text-[#1e293b] cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">
                    Part / Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. iPhone 13 Display"
                    className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] focus:bg-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">
                    SKU / Reference Number
                  </label>
                  <input
                    value={itemSku}
                    onChange={(e) => setItemSku(e.target.value)}
                    placeholder="e.g. IP13-DIS"
                    className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">Brand</label>
                  <input
                    value={itemBrand}
                    onChange={(e) => setItemBrand(e.target.value)}
                    placeholder="e.g. Apple"
                    className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">Category</label>
                  <input
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    placeholder="e.g. Display"
                    className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemCost}
                    onChange={(e) => setItemCost(e.target.value)}
                    placeholder="e.g. 2800"
                    className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] focus:bg-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] focus:bg-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {!editingItem && (
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">Initial Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={itemStock}
                      onChange={(e) => setItemStock(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] focus:border-[#116dff] focus:bg-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                )}
                <div className={editingItem ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">Minimum Stock (Alert)</label>
                  <input
                    type="number"
                    min="0"
                    value={itemMinStock}
                    onChange={(e) => setItemMinStock(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] focus:border-[#116dff] focus:bg-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">Location</label>
                  <input
                    value={itemLoc}
                    onChange={(e) => setItemLoc(e.target.value)}
                    placeholder="Shelf A-3"
                    className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide">Description / Notes</label>
                <textarea
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Additional specifications or supplier info..."
                  rows={3}
                  className="w-full p-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] focus:bg-white outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#dfe5eb] flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#1e293b] transition cursor-pointer bg-transparent border-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-5 py-2 text-xs font-bold bg-[#116dff] hover:bg-[#0052cc] text-white rounded-xl transition cursor-pointer shadow-xs"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Part'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Movement Drawer - Light Theme */}
      {isMovementsDrawerOpen && selectedItem && (
        <StockMovementsDrawer
          item={selectedItem}
          onClose={() => setIsMovementsDrawerOpen(false)}
        />
      )}
    </div>
  );
};

// ── Stock Movements Slide-out Drawer (Light Theme) ───────────────────────────
interface StockMovementsDrawerProps {
  item: InventoryItem;
  onClose: () => void;
}

const StockMovementsDrawer: React.FC<StockMovementsDrawerProps> = ({ item, onClose }) => {
  const [skip, setSkip] = useState(0);
  const take = 10;
  const { data: movementData, isLoading } = useInventoryMovementsQuery(item.id, skip, take);

  const movements = movementData?.movements ?? [];
  const total = movementData?.total ?? 0;

  const handleNext = () => {
    if (skip + take < total) setSkip(skip + take);
  };
  const handlePrev = () => {
    if (skip - take >= 0) setSkip(skip - take);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border-l border-[#dfe5eb] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-6 py-5 border-b border-[#dfe5eb] flex items-center justify-between shrink-0 bg-white">
          <div>
            <h3 className="text-base font-bold text-[#1e293b]">Stock Movements History</h3>
            <p className="text-xs text-[#64748b] mt-0.5 font-semibold truncate max-w-[320px]">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#1e293b] cursor-pointer p-1 rounded-lg hover:bg-[#f1f5f9] transition border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#116dff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-16 text-[#64748b] text-xs">No stock movement logs recorded.</div>
          ) : (
            <div className="relative border-l border-[#dfe5eb] ml-3 pl-6 space-y-6 py-2">
              {movements.map((m) => {
                const isPositive = m.quantity > 0;
                return (
                  <div key={m.id} className="relative">
                    <span
                      className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-white ${
                        m.type === 'RETURN'
                          ? 'border-blue-500'
                          : isPositive
                          ? 'border-emerald-500'
                          : 'border-amber-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            m.type === 'RETURN'
                              ? 'text-blue-600'
                              : isPositive
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {m.type === 'RETURN'
                            ? 'Stock Returned'
                            : isPositive
                            ? 'Stock Added'
                            : m.type === 'STOCK_OUT'
                            ? 'Stock Consumed'
                            : 'Stock Adjusted'}
                        </span>
                        <span className="text-[10px] text-[#94a3b8] font-mono">
                          {new Date(m.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-[#334155]">
                        <span>
                          Quantity: <strong className="font-mono">{isPositive ? `+${m.quantity}` : m.quantity}</strong>
                        </span>
                        <span className="text-[11px] text-[#64748b] font-mono">
                          {m.previousStock} → {m.newStock} units
                        </span>
                      </div>
                      {(m.reason || m.reference) && (
                        <p className="mt-1.5 text-[10px] text-[#64748b] leading-relaxed">
                          {m.reason && <span>Reason: {m.reason}</span>}
                          {m.reason && m.reference && <span className="mx-1.5">•</span>}
                          {m.reference && <span>Reference: {m.reference}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {total > take && (
          <div className="p-4 border-t border-[#dfe5eb] flex items-center justify-between text-xs text-[#64748b] shrink-0 bg-[#f8fafc]">
            <span>
              Log {skip + 1} to {Math.min(skip + take, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={skip === 0}
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#dfe5eb] hover:bg-[#f1f5f9] disabled:opacity-50 transition cursor-pointer border-none text-[#334155] text-xs font-semibold"
              >
                Prev
              </button>
              <button
                disabled={skip + take >= total}
                onClick={handleNext}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#dfe5eb] hover:bg-[#f1f5f9] disabled:opacity-50 transition cursor-pointer border-none text-[#334155] text-xs font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
