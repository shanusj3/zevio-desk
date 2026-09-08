import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Grid3X3,
  X,
  ArrowLeft,
  Trash2,
  Edit3,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import {
  useInventoryCategoriesQuery,
  useInventoryItemsQuery,
  useDeleteCategoryMutation,
  useCreateCategoryMutation,
  useRenameCategoryMutation,
} from '../hooks/useInventoryQuery';
import {
  navigate,
  parseCategoryRoute,
  categoryDetailPath,
  categoryListPath,
  createProductPath,
} from '../lib/navigation';

export interface CategoryItem {
  id: string;
  name: string;
  productCount: number;
}

const SOFT_PASTEL_GRADIENTS = [
  'linear-gradient(135deg, #cbe5e7 0%, #d6e4ea 50%, #e4dcf1 100%)',
  'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
  'linear-gradient(135deg, #d1fae5 0%, #ccfbf1 100%)',
  'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
  'linear-gradient(135deg, #ffedd5 0%, #fef3c7 100%)',
  'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
];

const CategorySkeletonCard: React.FC = () => (
  <div className="rounded-2xl p-5 border border-[#cbd5e1]/60 min-h-[160px] flex flex-col justify-between animate-pulse bg-[#f1f5f9]">
    <div className="flex justify-end">
      <div className="w-8 h-8 rounded-full bg-slate-200" />
    </div>
    <div className="flex justify-between items-center pt-8">
      <div className="h-5 w-32 bg-slate-200 rounded" />
      <div className="h-5 w-8 bg-slate-200 rounded" />
    </div>
  </div>
);

