import React, { useState } from 'react';
import {
  ArrowLeft,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Tag,
  Search,
  Info,
  X,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { inventoryApi } from '../lib/api';
import {
  useInventoryItemsQuery,
  useInventoryCategoriesQuery,
  useInventoryItemQuery,
  useUpdateInventoryItemMutation,
} from '../hooks/useInventoryQuery';
import { useQueryClient } from '@tanstack/react-query';
import { calculateTax, TaxTreatment, PriceMode } from '../lib/tax';
import { WarrantyModal, WarrantyItem } from '../components/WarrantyModal';

interface CreateProductPageProps {
  productId?: string;
  initialCategoryId?: string;
  onBack?: () => void;
}

export const CreateProductPage: React.FC<CreateProductPageProps> = ({
  productId,
  initialCategoryId,
  onBack,
}) => {
  const { showToast } = useAppStore();
  const queryClient = useQueryClient();
  const { data: categoriesList = [] } = useInventoryCategoriesQuery();

  // Basic Product Info State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Pricing State
  const [price, setPrice] = useState<string>('');
  const [costOfGoods, setCostOfGoods] = useState<string>('0');

  // Calculated Profit & Margin
  const numPrice = parseFloat(price) || 0;
  const numCost = parseFloat(costOfGoods) || 0;
  const profit = Math.max(0, numPrice - numCost);
  const margin = numPrice > 0 ? Math.round((profit / numPrice) * 100) : 100;

  // Media State (Max 4 images)
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Inventory & Product Domain Details
  const [itemType, setItemType] = useState<'PART' | 'SERVICE'>('PART');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [onHandStock, setOnHandStock] = useState<number>(10);
  const [minimumStock, setMinimumStock] = useState<number>(2);
  const [location, setLocation] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [gstRate, setGstRate] = useState('18%');
  const [priceIncludesGst, setPriceIncludesGst] = useState(false);
  const [taxType, setTaxType] = useState<'CGST_SGST' | 'IGST' | 'EXEMPT'>('CGST_SGST');

  // Tax Engine Specifications
  const [hsnCode, setHsnCode] = useState('');
  const [sacCode, setSacCode] = useState('');

  const [warrantiesList, setWarrantiesList] = useState<WarrantyItem[]>([]);

  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);

  const [isActive, setIsActive] = useState(true);

  // Category Selection State (Managed via Right Sidebar Categories Card)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategoryId ? [initialCategoryId] : ['All Products']
  );
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const { data: existingProduct } = useInventoryItemQuery(productId || '');
  const updateMutation = useUpdateInventoryItemMutation();

  React.useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name || '');
      setDescription(existingProduct.description || '');
      setPrice(existingProduct.sellingPrice?.toString() || '');
      setCostOfGoods(existingProduct.costPrice?.toString() || '0');
      setItemType(existingProduct.itemType || 'PART');
      setSku(existingProduct.sku || '');
      setBrand(existingProduct.brand || '');
      setOnHandStock(existingProduct.onHandStock ?? existingProduct.currentStock ?? 10);
      setMinimumStock(existingProduct.minimumStock ?? 2);
      setLocation(existingProduct.location || '');
      setSupplierName(existingProduct.supplierName || '');
      setGstRate(existingProduct.gstRate || '18%');
      setPriceIncludesGst(existingProduct.priceMode === 'TAX_INCLUSIVE');
      setTaxType(existingProduct.taxType || 'CGST_SGST');
      if (existingProduct.hsnCode) setHsnCode(existingProduct.hsnCode);
      if (existingProduct.sacCode) setSacCode(existingProduct.sacCode);
      if (existingProduct.category) {
        setSelectedCategories([existingProduct.category]);
      }
    }
  }, [existingProduct]);

  const [isSaving, setIsSaving] = useState(false);

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Toggle Category Checkbox
  const toggleCategory = (catName: string) => {
    setSelectedCategories(prev =>
      prev.includes(catName)
        ? prev.filter(c => c !== catName)
        : [...prev, catName]
    );
  };

  // AI Description Generator
  const handleGenerateAiText = () => {
    if (!name.trim()) {
      showToast('Please enter a product name first to generate description', 'warning');
      return;
    }
    setIsAiGenerating(true);
    setTimeout(() => {
      setDescription(
        `High-performance premium ${name} designed for optimal durability and seamless compatibility. Engineered to meet strict quality specifications with precision testing.`
      );
      setIsAiGenerating(false);
      showToast('AI Description generated!', 'success');
    }, 800);
  };

  // Image Upload Simulation (Max 4)
  const handleAddImageClick = () => {
    if (imageUrls.length >= 4) {
      showToast('Maximum 4 images allowed', 'warning');
      return;
    }
    const sampleImages = [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500&auto=format&fit=crop',
    ];
    const nextImg = sampleImages[imageUrls.length % sampleImages.length];
    setImageUrls(prev => [...prev, nextImg]);
    showToast('Image uploaded successfully', 'success');
  };

  // Save Product to Backend API
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      showToast('Product name is required', 'warning');
      return;
    }
    if (!price || numPrice <= 0) {
      showToast('Please specify a valid selling price', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const primaryCategory = selectedCategories.length > 0 ? selectedCategories[0] : 'All Products';

      const wParts: string[] = warrantiesList.map(
        w => `${w.type} (${w.duration} ${w.unit.toLowerCase()})`
      );
      const wPeriodStr = wParts.length > 0 ? wParts.join(' + ') : 'No warranty';

      const payload: any = {
        name: name.trim(),
        itemType: itemType,
        sku: sku.trim() || undefined,
        brand: brand.trim() || undefined,
        category: primaryCategory,
        description: description.trim() || undefined,
        costPrice: numCost,
        sellingPrice: numPrice,
        minimumStock: minimumStock,
        location: location.trim() || undefined,
        hasWarranty: warrantiesList.length > 0,
        warrantiesList: warrantiesList,
        warrantyPeriod: wPeriodStr,
        gstRate: gstRate,
        taxType: taxType,
        hsnCode: itemType === 'PART' ? hsnCode.trim() : undefined,
        sacCode: itemType === 'SERVICE' ? sacCode.trim() : undefined,
        priceMode: priceIncludesGst ? 'TAX_INCLUSIVE' : 'TAX_EXCLUSIVE',
      };

      if (productId) {
        await updateMutation.mutateAsync({ id: productId, data: payload });
        showToast(`Product "${name}" updated successfully!`, 'success');
      } else {
        await inventoryApi.create({
          ...payload,
          sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
          onHandStock: onHandStock,
          currentStock: onHandStock,
        });
        showToast(`Product "${name}" created successfully!`, 'success');
      }

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });

      handleBackNavigation();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle =
    'w-full h-10 px-3.5 bg-white border border-[#cbd5e1] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 rounded-xl text-xs text-[#1e293b] placeholder-[#94a3b8] outline-none transition-all';
  const selectStyle =
    'w-full h-10 pl-3.5 pr-10 bg-white border border-[#cbd5e1] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 rounded-xl text-xs text-[#1e293b] placeholder-[#94a3b8] outline-none transition-all cursor-pointer appearance-none bg-[url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23116dff%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat';
  const labelStyle = 'block text-xs font-semibold text-[#1e293b] mb-1.5';

  const isEditMode = Boolean(productId);

  return (
    <div className="min-h-screen bg-[#f4f7fb] pb-24 animate-in fade-in duration-200 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
      {/* ──── TOP BANNER HEADER (TOUCHES NAVBAR WITH 0 GAP) ── */}
      <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-30 bg-gradient-to-r from-[#dbeafe] via-[#e2e8f0] to-[#f1f5f9] border-b border-[#cbd5e1] px-6 py-4 shadow-sm transition-all backdrop-blur-md">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Header Title with Circular Arrow Back Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="w-9 h-9 rounded-full bg-white border border-[#cbd5e1] text-[#1e293b] flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-[#1e293b]" />
            </button>

            <div>
              <h1 className="text-xl font-extrabold text-[#1e293b] tracking-tight">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {isEditMode
                  ? `Update details for ${name || 'product'}`
                  : 'Configure pricing, inventory stock level and catalog categories'}
              </p>
            </div>
          </div>

          {/* Header Action Buttons (Cancel & Save) */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="px-5 py-2 rounded-full bg-white border border-[#cbd5e1] text-xs font-semibold text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveProduct}
              className="px-6 py-2 rounded-full bg-[#116dff] hover:bg-[#0d5fd9] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ──── MAIN CONTENT CONTAINER (2-COLUMN LAYOUT) ────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ──── LEFT COLUMN (2/3 width) ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card 1: Product Info */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] space-y-5">
            <h2 className="text-base font-bold text-[#1e293b]">Product Info</h2>

            <div className="space-y-4">
              {/* Product Name (Full Width) */}
              <div>
                <label className={labelStyle}>Item Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., iPhone 15 Pro Max OLED Screen Replacement"
                  className={inputStyle}
                />
              </div>

              {/* Description without rich text editing toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelStyle}>Description</label>

                </div>

                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3.5 bg-white border border-[#cbd5e1] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 rounded-xl text-xs text-[#1e293b] placeholder-[#94a3b8] outline-none resize-y transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Images (Max 4, No Video) */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1e293b]">Images</h2>
              <span className="text-xs font-semibold text-[#64748b]">{imageUrls.length}/4 images</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Upload Box */}
              {imageUrls.length < 4 && (
                <div
                  onClick={handleAddImageClick}
                  className="h-28 rounded-2xl border-2 border-dashed border-[#93c5fd] bg-[#eff6ff] hover:bg-[#dbeafe] transition-colors flex flex-col items-center justify-center cursor-pointer p-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-white text-[#116dff] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-[#116dff] tracking-wider mt-1.5">
                    ADD IMAGE
                  </span>
                </div>
              )}

              {/* Image Previews */}
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative h-28 rounded-2xl overflow-hidden border border-[#cbd5e1] group">
                  <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Pricing */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] space-y-5">
            <h2 className="text-base font-bold text-[#1e293b]">Pricing</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* Selling Price */}
              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
                  Selling Price *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-[#64748b]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    className={`${inputStyle} pl-8`}
                  />
                </div>
              </div>

              {/* Cost Price */}
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-[#1e293b]">Cost Price</label>
                  <Info className="w-3.5 h-3.5 text-[#94a3b8]" />
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-[#64748b]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costOfGoods}
                    onChange={e => setCostOfGoods(e.target.value)}
                    placeholder="0.00"
                    className={`${inputStyle} pl-8`}
                  />
                </div>
              </div>

              {/* Profit Preview */}
              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
                  Estimated Profit
                </label>
                <div className="h-10 px-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#116dff] flex items-center justify-between">
                  <span>₹ {profit.toLocaleString('en-IN')}</span>
                  <span className="text-[#64748b] font-semibold">({margin}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Product & Inventory Fields (Minimal Version) */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] space-y-5">
            <h2 className="text-base font-bold text-[#1e293b]">Product &amp; Inventory Fields</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SKU Code */}
              <div>
                <label className={labelStyle}>SKU Code</label>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="e.g., SKU-104928"
                  className={inputStyle}
                />
              </div>

              {/* Brand / Manufacturer */}
              <div>
                <label className={labelStyle}>Brand / Manufacturer</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g., Apple, Samsung, Dell"
                  className={inputStyle}
                />
              </div>

              {/* On-Hand Physical Stock */}
              <div>
                <label className={labelStyle}>On-Hand Physical Stock</label>
                <input
                  type="number"
                  min="0"
                  value={onHandStock}
                  onChange={e => setOnHandStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>Minimum Stock (Low Alert)</label>
                <input
                  type="number"
                  min="0"
                  value={minimumStock}
                  onChange={e => setMinimumStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className={inputStyle}
                />
              </div>

              {/* Bin / Storage Location */}
              <div>
                <label className={labelStyle}>Storage Location / Bin</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g., Shelf A-4, Rack 2"
                  className={inputStyle}
                />
              </div>

              {/* Supplier / Vendor Name */}
              <div>
                <label className={labelStyle}>Supplier / Vendor Name</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="e.g., Global Wholesale Pvt Ltd"
                  className={inputStyle}
                />
              </div>

              {/* Default GST Rate */}
              <div>
                <label className={labelStyle}>GST Rate</label>
                <select
                  value={gstRate}
                  onChange={e => setGstRate(e.target.value)}
                  className={selectStyle}
                >
                  <option value="0%">0% GST</option>
                  <option value="5%">5% GST</option>
                  <option value="12%">12% GST</option>
                  <option value="18%">18% GST (Standard)</option>
                  <option value="28%">28% GST</option>
                </select>
                <label className="flex items-center gap-2 mt-2.5 cursor-pointer text-xs font-semibold text-[#1e293b] select-none">
                  <input
                    type="checkbox"
                    checked={priceIncludesGst}
                    onChange={e => setPriceIncludesGst(e.target.checked)}
                    className="w-4 h-4 rounded text-[#116dff] cursor-pointer"
                  />
                  <span>Price includes GST</span>
                </label>
              </div>

              {/* HSN / SAC Code (Optional) */}
              <div>
                <label className={labelStyle}>HSN / SAC (Optional)</label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={e => setHsnCode(e.target.value)}
                  placeholder="Search or enter code..."
                  className={inputStyle}
                />
              </div>

              {/* Status */}
              <div>
                <label className={labelStyle}>Status</label>
                <select
                  value={isActive ? 'Active' : 'Inactive'}
                  onChange={e => setIsActive(e.target.value === 'Active')}
                  className={`${selectStyle} font-semibold`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Product Warranty Options Section */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h2 className="text-[#1e293b] font-bold text-base">Warranty Details</h2>
              {warrantiesList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsWarrantyModalOpen(true)}
                  className="px-3 py-1.5 bg-[#116dff] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Warranty
                </button>
              )}
            </div>

            {/* Empty State Box (Primary Blue Theme with 'product' wording) */}
            {warrantiesList.length === 0 ? (
              <div className="p-8 bg-[#eff6ff] border-2 border-dashed border-[#bfdbfe] rounded-2xl flex flex-col items-center justify-center space-y-3 text-center">
                <p className="text-xs font-medium text-[#1e40af]">
                  No warranties have been added for this product.
                </p>
                <button
                  type="button"
                  onClick={() => setIsWarrantyModalOpen(true)}
                  className="px-5 py-2 bg-white border border-[#116dff] text-[#116dff] hover:bg-blue-50 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Warranty
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {warrantiesList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 border border-[#e2e8f0] rounded-xl flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1e293b]">
                          {idx + 1}. {item.type}
                        </span>
                        <span className="text-[10px] font-semibold bg-blue-100 text-[#116dff] px-2 py-0.5 rounded">
                          {item.duration} {item.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Provider: <strong>{item.provider}</strong>
                        {item.expiryDate && ` | Expiry: ${item.expiryDate}`}
                      </p>
                      {item.notes && <p className="text-[11px] text-slate-600 italic">{item.notes}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => setWarrantiesList(prev => prev.filter(w => w.id !== item.id))}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Warranty Modal Popup */}
          <WarrantyModal
            isOpen={isWarrantyModalOpen}
            onClose={() => setIsWarrantyModalOpen(false)}
            onSave={(newWarranty) => {
              setWarrantiesList(prev => [...prev, newWarranty]);
            }}
          />

        </div>

        {/* ──── RIGHT SIDEBAR COLUMN (1/3 width) ───────────────────────────── */}
        <div className="space-y-6">

          {/* Sidebar Card 1: Categories */}
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] space-y-3">
            <h2 className="text-base font-bold text-[#1e293b] border-b border-[#e2e8f0] pb-3">
              Categories
            </h2>

            {/* Category Quick Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={categorySearchQuery}
                onChange={e => setCategorySearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-[#cbd5e1] rounded-xl text-xs text-[#1e293b] placeholder:text-slate-400 focus:border-[#116dff] outline-none"
              />
              {categorySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCategorySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 pt-1">
              {(!categorySearchQuery || 'all products'.includes(categorySearchQuery.toLowerCase())) && (
                <label className="flex items-center gap-3 cursor-pointer text-xs text-[#1e293b]">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes('All Products')}
                    onChange={() => toggleCategory('All Products')}
                    className="w-4 h-4 rounded text-[#116dff] cursor-pointer"
                  />
                  <span className="font-semibold">All Products</span>
                </label>
              )}

              {categoriesList
                .filter(c => c.toLowerCase() !== 'all products')
                .filter(c => c.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                .map((cat, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer text-xs text-[#1e293b]">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="w-4 h-4 rounded text-[#116dff] cursor-pointer"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
            </div>

            <button
              type="button"
              onClick={() => setShowCategoryDrawer(true)}
              className="flex items-center gap-1 text-xs font-semibold text-[#116dff] hover:text-[#0d5fd9] transition-colors cursor-pointer pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Category
            </button>
          </div>
        </div>
      </div>

      {/* ──── BOTTOM FOOTER ACTION BUTTONS ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#cbd5e1]">
          <button
            type="button"
            onClick={handleBackNavigation}
            className="px-6 py-2.5 rounded-full bg-white border border-[#cbd5e1] text-xs font-semibold text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveProduct}
            className="px-8 py-2.5 rounded-full bg-[#116dff] hover:bg-[#0d5fd9] text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>



      {/* ──── QUICK CREATE CATEGORY MODAL ──────────────────────────────────── */}
      {showCategoryDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in" onClick={() => setShowCategoryDrawer(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 z-10">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="text-sm font-bold text-[#1e293b]">Create New Category</h3>
              <button type="button" onClick={() => setShowCategoryDrawer(false)}>
                <X className="w-4 h-4 text-[#64748b]" />
              </button>
            </div>
            <div>
              <label className={labelStyle}>Category Name *</label>
              <input
                autoFocus
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Phone Accessories"
                className={inputStyle}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryDrawer(false)}
                className="px-4 py-1.5 rounded-full border border-[#cbd5e1] text-xs font-semibold text-[#475569]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newCatName.trim()}
                onClick={() => {
                  if (newCatName.trim()) {
                    setSelectedCategories(prev => [...prev, newCatName.trim()]);
                    setNewCatName('');
                    setShowCategoryDrawer(false);
                    showToast(`Category "${newCatName.trim()}" created & selected!`, 'success');
                  }
                }}
                className="px-4 py-1.5 rounded-full bg-[#116dff] text-white text-xs font-semibold disabled:opacity-40"
              >
                Create &amp; Select
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
