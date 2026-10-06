-- Lets the sign-in page show "create the first admin" only before setup.
create function public.setup_required() returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.profiles where role = 'admin');
$$;
revoke execute on function public.setup_required() from public;
grant execute on function public.setup_required() to anon, authenticated;