export const CatalogCategoriesPage: React.FC = () => {
  const { showToast } = useAppStore();

  // API Queries & Mutations
  const { data: backendCategories = [], isLoading: isCategoriesLoading } = useInventoryCategoriesQuery();
  const { data: inventoryData, isLoading: isInventoryLoading } = useInventoryItemsQuery({ take: 100 });
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const createCategoryMutation = useCreateCategoryMutation();
  const renameCategoryMutation = useRenameCategoryMutation();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Detail View State
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [detailMenuOpen, setDetailMenuOpen] = useState(false);

  // Modals
  const [showSavePromptModal, setShowSavePromptModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

  const totalAllProductsCount = inventoryData?.total || inventoryData?.items?.length || 0;

  // Sync API Categories into categories state (formatted clean Category IDs CAT-001)
  useEffect(() => {
    const inventoryItems = inventoryData?.items || [];
    const categoryMap = new Map<string, number>();

    inventoryItems.forEach(item => {
      if (item.category) {
        categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
      }
    });

    // Custom categories (excluding "All Products" which is always rendered as first card)
    const filteredBackend = backendCategories.filter(name => name.toLowerCase() !== 'all products');

    const categoryList: CategoryItem[] = filteredBackend.map((name, index) => ({
      id: `CAT-${(index + 1).toString().padStart(3, '0')}`,
      name,
      productCount: categoryMap.get(name) || 0,
    }));

    setCategories(categoryList);
  }, [backendCategories, inventoryData]);

  // Sync selectedCategory with browser URL path (/catalog/categories/:categoryId)
  useEffect(() => {
    const syncCategoryFromUrl = () => {
      const route = parseCategoryRoute(window.location.pathname);
      if (route?.view === 'detail') {
        const catIdOrName = route.categoryId;
        if (catIdOrName === 'CAT-ALL' || catIdOrName === 'cat-all' || catIdOrName.toLowerCase() === 'all products') {
          setSelectedCategory({ id: 'CAT-ALL', name: 'All Products', productCount: totalAllProductsCount });
          setEditName('All Products');
        } else {
          const matched = categories.find(
            c => c.id === catIdOrName || c.name.toLowerCase() === decodeURIComponent(catIdOrName).toLowerCase()
          );
          if (matched) {
            setSelectedCategory(matched);
            setEditName(matched.name);
          } else if (catIdOrName) {
            const fallback: CategoryItem = {
              id: catIdOrName,
              name: decodeURIComponent(catIdOrName),
              productCount: 0,
            };
            setSelectedCategory(fallback);
            setEditName(fallback.name);
          }
        }
      } else if (route?.view === 'list') {
        setSelectedCategory(null);
      }
    };

    syncCategoryFromUrl();
    window.addEventListener('popstate', syncCategoryFromUrl);
    return () => window.removeEventListener('popstate', syncCategoryFromUrl);
  }, [categories, totalAllProductsCount]);

  // Open detail view for a category (push URL & set state)
  const handleOpenDetail = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    setEditName(cat.name);
    setActiveMenuId(null);
    setDetailMenuOpen(false);
    navigate(categoryDetailPath(cat.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Attempt to go back to category grid view
  const handleAttemptBack = () => {
    if (selectedCategory && editName.trim() !== selectedCategory.name) {
      setPendingNavigationAction(() => () => {
        setSelectedCategory(null);
        setShowSavePromptModal(false);
        navigate(categoryListPath());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      setShowSavePromptModal(true);
    } else {
      setSelectedCategory(null);
      navigate(categoryListPath());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Cancel edits inside detail view
  const handleCancelEdits = () => {
    if (selectedCategory) {
      setEditName(selectedCategory.name);
    }
  };

  // Save Category Changes (Persists to Backend DB)
  const handleSaveCategoryDetails = async () => {
    if (!selectedCategory || !editName.trim()) return;

    const updatedName = editName.trim();
    const oldName = selectedCategory.name;

    try {
      await renameCategoryMutation.mutateAsync({ oldName, newName: updatedName });
    } catch {
      // Handled silently or locally fallback
    }

    setCategories(prev =>
      prev.map(c => (c.id === selectedCategory.id ? { ...c, name: updatedName } : c))
    );

    setSelectedCategory(prev => (prev ? { ...prev, name: updatedName } : null));
    showToast(`Category "${updatedName}" saved successfully`, 'success');
  };

  // Discard changes & proceed
  const handleDiscardChanges = () => {
    if (selectedCategory) {
      setEditName(selectedCategory.name);
    }
    setShowSavePromptModal(false);
    if (pendingNavigationAction) {
      pendingNavigationAction();
      setPendingNavigationAction(null);
    }
  };

  // Save & Continue
  const handleSaveAndContinue = () => {
    handleSaveCategoryDetails();
    setShowSavePromptModal(false);
    if (pendingNavigationAction) {
      pendingNavigationAction();
      setPendingNavigationAction(null);
    }
  };

  // Create category via Drawer (Persists to Backend DB)
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const trimmed = newCategoryName.trim();

    try {
      await createCategoryMutation.mutateAsync(trimmed);
    } catch {
      // Handled silently or locally fallback
    }

    setNewCategoryName('');
    setIsNewDrawerOpen(false);
    showToast(`Category "${trimmed}" created successfully`, 'success');
  };

  // Confirm delete category (Reassigns all products to "All Products" via backend API)
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const catName = categoryToDelete.name;

    try {
      await deleteCategoryMutation.mutateAsync(catName);
    } catch {
      // Handled silently or locally fallback
    }

    setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
    setShowDeleteModal(false);
    if (selectedCategory?.id === categoryToDelete.id) {
      setSelectedCategory(null);
      navigate(categoryListPath());
    }
    setCategoryToDelete(null);
    showToast(`Category "${catName}" deleted. Products moved to All Products.`, 'info');
  };

  const renderDeleteModal = () => {
    if (!showDeleteModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => { setShowDeleteModal(false); setCategoryToDelete(null); }} />
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 z-10">
          {/* Red Header Title Banner */}
          <div className="bg-[#ef4444] px-6 py-4 flex items-center justify-between text-white font-bold text-base">
            <span>Delete this category?</span>
            <button
              type="button"
              onClick={() => { setShowDeleteModal(false); setCategoryToDelete(null); }}
              className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-5">
              {/* Custom Uploaded Trash Bin Illustration */}
              <img
                src="/delete-trash-illustration.png"
                alt="Delete category illustration"
                className="w-24 h-24 object-contain shrink-0"
              />

              {/* Message Text */}
              <div>
                <p className="text-sm font-medium text-[#1e293b] leading-relaxed">
                  Are you sure you want to delete &quot;{categoryToDelete?.name || ''}&quot;? All items in this category will be moved to <strong className="font-bold text-[#1e293b]">All Products</strong>.
                </p>
              </div>
            </div>

            {/* Modal Footer Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setCategoryToDelete(null); }}
                className="px-6 py-2 rounded-full border border-[#ef4444] text-[#ef4444] hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-6 py-2 rounded-full bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSavePromptModal = () => {
    if (!showSavePromptModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setShowSavePromptModal(false)} />
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 z-10">
          {/* Blue Title Banner */}
          <div className="bg-[#3b82f6] px-5 py-3.5 flex items-center justify-between text-white font-bold text-sm">
            <span>Save your changes</span>
            <button
              type="button"
              onClick={() => setShowSavePromptModal(false)}
              className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 space-y-6 text-center">
            <p className="text-sm font-medium text-[#475569]">
              Do you want to save your changes before moving on?
            </p>

            {/* Modal Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="px-6 py-2.5 rounded-full border border-[#3b82f6] text-[#3b82f6] hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={handleSaveAndContinue}
                className="px-6 py-2.5 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Save &amp; Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filtered categories (search filter)
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Products belonging to the selected category
  const selectedCategoryProducts = selectedCategory?.name === 'All Products'
    ? (inventoryData?.items || [])
    : (inventoryData?.items || []).filter(
        item => item.category?.toLowerCase() === selectedCategory?.name.toLowerCase()
      );

  const hasChanges = Boolean(selectedCategory && editName.trim() !== selectedCategory.name);

  // Separate Category Details Page View
  if (selectedCategory) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 min-h-screen">
        {/* Separate Page Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[#dfe5eb] pb-5">
          {/* Left Side: Circular Back Arrow Button + Category Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAttemptBack}
              className="w-9 h-9 rounded-full bg-white border border-[#dfe5eb] text-[#1e293b] flex items-center justify-center hover:bg-[#f8fafc] transition-colors cursor-pointer shadow-xs shrink-0"
              title="Back to Categories"
            >
              <ArrowLeft className="w-4 h-4 text-[#1e293b]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">
                {selectedCategory.name}
              </h1>
              <p className="text-xs text-[#64748b] mt-0.5">
                Category details &amp; assigned inventory items
              </p>
            </div>
          </div>

          {/* Right Side: Circular Three Dots + Cancel + Save Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Circular Three Dots Button (hidden for All Products) */}
            {selectedCategory.id !== 'cat-all' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDetailMenuOpen(!detailMenuOpen)}
                  className="w-9 h-9 rounded-full bg-white border border-[#dfe5eb] text-[#1e293b] flex items-center justify-center hover:bg-[#f8fafc] transition-colors cursor-pointer shadow-xs"
                >
                  <MoreHorizontal className="w-4.5 h-4.5 text-[#1e293b]" />
                </button>

                {/* Popover Menu (Matching Text & Icon Color #1e293b) */}
                {detailMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setDetailMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-40 bg-white border border-[#dfe5eb] rounded-xl shadow-xl p-1 min-w-[150px] animate-in fade-in duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailMenuOpen(false);
                          setCategoryToDelete(selectedCategory);
                          setShowDeleteModal(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#1e293b]" />
                        <span>Delete category</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleCancelEdits}
              className="px-5 py-2 rounded-full bg-white border border-[#dfe5eb] text-xs font-semibold text-[#1e293b] hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Save Button */}
            <button
              type="button"
              disabled={!hasChanges}
              onClick={handleSaveCategoryDetails}
              className={`px-6 py-2 rounded-full text-xs font-semibold transition-colors shadow-sm ${
                hasChanges
                  ? 'bg-[#116dff] hover:bg-[#0d5fd9] text-white cursor-pointer'
                  : 'bg-[#cbd5e1] text-white cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        </div>

        {/* Main Details Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Category Settings Card */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-[#dfe5eb] space-y-5 shadow-sm">
            <h2 className="text-base font-bold text-[#1e293b] border-b border-[#dfe5eb] pb-3">
              Category Details
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
                Category ID
              </label>
              <input
                disabled
                value={selectedCategory.id}
                className="w-full h-10 px-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs font-mono text-[#64748b] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                disabled={selectedCategory.id === 'cat-all'}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-[#dfe5eb] focus:border-[#116dff] rounded-xl text-xs text-[#1e293b] outline-none transition-colors disabled:bg-[#f8fafc] disabled:cursor-not-allowed"
                placeholder="e.g. Screen Replacements"
              />
            </div>
          </div>

          {/* Right Column: Assigned Products in Category */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#dfe5eb] space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#dfe5eb] pb-4">
              <h2 className="text-base font-bold text-[#1e293b]">
                Products in Category ({selectedCategoryProducts.length})
              </h2>
            </div>

            {selectedCategoryProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <h3 className="text-[#1e293b] font-semibold text-lg tracking-tight">
                  Start adding products to your category
                </h3>
                <p className="text-xs text-[#64748b] font-normal max-w-xs leading-relaxed">
                  Assign inventory items or spare parts to display them in this category.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate(createProductPath(selectedCategory?.name))}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#116dff] hover:bg-[#0d5fd9] text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Products
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#edf2f7]">
                {selectedCategoryProducts.map(p => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-[#1e293b]">{p.name}</p>
                      <p className="text-[#64748b]">SKU: {p.sku || 'N/A'}</p>
                    </div>
                    <span className="font-bold text-[#1e293b]">
                      ₹{parseFloat(p.sellingPrice || '0').toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>        {/* Custom Delete Confirmation Warning Modal */}
        {renderDeleteModal()}

        {/* Save Your Changes Confirmation Modal */}
        {renderSavePromptModal()}
      </div>
    );
  }

  // All Products default card item
  const allProductsCat: CategoryItem = {
    id: 'CAT-ALL',
    name: 'All Products',
    productCount: totalAllProductsCount,
  };

  // Main Categories Grid View
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight flex items-baseline gap-2">
            Categories
            <span className="text-lg text-[#116dff] font-bold">{categories.length + 1}</span>
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Group related parts &amp; products into categories for your catalog.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Table Style Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#116dff]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-48 md:w-64 h-10 bg-white border border-[#dfe5eb] rounded-full pl-10 pr-4 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] transition-colors shadow-xs"
            />
          </div>

          {/* Add Category Button */}
          <button
            type="button"
            onClick={() => setIsNewDrawerOpen(true)}
            className="flex items-center gap-2 px-5 h-10 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-semibold rounded-full text-sm transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Skeleton Loading State */}
      {(isCategoriesLoading || isInventoryLoading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CategorySkeletonCard />
          <CategorySkeletonCard />
          <CategorySkeletonCard />
        </div>
      )}

      {/* Categories Grid Display */}
      {!isCategoriesLoading && !isInventoryLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Always Rendered Card 1: All Products (Dark Slate Card matching Reference Image) */}
          <div
            onClick={() => handleOpenDetail(allProductsCat)}
            className="group relative rounded-2xl p-5 border border-[#374151] transition-all duration-150 cursor-pointer min-h-[160px] flex flex-col justify-between overflow-hidden text-white"
            style={{ background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)' }}
          >
            <div className="flex items-center justify-end w-full">
              <span className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            </div>

            <div className="flex items-center justify-between w-full pt-8">
              <span className="text-base font-bold text-white tracking-tight truncate pr-2">
                All Products
              </span>
              <span className="text-sm font-bold text-slate-300 shrink-0">
                {totalAllProductsCount}
              </span>
            </div>
          </div>

          {/* Render Custom Categories */}
          {filteredCategories.map((cat, idx) => {
            const gradient = SOFT_PASTEL_GRADIENTS[idx % SOFT_PASTEL_GRADIENTS.length];
            const isMenuOpen = activeMenuId === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => handleOpenDetail(cat)}
                className="group relative rounded-2xl p-5 border border-[#cbd5e1]/60 transition-all duration-150 cursor-pointer min-h-[160px] flex flex-col justify-between overflow-hidden"
                style={{ background: gradient }}
              >
                {/* Top Right Three Dots Menu Button */}
                <div className="flex items-center justify-end w-full">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setActiveMenuId(isMenuOpen ? null : cat.id);
                    }}
                    className="w-8 h-8 rounded-full bg-white/70 hover:bg-white text-[#1e293b] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4 text-[#1e293b]" />
                  </button>
                </div>

                {/* Popover Menu (Matching Text & Icon Color #1e293b) */}
                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={e => {
                        e.stopPropagation();
                        setActiveMenuId(null);
                      }}
                    />
                    <div
                      className="absolute top-12 right-4 z-30 bg-white border border-[#dfe5eb] rounded-xl shadow-xl p-1 min-w-[130px] animate-in fade-in duration-150"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(cat)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#1e293b] hover:bg-[#f4f7ff] hover:text-[#116dff] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#1e293b]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setCategoryToDelete(cat);
                          setActiveMenuId(null);
                          setShowDeleteModal(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#1e293b]" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Card Bottom Text Layout */}
                <div className="flex items-center justify-between w-full pt-8">
                  <span className="text-base font-bold text-[#1e293b] tracking-tight truncate pr-2">
                    {cat.name}
                  </span>
                  <span className="text-sm font-bold text-[#475569] shrink-0">
                    {cat.productCount}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Plus Box Card for Adding New Category (Matching Reference Image) */}
          <div
            onClick={() => setIsNewDrawerOpen(true)}
            className="bg-white border-2 border-dashed border-[#cbd5e1] hover:border-[#116dff] hover:bg-[#f8fafc] rounded-2xl min-h-[160px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#eff6ff] text-[#116dff] group-hover:scale-110 flex items-center justify-center transition-transform">
              <Plus className="w-7 h-7" />
            </div>
            <span className="text-xs font-semibold text-[#116dff] mt-2.5">
              Add Category
            </span>
          </div>
        </div>
      )}

      {/* Add Category Slide-Over Drawer (Positioned Behind Header top-12 with Motion Animation) */}
      <AnimatePresence>
        {isNewDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30"
            />

            {/* Slide Drawer (Positioned top-12 behind app header) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-12 right-0 bottom-0 w-full max-w-md bg-white border-l border-[#e2e8f0] flex flex-col shadow-2xl z-40"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-[#dfe5eb] flex items-center justify-between shrink-0">
                <h2 className="text-base font-bold text-[#1e293b]">Add New Category</h2>
                <button
                  type="button"
                  onClick={() => setIsNewDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
                    Category Name *
                  </label>
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                    placeholder="e.g. Screen Replacements"
                    className="w-full h-10 px-3.5 bg-white border border-[#dfe5eb] focus:border-[#116dff] rounded-xl text-xs text-[#1e293b] placeholder-[#94a3b8] outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-[#dfe5eb] flex items-center justify-end gap-3 shrink-0 bg-[#f8fafc]">
                <button
                  type="button"
                  onClick={() => setIsNewDrawerOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#cbd5e1] text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newCategoryName.trim()}
                  onClick={handleCreateCategory}
                  className="px-5 py-2 rounded-full bg-[#116dff] hover:bg-[#0d5fd9] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Warning Modal */}
      {renderDeleteModal()}

      {/* Save Your Changes Confirmation Modal */}
      {renderSavePromptModal()}
    </div>
  );
};
