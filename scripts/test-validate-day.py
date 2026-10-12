#!/usr/bin/env python3
"""Run the real schema and E16 migration in an owned, disposable PostgreSQL.

Requires initdb/pg_ctl/psql on PATH (or PG_BINDIR); never accepts a database URL.
--source-ref reads SQL from Git to reproduce the original defect without editing.
"""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[1]
OWNER = '00000000-0000-4000-8000-000000000001'
OTHER = '00000000-0000-4000-8000-000000000002'
PROFILE = '10000000-0000-4000-8000-000000000001'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-ref')
    parser.add_argument('--expect-vulnerable', action='store_true')
    args = parser.parse_args()
    tools = {}
    for name in ('initdb', 'pg_ctl', 'psql'):
        tools[name] = str(Path(os.environ['PG_BINDIR']) / name) if os.environ.get('PG_BINDIR') else shutil.which(name)
        if not tools[name]:
            raise SystemExit(f'Missing PostgreSQL tool: {name}')
    env = {k: v for k, v in os.environ.items() if not k.startswith('PG')}

    def source(path):
        if args.source_ref:
            return subprocess.check_output(['git', '-C', str(ROOT), 'show', f'{args.source_ref}:{path}'], text=True)
        return (ROOT / path).read_text()

    with tempfile.TemporaryDirectory(prefix='maroutine-rpc-') as tmp:
        tmp = Path(tmp)
        os.chmod(tmp, 0o700)
        data, sock = tmp / 'data', tmp / 'socket'
        sock.mkdir(mode=0o700)
        started = False
        try:
            subprocess.run([tools['initdb'], '-D', str(data), '--auth=trust', '--no-locale', '-E', 'UTF8'], env=env, check=True, stdout=subprocess.DEVNULL)
            subprocess.run([tools['pg_ctl'], '-D', str(data), '-l', str(tmp / 'server.log'), '-o', f"-c listen_addresses='' -k {sock} -p 55439", '-w', 'start'], env=env, check=True, stdout=subprocess.DEVNULL)
            started = True

            def sql(db, statement, role=None, uid=None, check=True):
                prefix = f"SET ROLE {role}; SET request.jwt.claim.sub = '{uid or ''}';\n" if role else ''
                result = subprocess.run([tools['psql'], '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-h', str(sock), '-p', '55439', '-d', db], input=prefix + statement, text=True, capture_output=True, env=env)
                if check and result.returncode:
                    raise AssertionError(result.stderr)
                return result

            sql('postgres', 'CREATE ROLE authenticated NOLOGIN; CREATE ROLE anon NOLOGIN;')
            scaffold = """
CREATE SCHEMA auth;
CREATE TABLE auth.users(id UUID PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
 SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;
"""
            fixture = f"""
INSERT INTO auth.users(id) VALUES ('{OWNER}'), ('{OTHER}');
INSERT INTO profiles(id, user_id, name, balance) VALUES ('{PROFILE}', '{OWNER}', 'Enfant fictif', 10);
INSERT INTO daily_validations(profile_id, check_date, earned_stars, new_balance)
VALUES ('{PROFILE}', '2026-01-01', 3, 13);
INSERT INTO daily_checks(profile_id, check_date, target_type, checked, stars_earned) VALUES
('{PROFILE}', '2026-01-02', 'task', true, 7),
('{PROFILE}', '2026-01-02', 'activity', true, 5),
('{PROFILE}', '2026-01-02', 'moment', true, 100),
('{PROFILE}', '2026-01-02', 'task', false, 9),
('{PROFILE}', '2026-01-03', 'task', true, 4);
"""

            def value(db, statement, expected, role=None, uid=None):
                actual = sql(db, statement, role, uid).stdout.strip()
                assert actual == expected, (statement, expected, actual)

            def denied(db, statement, role, uid):
                result = sql(db, statement, role, uid, check=False)
                assert result.returncode != 0 and 'Profil introuvable' in result.stderr, result

            for variant in ('schema', 'migration'):
                db = f'validate_day_{variant}'
                sql('postgres', f'CREATE DATABASE {db};')
                sql(db, scaffold)
                sql(db, source('docs/sql/schema-v2.sql'))
                if variant == 'migration':
                    sql(db, source('docs/sql/migration-e16-rewards-history.sql'))
                sql(db, fixture)
                if args.source_ref:
                    # Historical reproduction keeps the old scaffold grant only.
                    sql(db, 'GRANT SELECT, UPDATE ON profiles TO authenticated;')
                else:
                    # Use the delivered migration, not hidden test-only grants.
                    sql(db, source('docs/sql/migration-e19-data-api-grants.sql'))
                    value(db, "SELECT has_table_privilege('authenticated', 'profiles', 'SELECT'), has_table_privilege('authenticated', 'profiles', 'INSERT'), has_table_privilege('anon', 'profiles', 'SELECT'), has_table_privilege('authenticated', 'balance_history', 'INSERT');", 't|t|f|f')
                    value(db, 'SELECT count(*) FROM profiles;', '1', 'authenticated', OWNER)
                    value(db, 'SELECT count(*) FROM profiles;', '0', 'authenticated', OTHER)
                cached = f"SELECT * FROM validate_day('{PROFILE}', '2026-01-01');"
                if args.expect_vulnerable:
                    value(db, cached, '3|13', 'authenticated', OTHER)
                    value(db, cached, '3|13', 'anon', None)
                    print(f'{variant}: original foreign/anonymous cached disclosure reproduced')
                else:
                    denied(db, cached, 'authenticated', OTHER)
                    denied(db, cached, 'anon', None)
                    denied(db, cached, 'authenticated', None)
                    denied(db, f"SELECT * FROM validate_day('{PROFILE}', '2026-01-02');", 'authenticated', OTHER)
                    denied(db, "SELECT * FROM validate_day(NULL, NULL);", 'authenticated', OWNER)
                    denied(db, "SELECT * FROM validate_day('10000000-0000-4000-8000-999999999999', NULL);", 'authenticated', OWNER)
                value(db, cached, '3|13', 'authenticated', OWNER)
                fresh = f"SELECT * FROM validate_day('{PROFILE}', '2026-01-02');"
                value(db, fresh, '12|22', 'authenticated', OWNER)
                value(db, fresh, '12|22', 'authenticated', OWNER)
                value(db, f"SELECT balance FROM profiles WHERE id='{PROFILE}';", '22')
                value(db, f"SELECT count(*) FROM balance_history WHERE profile_id='{PROFILE}';", '1')
                value(db, f"SELECT count(*) FROM daily_checks WHERE profile_id='{PROFILE}' AND check_date='2026-01-02';", '0')
                value(db, f"SELECT count(*) FROM daily_checks WHERE profile_id='{PROFILE}' AND check_date='2026-01-03';", '1')
                # Historical retry returns its stored result, not today's balance.
                sql(db, f"UPDATE profiles SET balance=99 WHERE id='{PROFILE}';")
                value(db, fresh, '12|22', 'authenticated', OWNER)
                value(db, f"SELECT balance FROM profiles WHERE id='{PROFILE}';", '99')
                value(db, f"SELECT * FROM validate_day('{PROFILE}', '2026-01-04');", '0|99', 'authenticated', OWNER)
                value(db, f"SELECT count(*) FROM balance_history WHERE profile_id='{PROFILE}';", '1')
                value(db, f"SELECT * FROM validate_day('{PROFILE}');", '0|99', 'authenticated', OWNER)
                value(db, f"SELECT * FROM validate_day('{PROFILE}', NULL);", '0|99', 'authenticated', OWNER)
                # One session holds the owner row while two retries overlap.
                sql(db, f"INSERT INTO daily_checks(profile_id, check_date, target_type, checked, stars_earned) VALUES ('{PROFILE}', '2026-01-05', 'task', true, 6);")
                concurrent = f"SELECT * FROM validate_day('{PROFILE}', '2026-01-05');"
                with ThreadPoolExecutor(max_workers=2) as pool:
                    a = pool.submit(sql, db, f"SET application_name='validate-day-locker'; BEGIN; SELECT 1 FROM profiles WHERE id='{PROFILE}' FOR UPDATE; SELECT pg_sleep(3); {concurrent} COMMIT;", 'authenticated', OWNER)
                    def wait_for(statement):
                        deadline = time.monotonic() + 2
                        while time.monotonic() < deadline:
                            if sql(db, statement).stdout.strip() == '1':
                                return
                            time.sleep(0.02)
                        raise AssertionError('Expected concurrent lock state was not observed')
                    wait_for("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND application_name='validate-day-locker' AND wait_event='PgSleep';")
                    b = pool.submit(sql, db, "SET application_name='validate-day-retry'; " + concurrent, 'authenticated', OWNER)
                    wait_for("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND application_name='validate-day-retry' AND wait_event_type='Lock';")
                    results = [a.result(), b.result()]
                assert all(r.stdout.strip().endswith('6|105') for r in results), results
                value(db, f"SELECT balance FROM profiles WHERE id='{PROFILE}';", '105')
                value(db, f"SELECT count(*) FROM daily_validations WHERE profile_id='{PROFILE}' AND check_date='2026-01-05';", '1')
                value(db, f"SELECT count(*) FROM balance_history WHERE profile_id='{PROFILE}' AND idempotency_key='validate_day:2026-01-05';", '1')
                print(f'{variant}: owner, retry, leaf sum, date scope, null date, zero stars, concurrent credit passed')
                if not args.expect_vulnerable:
                    print(f'{variant}: foreign, anonymous, missing-identity/profile refusals passed')
        finally:
            if started:
                subprocess.run([tools['pg_ctl'], '-D', str(data), '-m', 'fast', '-w', 'stop'], env=env, check=True, stdout=subprocess.DEVNULL)


if __name__ == '__main__':
    main()
