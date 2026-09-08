import { SupplyType, TaxContextSnapshot } from './taxTypes';

/**
 * Resolves the SupplyType (INTRA_STATE vs INTER_STATE) based on seller location,
 * place of supply jurisdiction, and transaction context.
 */
export function resolveSupplyType(
  sellerState: string = 'Kerala',
  placeOfSupplyState?: string,
  transactionType: 'DOMESTIC' | 'SEZ' | 'EXPORT' | 'IMPORT' = 'DOMESTIC'
): { supplyType: SupplyType; placeOfSupplyState: string } {
  const resolvedPlaceOfSupply = (placeOfSupplyState || sellerState).trim();
  const normalizedSeller = sellerState.trim().toLowerCase();
  const normalizedPos = resolvedPlaceOfSupply.toLowerCase();

  // Special transaction types (SEZ, EXPORT, IMPORT) act as Interstate by default under GST law
  if (transactionType === 'SEZ' || transactionType === 'EXPORT' || transactionType === 'IMPORT') {
    return {
      supplyType: 'INTER_STATE',
      placeOfSupplyState: resolvedPlaceOfSupply,
    };
  }

  // Standard domestic comparison
  const isSameState = normalizedSeller === normalizedPos;

  return {
    supplyType: isSameState ? 'INTRA_STATE' : 'INTER_STATE',
    placeOfSupplyState: resolvedPlaceOfSupply,
  };
}

export function buildTaxContextSnapshot(payload: {
  sellerState?: string;
  sellerGSTIN?: string;
  sellerRegistrationId?: string;
  buyerState?: string;
  buyerGSTIN?: string;
  placeOfSupplyState?: string;
  transactionType?: 'DOMESTIC' | 'SEZ' | 'EXPORT' | 'IMPORT';
}): TaxContextSnapshot {
  const sellerState = payload.sellerState || 'Kerala';
  const { supplyType, placeOfSupplyState } = resolveSupplyType(
    sellerState,
    payload.placeOfSupplyState || payload.buyerState,
    payload.transactionType
  );

  return {
    sellerRegistrationId: payload.sellerRegistrationId,
    sellerGSTIN: payload.sellerGSTIN,
    sellerState: sellerState,
    buyerGSTIN: payload.buyerGSTIN,
    buyerState: payload.buyerState || placeOfSupplyState,
    placeOfSupplyState: placeOfSupplyState,
    supplyType: supplyType,
  };
}
