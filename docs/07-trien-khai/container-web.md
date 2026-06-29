---
sidebar_position: 1
title: Container — Next.js App
---

# Container — Next.js App (web)

> 🚧 **Khung**. Concern: render UI (RSC) + Server Actions + API routes.

| Thuộc tính | Giá trị |
|---|---|
| Loại | Vercel serverless / edge functions |
| Tech | Next.js 16 (App Router), React 19, TypeScript |
| Vào | HTTPS từ 3 host (public/admin/portal) qua `proxy.ts` |
| Ra | PostgreSQL (Prisma), R2 (S3), Redis, Sentry |
| Scaling | Tự co giãn theo request (serverless) |
| Region | `hnd1` (gần Supabase) |

## Biến môi trường chính (skeleton)
`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `R2_*`, `RESEND_API_KEY`, `UPSTASH_REDIS_*`, `SENTRY_DSN`, `META_*`, feature flags (`SCORM_ENABLED`, `SESSION_LIFECYCLE_V2`, `EVAL_V2`, `MEDIA_SIGNED_URL`).

## Sẽ chi tiết
- [ ] Bảng env đầy đủ + mô tả + bắt buộc/tuỳ chọn.
- [ ] Cold start, giới hạn thời gian function, streaming RSC.
