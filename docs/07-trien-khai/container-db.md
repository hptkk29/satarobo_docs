---
sidebar_position: 3
title: Container — PostgreSQL
---

# Container — PostgreSQL (Supabase)

> 🚧 **Khung**. Concern: CSDL chính, 200+ models, cách ly cơ sở.

| Thuộc tính | Giá trị |
|---|---|
| Loại | Supabase managed Postgres |
| Truy cập | Prisma 5 qua **pooler** |
| Runtime | transaction pooler `:6543` (`DATABASE_URL`) |
| Migrate | session pooler `:5432` (`DIRECT_URL`) |
| Username | `postgres.<project-ref>` |
| Backup | RPO 24h / RTO 4–8h |

:::warning Supabase IPv6 quirk
Direct `db.<ref>.supabase.co:5432` chỉ có **AAAA record** → mạng IPv4 không tới. **Luôn dùng pooler**.
:::

## Dev/Test
Postgres 16 **local Docker** (`satarobo_test`), không trỏ Supabase. Xem [§7 Triển khai](/07-trien-khai).

## Sẽ chi tiết
- [ ] ERD theo nhóm (xem [Tầng Dữ liệu](/05-khoi-xay-dung/tang-du-lieu)).
- [ ] Chiến lược migration 2-phase, seed.
