---
sidebar_position: 6
title: Container — Email (Resend)
---

# Container — Email (Resend)

> 🚧 **Khung**. Concern: email giao dịch, gửi qua queue (cron).

| Thuộc tính | Giá trị |
|---|---|
| Loại | Resend (SaaS) |
| Thư mục code | `lib/email/*` |
| Cơ chế | Ghi `EmailQueue` → cron gửi (không gửi đồng bộ trong action) |
| Loại email | Kích hoạt tài khoản, báo cáo tiến độ, thông báo điểm danh, biên lai |

## Sẽ chi tiết
- [ ] Danh mục template + trigger.
- [ ] Retry & log gửi (`EmailLog` / `OtpDeliveryLog`).
