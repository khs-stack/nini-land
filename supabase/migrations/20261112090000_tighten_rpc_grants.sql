-- 내부용 함수는 외부(API)에서 직접 못 부르게, 로그인 필요한 함수는 비로그인(anon)에서 못 부르게
revoke execute on function public.sync_order_shipping(uuid) from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;

revoke execute on function public.approve_submission(uuid, jsonb) from anon;
revoke execute on function public.reject_submission(uuid, text) from anon;
revoke execute on function public.my_orders() from anon;
revoke execute on function public.my_account() from anon;
revoke execute on function public.my_vendor_id() from anon;
revoke execute on function public.vendor_orders() from anon;
revoke execute on function public.vendor_set_tracking(uuid, text, text) from anon;
revoke execute on function public.settlement_summary(date, date) from anon;
revoke execute on function public.set_my_cert(text) from anon;
