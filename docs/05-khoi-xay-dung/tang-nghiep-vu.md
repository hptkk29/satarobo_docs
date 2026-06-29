---
sidebar_position: 3
title: Tầng Nghiệp vụ (Domain)
---

# Tầng Nghiệp vụ (Domain)

> 🚧 **Khung** — sẽ chi tiết hoá từng module nghiệp vụ ở bước 2.

**Trách nhiệm:** logic miền, quy tắc nghiệp vụ, transaction tiền/enrollment, phát DomainEvent. Đây là "trái tim" LMS.

## Bản đồ module (C4 L3 — skeleton)

```mermaid
C4Component
  title C4 L3 — Tầng Nghiệp vụ (lib/*)
  Container_Boundary(lib, "lib/* domain modules") {
    Component(crm, "crm", "Lead, convert, messenger, commission, marketing")
    Component(lms, "lms", "Session, attendance, homework, report-card, calendar, makeup")
    Component(fin, "finance / orders / payments", "Payment, installment, invoice, refund, debt")
    Component(authm, "auth", "permissions (can), actor, route-policy")
    Component(ev, "events", "DomainEvent outbox: publish + dispatcher + handlers")
    Component(scorm, "scorm", "ingest, manifest, access, ticket")
    Component(other, "courses · classes · enrollments · teachers · risk · transfer · eval · satacoin", "")
  }
  Rel(crm, ev, "publish lead.converted")
  Rel(lms, ev, "publish session.taught / makeup.*")
  Rel(fin, ev, "publish payment.confirmed")
```

## Module chính

| Module | Thư mục | Điểm nhấn |
|---|---|---|
| CRM | `lib/crm/*` | `convert-lead-v2`, `meta-webhook`, `commission`, `marketing-*` |
| LMS | `lib/lms/*` | `session-lifecycle`, `attendance-record`, `assignment`, `report-card`, `makeup`, `calendar` |
| Tài chính | `lib/finance/*`, `lib/orders/*`, `lib/payments/*` | `payment`, `installments`, `invoice-code`, `refund`, `debt` |
| Auth/RBAC | `lib/auth/*` | `permissions` (matrix `can`), `actor`, `route-policy` |
| Events | `lib/events/*` | `publish`, `register`, handlers idempotent |
| SCORM | `lib/scorm/*` | `ingest`, `manifest`, `access`, `ticket` |

## Sẽ chi tiết
- [ ] Sơ đồ component từng module + quan hệ.
- [ ] Danh mục DomainEvent + handler (xem [§8](/08-khai-niem-xuyen-suot)).
- [ ] Ranh giới `modules/*` (đích, ESLint boundary).
