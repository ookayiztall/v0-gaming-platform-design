export type AgeGroup = 'under_13' | '14_17' | '18_plus' | 'unknown';

export interface AgeRestrictions {
  canPlayCasinoGames: boolean;
  canSendDirectMessages: boolean;
  canCreatePrivateSpace: boolean;
  canBecomeSpaceAdmin: boolean;
  requiresGuardian: boolean;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string | null): number | null {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age < 0 ? null : age;
}

/**
 * Get age group from age
 */
export function getAgeGroup(age: number | null): AgeGroup {
  if (age === null || age < 0) return 'unknown';
  if (age <= 13) return 'under_13';
  if (age <= 17) return '14_17';
  return '18_plus';
}

/**
 * Get age group from date of birth
 */
export function getAgeGroupFromDOB(dateOfBirth: Date | string | null): AgeGroup {
  const age = calculateAge(dateOfBirth);
  return getAgeGroup(age);
}

/**
 * Get restrictions based on age group
 */
export function getAgeRestrictions(ageGroup: AgeGroup): AgeRestrictions {
  switch (ageGroup) {
    case 'under_13':
      return {
        canPlayCasinoGames: false,
        canSendDirectMessages: false,
        canCreatePrivateSpace: false, // Must have 18+ guardian create it
        canBecomeSpaceAdmin: false, // Only if created by guardian
        requiresGuardian: true,
      };
    case '14_17':
      return {
        canPlayCasinoGames: false,
        canSendDirectMessages: true,
        canCreatePrivateSpace: true,
        canBecomeSpaceAdmin: true,
        requiresGuardian: false,
      };
    case '18_plus':
      return {
        canPlayCasinoGames: true,
        canSendDirectMessages: true,
        canCreatePrivateSpace: true,
        canBecomeSpaceAdmin: true,
        requiresGuardian: false,
      };
    default:
      return {
        canPlayCasinoGames: false,
        canSendDirectMessages: false,
        canCreatePrivateSpace: false,
        canBecomeSpaceAdmin: false,
        requiresGuardian: true,
      };
  }
}

/**
 * Format date of birth for input[type=date]
 */
export function formatDOBForInput(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Validate date of birth
 */
export function isValidDOB(dateOfBirth: Date | string | null): boolean {
  if (!dateOfBirth) return false;

  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return false;

  // Must be at least 3 years old
  const age = calculateAge(dob);
  if (age === null || age < 3) return false;

  // Cannot be more than 120 years old
  if (age > 120) return false;

  // Cannot be in the future
  if (dob > new Date()) return false;

  return true;
}

/**
 * Get readable age range for age group
 */
export function getAgeGroupLabel(ageGroup: AgeGroup): string {
  switch (ageGroup) {
    case 'under_13':
      return 'Under 13';
    case '14_17':
      return '14-17';
    case '18_plus':
      return '18+';
    default:
      return 'Unknown';
  }
}
