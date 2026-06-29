# 8. Khái niệm xuyên suốt

> arc42 §8 — *Cross-cutting Concepts*. Mẫu & quy tắc áp dụng ở nhiều nơi.

> 🚧 **Khung** — mỗi khái niệm sẽ có trang chi tiết ở bước 2.

## 8.1 RBAC (phân quyền theo hành động)
- Matrix tĩnh `PERMISSIONS: Record<Action, Role[]>` — `can(user, 'res:action')` / `assertCan(...)`.
- Đa vai trò: quyền = **union**; per-user grant ALLOW/DENY; `SUPER_ADMIN` bypass.
- RBAC động (DB): `RoleDef` + `RolePermission(action, scopeType)` + `UserOrgRole`; UI `/admin/roles`.
- 9 vai trò: `SUPER_ADMIN, CENTER_MANAGER, TRAINING, TEACHER, SALES_CSM, ACCOUNTANT, MARKETING, HR, PARENT`.

## 8.2 Cách ly cơ sở — `scopedDb`
- Inject `centerId ∈ visibleCenterIds` cho `SCOPED_MODELS` khi **đọc**.
- `passesScope()` post-filter ở `findUnique`.
- ⚠️ Chưa auto-scope **write** + nested include → guard thủ công.

## 8.3 DomainEvent outbox
- `publishEvent()` trong transaction → dispatcher → handler idempotent (dedupeKey).
- 15 nhóm handler: `lead.converted`, `payment.confirmed/rejected`, `session.taught`, `makeup.*`, `reportcard.published`, `account.activated`…

## 8.4 Bảo mật & PII
- `canViewParentContact` chặn TEACHER/MARKETING/HR xem SĐT/email PH.
- Không lộ `studentId` trên URL portal; consent ảnh (`StudentConsent`).
- AuditLog hợp nhất + mask PII theo quyền.

## 8.5 Idempotency
- Webhook + confirm payment bắt buộc idempotent (`IdempotencyKey`, dedupeKey).

## Sẽ chi tiết
- [ ] Trang riêng cho từng khái niệm + sơ đồ.
