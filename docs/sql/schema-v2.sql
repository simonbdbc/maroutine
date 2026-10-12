-- ─────────────────────────────────────────────────────────────────────────────
-- MAROUTINE — Schéma PostgreSQL v2
-- Un seul bloc SQL à copier-coller dans Supabase SQL Editor.
-- Inclut : schéma, seed, RLS, index, triggers.
-- Pour une base existante avec données, utiliser les migrations non destructives:
-- - `docs/sql/migration-e9-r02-points-to-stars.sql`
-- - `docs/sql/migration-e9-r13-pma-sticker-required.sql`
-- - `docs/sql/migration-e15-u02-account-owned-catalog.sql`
-- - `docs/sql/migration-e15-u03-fix-legacy-routines-and-catalog-order.sql`
-- - `docs/sql/migration-e16-rewards-history.sql`
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════════
-- 0. RESET COMPLET (DESTRUCTIF)
-- ═══════════════════════════════════════════════════════════════════════════════
-- ⚠️ Ce bloc supprime toutes les tables métier de l'app (et donc toutes les
-- données associées), puis recrée l'ensemble du schéma.
-- À utiliser pour une remise à zéro complète en dev/recette.

-- Fonctions métier (si présentes)
DROP TRIGGER IF EXISTS trg_auth_user_catalog_init ON auth.users;
DROP FUNCTION IF EXISTS handle_auth_user_catalog_init();
DROP FUNCTION IF EXISTS initialize_my_catalog();
DROP FUNCTION IF EXISTS initialize_user_catalog(UUID);
DROP FUNCTION IF EXISTS create_profile_from_template(TEXT);
DROP FUNCTION IF EXISTS redeem_profile_reward(UUID);
DROP FUNCTION IF EXISTS set_profile_balance(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS validate_day(UUID, DATE);
DROP FUNCTION IF EXISTS toggle_moment_check(UUID, UUID, DATE); -- legacy cleanup (endpoint removed)
DROP FUNCTION IF EXISTS toggle_activity_check(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS toggle_task_check(UUID, UUID, DATE);

-- Tables métier (ordre enfant -> parent)
DROP TABLE IF EXISTS balance_history CASCADE;
DROP TABLE IF EXISTS profile_rewards CASCADE;
DROP TABLE IF EXISTS profile_template_rewards CASCADE;
DROP TABLE IF EXISTS profile_template_tasks CASCADE;
DROP TABLE IF EXISTS profile_template_activities CASCADE;
DROP TABLE IF EXISTS profile_template_moments CASCADE;
DROP TABLE IF EXISTS profile_templates CASCADE;
DROP TABLE IF EXISTS daily_validations CASCADE;
DROP TABLE IF EXISTS daily_checks CASCADE;
DROP TABLE IF EXISTS profile_moment_activity_tasks CASCADE;
DROP TABLE IF EXISTS profile_moment_activities CASCADE;
DROP TABLE IF EXISTS profile_moments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS moments CASCADE;
DROP TABLE IF EXISTS user_catalog_states CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Fonction utilitaire (après drop tables pour éviter les dépendances de trigger)
DROP FUNCTION IF EXISTS set_updated_at();

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Profils enfants ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  primary_color   TEXT NOT NULL DEFAULT '#8A2BE2',
  secondary_color TEXT NOT NULL DEFAULT '#FFD700',
  sticker_key     TEXT NOT NULL DEFAULT 'stars-icon',
  balance         INTEGER NOT NULL DEFAULT 0,
  sort_index      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_name_per_user UNIQUE (user_id, name)
);

-- ─── État d'initialisation du catalogue par compte ──────────────────────────
CREATE TABLE IF NOT EXISTS user_catalog_states (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  seeded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Catalogue : moments ──────────────────────────────────────────────────────
-- Les lignes `user_id IS NULL` servent uniquement de seed global de départ.
-- L'app lit ensuite uniquement le catalogue propre au compte.
CREATE TABLE IF NOT EXISTS moments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('morning', 'noon', 'afternoon', 'evening')),
  label           TEXT,
  default_stars  INTEGER NOT NULL DEFAULT 0,
  sort_index      INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_moment_name_user UNIQUE (user_id, name)
);

-- ─── Catalogue : activités ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  label           TEXT,
  icon            TEXT,
  default_stars  INTEGER NOT NULL DEFAULT 0,
  sort_index      INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_activity_name_user UNIQUE (user_id, name)
);

-- ─── Catalogue : tâches ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  label           TEXT,
  default_stars  INTEGER NOT NULL DEFAULT 0,
  sort_index      INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_task_name_user UNIQUE (user_id, name)
);

-- ─── Catalogue : récompenses ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  sort_index      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rewards_name_per_user UNIQUE (user_id, name),
  CONSTRAINT rewards_name_not_blank CHECK (btrim(name) <> '')
);

-- ─── Pivot : profil ↔ moment ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_moments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  moment_id       UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  stars          INTEGER NOT NULL DEFAULT 0,
  sort_index      INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_profile_moment UNIQUE (profile_id, moment_id)
);

-- ─── Pivot : profil ↔ récompense ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_rewards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id       UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  cost_stars      INTEGER NOT NULL,
  sort_index      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_rewards_positive_duration CHECK (duration_minutes > 0),
  CONSTRAINT profile_rewards_positive_cost CHECK (cost_stars > 0),
  CONSTRAINT profile_rewards_profile_reward_unique UNIQUE (profile_id, reward_id)
);

-- ─── Templates de profils exemple ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_templates (
  template_key    TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  primary_color   TEXT NOT NULL DEFAULT '#FF6B6B',
  secondary_color TEXT NOT NULL DEFAULT '#FFD700',
  sticker_key     TEXT NOT NULL DEFAULT 'star-sticker',
  sort_index      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_templates_key_not_blank CHECK (btrim(template_key) <> ''),
  CONSTRAINT profile_templates_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT profile_templates_sticker_key_not_blank CHECK (btrim(sticker_key) <> '')
);

CREATE TABLE IF NOT EXISTS profile_template_moments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key    TEXT NOT NULL REFERENCES profile_templates(template_key) ON DELETE CASCADE,
  moment_name     TEXT NOT NULL,
  moment_kind     TEXT NOT NULL CHECK (moment_kind IN ('morning', 'noon', 'afternoon', 'evening')),
  stars           INTEGER NOT NULL DEFAULT 0,
  sort_index      INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT profile_template_moments_name_not_blank CHECK (btrim(moment_name) <> ''),
  CONSTRAINT profile_template_moments_unique UNIQUE (template_key, moment_name)
);

CREATE TABLE IF NOT EXISTS profile_template_activities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_moment_id UUID NOT NULL REFERENCES profile_template_moments(id) ON DELETE CASCADE,
  activity_name   TEXT NOT NULL,
  stars           INTEGER NOT NULL DEFAULT 0,
  sticker_key     TEXT NOT NULL DEFAULT 'star-sticker',
  sort_index      INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT profile_template_activities_name_not_blank CHECK (btrim(activity_name) <> ''),
  CONSTRAINT profile_template_activities_sticker_key_not_blank CHECK (btrim(sticker_key) <> ''),
  CONSTRAINT profile_template_activities_unique UNIQUE (template_moment_id, activity_name)
);

CREATE TABLE IF NOT EXISTS profile_template_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_activity_id UUID NOT NULL REFERENCES profile_template_activities(id) ON DELETE CASCADE,
  task_name       TEXT NOT NULL,
  stars           INTEGER NOT NULL DEFAULT 0,
  sort_index      INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT profile_template_tasks_name_not_blank CHECK (btrim(task_name) <> ''),
  CONSTRAINT profile_template_tasks_unique UNIQUE (template_activity_id, task_name)
);

