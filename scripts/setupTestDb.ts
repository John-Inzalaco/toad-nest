/* eslint-disable no-console */
import { execSync } from 'child_process';
import { Client } from 'pg';

async function setupDashboardDb() {
  const databaseUrl = `postgres://postgres:postgres@localhost:5432/test_nest_dashboard?schema=public`;
  const client = new Client({
    connectionString: databaseUrl,
  });
  await client.connect();
  await client.query(`DROP SCHEMA IF EXISTS "public" CASCADE`);
  await client.query(`CREATE SCHEMA IF NOT EXISTS "public"`);
  await client.query(`CREATE EXTENSION IF NOT EXISTS hstore SCHEMA "public"`);
  execSync(
    `DATABASE_URL=${databaseUrl} yarn prisma db push --schema=./prisma/dashboard.prisma`,
  );
  await client.query(`
    INSERT INTO offerings (id, name, gam_network_code, created_at, updated_at, offering_code)
    VALUES (1, 'Mediavine Ad Management', 1030006, '2022-06-16 13:58:58.574407', '2022-06-16 13:58:58.574407', 'mediavine'),
            (3, 'Universal Bid', NULL, '2022-06-16 13:58:58.582705', '2022-06-16 13:58:58.582705', 'universalbid'),
            (2, 'PubNation', 22794612459, '2022-06-16 13:58:58.579087', '2022-08-01 22:32:35.021789', 'pubnation')
  `);
  await client.query(`
    INSERT INTO categories (id, title, slug, parent_id, iab_code, created_at, updated_at)
    VALUES
      (1, 'Arts & Entertainment', 'arts-and-entertainment', 1, 'IAB1', '2023-05-30', '2023-05-30'),
      (2, 'Education', 'education', NULL, 'IAB5', '2023-05-30', '2023-05-30'),
      (3, 'Family & Parenting', 'family-and-parenting', NULL, 'IAB6', '2023-05-30', '2023-05-30'),
      (4, 'Health & Fitness', 'health-and-fitness', NULL, 'IAB7', '2023-05-30', '2023-05-30'),
      (5, 'Food & Drink', 'food-and-drink', NULL, 'IAB8', '2023-05-30', '2023-05-30'),
      (6, 'Hobbies & Interests', 'hobbies-and-interests', NULL, 'IAB9', '2023-05-30', '2023-05-30'),
      (7, 'Home & Garden', 'home-and-garden', NULL, 'IAB10', '2023-05-30', '2023-05-30'),
      (8, 'Style & Fashion', 'style-and-fashion', NULL, 'IAB18', '2023-05-30', '2023-05-30'),
      (9, 'Travel', 'travel', NULL, 'IAB20', '2023-05-30', '2023-05-30'),
      (10, 'Vegan', 'food-and-drink-vegan', 5, 'IAB8-16', '2023-05-30', '2023-05-30');
  `);
  await client.query(`
    INSERT INTO countries (id, name, code)
    VALUES
      (1, 'Afghanistan', 'AF'),
      (2, 'China', 'CN'),
      (3, 'India', 'IN'),
      (4, 'Indonesia', 'ID'),
      (5, 'Pakistan', 'PK'),
      (6, 'United States', 'US'),
      (7, 'Brazil', 'BR'),
      (8, 'Nigeria', 'NG'),
      (9, 'Bangladesh', 'BD'),
      (10, 'Russia', 'RU');
  `);

  await client.query(`create or replace function paper_trail_trigger() returns trigger as
  $$
  declare
    config jsonb;
    new_object jsonb;
    old_object jsonb;
    object jsonb;
    object_changes jsonb;
    key text;
    val text;
    retval record;
    event text;
    item_type text;
    item_subtype text;
    change_timestamp timestamptz;
    num_changed_keys int;
  
  begin
    case tg_op
      when 'INSERT' then
        new_object := row_to_json(new);
        retval := new;
        event := 'create';
  
      when 'UPDATE' then
        new_object := row_to_json(new);
        old_object := row_to_json(old);
        object := old_object;
        retval := new;
        event := 'update';
  
      when 'DELETE' then
        old_object := row_to_json(old);
        object := old_object;
        retval := old;
        event := 'destroy';
        change_timestamp := clock_timestamp();
    end case;
  
    config := tg_argv[0];
    object_changes := '{}';
    item_type := config->>'item_type';
  
    if nullif(current_setting('app.current_user_id', true), '') is null then
      return retval;
    end if;
  
    if change_timestamp is null then
      begin
        change_timestamp := new.updated_at;
      exception when undefined_column then
        raise notice 'No updated_at column, using clock_timestamp()';
        change_timestamp := clock_timestamp();
      end;
    end if;
  
    for key in
      select * from jsonb_object_keys(coalesce(old_object, new_object))
    loop
      continue when old_object->>key = new_object->>key;
      continue when old_object->>key is null and new_object->>key is null;
      continue when key = 'updated_at';
  
      object_changes := object_changes || jsonb_build_object(key, array[old_object->key, new_object->key]);
    end loop;
  
    num_changed_keys = (select count(*) from jsonb_object_keys(object_changes));
    if num_changed_keys = 0 then
      return retval;
    end if;

    insert into versions (item_type, item_id, event, whodunnit, ip, object, object_changes, created_at)
      values (
        item_type,
        retval.id,
        event,
        nullif(current_setting('app.current_user_id', true), '')::int,
        nullif(current_setting('app.current_user_ip', true), ''),
        object,
        object_changes,
        change_timestamp
      );
  
    return retval;
  end;
  $$ language 'plpgsql' security definer;`);
  await client.query(
    `create trigger trig_users_paper_trail before insert or update or delete on users for each row execute procedure paper_trail_trigger('{"item_type": "User"}');`,
  );
  await client.query(
    `create trigger trig_site_users_paper_trail before insert or update or delete on site_users for each row execute procedure paper_trail_trigger('{"item_type": "SiteUser"}');`,
  );
  await client.query(
    `create trigger trig_site_paper_trail before insert or update or delete on sites for each row execute procedure paper_trail_trigger('{"item_type": "Site"}');`,
  );
  await client.query(
    `create trigger trig_payee_paper_trail before insert or update or delete on payees for each row execute procedure paper_trail_trigger('{"item_type": "Payee"}');`,
  );
  await client.query(
    `create trigger trig_optout_paper_trail before insert or update or delete on optouts for each row execute procedure paper_trail_trigger('{"item_type": "Optout"}');`,
  );
  await client.query(
    `create trigger trig_onboarding_application_paper_trail before insert or update or delete on onboarding_applications for each row execute procedure paper_trail_trigger('{"item_type": "OnboardingApplication"}');`,
  );
  await client.end();
}

