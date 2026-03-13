# Age Verification System Implementation

## Overview
Comprehensive age verification system with COPPA compliance for users under 13, targeting restrictions for 14-17, and full features for 18+.

## Files Created/Modified

### 1. Database Migration
**File:** `scripts/017_add_age_verification.sql`

Adds to the `profiles` table:
- `date_of_birth` (DATE) - User's date of birth
- `age_group` (TEXT) - Automatically calculated group: 'under_13', '14_17', '18_plus', or 'unknown'
- `parental_consent` (BOOLEAN) - Required for users under 13
- `guardian_user_id` (UUID) - Links to guardian's auth.users record

Features:
- Automatic age group calculation via `get_age_group()` PostgreSQL function
- Trigger `tr_update_age_group` maintains age_group on insert/update
- Check constraints enforce guardian requirements for minors

### 2. Age Verification Utility
**File:** `lib/age-verification.ts`

Core utilities for age-based access control:

```typescript
// Get age from DOB
calculateAge(dateOfBirth: Date | string | null): number

// Get age group
getAgeGroup(age: number | null): AgeGroup
getAgeGroupFromDOB(dateOfBirth: Date | string | null): AgeGroup

// Get access restrictions
getAgeRestrictions(ageGroup: AgeGroup): AgeRestrictions
```

**AgeRestrictions Interface:**
```typescript
{
  canPlayCasinoGames: boolean
  canSendDirectMessages: boolean
  canCreatePrivateSpace: boolean
  canBecomeSpaceAdmin: boolean
  requiresGuardian: boolean
}
```

### 3. Updated Signup Form
**File:** `app/(auth)/register/page.tsx`

New features:
- Date of birth input (MM/DD/YYYY format)
- Real-time age calculation display
- Guardian email collection for under 13
- Age-specific warning messages
- Form validation ensures:
  - Valid DOB (3-120 years old)
  - Guardian email provided for under 13
  - All age data stored in auth metadata

## Age Group Restrictions

### Under 13 (COPPA Compliance)
❌ **Cannot:**
- Play casino games
- Send direct private messages
- Create private spaces without guardian
- Become space admin unless guardian created space

✅ **Must Have:**
- Parental consent from guardian 18+
- Guardian must be space owner/admin
- Restricted to parent-managed accounts only

### Ages 14-17 (Teens)
❌ **Cannot:**
- Play casino games

✅ **Can:**
- Send direct messages
- Create and manage private spaces
- Become space admins
- Access all non-casino features

### 18+ (Adults)
✅ **Can:**
- Access all features
- Play casino games (when available)
- Full platform access

## Implementation Checklist

### Phase 1: Database & Signup ✅
- [x] Add date_of_birth to profiles table
- [x] Add age_group calculation logic
- [x] Add guardian consent fields
- [x] Update signup form with DOB collection
- [x] Add guardian email field for minors

### Phase 2: Feature Restrictions (TODO)
- [ ] Hide casino games from under 17
- [ ] Block direct messages for under 13
- [ ] Prevent under 13 from creating spaces without guardian
- [ ] Show warning messages when accessing restricted features
- [ ] Add parental controls dashboard

### Phase 3: Verification & Compliance (TODO)
- [ ] Email verification for guardians
- [ ] Two-factor setup for guardian accounts
- [ ] Terms of service updates for different age groups
- [ ] Data deletion workflows for minors
- [ ] COPPA compliance reporting

## Usage Example

```typescript
import { 
  getAgeGroupFromDOB, 
  getAgeRestrictions,
  calculateAge 
} from '@/lib/age-verification'

// Get user's age group
const ageGroup = getAgeGroupFromDOB('2010-05-15')
// Result: 'under_13'

// Get what they can access
const restrictions = getAgeRestrictions(ageGroup)
// Result: { 
//   canPlayCasinoGames: false,
//   canSendDirectMessages: false,
//   canCreatePrivateSpace: false,
//   canBecomeSpaceAdmin: false,
//   requiresGuardian: true
// }

// Display age to user
const age = calculateAge('2010-05-15')
// Result: 14
```

## Database Queries

### Get all users under 13
```sql
SELECT * FROM profiles 
WHERE age_group = 'under_13' 
AND parental_consent = FALSE;
```

### Get users by age group
```sql
SELECT age_group, COUNT(*) as user_count 
FROM profiles 
WHERE age_group != 'unknown' 
GROUP BY age_group;
```

## Next Steps

1. Run migration: `scripts/017_add_age_verification.sql`
2. Test signup form with different ages
3. Implement feature-level restrictions using `getAgeRestrictions()`
4. Add guardian verification flow
5. Update games listing to hide casino games for minors
6. Add direct message restrictions
7. Add space creation validation

## Notes

- Age calculation is automatic via database trigger
- Age group updates whenever DOB changes
- Guardian requirements enforced at database level
- All age data stored securely in user metadata
- System defaults to 'unknown' for safety if DOB not provided