CREATE TABLE IF NOT EXISTS profile_template_rewards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key    TEXT NOT NULL REFERENCES profile_templates(template_key) ON DELETE CASCADE,
  reward_name     TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  cost_stars      INTEGER NOT NULL,
  sort_index      INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT profile_template_rewards_name_not_blank CHECK (btrim(reward_name) <> ''),
  CONSTRAINT profile_template_rewards_positive_duration CHECK (duration_minutes > 0),
  CONSTRAINT profile_template_rewards_positive_cost CHECK (cost_stars > 0),
  CONSTRAINT profile_template_rewards_unique UNIQUE (template_key, reward_name)
);

-- ─── Pivot : profile_moment ↔ activité ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_moment_activities (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_moment_id     UUID NOT NULL REFERENCES profile_moments(id) ON DELETE CASCADE,
  activity_id           UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  stars                INTEGER NOT NULL DEFAULT 0,
  sticker_key           TEXT NOT NULL DEFAULT 'stars-icon',
  sort_index            INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT pma_sticker_key_not_blank CHECK (btrim(sticker_key) <> ''),
  CONSTRAINT uq_profile_moment_activity UNIQUE (profile_moment_id, activity_id)
);

-- ─── Pivot : profile_moment_activity ↔ tâche ─────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_moment_activity_tasks (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_moment_activity_id    UUID NOT NULL REFERENCES profile_moment_activities(id) ON DELETE CASCADE,
  task_id                       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  stars                        INTEGER NOT NULL DEFAULT 0,
  sort_index                    INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_profile_moment_activity_task UNIQUE (profile_moment_activity_id, task_id)
);

-- ─── Daily checks ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_checks (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id                    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_date                    DATE NOT NULL DEFAULT CURRENT_DATE,
  target_type                   TEXT NOT NULL CHECK (target_type IN ('moment', 'activity', 'task')),
  profile_moment_id             UUID REFERENCES profile_moments(id) ON DELETE CASCADE,
  profile_moment_activity_id    UUID REFERENCES profile_moment_activities(id) ON DELETE CASCADE,
  profile_moment_activity_task_id UUID REFERENCES profile_moment_activity_tasks(id) ON DELETE CASCADE,
  checked                       BOOLEAN NOT NULL DEFAULT FALSE,
  sticker_key                   TEXT,
  stars_earned                 INTEGER NOT NULL DEFAULT 0,
  checked_at                    TIMESTAMPTZ,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Validation journalière (idempotence validate_day) ───────────────────────
CREATE TABLE IF NOT EXISTS daily_validations (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id                    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_date                    DATE NOT NULL DEFAULT CURRENT_DATE,
  earned_stars                 INTEGER NOT NULL DEFAULT 0,
  new_balance                   INTEGER NOT NULL,
  validated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_daily_validation_profile_date UNIQUE (profile_id, check_date)
);

-- ─── Historique tirelire ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS balance_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delta_stars     INTEGER NOT NULL,
  balance_before  INTEGER NOT NULL,
  balance_after   INTEGER NOT NULL,
  source          TEXT NOT NULL CHECK (source IN ('daily_validation', 'manual_adjustment', 'reward_redemption')),
  description     TEXT NOT NULL,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT balance_history_non_zero_delta CHECK (delta_stars <> 0),
  CONSTRAINT balance_history_non_negative_before CHECK (balance_before >= 0),
  CONSTRAINT balance_history_non_negative_after CHECK (balance_after >= 0)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. INDEX
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_check_task
  ON daily_checks (profile_id, check_date, profile_moment_activity_task_id)
  WHERE target_type = 'task';

CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_check_activity
  ON daily_checks (profile_id, check_date, profile_moment_activity_id)
  WHERE target_type = 'activity';

CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_check_moment
  ON daily_checks (profile_id, check_date, profile_moment_id)
  WHERE target_type = 'moment';

CREATE INDEX IF NOT EXISTS ix_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS ix_moments_user_id ON moments(user_id);
CREATE INDEX IF NOT EXISTS ix_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS ix_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS ix_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS ix_profile_moments_profile_id ON profile_moments(profile_id);
CREATE INDEX IF NOT EXISTS ix_profile_rewards_profile_id ON profile_rewards(profile_id);
CREATE INDEX IF NOT EXISTS ix_profile_rewards_reward_id ON profile_rewards(reward_id);
CREATE INDEX IF NOT EXISTS ix_profile_template_moments_template ON profile_template_moments(template_key, sort_index);
CREATE INDEX IF NOT EXISTS ix_profile_template_activities_moment ON profile_template_activities(template_moment_id, sort_index);
CREATE INDEX IF NOT EXISTS ix_profile_template_tasks_activity ON profile_template_tasks(template_activity_id, sort_index);
CREATE INDEX IF NOT EXISTS ix_profile_template_rewards_template ON profile_template_rewards(template_key, sort_index);
CREATE INDEX IF NOT EXISTS ix_pma_profile_moment_id ON profile_moment_activities(profile_moment_id);
CREATE INDEX IF NOT EXISTS ix_pmat_pma_id ON profile_moment_activity_tasks(profile_moment_activity_id);
CREATE INDEX IF NOT EXISTS ix_daily_checks_profile_date ON daily_checks(profile_id, check_date);
CREATE INDEX IF NOT EXISTS ix_daily_validations_profile_date ON daily_validations(profile_id, check_date);
CREATE INDEX IF NOT EXISTS ix_balance_history_user_occurred ON balance_history(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_balance_history_profile_occurred ON balance_history(profile_id, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_balance_history_profile_idempotency
  ON balance_history(profile_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION initialize_user_catalog(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claimed_user_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO user_catalog_states (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING user_id INTO v_claimed_user_id;

  IF v_claimed_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO moments (user_id, name, kind, label, default_stars, sort_index)
  SELECT
    p_user_id,
    seed.name,
    seed.kind,
    COALESCE(seed.label, seed.name),
    seed.default_stars,
    seed.sort_index
  FROM moments seed
  WHERE seed.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM moments owned
      WHERE owned.user_id = p_user_id
        AND owned.name = seed.name
    );

  INSERT INTO activities (user_id, name, label, icon, default_stars, sort_index)
  SELECT
    p_user_id,
    seed.name,
    COALESCE(seed.label, seed.name),
    seed.icon,
    seed.default_stars,
    seed.sort_index
  FROM activities seed
  WHERE seed.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM activities owned
      WHERE owned.user_id = p_user_id
        AND owned.name = seed.name
    );

  INSERT INTO tasks (user_id, name, label, default_stars, sort_index)
  SELECT
    p_user_id,
    seed.name,
    COALESCE(seed.label, seed.name),
    seed.default_stars,
    seed.sort_index
  FROM tasks seed
  WHERE seed.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM tasks owned
      WHERE owned.user_id = p_user_id
        AND owned.name = seed.name
    );

  INSERT INTO rewards (user_id, name, sort_index)
  SELECT
    p_user_id,
    seed.name,
    seed.sort_index
  FROM rewards seed
  WHERE seed.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM rewards owned
      WHERE owned.user_id = p_user_id
        AND owned.name = seed.name
    );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION initialize_my_catalog()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT initialize_user_catalog(auth.uid());
$$;

REVOKE ALL ON FUNCTION initialize_user_catalog(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION initialize_my_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION initialize_my_catalog() TO authenticated;

CREATE OR REPLACE FUNCTION handle_auth_user_catalog_init()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM initialize_user_catalog(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auth_user_catalog_init
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_catalog_init();

-- Backfill des comptes déjà présents dans auth.users
SELECT initialize_user_catalog(u.id)
FROM auth.users u;

-- Repointage best-effort des routines existantes vers le catalogue du compte.
UPDATE profile_moments pm
SET moment_id = owned.id
FROM profiles p,
     moments legacy,
     moments owned
WHERE pm.profile_id = p.id
  AND legacy.id = pm.moment_id
  AND legacy.user_id IS NULL
  AND owned.user_id = p.user_id
  AND owned.sort_index = legacy.sort_index
  AND owned.kind = legacy.kind
  AND pm.moment_id <> owned.id
  AND NOT EXISTS (
    SELECT 1
    FROM profile_moments duplicate_pm
    WHERE duplicate_pm.profile_id = pm.profile_id
      AND duplicate_pm.moment_id = owned.id
      AND duplicate_pm.id <> pm.id
  );

UPDATE profile_moment_activities pma
SET activity_id = owned.id
FROM profile_moments pm,
     profiles p,
     activities legacy,
     activities owned
WHERE pma.profile_moment_id = pm.id
  AND p.id = pm.profile_id
  AND legacy.id = pma.activity_id
  AND legacy.user_id IS NULL
  AND owned.user_id = p.user_id
  AND owned.sort_index = legacy.sort_index
  AND pma.activity_id <> owned.id
  AND NOT EXISTS (
    SELECT 1
    FROM profile_moment_activities duplicate_pma
    WHERE duplicate_pma.profile_moment_id = pma.profile_moment_id
      AND duplicate_pma.activity_id = owned.id
      AND duplicate_pma.id <> pma.id
  );

UPDATE profile_moment_activity_tasks pmat
SET task_id = owned.id
FROM profile_moment_activities pma,
     profile_moments pm,
     profiles p,
     tasks legacy,
     tasks owned
WHERE pmat.profile_moment_activity_id = pma.id
  AND pm.id = pma.profile_moment_id
  AND p.id = pm.profile_id
  AND legacy.id = pmat.task_id
  AND legacy.user_id IS NULL
  AND owned.user_id = p.user_id
  AND owned.sort_index = legacy.sort_index
  AND pmat.task_id <> owned.id
  AND NOT EXISTS (
    SELECT 1
    FROM profile_moment_activity_tasks duplicate_pmat
    WHERE duplicate_pmat.profile_moment_activity_id = pmat.profile_moment_activity_id
      AND duplicate_pmat.task_id = owned.id
      AND duplicate_pmat.id <> pmat.id
  );

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profile_rewards_updated_at
  BEFORE UPDATE ON profile_rewards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profile_templates_updated_at
  BEFORE UPDATE ON profile_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_daily_checks_updated_at
  BEFORE UPDATE ON daily_checks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_daily_validations_updated_at
  BEFORE UPDATE ON daily_validations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_catalog_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_template_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_template_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_template_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_moment_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_moment_activity_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_history ENABLE ROW LEVEL SECURITY;

-- ─── profiles ─────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ─── user_catalog_states ─────────────────────────────────────────────────────
CREATE POLICY "user_catalog_states_select_own" ON user_catalog_states FOR SELECT
  USING (auth.uid() = user_id);

-- ─── moments (catalogue par user) ────────────────────────────────────────────
CREATE POLICY "moments_select_own" ON moments FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "moments_insert_own" ON moments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moments_update_own" ON moments FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moments_delete_own" ON moments FOR DELETE
  USING (auth.uid() = user_id);

-- ─── activities (catalogue par user) ─────────────────────────────────────────
CREATE POLICY "activities_select_own" ON activities FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "activities_insert_own" ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_update_own" ON activities FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_delete_own" ON activities FOR DELETE
  USING (auth.uid() = user_id);

-- ─── tasks (catalogue par user) ──────────────────────────────────────────────
CREATE POLICY "tasks_select_own" ON tasks FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ─── rewards (catalogue par user) ────────────────────────────────────────────
CREATE POLICY "rewards_select_own" ON rewards FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "rewards_insert_own" ON rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rewards_update_own" ON rewards FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rewards_delete_own" ON rewards FOR DELETE
  USING (auth.uid() = user_id);

-- ─── profile_moments ─────────────────────────────────────────────────────────
CREATE POLICY "profile_moments_select_own" ON profile_moments FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_moments.profile_id AND p.user_id = auth.uid()));
CREATE POLICY "profile_moments_insert_own" ON profile_moments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_moments.profile_id AND p.user_id = auth.uid()));
CREATE POLICY "profile_moments_update_own" ON profile_moments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_moments.profile_id AND p.user_id = auth.uid()));
CREATE POLICY "profile_moments_delete_own" ON profile_moments FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_moments.profile_id AND p.user_id = auth.uid()));

