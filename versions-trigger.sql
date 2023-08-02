create or replace function paper_trail_trigger() returns trigger as
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
$$ language 'plpgsql' security definer;