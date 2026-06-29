# 9. Quyết định kiến trúc (ADR)

> arc42 §9 — *Architecture Decisions*. Mỗi quyết định: Bối cảnh → Quyết định → Hệ quả.

> 🚧 **Khung** — mỗi ADR sẽ tách trang riêng (`adr-XXX-*`) ở bước 2.

| ADR | Quyết định | Trạng thái |
|---|---|---|
| ADR-001 | **Modular monolith** thay vì microservice | ✅ chấp nhận |
| ADR-002 | **DB-backed queue + Vercel Cron** thay vì message broker | ✅ |
| ADR-003 | **OrgUnit tree** (ROOT → HO/CS1/CS2 độc lập) | ✅ |
| ADR-004 | **scopedDb** ép cách ly cơ sở (test CI bắt buộc) | ✅ |
| ADR-005 | **DomainEvent outbox** tách side-effect không-atomic | ✅ |
| ADR-006 | **RBAC động (DB)** + audit + reason bắt buộc | 🟡 đang chuyển |
| ADR-007 | **2-phase migration** (additive trước, drop sau) | ✅ |
| ADR-008 | Học viên **không** có tài khoản riêng (qua portal PH) | ✅ |
| ADR-009 | **Hợp nhất ledger Payment** (bỏ split-brain Payment vs OrderInstallment) | 🟡 fix ở working tree |

## Mẫu ADR

```md
# ADR-XXX: <Tiêu đề>
- **Bối cảnh:** <vì sao cần quyết định>
- **Quyết định:** <chọn gì>
- **Hệ quả:** <được gì / mất gì / ràng buộc kéo theo>
- **Trạng thái:** đề xuất | chấp nhận | thay thế bởi ADR-YYY
```