-- ─── profile_rewards ─────────────────────────────────────────────────────────
CREATE POLICY "profile_rewards_select_own" ON profile_rewards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = profile_rewards.profile_id
      AND p.user_id = auth.uid()
  ));
CREATE POLICY "profile_rewards_insert_own" ON profile_rewards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM profiles p
    JOIN rewards r ON r.id = profile_rewards.reward_id
    WHERE p.id = profile_rewards.profile_id
      AND p.user_id = auth.uid()
      AND r.user_id = auth.uid()
  ));
CREATE POLICY "profile_rewards_update_own" ON profile_rewards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = profile_rewards.profile_id
      AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM profiles p
    JOIN rewards r ON r.id = profile_rewards.reward_id
    WHERE p.id = profile_rewards.profile_id
      AND p.user_id = auth.uid()
      AND r.user_id = auth.uid()
  ));
CREATE POLICY "profile_rewards_delete_own" ON profile_rewards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = profile_rewards.profile_id
      AND p.user_id = auth.uid()
  ));

-- ─── profile templates ───────────────────────────────────────────────────────
CREATE POLICY "profile_templates_select_all" ON profile_templates FOR SELECT
  USING (true);
CREATE POLICY "profile_template_moments_select_all" ON profile_template_moments FOR SELECT
  USING (true);
CREATE POLICY "profile_template_activities_select_all" ON profile_template_activities FOR SELECT
  USING (true);
CREATE POLICY "profile_template_tasks_select_all" ON profile_template_tasks FOR SELECT
  USING (true);
CREATE POLICY "profile_template_rewards_select_all" ON profile_template_rewards FOR SELECT
  USING (true);

-- ─── profile_moment_activities ───────────────────────────────────────────────
CREATE POLICY "pma_select_own" ON profile_moment_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profile_moments pm JOIN profiles p ON p.id = pm.profile_id
    WHERE pm.id = profile_moment_activities.profile_moment_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "pma_insert_own" ON profile_moment_activities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profile_moments pm JOIN profiles p ON p.id = pm.profile_id
    WHERE pm.id = profile_moment_activities.profile_moment_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "pma_update_own" ON profile_moment_activities FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profile_moments pm JOIN profiles p ON p.id = pm.profile_id
    WHERE pm.id = profile_moment_activities.profile_moment_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "pma_delete_own" ON profile_moment_activities FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profile_moments pm JOIN profiles p ON p.id = pm.profile_id
    WHERE pm.id = profile_moment_activities.profile_moment_id AND p.user_id = auth.uid()
  ));

