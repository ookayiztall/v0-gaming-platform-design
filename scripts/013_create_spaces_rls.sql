-- Enable RLS on spaces table
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- Allow users to read spaces they own or are members of
CREATE POLICY spaces_select_policy ON spaces
  FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = spaces.id
      AND space_memberships.user_id = auth.uid()
    )
  );

-- Allow users to create spaces
CREATE POLICY spaces_create_policy ON spaces
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Allow owners to update their spaces
CREATE POLICY spaces_update_policy ON spaces
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Allow owners to delete their spaces
CREATE POLICY spaces_delete_policy ON spaces
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Enable RLS on space_memberships
ALTER TABLE space_memberships ENABLE ROW LEVEL SECURITY;

-- Allow members to read memberships of their space
CREATE POLICY memberships_select_policy ON space_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_memberships sm
      WHERE sm.space_id = space_memberships.space_id
      AND sm.user_id = auth.uid()
    )
  );

-- Allow space owner/admin to manage memberships
CREATE POLICY memberships_insert_policy ON space_memberships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_memberships.space_id
      AND spaces.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM space_memberships sm
      WHERE sm.space_id = space_memberships.space_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
  );

CREATE POLICY memberships_delete_policy ON space_memberships
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_memberships.space_id
      AND spaces.owner_id = auth.uid()
    ) OR
    (
      auth.uid() = space_memberships.user_id AND
      space_memberships.role != 'owner'
    )
  );

-- Enable RLS on space_invites
ALTER TABLE space_invites ENABLE ROW LEVEL SECURITY;

-- Allow space members to read invites for their space
CREATE POLICY invites_select_policy ON space_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = space_invites.space_id
      AND space_memberships.user_id = auth.uid()
      AND space_memberships.role IN ('owner', 'admin')
    )
  );

-- Allow anyone to check invite token validity
CREATE POLICY invites_check_token ON space_invites
  FOR SELECT
  USING (status = 'pending');

-- Allow owner/admin to create invites
CREATE POLICY invites_create_policy ON space_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_invites.space_id
      AND spaces.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = space_invites.space_id
      AND space_memberships.user_id = auth.uid()
      AND space_memberships.role = 'admin'
    )
  );

-- Allow owner/admin to revoke invites
CREATE POLICY invites_update_policy ON space_invites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_invites.space_id
      AND spaces.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = space_invites.space_id
      AND space_memberships.user_id = auth.uid()
      AND space_memberships.role = 'admin'
    )
  );

-- Enable RLS on space_subscriptions
ALTER TABLE space_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow space owner to read subscription
CREATE POLICY subscriptions_select_policy ON space_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_subscriptions.space_id
      AND spaces.owner_id = auth.uid()
    )
  );

-- Allow space owner to update subscription
CREATE POLICY subscriptions_update_policy ON space_subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_subscriptions.space_id
      AND spaces.owner_id = auth.uid()
    )
  );
