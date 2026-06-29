---
sidebar_position: 5
title: Tầng Tích hợp (Integration)
---

# Tầng Tích hợp (Integration)

> 🚧 **Khung** — sẽ chi tiết hoá từng cổng tích hợp ở bước 2.

**Trách nhiệm:** cổng ra hệ ngoài. Định hướng đích: **mọi external call chỉ qua `modules/integration`** (idempotent, retry, log).

## Thành phần (C4 L3 — skeleton)

```mermaid
C4Component
  title C4 L3 — Tầng Tích hợp
  Container_Boundary(int, "Integration gateways") {
    Component(storage, "Storage (R2)", "lib/storage/*", "presign, signed-url, upload-config")
    Component(email, "Email (Resend)", "lib/email/*", "client, queue, triggers")
    Component(rate, "Rate limit (Redis)", "Upstash", "")
    Component(meta, "Meta", "lib/crm/meta-*", "webhook lead, CAPI, ads-insights")
    Component(zalo, "Zalo OA", "ZaloMessageLog", "ZNS")
    Component(obs, "Observability", "Sentry / GA4", "lỗi / đo lường")
  }
```

## Cổng tích hợp

| Cổng | Thư mục/Model | Ghi chú |
|---|---|---|
| Cloudflare R2 | `lib/storage/*` | Presigned upload; signed-url (flag `MEDIA_SIGNED_URL`); CORS cho SCORM |
| Resend | `lib/email/*` | Gửi qua `EmailQueue` (cron) |
| Upstash Redis | rate-limit | — |
| Meta | `lib/crm/meta-webhook`, `ads-insights` | Webhook + CAPI; idempotency bắt buộc |
| Zalo OA | `ZaloMessageLog`, `lib/integration/*` | ZNS |
| Sentry / GA4 | config | server+edge / client |

## Sẽ chi tiết
- [ ] Hợp đồng từng cổng (input/output, idempotency, retry, lỗi).
- [ ] Sơ đồ luồng webhook Meta → lead → convert.
