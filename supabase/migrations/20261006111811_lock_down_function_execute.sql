-- Trigger functions are never called directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
revoke execute on function public.set_comment_area() from public, anon, authenticated;
revoke execute on function public.document_submits_request() from public, anon, authenticated;
revoke execute on function public.log_activity() from public, anon, authenticated;
-- Access helpers are needed by RLS for signed-in users only. They only
-- reveal the caller's own permissions.
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.can_view_area(uuid) from public, anon;
revoke execute on function public.can_edit_area(uuid) from public, anon;
revoke execute on function public.shares_area_with(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_view_area(uuid) to authenticated;
grant execute on function public.can_edit_area(uuid) to authenticated;
grant execute on function public.shares_area_with(uuid) to authenticated;
