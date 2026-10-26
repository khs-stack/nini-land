import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 관리자 화면에서 올린 상품 사진(Supabase Storage)
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
