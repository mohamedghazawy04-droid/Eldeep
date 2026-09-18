import { Product } from '../types';

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Extracts or computes the creation timestamp of a product
 */
export function getProductCreationTime(product: Product): number | null {
  if (!product) return null;

  // 1. Direct createdAt as number
  if (typeof product.createdAt === 'number' && !isNaN(product.createdAt) && product.createdAt > 0) {
    return product.createdAt;
  }

  // 2. Direct createdAt as string (ISO date or numeric string)
  if (typeof product.createdAt === 'string' && product.createdAt.trim()) {
    const parsed = Date.parse(product.createdAt);
    if (!isNaN(parsed)) return parsed;

    const num = Number(product.createdAt);
    if (!isNaN(num) && num > 0) return num;
  }

  // 3. Fallback: Extract from standard ID format 'prod-<timestamp>'
  if (product.id && typeof product.id === 'string' && product.id.startsWith('prod-')) {
    const rawTime = product.id.replace('prod-', '');
    const num = Number(rawTime);
    // Reasonable epoch timestamp (after 2020)
    if (!isNaN(num) && num > 1600000000000) {
      return num;
    }
  }

  return null;
}

/**
 * Checks whether a product qualifies as "جديد" (New).
 * Requirement: The "صنف جديد" badge MUST disappear after 24 hours of the product being on the page/catalog.
 */
export function isProductNew(product: Product): boolean {
  if (!product || !product.isNew) return false;

  const creationTime = getProductCreationTime(product);

  if (creationTime) {
    const elapsed = Date.now() - creationTime;
    // Returns true only if within 24 hours from creation
    return elapsed >= 0 && elapsed < TWENTY_FOUR_HOURS_MS;
  }

  // If no timestamp can be found or determined, we default to false to avoid perpetual 'new' badge
  return false;
}
