# 11. Rủi ro & Nợ kỹ thuật

> arc42 §11 — *Risks and Technical Debt*. Sổ tổng hợp khoảng trống đã đối chiếu code (nguồn: `docs/luong-lms-hien-trang.md`, Phụ lục E).

## 🔴 Ưu tiên cao
| Vấn đề | Bằng chứng |
|---|---|
| **Consent ảnh không có UI cấp/thu hồi** — `grant/revokeMediaConsent` chỉ test gọi → `/portal/hinh-anh` luôn rỗng nếu không set tay | `lib/lms/media-consent.ts:17,26` |
| **`HomeworkAssignment.status` không bao giờ chuyển** — tạo `ASSIGNED` qua `createMany`, không update → "Đã làm/Đã chấm" đứng yên | `lib/lms/assignment.ts:164`; `schema.prisma:3813` |
| **`convertLeadV2` không re-check sĩ số + không check tiên quyết** — rủi ro vượt sĩ số khi convert song song | `lib/crm/convert-lead-v2.ts:194` |

## 🟡 Ưu tiên trung bình
| Vấn đề | Bằng chứng |
|---|---|
| `/admin/parent-feedback` không cách ly cơ sở | `parent-feedback/page.tsx:16-19` |
| `scopedDb` chưa auto-scope WRITE + nested include (IDOR write) | `lib/db-scope.ts` |
| `Attendance` & `ReportCard` còn ở `SCOPE_EXEMPT` | `lib/db-scope.ts:42-57` |
| `cancelClassAction` (hủy lớp + refund) chưa nối UI | `classes/_actions.ts:754` |
| "GV đề xuất chỉnh bài" broken cho TEACHER | `curriculums/_actions.ts:521`; `permissions.ts:425,431` |
| Lịch dạy GV lọc theo cơ sở, không theo lớp phân công | `lib/lms/calendar-data.ts:11` |
| `markAttendance` bỏ qua matrix `attendance:edit` | `attendance/_actions.ts:34-42` |
| Gamification SataCoin rule-based chưa nối | `lib/satacoin/service.ts:78` |
| Tài liệu bài giảng lộ `fileUrl` thô | `lib/portal/learning.ts:172,203` |
| `createParentRequest` không phát event / notify staff | `yeu-cau/actions.ts:61-74` |
| `REGISTERED` thiếu khỏi `KANBAN_COLUMNS` | `lib/leads/status.ts:63-77` |
| `TRAINING` không có quyền duyệt/phát hành ReportCard & CourseCompletion | `permissions.ts:382,390,391` |

## 🟢 Ưu tiên thấp / nợ kỹ thuật
- 2 hệ TrialClass song song (`TrialClass` + `TrialClassV2`).
- 2 hệ "bài" song song (`Assignment` vs `HomeworkAssignment`).
- Phân trang cứng `take 100-200` ở portal.
- Badge thông báo = đếm 7 ngày, không phải "chưa đọc".
- Preview đổi lịch format ngày client-side (rủi ro lệch GMT+7).
- Điểm danh phát side-effect inline thay vì DomainEvent.

:::warning Chưa commit
Fix **PH‑1** (split-brain Payment), **PH‑2** (Lead→REGISTERED), **C4/C5** + migration `20260629142518_lead_payment_enroll_fields` đang ở **working tree, chưa commit** (`satarobo-vn`). Commit + chạy migration trước khi phụ thuộc.
:::
