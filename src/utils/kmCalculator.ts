import { SparepartStatus } from '../types';

/**
 * Calculate remaining KM before sparepart replacement is due.
 * Pure odometer-driven telemetry formula: (KM at Setup + Target Interval) - Latest KM
 */
export function calculateRemainingKm(
  kmAtSetup: number,
  customInterval: number,
  currentKm: number
): number {
  return (kmAtSetup + customInterval) - currentKm;
}

/**
 * Determine sparepart status based strictly on remaining KM.
 * - Normal: remaining > 100
 * - Warning: 1 <= remaining <= 100
 * - Overdue: remaining <= 0
 */
export function getStatus(remainingKm: number): SparepartStatus {
  if (remainingKm <= 0) {
    return 'Overdue';
  }

  if (remainingKm <= 100) {
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