-- ─── profile_moment_activity_tasks ───────────────────────────────────────────
CREATE POLICY "pmat_select_own" ON profile_moment_activity_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profile_moment_activities pma
    JOIN profile_moments pm ON pm.id = pma.profile_moment_id
    JOIN profiles p ON p.id = pm.profile_id
    WHERE pma.id = profile_moment_activity_tasks.profile_moment_activity_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "pmat_insert_own" ON profile_moment_activity_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profile_moment_activities pma
    JOIN profile_moments pm ON pm.id = pma.profile_moment_id
    JOIN profiles p ON p.id = pm.profile_id
    WHERE pma.id = profile_moment_activity_tasks.profile_moment_activity_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "pmat_update_own" ON profile_moment_activity_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profile_moment_activities pma
    JOIN profile_moments pm ON pm.id = pma.profile_moment_id
    JOIN profiles p ON p.id = pm.profile_id
    WHERE pma.id = profile_moment_activity_tasks.profile_moment_activity_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "pmat_delete_own" ON profile_moment_activity_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profile_moment_activities pma
    JOIN profile_moments pm ON pm.id = pma.profile_moment_id
    JOIN profiles p ON p.id = pm.profile_id
    WHERE pma.id = profile_moment_activity_tasks.profile_moment_activity_id AND p.user_id = auth.uid()
  ));

-- ─── daily_checks ────────────────────────────────────────────────────────────
CREATE POLICY "daily_checks_select_own" ON daily_checks FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = daily_checks.profile_id AND p.user_id = auth.uid()));
CREATE POLICY "daily_checks_insert_own" ON daily_checks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = daily_checks.profile_id AND p.user_id = auth.uid()));
CREATE POLICY "daily_checks_update_own" ON daily_checks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = daily_checks.profile_id AND p.user_id = auth.uid()));
CREATE POLICY "daily_checks_delete_own" ON daily_checks FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = daily_checks.profile_id AND p.user_id = auth.uid()));

-- ─── daily_validations ────────────────────────────────────────────────────────
CREATE POLICY "daily_validations_select_own" ON daily_validations FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = daily_validations.profile_id AND p.user_id = auth.uid()));
CREATE POLICY "daily_validations_insert_own" ON daily_validations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = daily_validations.profile_id AND p.user_id = auth.uid()));
CREATE POLICY "daily_validations_update_own" ON daily_validations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = daily_validations.profile_id AND p.user_id = auth.uid()));
CREATE POLICY "daily_validations_delete_own" ON daily_validations FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = daily_validations.profile_id AND p.user_id = auth.uid()));

-- ─── balance_history ─────────────────────────────────────────────────────────
CREATE POLICY "balance_history_select_own" ON balance_history FOR SELECT
  USING (auth.uid() = user_id);

-- MaRoutine : droits explicites pour une Data API Supabase neuve.
-- Les GRANT autorisent l'opération ; les policies RLS existantes filtrent
-- toujours les lignes au compte propriétaire. Aucun droit accordé à anon,
-- aucune modification des privilèges par défaut ni des tables futures.
-- Sur une base existante : sauvegarde, revue des ACL/RLS et autorisation
-- de migration requises ; ce fichier ne révoque pas les anciens droits.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.profiles,
  public.moments,
  public.activities,
  public.tasks,
  public.rewards,
  public.profile_moments,
  public.profile_rewards,
  public.profile_moment_activities,
  public.profile_moment_activity_tasks,
  public.daily_checks
TO authenticated;

-- Lecture de la validation puis réouverture du jour dans settingsRepo.
-- Les insertions/mises à jour restent effectuées par validate_day.
GRANT SELECT, DELETE ON TABLE public.daily_validations TO authenticated;
-- Les écritures d'historique restent réservées aux RPC SECURITY DEFINER.
GRANT SELECT ON TABLE public.balance_history TO authenticated;



-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. RPC MÉTIER HOME
-- ═══════════════════════════════════════════════════════════════════════════════

