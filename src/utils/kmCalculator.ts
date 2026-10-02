import { SparepartStatus } from '../types';

/**
 * Calculate remaining KM before sparepart replacement is due.
 * Formula: (KM at Setup + Target Interval) - Latest KM
 */
export function calculateRemainingKm(
  kmAtSetup: number,
  customInterval: number,
  currentKm: number,
  dateAtSetup?: string,
  customTimeInterval?: number
): { remainingKm: number; remainingMonths: number | null } {
  const remainingKm = (kmAtSetup + customInterval) - currentKm;
  let remainingMonths: number | null = null;
  
  if (dateAtSetup && customTimeInterval) {
    const setupDate = new Date(dateAtSetup);
    const targetDate = new Date(setupDate);
    targetDate.setMonth(setupDate.getMonth() + customTimeInterval);
    const now = new Date();
    // Rough remaining months calculation
    remainingMonths = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  }
  
  return { remainingKm, remainingMonths };
}

/**
 * Determine sparepart status based on remaining KM.
 * - Normal: remaining > 100
 * - Warning: 1 <= remaining <= 100
 * - Overdue: remaining <= 0
 */
export function getStatus(remainingKm: number, remainingMonths: number | null = null): SparepartStatus {
  if (remainingKm <= 0 || (remainingMonths !== null && remainingMonths <= 0)) {
    return 'Overdue';
  }
  
  // Warning if remaining KM is <= 100 OR remaining time is <= 1 month
  if (remainingKm <= 100 || (remainingMonths !== null && remainingMonths <= 1)) {
    return 'Warning';
  }
  
  return 'Normal';
}

/**
 * Validate KM input.
 * Returns error message string or null if valid.
 */
export function validateKmInput(
  newKm: number | null,
  lastKm: number
): string | null {
  if (newKm === null || isNaN(newKm)) {
    return 'Please enter your vehicle odometer reading.';
  }
  if (newKm < 0) {
    return 'Odometer must be a positive number.';
  }
  if (newKm < lastKm) {
    return `Odometer cannot be less than previous reading (${lastKm.toLocaleString()} KM).`;
  }
  if (newKm > 999999) {
    return 'Invalid odometer value. Please verify.';
  }
  return null;
}
