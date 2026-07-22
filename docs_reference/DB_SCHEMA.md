# DB_SCHEMA.md — 데이터베이스 테이블 초안 (Supabase / Postgres)

> 초안 단계이며, 개발 2단계 진입 전 검토·확정한다. 도매가격 관련 테이블은 RLS로 엄격히 보호한다.

## 1. 사용자 / 회원

**users** (Supabase Auth 연동)
- id (uuid, PK, auth.users 참조)
- role (enum: guest / member / wholesale_pending / wholesale_approved / admin)
- email, phone
- created_at, updated_at

**user_login_providers**
- id, user_id (FK)
- provider (enum: kakao / naver / phone / email)
- provider_uid
- created_at

**member_profiles** (일반회원)
- id, user_id (FK)
- name, nickname
- marketing_agree, created_at

**wholesale_members** (사업자회원 정보)
- id, user_id (FK)
- representative_name, company_name, business_reg_number
- business_reg_image_url
- business_phone, kakao_id, email
- business_address, shipping_address
- sales_channel, shop_url, sns_url
- operation_type (도매/소매)
- handling_items
- applied_at
- approval_status (enum: pending / approved / rejected / on_hold)
- approved_by (FK admin), approved_at
- privacy_agree_at

**business_documents** (사업자등록증 등 서류 — Storage 비공개 버킷)
- id, wholesale_member_id (FK)
- file_url, file_type, uploaded_at
- 접근권한: 관리자 + 본인만 (RLS)

## 2. 상품

**products**
- id, product_no, name, category_id (FK)
- description, material, made_in, manufacturer, wash_guide, precautions
- status (판매중/품절/판매중지), is_new, is_popular, is_visible
- created_at, updated_at

**product_images**
- id, product_id (FK), image_url, type(main/detail), sort_order

**product_options**
- id, product_id (FK)
- color, size, extra_price, sold_out (bool)

**product_option_stock**
- id, product_option_id (FK), quantity, reserved_quantity

**product_consumer_price** (소비자 판매정보)
- id, product_id (FK)
- price, discount_price, discount_start, discount_end
- shipping_fee, free_shipping_threshold

**product_wholesale_price** (도매가 — 접근 엄격 제한, RLS 필수)
- id, product_id (FK)
- wholesale_price, recommended_retail_price
- min_order_qty, order_unit, mix_order_allowed (bool)
- wholesale_shipping_fee, vat_included (bool)
- is_wholesale_visible (bool, 관리자 공개여부 토글)

**product_schedule** (공구/배송일정)
- id, product_id (FK)
- group_buy_start, group_buy_end, order_deadline
- expected_ship_start, expected_ship_end
- reorder_date, restock_date
- delay_notice, status (공구예정/진행중/마감/제작중/입고예정/배송준비중/배송중/공구종료)
- extra_notice

## 3. 장바구니 / 주문

**carts**
- id, user_id (FK, nullable for guest via session_id), type (consumer/wholesale)

**cart_items**
- id, cart_id (FK), product_option_id (FK), quantity, added_at

**orders**
- id, user_id (FK, nullable for guest), order_type (consumer/wholesale)
- status (결제대기/입금대기/결제완료/상품준비중/제작중/배송준비중/배송중/배송완료/
  취소요청/취소완료/교환요청/교환진행중/반품요청/반품진행중/환불완료)
- total_amount, shipping_fee, coupon_discount, point_used
- payment_method, created_at

**order_items**
- id, order_id (FK), product_id (FK), product_option_id (FK)
- quantity, price_at_order (주문시점 가격 스냅샷 — 필수), price_type(consumer/wholesale)

**payments**
- id, order_id (FK), pg_provider, pg_transaction_id
- amount, status (테스트/실결제 구분 플래그 포함), paid_at

**shipping_addresses**
- id, user_id (FK, nullable), recipient, phone, address, memo, is_default

**shipments**
- id, order_id (FK), carrier, tracking_no, status, shipped_at, delivered_at

**cancellations / exchanges / returns**
- id, order_id (FK), order_item_id (FK, nullable)
- type(cancel/exchange/return), reason, status, requested_at, processed_at
- refund_amount (returns 전용)

**wholesale_transaction_records** (거래명세 관련)
- id, order_id (FK), business_reg_number_snapshot, company_name_snapshot
- issued_at

## 4. 회원 부가 기능

**wishlist** (관심상품)
- id, user_id (FK), product_id (FK), created_at

**recently_viewed**
- id, user_id (FK, nullable/session), product_id (FK), viewed_at

**reviews**
- id, user_id (FK), product_id (FK), order_item_id (FK)
- rating, content, images, created_at

**inquiries** (상품 문의)
- id, user_id (FK, nullable), product_id (FK)
- type(도매문의/일반문의), content, page_url_snapshot
- status, answered_at

## 5. 운영 / 설정

**notices** (공지사항) — id, title, content, is_wholesale_only, created_at
**popups** (팝업) — id, image_url, link_url, start_at, end_at, is_active
**external_service_settings** (네이버/카카오 등 연동 설정)
- id, key (naver_place_url / smartstore_url / naver_talktalk_url / naver_login_config /
  naver_pay_config / external_product_url / external_channel_enabled / kakao_id / open_chat_url)
- value, updated_by, updated_at

**image_download_logs** (이미지 일괄 저장 기록)
- id, wholesale_member_id (FK), product_id (FK), downloaded_at, file_type(원본/워터마크)

## 6. RLS 정책 원칙

- `product_wholesale_price`: SELECT는 `role = 'wholesale_approved'` 또는 `role = 'admin'`인
  세션만 허용. INSERT/UPDATE/DELETE는 admin만.
- `business_documents`: SELECT는 본인(`wholesale_member_id`가 본인 소유) 또는 admin만.
- `wholesale_members.approval_status`: UPDATE는 admin만 (본인 포함 일반 사용자는 변경 불가).
- 관리자 판별은 `users.role = 'admin'`을 서버(RLS + API)에서 검증하며 클라이언트가 보낸 role
  값은 신뢰하지 않는다.
