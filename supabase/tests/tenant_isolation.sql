-- Run against a disposable/local Supabase database.
-- This transaction proves Tenant A cannot read Tenant B through the Data API role.
begin;

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111111','authenticated','authenticated','tenant-a-test@example.invalid','',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222222','authenticated','authenticated','tenant-b-test@example.invalid','',now(),'{}','{}',now(),now());

insert into public.companies(id,name,slug,status) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Tenant A','tenant-a-test','active'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Tenant B','tenant-b-test','active');

insert into public.company_memberships(company_id,user_id,membership_type,status)
values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','company_admin','active'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222','company_admin','active');

insert into public.sync_records(company_id,record_type,record_key,payload,changed_by)
values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','invoice','A-1','{"number":"A-1"}','11111111-1111-1111-1111-111111111111'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','invoice','B-1','{"number":"B-1"}','22222222-2222-2222-2222-222222222222');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',true);

do $$
begin
  if (select count(*) from public.companies) <> 1 then
    raise exception 'tenant isolation failed for companies';
  end if;
  if (select count(*) from public.sync_records) <> 1 then
    raise exception 'tenant isolation failed for sync records';
  end if;
  if not (select bool_and(company_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') from public.sync_records) then
    raise exception 'cross-company row became visible';
  end if;
end $$;

rollback;
