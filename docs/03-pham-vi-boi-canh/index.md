# 3. Phạm vi & Bối cảnh — C4 Level 1 (System Context)

> arc42 §3 — *Context and Scope* · **C4 Level 1**. Hệ thống Sata Robo nằm ở đâu, ai dùng, kết nối với hệ thống ngoài nào.

## 3.1 Sơ đồ bối cảnh (C4 System Context)

```mermaid
C4Context
  title C4 L1 — Bối cảnh hệ thống Sata Robo
  Person_Ext(visitor, "Khách / Lead", "Xem web public, để lại lead qua form/Messenger")
  Person(parent, "Phụ huynh", "Đăng nhập portal; theo dõi & thay con tương tác")
  Person(staff, "Nhân sự nội bộ", "Đào tạo · Giáo viên · QL lớp · Sale/CSM · Kế toán · Marketing · HR")

  System(satarobo, "Sata Robo Platform", "Next.js modular monolith: public + admin + portal")

  System_Ext(supabase, "Supabase PostgreSQL", "CSDL chính (Prisma)")
  System_Ext(r2, "Cloudflare R2", "Lưu file/ảnh/SCORM")
  System_Ext(resend, "Resend", "Email giao dịch")
  System_Ext(redis, "Upstash Redis", "Rate limit / cache")
  System_Ext(meta, "Meta (Messenger + CAPI + Ads)", "Lead Messenger-first; ads insights")
  System_Ext(zalo, "Zalo OA", "Thông báo ZNS")
  System_Ext(sentry, "Sentry", "Giám sát lỗi")
  System_Ext(ga4, "Google Analytics 4", "Đo lường hành vi")

  Rel(visitor, satarobo, "Xem web, gửi lead", "HTTPS")
  Rel(parent, satarobo, "Dùng portal", "HTTPS")
  Rel(staff, satarobo, "Vận hành admin", "HTTPS")
  Rel(satarobo, supabase, "Đọc/ghi qua Prisma (scopedDb)", "SQL/pooler")
  Rel(satarobo, r2, "Upload/serve (presigned)", "S3 API")
  Rel(satarobo, resend, "Gửi email", "HTTPS")
  Rel(satarobo, redis, "Rate limit", "HTTPS")
  Rel(meta, satarobo, "Webhook lead", "HTTPS")
  Rel(satarobo, meta, "CAPI / đọc ads", "HTTPS")
  Rel(satarobo, zalo, "Gửi ZNS", "HTTPS")
  Rel(satarobo, sentry, "Báo lỗi", "HTTPS")
  Rel(satarobo, ga4, "Sự kiện đo lường", "HTTPS")
```

:::note Học viên không có tài khoản riêng
**Học viên** học offline và **không có đăng nhập riêng** (scope đã loại). Mọi mặt học-viên-facing nằm trong **portal của phụ huynh** — xem [§6 Học viên](/06-runtime-luong/hoc-vien).
:::

## 3.2 Bối cảnh người dùng (chi tiết)

| Tác nhân | Loại | Tương tác chính |
|---|---|---|
| Khách / Lead | ngoài | Xem public, gửi lead (form/Messenger) |
| Phụ huynh (`PARENT`) | người dùng | Portal: học phí, lịch, bài tập/thi, học bạ, ảnh, yêu cầu |
| Nhân sự nội bộ | người dùng | Admin: CRM, lớp, điểm danh, chấm bài, tài chính… (9 vai trò RBAC) |
| Học viên | gián tiếp | Làm bài/thi **qua tài khoản phụ huynh** (cookie `portal_view`) |

## 3.3 Hệ thống ngoài (external systems)

| Hệ thống | Vai trò | Ràng buộc |
|---|---|---|
| Supabase PostgreSQL | CSDL chính | Dùng **pooler** (IPv6 quirk) |
| Cloudflare R2 | Object storage | Presigned URL; CORS cho SCORM |
| Resend | Email | Qua email queue (cron) |
| Upstash Redis | Rate limit | — |
| Meta | Lead + Ads | Webhook + CAPI **chỉ qua** `modules/integration` |
| Zalo OA | Thông báo | — |
| Sentry / GA4 | Quan sát/đo lường | server+edge / client |

→ Cách các container nội bộ kết nối các hệ ngoài này: [§5 Khối xây dựng](/05-khoi-xay-dung) và [§7 Triển khai](/07-trien-khai).