-- Toggle atomique d'une tâche + recalcul activity/moment parent.
-- Idempotence des effets métier:
-- - un retry "check" ne double pas les stars de la tâche (upsert),
-- - aucun crédit de solde ici (le solde sera géré par validate_day).
CREATE OR REPLACE FUNCTION toggle_task_check(
  p_profile_id UUID,
  p_profile_moment_activity_task_id UUID,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  task_checked BOOLEAN,
  activity_checked BOOLEAN,
  moment_checked BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_check_date DATE := COALESCE(p_check_date, CURRENT_DATE);
  v_now TIMESTAMPTZ := NOW();

  v_profile_moment_activity_id UUID;
  v_profile_moment_id UUID;
  v_task_stars INTEGER := 0;

  v_existing_task_check_id UUID;
  v_existing_task_checked BOOLEAN;

  v_activity_total_tasks INTEGER := 0;
  v_activity_checked_tasks INTEGER := 0;

  v_moment_total_activities INTEGER := 0;
  v_moment_checked_activities INTEGER := 0;
BEGIN
  -- 1) Vérifier la relation task -> activity -> moment -> profile + lock hiérarchie.
  SELECT
    pmat.profile_moment_activity_id,
    pma.profile_moment_id,
    COALESCE(pmat.stars, 0)
  INTO
    v_profile_moment_activity_id,
    v_profile_moment_id,
    v_task_stars
  FROM profile_moment_activity_tasks pmat
  JOIN profile_moment_activities pma ON pma.id = pmat.profile_moment_activity_id
  JOIN profile_moments pm ON pm.id = pma.profile_moment_id
  WHERE pmat.id = p_profile_moment_activity_task_id
    AND pm.profile_id = p_profile_id
  FOR UPDATE OF pmat, pma, pm;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task pivot introuvable pour ce profil'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2) Toggle de la tâche ciblée.
  SELECT dc.id, dc.checked
  INTO v_existing_task_check_id, v_existing_task_checked
  FROM daily_checks dc
  WHERE dc.profile_id = p_profile_id
    AND dc.check_date = v_check_date
    AND dc.target_type = 'task'
    AND dc.profile_moment_activity_task_id = p_profile_moment_activity_task_id
  FOR UPDATE;

  IF FOUND AND v_existing_task_checked THEN
    DELETE FROM daily_checks WHERE id = v_existing_task_check_id;
    task_checked := FALSE;
  ELSE
    INSERT INTO daily_checks (
      profile_id,
      check_date,
      target_type,
      profile_moment_id,
      profile_moment_activity_id,
      profile_moment_activity_task_id,
      checked,
      sticker_key,
      stars_earned,
      checked_at
    )
    VALUES (
      p_profile_id,
      v_check_date,
      'task',
      v_profile_moment_id,
      v_profile_moment_activity_id,
      p_profile_moment_activity_task_id,
      TRUE,
      NULL,
      v_task_stars,
      v_now
    )
    ON CONFLICT (profile_id, check_date, profile_moment_activity_task_id)
    WHERE target_type = 'task'
    DO UPDATE
    SET
      checked = TRUE,
      profile_moment_id = EXCLUDED.profile_moment_id,
      profile_moment_activity_id = EXCLUDED.profile_moment_activity_id,
      sticker_key = EXCLUDED.sticker_key,
      stars_earned = EXCLUDED.stars_earned,
      checked_at = EXCLUDED.checked_at,
      updated_at = NOW();

    task_checked := TRUE;
  END IF;

  -- 3) Recalcul état activity parent:
  --    activity.checked = all(tasks.checked) pour une activité avec tâches.
  SELECT COUNT(*)
  INTO v_activity_total_tasks
  FROM profile_moment_activity_tasks pmat
  WHERE pmat.profile_moment_activity_id = v_profile_moment_activity_id;

  SELECT COUNT(*)
  INTO v_activity_checked_tasks
  FROM profile_moment_activity_tasks pmat
  JOIN daily_checks dc
    ON dc.profile_id = p_profile_id
   AND dc.check_date = v_check_date
   AND dc.target_type = 'task'
   AND dc.profile_moment_activity_task_id = pmat.id
   AND dc.checked = TRUE
  WHERE pmat.profile_moment_activity_id = v_profile_moment_activity_id;

  activity_checked := (v_activity_total_tasks > 0 AND v_activity_checked_tasks = v_activity_total_tasks);

  IF activity_checked THEN
    INSERT INTO daily_checks (
      profile_id,
      check_date,
      target_type,
      profile_moment_id,
      profile_moment_activity_id,
      profile_moment_activity_task_id,
      checked,
      sticker_key,
      stars_earned,
      checked_at
    )
    VALUES (
      p_profile_id,
      v_check_date,
      'activity',
      v_profile_moment_id,
      v_profile_moment_activity_id,
      NULL,
      TRUE,
      NULL,
      0,
      v_now
    )
    ON CONFLICT (profile_id, check_date, profile_moment_activity_id)
    WHERE target_type = 'activity'
    DO UPDATE
    SET
      checked = TRUE,
      profile_moment_id = EXCLUDED.profile_moment_id,
      profile_moment_activity_task_id = NULL,
      sticker_key = NULL,
      stars_earned = 0,
      checked_at = EXCLUDED.checked_at,
      updated_at = NOW();
  ELSE
    DELETE FROM daily_checks
    WHERE profile_id = p_profile_id
      AND check_date = v_check_date
      AND target_type = 'activity'
      AND profile_moment_activity_id = v_profile_moment_activity_id;
  END IF;

  -- 4) Recalcul état moment parent:
  --    moment.checked = all(activities.checked) pour un moment avec activités.
  SELECT COUNT(*)
  INTO v_moment_total_activities
  FROM profile_moment_activities pma
  WHERE pma.profile_moment_id = v_profile_moment_id;

  SELECT COUNT(*)
  INTO v_moment_checked_activities
  FROM profile_moment_activities pma
  WHERE pma.profile_moment_id = v_profile_moment_id
    AND NOT EXISTS (
      SELECT 1
      FROM profile_moment_activity_tasks pmat
      WHERE pmat.profile_moment_activity_id = pma.id
        AND NOT EXISTS (
          SELECT 1
          FROM daily_checks dc_task
          WHERE dc_task.profile_id = p_profile_id
            AND dc_task.check_date = v_check_date
            AND dc_task.target_type = 'task'
            AND dc_task.profile_moment_activity_task_id = pmat.id
            AND dc_task.checked = TRUE
        )
    )
    AND (
      EXISTS (
        SELECT 1
        FROM profile_moment_activity_tasks has_task
        WHERE has_task.profile_moment_activity_id = pma.id
      )
      OR EXISTS (
        SELECT 1
        FROM daily_checks dc_activity
        WHERE dc_activity.profile_id = p_profile_id
          AND dc_activity.check_date = v_check_date
          AND dc_activity.target_type = 'activity'
          AND dc_activity.profile_moment_activity_id = pma.id
          AND dc_activity.checked = TRUE
      )
    );

  moment_checked := (v_moment_total_activities > 0 AND v_moment_checked_activities = v_moment_total_activities);

  IF moment_checked THEN
    INSERT INTO daily_checks (
      profile_id,
      check_date,
      target_type,
      profile_moment_id,
      profile_moment_activity_id,
      profile_moment_activity_task_id,
      checked,
      sticker_key,
      stars_earned,
      checked_at
    )
    VALUES (
      p_profile_id,
      v_check_date,
      'moment',
      v_profile_moment_id,
      NULL,
      NULL,
      TRUE,
      NULL,
      0,
      v_now
    )
    ON CONFLICT (profile_id, check_date, profile_moment_id)
    WHERE target_type = 'moment'
    DO UPDATE
    SET
      checked = TRUE,
      profile_moment_activity_id = NULL,
      profile_moment_activity_task_id = NULL,
      sticker_key = NULL,
      stars_earned = 0,
      checked_at = EXCLUDED.checked_at,
      updated_at = NOW();
  ELSE
    DELETE FROM daily_checks
    WHERE profile_id = p_profile_id
      AND check_date = v_check_date
      AND target_type = 'moment'
      AND profile_moment_id = v_profile_moment_id;
  END IF;

  RETURN QUERY
  SELECT task_checked, activity_checked, moment_checked;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_task_check(UUID, UUID, DATE) TO authenticated;

