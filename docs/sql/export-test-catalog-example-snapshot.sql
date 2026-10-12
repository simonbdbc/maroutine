-- Export lecture seule du catalogue du compte test + profil exemple Méline.
--
-- À exécuter dans Supabase SQL Editor, puis copier la valeur de la colonne
-- `snapshot_insert_sql` dans la section marquée de:
-- `docs/sql/migration-e17-default-catalog-rewards-example-profile.sql`.

WITH test_user AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower('simonbdbc+test@gmail.com')
  LIMIT 1
),
source_profile AS (
  SELECT p.*
  FROM public.profiles p
  JOIN test_user u ON u.id = p.user_id
  WHERE p.name = 'Méline'
  LIMIT 1
),
catalog_moments AS (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', m.name,
      'kind', m.kind,
      'label', m.label,
      'default_stars', m.default_stars,
      'sort_index', m.sort_index
    )
    ORDER BY m.sort_index, m.name
  ), '[]'::jsonb) AS data
  FROM public.moments m
  JOIN test_user u ON u.id = m.user_id
),
catalog_activities AS (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', a.name,
      'label', a.label,
      'icon', a.icon,
      'default_stars', a.default_stars,
      'sort_index', a.sort_index
    )
    ORDER BY a.sort_index, a.name
  ), '[]'::jsonb) AS data
  FROM public.activities a
  JOIN test_user u ON u.id = a.user_id
),
catalog_tasks AS (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', t.name,
      'label', t.label,
      'default_stars', t.default_stars,
      'sort_index', t.sort_index
    )
    ORDER BY t.sort_index, t.name
  ), '[]'::jsonb) AS data
  FROM public.tasks t
  JOIN test_user u ON u.id = t.user_id
),
catalog_rewards AS (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', r.name,
      'sort_index', r.sort_index
    )
    ORDER BY r.sort_index, r.name
  ), '[]'::jsonb) AS data
  FROM public.rewards r
  JOIN test_user u ON u.id = r.user_id
),
template_moments AS (
  SELECT COALESCE(jsonb_agg(moment_payload ORDER BY sort_index, moment_name), '[]'::jsonb) AS data
  FROM (
    SELECT
      pm.sort_index,
      m.name AS moment_name,
      jsonb_build_object(
        'moment_name', m.name,
        'moment_kind', m.kind,
        'stars', pm.stars,
        'sort_index', pm.sort_index,
        'activities', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'activity_name', a.name,
              'stars', pma.stars,
              'sticker_key', 'star-sticker',
              'sort_index', pma.sort_index,
              'tasks', COALESCE((
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'task_name', t.name,
                    'stars', pmat.stars,
                    'sort_index', pmat.sort_index
                  )
                  ORDER BY pmat.sort_index, t.name
                )
                FROM public.profile_moment_activity_tasks pmat
                JOIN public.tasks t ON t.id = pmat.task_id
                WHERE pmat.profile_moment_activity_id = pma.id
              ), '[]'::jsonb)
            )
            ORDER BY pma.sort_index, a.name
          )
          FROM public.profile_moment_activities pma
          JOIN public.activities a ON a.id = pma.activity_id
          WHERE pma.profile_moment_id = pm.id
        ), '[]'::jsonb)
      ) AS moment_payload
    FROM public.profile_moments pm
    JOIN public.moments m ON m.id = pm.moment_id
    JOIN source_profile p ON p.id = pm.profile_id
  ) moments
),
template_rewards AS (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'reward_name', r.name,
      'duration_minutes', pr.duration_minutes,
      'cost_stars', pr.cost_stars,
      'sort_index', pr.sort_index
    )
    ORDER BY pr.sort_index, r.name
  ), '[]'::jsonb) AS data
  FROM public.profile_rewards pr
  JOIN public.rewards r ON r.id = pr.reward_id
  JOIN source_profile p ON p.id = pr.profile_id
),
snapshot AS (
  SELECT jsonb_build_object(
    'catalog', jsonb_build_object(
      'moments', catalog_moments.data,
      'activities', catalog_activities.data,
      'tasks', catalog_tasks.data,
      'rewards', catalog_rewards.data
    ),
    'template', jsonb_build_object(
      'key', 'example',
      'name', 'Exemple',
      'primary_color', source_profile.primary_color,
      'secondary_color', source_profile.secondary_color,
      'sticker_key', 'star-sticker',
      'moments', template_moments.data,
      'rewards', template_rewards.data
    )
  ) AS data
  FROM source_profile
  CROSS JOIN catalog_moments
  CROSS JOIN catalog_activities
  CROSS JOIN catalog_tasks
  CROSS JOIN catalog_rewards
  CROSS JOIN template_moments
  CROSS JOIN template_rewards
)
SELECT format(
  'INSERT INTO _e17_snapshot(data) VALUES ($snapshot$%s$snapshot$::jsonb);',
  data::text
) AS snapshot_insert_sql
FROM snapshot;
