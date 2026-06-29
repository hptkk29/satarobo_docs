---
sidebar_position: 2
title: Container — Cron Jobs
---

# Container — Cron Jobs

> 🚧 **Khung**. Concern: xử lý bất đồng bộ (DB-backed queue + dispatcher DomainEvent).

| Thuộc tính | Giá trị |
|---|---|
| Loại | Vercel Cron (scheduled functions) |
| Tech | Next Route Handlers `/api/cron/*` |
| Nhiệm vụ | Email queue, SLA lead, dispatcher `DomainEvent`, dọn rác |
| Idempotency | Handler idempotent (dedupeKey) |

## Công việc định kỳ (skeleton)
| Job | Vai trò |
|---|---|
| Email queue | Gửi `EmailQueue` qua Resend |
| Event dispatcher | Đẩy `DomainEvent` outbox → handler |
| SLA / nhắc | Lead quá hạn, sắp hết khoá |

## Sẽ chi tiết
- [ ] Lịch chạy từng job + endpoint.
- [ ] Cơ chế outbox: publish (trong tx) → dispatch → handler idempotent.
