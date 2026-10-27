import { supabase } from './supabase';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Account {
  isAdmin: boolean;
  profile: { name: string | null; phone: string | null; marketing_agree: boolean; created_at: string } | null;
  business: { status: ReviewStatus; companyName: string; businessNumber: string; reviewNote: string | null; hasCert: boolean } | null;
  vendor: { id: string; status: ReviewStatus; companyName: string; businessNumber: string; reviewNote: string | null; hasCert: boolean } | null;
}

export async function fetchAccount(): Promise<Account | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('my_account');
  if (error || !data) return null;
  return data as Account;
}

export type SignupKind = 'business' | 'vendor';

export interface BusinessSignupInput {
  kind: SignupKind;
  email: string;
  password: string;
  name: string;
  phone: string;
  companyName: string;
  businessNumber: string;
  representative: string;
  address: string;
  mailOrderNumber?: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  marketingAgree: boolean;
}

/** 사업자·도매처 가입. 신청서는 가입 메타데이터로 서버 트리거가 만든다. */
export async function signupBusiness(input: BusinessSignupInput): Promise<{ error?: string; needsEmailConfirm?: boolean }> {
  if (!supabase) return { error: '지금은 가입을 받을 수 없습니다.' };
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/mypage`,
      data: {
        signup_kind: input.kind,
        name: input.name.trim(),
        phone: input.phone.trim(),
        company_name: input.companyName.trim(),
        business_number: input.businessNumber.trim(),
        representative: input.representative.trim(),
        address: input.address.trim(),
        mail_order_number: input.mailOrderNumber?.trim() ?? '',
        bank_name: input.bankName?.trim() ?? '',
        bank_account: input.bankAccount?.trim() ?? '',
        bank_holder: input.bankHolder?.trim() ?? '',
        marketing_agree: input.marketingAgree,
      },
    },
  });
  if (error) {
    if (/registered|already/i.test(error.message)) return { error: '이미 가입된 이메일입니다. 로그인해주세요.' };
    if (/password/i.test(error.message)) return { error: '비밀번호는 8자 이상으로 정해주세요.' };
    return { error: error.message };
  }
  return { needsEmailConfirm: !data.session };
}

/** 카카오 간편가입·로그인 (Supabase Auth 카카오 공급자) */
export async function loginWithKakao(next = '/') {
  if (!supabase) return { error: '지금은 로그인할 수 없습니다.' };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: { redirectTo: `${window.location.origin}${next}` },
  });
  if (error) {
    return { error: /provider is not enabled|Unsupported provider/i.test(error.message) ? '카카오 로그인이 아직 준비 중입니다.' : error.message };
  }
  return {};
}

/** 사업자등록증 업로드 (비공개 저장소, 본인 폴더) */
export async function uploadBusinessCert(file: File): Promise<{ error?: string }> {
  if (!supabase) return { error: '업로드할 수 없습니다.' };
  if (file.size > 10 * 1024 * 1024) return { error: '10MB 이하 파일만 올릴 수 있습니다.' };
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return { error: '로그인 후 올려주세요.' };
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${uid}/business-cert-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('business-docs').upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: error.message };
  const { error: setError } = await supabase.rpc('set_my_cert', { p_path: path });
  return setError ? { error: setError.message } : {};
}

export const REVIEW_LABEL: Record<ReviewStatus, string> = {
  pending: '승인 대기',
  approved: '승인 완료',
  rejected: '반려',
  suspended: '이용 정지',
};

export function isValidBusinessNumber(value: string) {
  return /^\d{3}-?\d{2}-?\d{5}$/.test(value.trim());
}
