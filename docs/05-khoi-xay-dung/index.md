# 5. Khối xây dựng — C4 Level 2 & 3

> arc42 §5 — *Building Block View* · **C4 Level 2 (Container)** + **Level 3 (Component)**. Phân rã hệ thống theo **5 tầng**.

## 5.1 Sơ đồ Container (C4 L2)

```mermaid
C4Container
  title C4 L2 — Container (logic) của Sata Robo
  Person_Ext(visitor, "Khách/Lead")
  Person(parent, "Phụ huynh")
  Person(staff, "Nhân sự")

  System_Boundary(sr, "Sata Robo Platform — 1 app Next.js") {
    Container(web, "Next.js App (RSC + Server Actions)", "Next.js 16 / React 19", "3 route group: public · admin · portal (+ auth)")
    Container(api, "API & Webhook Routes", "Next Route Handlers", "/api/* : upload-url, cron, webhook Meta/Zalo, auth")
    Container(cron, "Cron Jobs", "Vercel Cron", "Email queue, SLA, dispatcher DomainEvent, queue DB")
    ContainerDb(db, "PostgreSQL", "Supabase + Prisma 5", "200+ models, scopedDb")
  }

  System_Ext(r2, "Cloudflare R2")
  System_Ext(resend, "Resend")
  System_Ext(redis, "Upstash Redis")
  System_Ext(meta, "Meta")

  Rel(visitor, web, "Xem public", "HTTPS")
  Rel(parent, web, "Portal", "HTTPS")
  Rel(staff, web, "Admin", "HTTPS")
  Rel(web, db, "Prisma (scopedDb)", "SQL")
  Rel(api, db, "Prisma", "SQL")
  Rel(cron, db, "Đọc queue/outbox", "SQL")
  Rel(web, r2, "Presigned upload/serve", "S3")
  Rel(web, redis, "Rate limit", "HTTPS")
  Rel(cron, resend, "Gửi email", "HTTPS")
  Rel(meta, api, "Webhook lead", "HTTPS")
```

## 5.2 Phân rã theo 5 tầng

```mermaid
flowchart TD
  A["Tầng Trình bày — app/(public|admin|portal|auth)"] --> B["Tầng Ứng dụng — Server Actions · API · validators (Zod)"]
  B --> C["Tầng Nghiệp vụ — lib/* (crm · lms · finance · auth · events · scorm…)"]
  C --> D["Tầng Dữ liệu — Prisma + PostgreSQL (200+ models)"]
  C --> E["Tầng Tích hợp — R2 · Resend · Redis · Meta · Zalo · Sentry · GA4"]
```

| Tầng | Thư mục chính | Trách nhiệm | Trang |
|---|---|---|---|
| **Trình bày** | `app/(public\|admin\|portal\|auth)`, `components/*` | RSC + client components, render UI, host-based routing | [→ Tầng Trình bày](./tang-trinh-bay) |
| **Ứng dụng** | `*/actions.ts`, `app/api/*`, `lib/validators/*` | Server Actions, API routes, xác thực Zod, gọi nghiệp vụ | [→ Tầng Ứng dụng](./tang-ung-dung) |
| **Nghiệp vụ** | `lib/{crm,lms,finance,auth,events,scorm,…}` | Logic miền, quy tắc, transaction, DomainEvent | [→ Tầng Nghiệp vụ](./tang-nghiep-vu) |
| **Dữ liệu** | `prisma/`, `lib/db.ts`, `lib/db-scope.ts` | Schema, migration, truy vấn, cách ly cơ sở | [→ Tầng Dữ liệu](./tang-du-lieu) |
| **Tích hợp** | `lib/{storage,email,crm/meta-*}`, `modules/integration` | Cổng ra hệ ngoài | [→ Tầng Tích hợp](./tang-tich-hop) |

:::info 🚧 Khung
Mỗi trang tầng đang ở mức **khung** (mục đích + sơ đồ component skeleton + file chính). Bước 2 sẽ chi tiết hoá từng component & từng tính năng.
:::