async function setupReportingDb() {
  const reportinDbUrl = `postgres://postgres:postgres@localhost:5432/test_nest_reporting?schema=public`;
  const reportingClient = new Client({
    connectionString: reportinDbUrl,
  });
  await reportingClient.connect();
  await reportingClient.query(`DROP SCHEMA IF EXISTS "public" CASCADE`);
  await reportingClient.query(`DROP SCHEMA IF EXISTS "dashboard_link" CASCADE`);
  await reportingClient.query(`CREATE SCHEMA IF NOT EXISTS "public"`);
  await reportingClient.query(`CREATE SCHEMA IF NOT EXISTS "dashboard_link"`);
  execSync(
    `REPORTING_DATABASE_URL=${reportinDbUrl} yarn prisma db push --schema=./prisma/reporting.prisma`,
  );
  await reportingClient.query(
    `CREATE EXTENSION IF NOT EXISTS hstore SCHEMA "public"`,
  );
  await reportingClient.query(
    `CREATE EXTENSION IF NOT EXISTS postgres_fdw SCHEMA "public"`,
  );
  await reportingClient.query(
    `CREATE SERVER IF NOT EXISTS server_dashboard_link FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host 'localhost', port '5432', dbname 'test_nest_dashboard')`,
  );
  await reportingClient.query(
    `CREATE USER MAPPING FOR postgres SERVER server_dashboard_link OPTIONS (user 'postgres', password 'postgres')`,
  );
  await reportingClient.query(
    `IMPORT FOREIGN SCHEMA "public" LIMIT TO (sites, offerings) FROM SERVER server_dashboard_link INTO "dashboard_link"`,
  );
  await reportingClient.query(
    `CREATE MATERIALIZED VIEW IF NOT EXISTS "public"."mat_premiere_revenue_summaries" AS ${MAT_PREMIERE_REVENUE_SUMMARIES_SQL}`,
  );
  await reportingClient.end();
}

async function setupDefaultTestSchema() {
  try {
    await Promise.all([setupDashboardDb(), setupReportingDb()]);
    console.info(`Setup test schema`);
  } catch (e) {
    console.error(`Failed to setup schema for testing`, e);
  }
}

