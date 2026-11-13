-- Applied to the GST Invoice Buddy Supabase project on 2026-11-13.
-- Requires the baseline public tables and business_memberships unique constraint.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_business_member(target_business_id uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.business_memberships m where m.business_id = target_business_id and m.user_id = auth.uid()); $$;
revoke all on function private.is_business_member(uuid) from public, anon;
grant execute on function private.is_business_member(uuid) to authenticated;

create or replace function public.add_business_owner_membership()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.business_memberships (business_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (business_id, user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.add_business_owner_membership() from public, anon, authenticated;
drop trigger if exists businesses_add_owner_membership on public.businesses;
create trigger businesses_add_owner_membership after insert on public.businesses
for each row execute function public.add_business_owner_membership();

drop policy if exists "members read audit logs" on public.audit_logs;
drop policy if exists "business owners and members can read businesses" on public.businesses;
drop policy if exists "members manage customers" on public.customers;
drop policy if exists "members manage invoices" on public.invoices;
drop policy if exists "members manage invoice items" on public.invoice_items;
drop policy if exists "members read payments" on public.invoice_payments;
drop policy if exists "members read subscriptions" on public.plan_subscriptions;
drop function if exists public.is_business_member(uuid);

create policy "business owners and members can read businesses" on public.businesses for select to authenticated
using (owner_id = (select auth.uid()) or private.is_business_member(id));
create policy "members manage customers" on public.customers for all to authenticated
using (private.is_business_member(business_id)) with check (private.is_business_member(business_id));
create policy "members manage invoices" on public.invoices for all to authenticated
using (private.is_business_member(business_id) and (customer_id is null or exists (select 1 from public.customers c where c.id = invoices.customer_id and c.business_id = invoices.business_id)))
with check (private.is_business_member(business_id) and (customer_id is null or exists (select 1 from public.customers c where c.id = invoices.customer_id and c.business_id = invoices.business_id)));
create policy "members manage invoice items" on public.invoice_items for all to authenticated
using (exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and private.is_business_member(i.business_id)))
with check (exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and private.is_business_member(i.business_id)));
create policy "members read payments" on public.invoice_payments for select to authenticated
using (exists (select 1 from public.invoices i where i.id = invoice_payments.invoice_id and private.is_business_member(i.business_id)));
create policy "members read subscriptions" on public.plan_subscriptions for select to authenticated
using (private.is_business_member(business_id));
create policy "members read audit logs" on public.audit_logs for select to authenticated
using (private.is_business_member(audit_logs.business_id));

insert into public.business_memberships (business_id, user_id, role)
select b.id, b.owner_id, 'owner' from public.businesses b
on conflict (business_id, user_id) do nothing;
