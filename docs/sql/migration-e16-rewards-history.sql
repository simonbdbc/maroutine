-- ─────────────────────────────────────────────────────────────────────────────
-- E16 — Récompenses + historique tirelire
-- Non destructif: ajoute les tables récompenses/historique et historise les
-- futures modifications de `profiles.balance`.
-- À exécuter après `migration-e15-u03-fix-legacy-routines-and-catalog-order.sql`.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rewards_name_per_user UNIQUE (user_id, name),
  CONSTRAINT rewards_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE IF NOT EXISTS public.profile_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  cost_stars INTEGER NOT NULL,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_rewards_positive_duration CHECK (duration_minutes > 0),
  CONSTRAINT profile_rewards_positive_cost CHECK (cost_stars > 0),
  CONSTRAINT profile_rewards_profile_reward_unique UNIQUE (profile_id, reward_id)
);

CREATE TABLE IF NOT EXISTS public.balance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta_stars INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('daily_validation', 'manual_adjustment', 'reward_redemption')),
  description TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT balance_history_non_zero_delta CHECK (delta_stars <> 0),
  CONSTRAINT balance_history_non_negative_before CHECK (balance_before >= 0),
  CONSTRAINT balance_history_non_negative_after CHECK (balance_after >= 0)
);

CREATE INDEX IF NOT EXISTS ix_rewards_user_id ON public.rewards(user_id);
CREATE INDEX IF NOT EXISTS ix_profile_rewards_profile_id ON public.profile_rewards(profile_id);
CREATE INDEX IF NOT EXISTS ix_profile_rewards_reward_id ON public.profile_rewards(reward_id);
CREATE INDEX IF NOT EXISTS ix_balance_history_user_occurred ON public.balance_history(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_balance_history_profile_occurred ON public.balance_history(profile_id, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_balance_history_profile_idempotency
  ON public.balance_history(profile_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

DROP TRIGGER IF EXISTS trg_rewards_updated_at ON public.rewards;
CREATE TRIGGER trg_rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_profile_rewards_updated_at ON public.profile_rewards;
CREATE TRIGGER trg_profile_rewards_updated_at
  BEFORE UPDATE ON public.profile_rewards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rewards_select_own" ON public.rewards;
DROP POLICY IF EXISTS "rewards_insert_own" ON public.rewards;
DROP POLICY IF EXISTS "rewards_update_own" ON public.rewards;
DROP POLICY IF EXISTS "rewards_delete_own" ON public.rewards;
CREATE POLICY "rewards_select_own" ON public.rewards FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "rewards_insert_own" ON public.rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rewards_update_own" ON public.rewards FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rewards_delete_own" ON public.rewards FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profile_rewards_select_own" ON public.profile_rewards;
DROP POLICY IF EXISTS "profile_rewards_insert_own" ON public.profile_rewards;
DROP POLICY IF EXISTS "profile_rewards_update_own" ON public.profile_rewards;
DROP POLICY IF EXISTS "profile_rewards_delete_own" ON public.profile_rewards;
CREATE POLICY "profile_rewards_select_own" ON public.profile_rewards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_rewards.profile_id
      AND p.user_id = auth.uid()
  ));
CREATE POLICY "profile_rewards_insert_own" ON public.profile_rewards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.rewards r ON r.id = profile_rewards.reward_id
    WHERE p.id = profile_rewards.profile_id
      AND p.user_id = auth.uid()
      AND r.user_id = auth.uid()
  ));
CREATE POLICY "profile_rewards_update_own" ON public.profile_rewards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_rewards.profile_id
      AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.rewards r ON r.id = profile_rewards.reward_id
    WHERE p.id = profile_rewards.profile_id
      AND p.user_id = auth.uid()
      AND r.user_id = auth.uid()
  ));
CREATE POLICY "profile_rewards_delete_own" ON public.profile_rewards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_rewards.profile_id
      AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "balance_history_select_own" ON public.balance_history;
