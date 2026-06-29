---
sidebar_position: 4
title: Tầng Dữ liệu (Data)
---

# Tầng Dữ liệu (Data)

> 🚧 **Khung** — sẽ chi tiết hoá ERD theo nhóm & cách ly cơ sở ở bước 2.

**Trách nhiệm:** schema Prisma (200+ models), migration, truy vấn, **cách ly cơ sở** (`scopedDb`).

## Sơ đồ quan hệ cốt lõi LMS (skeleton)

```mermaid
erDiagram
  Lead ||--o{ Enrollment : "convert"
  Student ||--o{ Enrollment : ""
  Class ||--o{ Enrollment : ""
  Class ||--o{ ClassSession : ""
  ClassSession ||--o{ Attendance : ""
  Enrollment ||--o{ Attendance : ""
  Enrollment ||--o{ ReportCard : ""
  Class ||--o{ Assignment : ""
  Assignment ||--o{ AssignmentSubmission : ""
  Order ||--o{ OrderInstallment : ""
  Order ||--o{ Payment : ""
  Enrollment ||--o{ Payment : ""
```

## Nhóm model (200+ models)

| Nhóm | Model tiêu biểu |
|---|---|
| Tổ chức & quyền | `OrgUnit`, `RoleDef`, `RolePermission`, `UserOrgRole`, `User`, `Center` |
| CRM | `Lead`, `LeadChild`, `LeadActivity`, `MessengerConversation`, `CommissionStatement` |
| Đào tạo | `Course`, `CoursePackage`, `Curriculum`, `Lesson`, `Class`, `ClassSession`, `Enrollment`, `Student` |
| Đánh giá | `Exam`, `Question`, `Assignment`, `ReportCard`, `StudentSkillAssessment`, `EvalForm` |
| Tài chính | `Order`, `OrderInstallment`, `Payment`, `Receipt`, `Voucher`, `RefundRequest` |
| Vận hành | `MakeupNeed`, `StudentRiskAlert`, `TrialClassV2`, `ScormPackage`, `Notification` |
| Audit/queue | `AuditLog`, `DomainEvent`, `EmailQueue`, `IdempotencyKey` |

## Cách ly cơ sở (scopedDb)

- `SCOPED_MODELS` (vd `Lead, Order, Student, Class, Payment, Enrollment, ClassSession`) → tự chèn `centerId ∈ visibleCenterIds` khi **đọc**.
- `SCOPE_EXEMPT` (vd `Attendance, ReportCard, EvaluationRound`) → lọc thủ công.
- ⚠️ **Write chưa auto-scope** → cần `passesScope` thủ công. Xem [§11 Rủi ro](/11-rui-ro-no-ky-thuat).

## Quy ước (Supabase / Prisma)
- Luôn dùng **pooler** (IPv6 quirk): runtime `:6543`, migrations `:5432`.
- Test = Postgres **local Docker**, không trỏ Supabase.

## Sẽ chi tiết
- [ ] ERD đầy đủ theo từng nhóm.
- [ ] Vòng đời trạng thái (Lead, Enrollment, Class, Payment, ReportCard).