-- Toggle atomique d'une activité.
-- Si l'activité a des tâches: cascade check/uncheck sur toutes les tâches.
-- Si l'activité n'a pas de tâche: activité traitée comme feuille checkable.
CREATE OR REPLACE FUNCTION toggle_activity_check(
  p_profile_id UUID,
  p_profile_moment_activity_id UUID,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  activity_checked BOOLEAN,
  moment_checked BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_check_date DATE := COALESCE(p_check_date, CURRENT_DATE);
  v_now TIMESTAMPTZ := NOW();

  v_profile_moment_id UUID;
  v_activity_stars INTEGER := 0;

  v_total_tasks INTEGER := 0;
  v_checked_tasks INTEGER := 0;
  v_is_leaf_activity BOOLEAN := FALSE;
  v_current_activity_checked BOOLEAN := FALSE;
  v_target_activity_checked BOOLEAN := FALSE;

  v_moment_total_activities INTEGER := 0;
  v_moment_checked_activities INTEGER := 0;
BEGIN
  -- 1) Vérifier la relation activity -> moment -> profile + lock hiérarchie.
  SELECT
    pma.profile_moment_id,
    COALESCE(pma.stars, 0)
  INTO
    v_profile_moment_id,
    v_activity_stars
  FROM profile_moment_activities pma
  JOIN profile_moments pm ON pm.id = pma.profile_moment_id
  WHERE pma.id = p_profile_moment_activity_id
    AND pm.profile_id = p_profile_id
  FOR UPDATE OF pma, pm;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity pivot introuvable pour ce profil'
      USING ERRCODE = 'P0001';
  END IF;

  -- Lock lignes tâches enfants pour éviter les courses avec toggle_task_check.
  PERFORM 1
  FROM profile_moment_activity_tasks pmat
  WHERE pmat.profile_moment_activity_id = p_profile_moment_activity_id
  FOR UPDATE;

  SELECT COUNT(*)
  INTO v_total_tasks
  FROM profile_moment_activity_tasks pmat
  WHERE pmat.profile_moment_activity_id = p_profile_moment_activity_id;

  v_is_leaf_activity := (v_total_tasks = 0);

  -- 2) État courant (dérivé), puis état cible du toggle.
  IF v_is_leaf_activity THEN
    SELECT EXISTS (
      SELECT 1
      FROM daily_checks dc
      WHERE dc.profile_id = p_profile_id
        AND dc.check_date = v_check_date
        AND dc.target_type = 'activity'
        AND dc.profile_moment_activity_id = p_profile_moment_activity_id
        AND dc.checked = TRUE
    )
    INTO v_current_activity_checked;
  ELSE
    SELECT COUNT(*)
    INTO v_checked_tasks
    FROM profile_moment_activity_tasks pmat
    JOIN daily_checks dc
      ON dc.profile_id = p_profile_id
     AND dc.check_date = v_check_date
     AND dc.target_type = 'task'
     AND dc.profile_moment_activity_task_id = pmat.id
     AND dc.checked = TRUE
    WHERE pmat.profile_moment_activity_id = p_profile_moment_activity_id;

    v_current_activity_checked := (v_total_tasks > 0 AND v_checked_tasks = v_total_tasks);
  END IF;

  v_target_activity_checked := NOT v_current_activity_checked;

  -- 3) Appliquer le toggle.
  IF v_is_leaf_activity THEN
    IF v_target_activity_checked THEN
      INSERT INTO daily_checks (
        profile_id,
        check_date,
        target_type,
        profile_moment_id,
        profile_moment_activity_id,
        profile_moment_activity_task_id,
        checked,
        sticker_key,
        stars_earned,
        checked_at
      )
      VALUES (
        p_profile_id,
        v_check_date,
        'activity',
        v_profile_moment_id,
        p_profile_moment_activity_id,
        NULL,
        TRUE,
        NULL,
        v_activity_stars,
        v_now
      )
      ON CONFLICT (profile_id, check_date, profile_moment_activity_id)
      WHERE target_type = 'activity'
      DO UPDATE
      SET
        checked = TRUE,
        profile_moment_id = EXCLUDED.profile_moment_id,
        profile_moment_activity_task_id = NULL,
        sticker_key = NULL,
        stars_earned = EXCLUDED.stars_earned,
        checked_at = EXCLUDED.checked_at,
        updated_at = NOW();
    ELSE
      DELETE FROM daily_checks
      WHERE profile_id = p_profile_id
        AND check_date = v_check_date
        AND target_type = 'activity'
        AND profile_moment_activity_id = p_profile_moment_activity_id;
    END IF;
  ELSE
    IF v_target_activity_checked THEN
      -- Checker toutes les tâches de l'activité.
      INSERT INTO daily_checks (
        profile_id,
        check_date,
        target_type,
        profile_moment_id,
        profile_moment_activity_id,
        profile_moment_activity_task_id,
        checked,
        sticker_key,
        stars_earned,
        checked_at
      )
      SELECT
        p_profile_id,
        v_check_date,
        'task',
        v_profile_moment_id,
        p_profile_moment_activity_id,
        pmat.id,
        TRUE,
        NULL,
        COALESCE(pmat.stars, 0),
        v_now
      FROM profile_moment_activity_tasks pmat
      WHERE pmat.profile_moment_activity_id = p_profile_moment_activity_id
      ON CONFLICT (profile_id, check_date, profile_moment_activity_task_id)
      WHERE target_type = 'task'
      DO UPDATE
      SET
        checked = TRUE,
        profile_moment_id = EXCLUDED.profile_moment_id,
        profile_moment_activity_id = EXCLUDED.profile_moment_activity_id,
        sticker_key = NULL,
        stars_earned = EXCLUDED.stars_earned,
        checked_at = EXCLUDED.checked_at,
        updated_at = NOW();

      INSERT INTO daily_checks (
        profile_id,
        check_date,
        target_type,
        profile_moment_id,
        profile_moment_activity_id,
        profile_moment_activity_task_id,
        checked,
        sticker_key,
        stars_earned,
        checked_at
      )
      VALUES (
        p_profile_id,
        v_check_date,
        'activity',
        v_profile_moment_id,
        p_profile_moment_activity_id,
        NULL,
        TRUE,
        NULL,
        0,
        v_now
      )
      ON CONFLICT (profile_id, check_date, profile_moment_activity_id)
      WHERE target_type = 'activity'
      DO UPDATE
      SET
        checked = TRUE,
        profile_moment_id = EXCLUDED.profile_moment_id,
        profile_moment_activity_task_id = NULL,
        sticker_key = NULL,
        stars_earned = 0,
        checked_at = EXCLUDED.checked_at,
        updated_at = NOW();
    ELSE
      -- Décocher toute l'activité: tâches + état activité.
      DELETE FROM daily_checks
      WHERE profile_id = p_profile_id
        AND check_date = v_check_date
        AND target_type = 'task'
        AND profile_moment_activity_id = p_profile_moment_activity_id;

      DELETE FROM daily_checks
      WHERE profile_id = p_profile_id
        AND check_date = v_check_date
        AND target_type = 'activity'
        AND profile_moment_activity_id = p_profile_moment_activity_id;
    END IF;
  END IF;

  -- 4) Recalcul état activity final (source unique pour le retour + cohérence).
  IF v_is_leaf_activity THEN
    SELECT EXISTS (
      SELECT 1
      FROM daily_checks dc
      WHERE dc.profile_id = p_profile_id
        AND dc.check_date = v_check_date
        AND dc.target_type = 'activity'
        AND dc.profile_moment_activity_id = p_profile_moment_activity_id
        AND dc.checked = TRUE
    )
    INTO activity_checked;
  ELSE
    SELECT COUNT(*)
    INTO v_checked_tasks
    FROM profile_moment_activity_tasks pmat
    JOIN daily_checks dc
      ON dc.profile_id = p_profile_id
     AND dc.check_date = v_check_date
     AND dc.target_type = 'task'
     AND dc.profile_moment_activity_task_id = pmat.id
     AND dc.checked = TRUE
    WHERE pmat.profile_moment_activity_id = p_profile_moment_activity_id;

    activity_checked := (v_total_tasks > 0 AND v_checked_tasks = v_total_tasks);

    IF activity_checked THEN
      INSERT INTO daily_checks (
        profile_id,
        check_date,
        target_type,
        profile_moment_id,
        profile_moment_activity_id,
        profile_moment_activity_task_id,
        checked,
        sticker_key,
        stars_earned,
        checked_at
      )
      VALUES (
        p_profile_id,
        v_check_date,
        'activity',
        v_profile_moment_id,
        p_profile_moment_activity_id,
        NULL,
        TRUE,
        NULL,
        0,
        v_now
      )
      ON CONFLICT (profile_id, check_date, profile_moment_activity_id)
      WHERE target_type = 'activity'
      DO UPDATE
      SET
        checked = TRUE,
        profile_moment_id = EXCLUDED.profile_moment_id,
        profile_moment_activity_task_id = NULL,
        sticker_key = NULL,
        stars_earned = 0,
        checked_at = EXCLUDED.checked_at,
        updated_at = NOW();
    ELSE
      DELETE FROM daily_checks
      WHERE profile_id = p_profile_id
        AND check_date = v_check_date
        AND target_type = 'activity'
        AND profile_moment_activity_id = p_profile_moment_activity_id;
    END IF;
  END IF;

  -- 5) Recalcul état moment parent.
  SELECT COUNT(*)
  INTO v_moment_total_activities
  FROM profile_moment_activities pma
  WHERE pma.profile_moment_id = v_profile_moment_id;

  SELECT COUNT(*)
  INTO v_moment_checked_activities
  FROM profile_moment_activities pma
  WHERE pma.profile_moment_id = v_profile_moment_id
    AND NOT EXISTS (
      SELECT 1
      FROM profile_moment_activity_tasks pmat
      WHERE pmat.profile_moment_activity_id = pma.id
        AND NOT EXISTS (
          SELECT 1
          FROM daily_checks dc_task
          WHERE dc_task.profile_id = p_profile_id
            AND dc_task.check_date = v_check_date
            AND dc_task.target_type = 'task'
            AND dc_task.profile_moment_activity_task_id = pmat.id
            AND dc_task.checked = TRUE
        )
    )
    AND (
      EXISTS (
        SELECT 1
        FROM profile_moment_activity_tasks has_task
        WHERE has_task.profile_moment_activity_id = pma.id
      )
      OR EXISTS (
        SELECT 1
        FROM daily_checks dc_activity
        WHERE dc_activity.profile_id = p_profile_id
          AND dc_activity.check_date = v_check_date
          AND dc_activity.target_type = 'activity'
          AND dc_activity.profile_moment_activity_id = pma.id
          AND dc_activity.checked = TRUE
      )
    );

  moment_checked := (v_moment_total_activities > 0 AND v_moment_checked_activities = v_moment_total_activities);

  IF moment_checked THEN
    INSERT INTO daily_checks (
      profile_id,
      check_date,
      target_type,
      profile_moment_id,
      profile_moment_activity_id,
      profile_moment_activity_task_id,
      checked,
      sticker_key,
      stars_earned,
      checked_at
    )
    VALUES (
      p_profile_id,
      v_check_date,
      'moment',
      v_profile_moment_id,
      NULL,
      NULL,
      TRUE,
      NULL,
      0,
      v_now
    )
    ON CONFLICT (profile_id, check_date, profile_moment_id)
    WHERE target_type = 'moment'
    DO UPDATE
    SET
      checked = TRUE,
      profile_moment_activity_id = NULL,
      profile_moment_activity_task_id = NULL,
      sticker_key = NULL,
      stars_earned = 0,
      checked_at = EXCLUDED.checked_at,
      updated_at = NOW();
  ELSE
    DELETE FROM daily_checks
    WHERE profile_id = p_profile_id
      AND check_date = v_check_date
      AND target_type = 'moment'
      AND profile_moment_id = v_profile_moment_id;
  END IF;

  RETURN QUERY
  SELECT activity_checked, moment_checked;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_activity_check(UUID, UUID, DATE) TO authenticated;