CREATE POLICY "balance_history_select_own" ON public.balance_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_profile_balance(
  p_profile_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  previous_balance INTEGER,
  new_balance INTEGER,
  delta_stars INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_previous_balance INTEGER;
  v_description TEXT := COALESCE(NULLIF(btrim(p_description), ''), 'Modification manuelle de la tirelire');
BEGIN
  IF p_amount IS NULL OR p_amount < 0 THEN
    RAISE EXCEPTION 'Le montant de la tirelire doit être un entier positif ou nul.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT p.user_id, p.balance
  INTO v_user_id, v_previous_balance
  FROM public.profiles p
  WHERE p.id = p_profile_id
    AND p.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable'
      USING ERRCODE = 'P0001';
  END IF;

  previous_balance := v_previous_balance;
  new_balance := p_amount;
  delta_stars := p_amount - v_previous_balance;

  IF delta_stars <> 0 THEN
    UPDATE public.profiles
    SET balance = p_amount
    WHERE id = p_profile_id;

    INSERT INTO public.balance_history (
      user_id,
      profile_id,
      delta_stars,
      balance_before,
      balance_after,
      source,
      description,
      metadata
    )
    VALUES (
      v_user_id,
      p_profile_id,
      delta_stars,
      previous_balance,
      new_balance,
      'manual_adjustment',
      v_description,
      jsonb_build_object('action', 'set_profile_balance')
    );
  END IF;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_profile_balance(UUID, INTEGER, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_profile_reward(
  p_profile_reward_id UUID
)
RETURNS TABLE (
  profile_id UUID,
  spent_stars INTEGER,
  new_balance INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_reward_id UUID;
  v_reward_name TEXT;
  v_duration_minutes INTEGER;
  v_cost_stars INTEGER;
  v_current_balance INTEGER;
BEGIN
  SELECT
    p.user_id,
    p.id,
    r.id,
    r.name,
    pr.duration_minutes,
    pr.cost_stars,
    p.balance
  INTO
    v_user_id,
    v_profile_id,
    v_reward_id,
    v_reward_name,
    v_duration_minutes,
    v_cost_stars,
    v_current_balance
  FROM public.profile_rewards pr
  JOIN public.profiles p ON p.id = pr.profile_id
  JOIN public.rewards r ON r.id = pr.reward_id
  WHERE pr.id = p_profile_reward_id
    AND p.user_id = auth.uid()
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Récompense introuvable pour ce profil'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_cost_stars > v_current_balance THEN
    RAISE EXCEPTION 'Tirelire insuffisante'
      USING ERRCODE = 'P0001';
  END IF;

  profile_id := v_profile_id;
  spent_stars := v_cost_stars;
  new_balance := v_current_balance - v_cost_stars;

  UPDATE public.profiles
  SET balance = new_balance
  WHERE id = v_profile_id;

  INSERT INTO public.balance_history (
    user_id,
    profile_id,
    delta_stars,
    balance_before,
    balance_after,
    source,
    description,
    metadata
  )
  VALUES (
    v_user_id,
    v_profile_id,
    -v_cost_stars,
    v_current_balance,
    new_balance,
    'reward_redemption',
    'Échange récompense: ' || v_reward_name,
    jsonb_build_object(
      'reward_id', v_reward_id,
      'profile_reward_id', p_profile_reward_id,
      'duration_minutes', v_duration_minutes
    )
  );

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_profile_reward(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_day(
  p_profile_id UUID,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  earned_stars INTEGER,
  new_balance INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check_date DATE := COALESCE(p_check_date, CURRENT_DATE);
  v_now TIMESTAMPTZ := NOW();

  v_existing_earned_stars INTEGER := 0;
  v_existing_new_balance INTEGER := 0;

  v_user_id UUID;
  v_current_balance INTEGER := 0;
  v_earned_stars INTEGER := 0;
  v_new_balance INTEGER := 0;
BEGIN
  -- Autoriser et verrouiller le profil avant toute lecture idempotente.
  SELECT p.user_id, p.balance
  INTO v_user_id, v_current_balance
  FROM public.profiles p
  WHERE p.id = p_profile_id
    AND p.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT dv.earned_stars, dv.new_balance
  INTO v_existing_earned_stars, v_existing_new_balance
  FROM public.daily_validations dv
  WHERE dv.profile_id = p_profile_id
    AND dv.check_date = v_check_date;

  IF FOUND THEN
    RETURN QUERY
    SELECT v_existing_earned_stars, v_existing_new_balance;
    RETURN;
  END IF;

  SELECT COALESCE(SUM(dc.stars_earned), 0)
  INTO v_earned_stars
  FROM public.daily_checks dc
  WHERE dc.profile_id = p_profile_id
    AND dc.check_date = v_check_date
    AND dc.checked = TRUE
    AND (
      dc.target_type = 'task'
      OR (
        dc.target_type = 'activity'
        AND NOT EXISTS (
          SELECT 1
          FROM public.profile_moment_activity_tasks pmat
          WHERE pmat.profile_moment_activity_id = dc.profile_moment_activity_id
        )
      )
    );

  v_new_balance := v_current_balance + v_earned_stars;

  UPDATE public.profiles
  SET balance = v_new_balance
  WHERE id = p_profile_id;

  DELETE FROM public.daily_checks
  WHERE profile_id = p_profile_id
    AND check_date = v_check_date;

  INSERT INTO public.daily_validations (
    profile_id,
    check_date,
    earned_stars,
    new_balance,
    validated_at
  )
  VALUES (
    p_profile_id,
    v_check_date,
    v_earned_stars,
    v_new_balance,
    v_now
  )
  ON CONFLICT (profile_id, check_date) DO NOTHING;

  IF v_earned_stars <> 0 THEN
    INSERT INTO public.balance_history (
      user_id,
      profile_id,
      delta_stars,
      balance_before,
      balance_after,
      source,
      description,
      occurred_at,
      metadata,
      idempotency_key
    )
    VALUES (
      v_user_id,
      p_profile_id,
      v_earned_stars,
      v_current_balance,
      v_new_balance,
      'daily_validation',
      'Validation de la journée',
      v_now,
      jsonb_build_object('check_date', v_check_date),
      'validate_day:' || v_check_date::TEXT
    )
    ON CONFLICT (profile_id, idempotency_key)
      WHERE idempotency_key IS NOT NULL
      DO NOTHING;
  END IF;

  SELECT dv.earned_stars, dv.new_balance
  INTO v_existing_earned_stars, v_existing_new_balance
  FROM public.daily_validations dv
  WHERE dv.profile_id = p_profile_id
    AND dv.check_date = v_check_date;

  RETURN QUERY
  SELECT v_existing_earned_stars, v_existing_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_day(UUID, DATE) TO authenticated;

INSERT INTO public.balance_history (
  user_id,
  profile_id,
  delta_stars,
  balance_before,
  balance_after,
  source,
  description,
  occurred_at,
  metadata,
  idempotency_key
)
SELECT
  p.user_id,
  dv.profile_id,
  dv.earned_stars,
  dv.new_balance - dv.earned_stars,
  dv.new_balance,
  'daily_validation',
  'Validation de la journée',
  dv.validated_at,
  jsonb_build_object('check_date', dv.check_date, 'backfill', TRUE),
  'validate_day:' || dv.check_date::TEXT
FROM public.daily_validations dv
JOIN public.profiles p ON p.id = dv.profile_id
WHERE dv.earned_stars <> 0
ON CONFLICT (profile_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL
  DO NOTHING;
