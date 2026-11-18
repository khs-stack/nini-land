-- 2026-11-18 관리자가 관리자 화면에서 자기 로그인 아이디(이메일)를 바꾼다.
-- (비밀번호는 Supabase Auth의 updateUser로 화면에서 바로 바꿈)
create or replace function public.admin_change_my_email(p_email text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if auth.uid() is null or not public.is_admin() then raise exception '관리자만 바꿀 수 있습니다.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 200 then raise exception '이메일 형식을 확인해주세요.'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email and id <> auth.uid()) then
    raise exception '이미 다른 계정이 쓰는 이메일입니다.';
  end if;
  update auth.users set email = v_email, email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
  where id = auth.uid();
  update auth.identities set identity_data = identity_data || jsonb_build_object('email', v_email), updated_at = now()
  where user_id = auth.uid() and provider = 'email';
  return v_email;
end; $$;

revoke all on function public.admin_change_my_email(text) from public;
revoke execute on function public.admin_change_my_email(text) from anon;
grant execute on function public.admin_change_my_email(text) to authenticated;