void setupDefaultTestSchema();

const MAT_PREMIERE_REVENUE_SUMMARIES_SQL = `WITH premiere_sites AS (
  SELECT sites.id AS site_id,
     sites.title,
     sites.anniversary_on,
     (sites.profile -> 'given_notice'::text) AS given_notice,
     to_timestamp((((sites.settings -> 'premiere_accepted_on'::text))::bigint)::double precision) AS premiere_accepted_on,
     date_trunc('day'::text, timezone('America/New_York'::text, to_timestamp((((sites.settings -> 'premiere_accepted_on'::text))::bigint)::double precision))) AS premiere_accepted_on_date,
     (date_trunc('day'::text, timezone('America/New_York'::text, to_timestamp((((sites.settings -> 'premiere_accepted_on'::text))::bigint)::double precision))) - '1 day'::interval) AS last_non_premiere_date
    FROM dashboard_link.sites
   WHERE ((sites.settings -> 'premiere_accepted'::text) = 'true'::text)
 ), premiere_actual_revenue AS (
  SELECT ps.site_id,
     ps.title,
     ps.anniversary_on,
     ps.given_notice,
     ps.premiere_accepted_on_date,
     rev.date,
     rev.revenue,
     rev.net_revenue,
     sum(rolling_30.paid_impressions) AS rolling_30_paid_imp
    FROM ((premiere_sites ps
      LEFT JOIN revenue_reports rev ON (((rev.site_id = ps.site_id) AND (rev.date >= ps.premiere_accepted_on_date))))
      LEFT JOIN revenue_reports rolling_30 ON (((rev.site_id = rolling_30.site_id) AND ((rolling_30.date >= (rev.date - '31 days'::interval)) AND (rolling_30.date <= (rev.date - '1 day'::interval))))))
   GROUP BY ps.site_id, rev.date, rev.revenue, rev.net_revenue, ps.title, ps.anniversary_on, ps.premiere_accepted_on_date, ps.given_notice
 ), prior_rev AS (
  SELECT premiere_actual_revenue.site_id,
     premiere_actual_revenue.title,
     premiere_actual_revenue.anniversary_on,
     premiere_actual_revenue.given_notice,
     premiere_actual_revenue.premiere_accepted_on_date,
     premiere_actual_revenue.date,
     premiere_actual_revenue.revenue,
     premiere_actual_revenue.net_revenue,
     premiere_actual_revenue.rolling_30_paid_imp,
         CASE
             WHEN (premiere_actual_revenue.given_notice = 'true'::text) THEN (0)::double precision
             ELSE (LEAST(date_part('year'::text, age((premiere_actual_revenue.date + '1 day'::interval), (premiere_actual_revenue.anniversary_on)::timestamp without time zone)), (5)::double precision) * (0.01)::double precision)
         END AS loyalty_bonus,
         CASE
             WHEN (premiere_actual_revenue.rolling_30_paid_imp >= 15000000) THEN 0.85
             WHEN (premiere_actual_revenue.rolling_30_paid_imp >= 10000000) THEN 0.825
             WHEN (premiere_actual_revenue.rolling_30_paid_imp >= 5000000) THEN 0.8
             ELSE 0.75
         END AS base_rev_share
    FROM premiere_actual_revenue
 )
SELECT prior_rev.site_id,
prior_rev.premiere_accepted_on_date,
COALESCE(sum(((prior_rev.revenue)::numeric / 10000.0)), (0)::numeric) AS total_premiere_revenue,
COALESCE(sum(((prior_rev.net_revenue)::numeric / 10000.0)), (0)::numeric) AS net_premiere_revenue,
COALESCE(round((sum(((((prior_rev.revenue)::numeric / 10000.0))::double precision * (prior_rev.loyalty_bonus + (prior_rev.base_rev_share)::double precision))))::numeric, 2), (0)::numeric) AS net_without_premiere_revenue,
COALESCE(round((sum(((prior_rev.net_revenue)::numeric / 10000.0)) - (sum(((((prior_rev.revenue)::numeric / 10000.0))::double precision * (prior_rev.loyalty_bonus + (prior_rev.base_rev_share)::double precision))))::numeric), 2), (0)::numeric) AS net_premiere_difference,
now() AS updated_at
FROM prior_rev
GROUP BY prior_rev.site_id, prior_rev.title, prior_rev.premiere_accepted_on_date
`;