-- Définit explicitement le montant de tirelire d'un profil et historise l'écart.
CREATE OR REPLACE FUNCTION set_profile_balance(
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
  FROM profiles p
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
    UPDATE profiles
    SET balance = p_amount
    WHERE id = p_profile_id;

    INSERT INTO balance_history (
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

GRANT EXECUTE ON FUNCTION set_profile_balance(UUID, INTEGER, TEXT) TO authenticated;

-- Crée un profil enfant depuis un template global.
CREATE OR REPLACE FUNCTION create_profile_from_template(
  p_template_key TEXT DEFAULT 'example'
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  sticker_key TEXT,
  balance INTEGER,
  sort_index INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_template profile_templates%ROWTYPE;
  v_profile_id UUID;
  v_name_base TEXT;
  v_name_candidate TEXT;
  v_suffix INTEGER := 1;
  v_sort_index INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié'
      USING ERRCODE = 'P0001';
  END IF;

  PERFORM initialize_user_catalog(v_user_id);

  SELECT *
  INTO v_template
  FROM profile_templates
  WHERE template_key = COALESCE(NULLIF(btrim(p_template_key), ''), 'example');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template de profil introuvable'
      USING ERRCODE = 'P0001';
  END IF;

  v_name_base := COALESCE(NULLIF(btrim(v_template.name), ''), 'Exemple');
  v_name_candidate := v_name_base;

  WHILE EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = v_user_id
      AND p.name = v_name_candidate
  ) LOOP
    v_suffix := v_suffix + 1;
    v_name_candidate := v_name_base || ' ' || v_suffix::TEXT;
  END LOOP;

  SELECT COALESCE(MAX(p.sort_index), -1) + 1
  INTO v_sort_index
  FROM profiles p
  WHERE p.user_id = v_user_id;

  INSERT INTO profiles AS inserted_profile (
    user_id,
    name,
    primary_color,
    secondary_color,
    sticker_key,
    balance,
    sort_index
  )
  VALUES (
    v_user_id,
    v_name_candidate,
    v_template.primary_color,
    v_template.secondary_color,
    v_template.sticker_key,
    0,
    v_sort_index
  )
  RETURNING inserted_profile.id INTO v_profile_id;

  INSERT INTO moments (user_id, name, kind, label, default_stars, sort_index)
  SELECT v_user_id, seed.name, seed.kind, COALESCE(seed.label, seed.name), seed.default_stars, seed.sort_index
  FROM profile_template_moments tm
  JOIN moments seed
    ON seed.user_id IS NULL
   AND seed.name = tm.moment_name
   AND seed.kind = tm.moment_kind
  WHERE tm.template_key = v_template.template_key
    AND NOT EXISTS (
      SELECT 1 FROM moments owned
      WHERE owned.user_id = v_user_id
        AND owned.name = seed.name
    );

  INSERT INTO activities (user_id, name, label, icon, default_stars, sort_index)
  SELECT DISTINCT v_user_id, seed.name, COALESCE(seed.label, seed.name), seed.icon, seed.default_stars, seed.sort_index
  FROM profile_template_activities ta
  JOIN profile_template_moments tm ON tm.id = ta.template_moment_id
  JOIN activities seed
    ON seed.user_id IS NULL
   AND seed.name = ta.activity_name
  WHERE tm.template_key = v_template.template_key
    AND NOT EXISTS (
      SELECT 1 FROM activities owned
      WHERE owned.user_id = v_user_id
        AND owned.name = seed.name
    );

  INSERT INTO tasks (user_id, name, label, default_stars, sort_index)
  SELECT DISTINCT v_user_id, seed.name, COALESCE(seed.label, seed.name), seed.default_stars, seed.sort_index
  FROM profile_template_tasks tt
  JOIN profile_template_activities ta ON ta.id = tt.template_activity_id
  JOIN profile_template_moments tm ON tm.id = ta.template_moment_id
  JOIN tasks seed
    ON seed.user_id IS NULL
   AND seed.name = tt.task_name
  WHERE tm.template_key = v_template.template_key
    AND NOT EXISTS (
      SELECT 1 FROM tasks owned
      WHERE owned.user_id = v_user_id
        AND owned.name = seed.name
    );

  INSERT INTO rewards (user_id, name, sort_index)
  SELECT v_user_id, seed.name, seed.sort_index
  FROM profile_template_rewards tr
  JOIN rewards seed
    ON seed.user_id IS NULL
   AND seed.name = tr.reward_name
  WHERE tr.template_key = v_template.template_key
    AND NOT EXISTS (
      SELECT 1 FROM rewards owned
      WHERE owned.user_id = v_user_id
        AND owned.name = seed.name
    );

  WITH inserted_moments AS (
    INSERT INTO profile_moments AS inserted_profile_moment (
      profile_id,
      moment_id,
      stars,
      sort_index
    )
    SELECT
      v_profile_id,
      m.id,
      tm.stars,
      tm.sort_index
    FROM profile_template_moments tm
    JOIN moments m
      ON m.user_id = v_user_id
     AND m.name = tm.moment_name
     AND m.kind = tm.moment_kind
    WHERE tm.template_key = v_template.template_key
    ORDER BY tm.sort_index
    RETURNING inserted_profile_moment.id, inserted_profile_moment.moment_id
  ),
  moment_map AS (
    SELECT tm.id AS template_moment_id, im.id AS profile_moment_id
    FROM profile_template_moments tm
    JOIN moments m
      ON m.user_id = v_user_id
     AND m.name = tm.moment_name
     AND m.kind = tm.moment_kind
    JOIN inserted_moments im ON im.moment_id = m.id
    WHERE tm.template_key = v_template.template_key
  ),
  inserted_activities AS (
    INSERT INTO profile_moment_activities AS inserted_profile_moment_activity (
      profile_moment_id,
      activity_id,
      stars,
      sticker_key,
      sort_index
    )
    SELECT
      mm.profile_moment_id,
      a.id,
      ta.stars,
      'star-sticker',
      ta.sort_index
    FROM profile_template_activities ta
    JOIN moment_map mm ON mm.template_moment_id = ta.template_moment_id
    JOIN activities a
      ON a.user_id = v_user_id
     AND a.name = ta.activity_name
    ORDER BY mm.profile_moment_id, ta.sort_index
    RETURNING inserted_profile_moment_activity.id,
      inserted_profile_moment_activity.profile_moment_id,
      inserted_profile_moment_activity.activity_id
  ),
  activity_map AS (
    SELECT ta.id AS template_activity_id, ia.id AS profile_moment_activity_id
    FROM profile_template_activities ta
    JOIN moment_map mm ON mm.template_moment_id = ta.template_moment_id
    JOIN activities a
      ON a.user_id = v_user_id
     AND a.name = ta.activity_name
    JOIN inserted_activities ia
      ON ia.profile_moment_id = mm.profile_moment_id
     AND ia.activity_id = a.id
  )
  INSERT INTO profile_moment_activity_tasks (
    profile_moment_activity_id,
    task_id,
    stars,
    sort_index
  )
  SELECT
    am.profile_moment_activity_id,
    t.id,
    tt.stars,
    tt.sort_index
  FROM profile_template_tasks tt
  JOIN activity_map am ON am.template_activity_id = tt.template_activity_id
  JOIN tasks t
    ON t.user_id = v_user_id
   AND t.name = tt.task_name
  ORDER BY am.profile_moment_activity_id, tt.sort_index;

  INSERT INTO profile_rewards (
    profile_id,
    reward_id,
    duration_minutes,
    cost_stars,
    sort_index
  )
  SELECT
    v_profile_id,
    r.id,
    tr.duration_minutes,
    tr.cost_stars,
    tr.sort_index
  FROM profile_template_rewards tr
  JOIN rewards r
    ON r.user_id = v_user_id
   AND r.name = tr.reward_name
  WHERE tr.template_key = v_template.template_key
  ORDER BY tr.sort_index;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.name,
    p.primary_color,
    p.secondary_color,
    p.sticker_key,
    p.balance,
    p.sort_index,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = v_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_profile_from_template(TEXT) TO authenticated;

-- Débite atomiquement la tirelire lors de l'échange d'une récompense enfant.
CREATE OR REPLACE FUNCTION redeem_profile_reward(
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
  FROM profile_rewards pr
  JOIN profiles p ON p.id = pr.profile_id
  JOIN rewards r ON r.id = pr.reward_id
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

  UPDATE profiles
  SET balance = new_balance
  WHERE id = v_profile_id;

  INSERT INTO balance_history (
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

GRANT EXECUTE ON FUNCTION redeem_profile_reward(UUID) TO authenticated;

-- Validation atomique de la journée:
-- - calcule les stars gagnées depuis les feuilles checkées,
-- - crédite le solde du profil,
-- - reset les checks du jour,
-- - garantit l'idempotence via daily_validations + balance_history.
CREATE OR REPLACE FUNCTION validate_day(
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
  FROM profiles p
  WHERE p.id = p_profile_id
    AND p.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT dv.earned_stars, dv.new_balance
  INTO v_existing_earned_stars, v_existing_new_balance
  FROM daily_validations dv
  WHERE dv.profile_id = p_profile_id
    AND dv.check_date = v_check_date;

  IF FOUND THEN
    RETURN QUERY
    SELECT v_existing_earned_stars, v_existing_new_balance;
    RETURN;
  END IF;

  SELECT COALESCE(SUM(dc.stars_earned), 0)
  INTO v_earned_stars
  FROM daily_checks dc
  WHERE dc.profile_id = p_profile_id
    AND dc.check_date = v_check_date
    AND dc.checked = TRUE
    AND (
      dc.target_type = 'task'
      OR (
        dc.target_type = 'activity'
        AND NOT EXISTS (
          SELECT 1
          FROM profile_moment_activity_tasks pmat
          WHERE pmat.profile_moment_activity_id = dc.profile_moment_activity_id
        )
      )
    );

  v_new_balance := v_current_balance + v_earned_stars;

  UPDATE profiles
  SET balance = v_new_balance
  WHERE id = p_profile_id;

  DELETE FROM daily_checks
  WHERE profile_id = p_profile_id
    AND check_date = v_check_date;

  INSERT INTO daily_validations (
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
    INSERT INTO balance_history (
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
  FROM daily_validations dv
  WHERE dv.profile_id = p_profile_id
    AND dv.check_date = v_check_date;

  RETURN QUERY
  SELECT v_existing_earned_stars, v_existing_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_day(UUID, DATE) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. SEED (données initiales — globales, user_id = NULL)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO moments (user_id, name, kind, label, default_stars, sort_index) VALUES
  (NULL, 'Matin',       'morning',   'Le réveil et le départ',   0, 0),
  (NULL, 'Midi',        'noon',      'Le repas du midi',         0, 1),
  (NULL, 'Après-midi',  'afternoon', 'Le temps libre',           0, 2),
  (NULL, 'Soir',        'evening',   'Le coucher',               0, 3)
ON CONFLICT ON CONSTRAINT uq_moment_name_user DO NOTHING;

INSERT INTO activities (user_id, name, label, icon, default_stars, sort_index) VALUES
  (NULL, 'Petit Déjeuner',    'Manger le matin',          'restaurant',    0, 0),
  (NULL, 'S''habiller',        'Mettre ses vêtements',      'checkroom',     0, 1),
  (NULL, 'Se laver',          'Hygiène du matin',          'wash',          0, 2),
  (NULL, 'Ranger sa chambre', 'Rangement quotidien',       'home',          0, 3),
  (NULL, 'Devoirs',           'Travail scolaire',          'menu_book',     0, 4),
  (NULL, 'Brossage & Bain',   'Hygiène du soir',           'auto_fix_high', 0, 5),
  (NULL, 'Se coucher',        'Aller au lit à l''heure',   'bedtime',       0, 6),
  (NULL, 'Déjeuner',          'Repas du midi',             'lunch_dining',  0, 7),
  (NULL, 'Goûter',            'Collation de l''après-midi','cake',          0, 8)
ON CONFLICT ON CONSTRAINT uq_activity_name_user DO NOTHING;

INSERT INTO tasks (user_id, name, label, default_stars, sort_index) VALUES
  (NULL, 'Manger ses céréales',          NULL, 0, 0),
  (NULL, 'Boire son jus',               NULL, 0, 1),
  (NULL, 'Débarrasser son bol',         NULL, 0, 2),
  (NULL, 'Mettre ses chaussettes',      NULL, 0, 3),
  (NULL, 'Mettre ses chaussures',       NULL, 0, 4),
  (NULL, 'Mettre son manteau',          NULL, 0, 5),
  (NULL, 'Se brosser les dents (matin)',NULL, 0, 6),
  (NULL, 'Se laver le visage',          NULL, 0, 7),
  (NULL, 'Se peigner',                  NULL, 0, 8),
  (NULL, 'Ranger ses jouets',           NULL, 0, 9),
  (NULL, 'Ranger son bureau',           NULL, 0, 10),
  (NULL, 'Faire son lit',               NULL, 0, 11),
  (NULL, 'S''occuper de son linge',     NULL, 0, 12),
  (NULL, 'Faire ses devoirs',           NULL, 0, 13),
  (NULL, 'Ranger son cartable',         NULL, 0, 14),
  (NULL, 'Brosser les dents (2 min)',   NULL, 0, 15),
  (NULL, 'Ranger ses habits sales',     NULL, 0, 16),
  (NULL, 'Mettre son pyjama',           NULL, 0, 17),
  (NULL, 'Dire bonne nuit',             NULL, 0, 18),
  (NULL, 'Manger ses légumes',          NULL, 0, 19),
  (NULL, 'Débarrasser son assiette',    NULL, 0, 20)
ON CONFLICT ON CONSTRAINT uq_task_name_user DO NOTHING;
