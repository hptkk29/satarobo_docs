# 2. Ràng buộc

> arc42 §2 — *Architecture Constraints*. Những ràng buộc giới hạn không gian thiết kế.

## 2.1 Ràng buộc kỹ thuật (tech stack — FROZEN)

> Không đổi nếu không hỏi (theo `CLAUDE.md`).

| Nhóm | Lựa chọn |
|---|---|
| Framework | **Next.js 16** App Router · React 19 · TypeScript strict |
| UI | Tailwind v4 · shadcn/ui · Magic UI *(client only)* · Framer/Motion *(client only)* · Recharts *(admin only)* |
| Dữ liệu | **PostgreSQL (Supabase)** · Prisma 5 |
| Auth | **Auth.js v5** |
| Lưu trữ | **Cloudflare R2** |
| Email · Rate limit · Monitor | Resend · Upstash Redis · Sentry |
| Hạ tầng | **Vercel** (region `hnd1`) + Vercel Cron · pnpm 11 |

**Nguyên tắc kiến trúc bắt buộc:**
- **KHÔNG** microservice → modular monolith.
- **KHÔNG** message broker → DB-backed queue + Vercel Cron.
- **Server-first**: mặc định Server Component; `'use client'` chỉ khi cần state/effect/handler.
- **Strict TS**: không `any`; Zod schema là source of truth (suy type qua `z.infer`).

## 2.2 Ràng buộc tổ chức & quy ước

- **Route group cố định**: `app/(public|legacy|admin|portal|auth)/…`. Không tạo `/admin/*` ngoài route group.
- **UI library split** (ESLint enforce): admin = shadcn + Recharts; client = shadcn + Magic UI + Motion.
- **Migrations**: Prisma migrate, tên rõ nghĩa; migration đã apply **không sửa** (tạo migration mới).
- **Bảo mật (hook enforce)**: không commit `.env*` (trừ `.env.example`), không hardcode secret.
- **2-phase migration**: thêm cột mới → ổn định → mới drop cột cũ.

## 2.3 Ràng buộc tổ chức doanh nghiệp

- Tổ chức thật: **HO (Hội sở) + CS1 (211 Nguyễn Hữu Thọ) + CS2 (114 Hoàng Diệu)**.
- HO **độc lập** dưới ROOT, KHÔNG thuộc CS2 dù trùng địa chỉ → không dùng `address` để suy quan hệ quản lý.
- Lead **Messenger-first** (Page HO) theo phễu SR.QD.217 (L1 → L2 → L3).

→ Định hướng đích: [Blueprint Doc 15](/04-chien-luoc-giai-phap).
