-- Add date_of_birth and is_minor fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_group TEXT DEFAULT 'unknown' CHECK (age_group IN ('under_13', '14_17', '18_plus', 'unknown'));

-- Create indexes for age-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_age_group ON profiles(age_group);
CREATE INDEX IF NOT EXISTS idx_profiles_date_of_birth ON profiles(date_of_birth);

-- Add function to calculate age group from date of birth
CREATE OR REPLACE FUNCTION get_age_group(dob DATE)
RETURNS TEXT AS $$
DECLARE
  age INTEGER;
BEGIN
  IF dob IS NULL THEN
    RETURN 'unknown';
  END IF;
  
  age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob));
  
  IF age < 0 THEN
    RETURN 'unknown';
  ELSIF age <= 13 THEN
    RETURN 'under_13';
  ELSIF age <= 17 THEN
    RETURN '14_17';
  ELSE
    RETURN '18_plus';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add trigger to automatically update age_group when date_of_birth changes
CREATE OR REPLACE FUNCTION update_age_group()
RETURNS TRIGGER AS $$
BEGIN
  NEW.age_group := get_age_group(NEW.date_of_birth);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_age_group ON profiles;
CREATE TRIGGER tr_update_age_group
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
WHEN (NEW.date_of_birth IS NOT NULL)
EXECUTE FUNCTION update_age_group();

-- Add parental_consent field for users under 13
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parental_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guardian_user_id UUID REFERENCES auth.users(id);

-- Add index for guardian lookups
CREATE INDEX IF NOT EXISTS idx_profiles_guardian_user_id ON profiles(guardian_user_id);

-- Add check that users under 13 must have parental consent and a guardian
ALTER TABLE profiles ADD CONSTRAINT check_minor_consent 
  CHECK (
    CASE 
      WHEN age_group = 'under_13' THEN parental_consent = TRUE AND guardian_user_id IS NOT NULL
      ELSE TRUE
    END
  );
