---
sidebar_position: 2
sidebar_label: "📋 Kế hoạch triển khai"
description: "Kế hoạch chi tiết sprint-ready 6 workstream đưa SataRobo từ ~82% lên hoàn thiện."
---

# KẾ HOẠCH TRIỂN KHAI CHI TIẾT — SATAROBO VN

> Kế hoạch sprint-ready cho 6 workstream đưa dự án từ ~82% lên hoàn thiện & gia cố. Mã hạng mục (H1, H2, B0, M1...) khớp với sổ tồn đọng trong `SCOPE-KIEM-SOAT-DU-AN.md`. Lập 2026-06-30.

## Lộ trình tổng (thứ tự ưu tiên)

| Giai đoạn | Workstream | Mục tiêu | Cột mốc |
|---|---|---|---|
| Tuần 1 | B0 + WS-A (lõi) + H7 | Chặn rủi ro: commit fix, write-scope, dashboard, GA4/Pixel | Hết rò rỉ chéo cơ sở cơ bản |
| Tháng 1 | WS-B + WS-A (còn lại) | Toàn vẹn tiền & ghi danh, hoàn tất cách ly | ✅ Go-live an toàn |
| Tháng 2–3 | WS-C + WS-D | Gỡ 5 feature-flag, đóng 2-phase, gia cố HR/Kho/Public | Tính năng đầy đủ chạy thật |
| Tháng 3–4 | WS-E + WS-F | DR drill, cổng thanh toán online, QA & nghiệm thu | Nghiệm thu cuối |

---

## WS-A · Bảo mật & Cách ly đa cơ sở (multi-tenant)

> Workstream gia cố tầng cách ly dữ liệu giữa các cơ sở (CS1 / CS2 / HO). Mục tiêu: biến "cách ly cơ sở" từ một thuộc tính *chỉ đúng ở chiều đọc* thành **bất biến toàn hệ thống (đọc + ghi + media PII)** có test CI bảo vệ. Mọi tham chiếu file/hàm bám sát code thật trong `lib/db-scope.ts`, `lib/auth/`, `lib/lms/`, `lib/storage/`, `lib/portal/`.

### 1. Mục tiêu & Definition of Done

- **Chặn IDOR ghi chéo cơ sở:** mọi thao tác `create` / `update` / `updateMany` / `delete` / `deleteMany` / `upsert` qua `scopedDb(actor)` đều bị validate `centerId` (cả payload `data` lẫn `where`); ghi sai cơ sở bị từ chối **fail-closed**. Có test `[A0-04]` write-path xanh trong CI.
- **Dashboard sạch:** `ManagerDashboard` không còn query `db` trần — 10 KPI query chuyển sang `scopedDb(actor)`; `CENTER_MANAGER@CS1` chỉ thấy số liệu CS1 (kiểm chứng bằng test cách ly).
- **Không rò rỉ PII trẻ em:** `MEDIA_SIGNED_URL=true` trên production sau khi verify presign; ảnh học sinh và tài liệu `/portal/bai-giang` phục vụ qua presigned GET R2, link cũ/đoán ID trả `403`.
- **Giảm bề mặt `@/lib/db` trần:** số entry trong `lib/eslint/db-import-allowlist.mjs` giảm về **0 cho nhóm model nhạy cảm** (`Lead`, `Order`, `Student`, `Payment`) trong phạm vi sprint; tổng allowlist từ ~219 → ≤ 120.
- **Khép tech-debt SCOPE_EXEMPT:** `ReportCard` / `Attendance` / `EvaluationRound` được chuẩn hóa `centerId` non-null và đưa vào `SCOPED_MODELS` (hoặc giữ exempt có lý do văn bản hóa); HMAC secret thiếu env → **crash khi khởi động ở prod** thay vì chỉ `console.warn`.
- **Bất biến CI:** test `[A0-04-T12-01]` tiếp tục bắt mọi model có `centerId` phải nằm đúng 1 trong 2 set (`SCOPED_MODELS` / `SCOPE_EXEMPT`); thêm test write-path và test cách ly dashboard vào pipeline.

### 2. Bảng công việc chi tiết

:::note
Quy ước cột `Effort (PD)` = người-ngày. Các task con của cùng một hạng mục có thể giao cho 1–2 dev. Tên hàm/đường dẫn trong cột "Cách làm" là tên thật từ tài liệu, dev mid bắt tay làm ngay.
:::

#### H1 — `scopedDb` auto-scope chiều GHI (HIGH)

| ID | Hạng mục | Cách làm (file/hàm cụ thể + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| `A1-1` | Hàm validate write thuần | Trong `lib/db-scope.ts` viết `assertWriteInScope(model, args, actor)`: dùng lại `SCOPED_MODELS`, `bypassesScope`, `getModelVisibleCenterIds`. Với `create`/`upsert` đọc `args.data.centerId`; với `update`/`updateMany`/`delete`/`deleteMany` đọc `args.where`; nếu `centerId` không thuộc `visibleCenterIds` (hoặc thiếu khi user cơ sở) → `throw new ScopeWriteError(...)`. `centerScope === "ALL"`/`isHoLevel`/`isSuperAdmin` → pass. | Hàm thuần, không I/O; trả/ném đúng theo ma trận actor × center; coverage ≥ 95% nhánh | Unit test bảng `(actor, model, op, centerId) → pass/throw` trong `lib/db-scope.test.ts` | 2 | — |
| `A1-2` | Mở rộng Prisma Extension chặn write | Trong `scopedDb()` thêm 7 method vào `$allModels`: `create`, `createMany`, `update`, `updateMany`, `upsert`, `delete`, `deleteMany`. Mỗi method gọi `assertWriteInScope(model, args, actor)` **trước** `query(args)` (trừ khi `bypass`). Với `updateMany`/`deleteMany`: nếu `where` không ràng buộc `centerId`, **AND** thêm `{ centerId: { in: visibleCenterIds } }` (tái dùng pattern `injectScope`) để không xóa/sửa nhầm bản ghi cơ sở khác. | 7 method bị chặn fail-closed; `where` của `updateMany`/`deleteMany` luôn bị AND scope; `findUnique`/6 read method giữ nguyên hành vi | Test `[A0-04]` write-path: `CENTER_MANAGER@CS1` `update` Lead của CS2 → ném lỗi | 3 | `A1-1` |
| `A1-3` | Chặn `centerId` trong nested `create`/`connect` | Quét `args.data` đệ quy (nested `create`, `createMany`, `connectOrCreate`) tìm field `centerId`; với mỗi nhánh có `centerId` áp `assertWriteInScope`. Giới hạn độ sâu đệ quy + chỉ duyệt khóa quan hệ của `SCOPED_MODELS` để tránh false-positive. | Tạo `Order` kèm nested `Payment.centerId` của CS khác → bị chặn | Test nested include/create chéo cơ sở | 2 | `A1-2` |
| `A1-4` | Audit & rollout có cờ | Khi `bypass: true` đã có `logScopeBypass(actor, reason)` — đảm bảo mọi write-bypass đều gọi. Thêm cờ tạm `SCOPED_WRITE_ENFORCE` (env, default ON ở staging trước) để bật/tắt nhanh khi rollout; ghi log cảnh báo (không ném) trong giai đoạn shadow 3–5 ngày, sau đó chuyển sang ném. | Có đường rollback bằng env; log bypass đầy đủ trong `RbacAuditLog` | Smoke test staging với cờ ON/OFF | 1–2 | `A1-2` |

#### H4 — `ManagerDashboard` dùng `scopedDb` (HIGH)

| ID | Hạng mục | Cách làm (file/hàm cụ thể + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| `A2-1` | Thay `db` → `scopedDb(actor)` 10 query KPI | Trong `app/(admin)/admin/dashboard/_components/manager-dashboard.tsx` (known gap, bao-cao.mdx §7 + §8 chú thích `:::caution`): lấy `actor` qua `getActor()` rồi `const sdb = scopedDb(actor)`. Thay toàn bộ: `db.lead.count` (tổng/tháng này/tháng trước/`status: "ENROLLED"`), `db.student.count`, `db.lead.findMany({ take: 8 })`, `db.lead.groupBy` (14 ngày + theo `status`). `db.post.count` (Post không có `centerId`) giữ `db` trần — ghi chú rõ. | 10 query nhạy cảm dùng `scopedDb`; `CENTER_MANAGER@CS1` thấy KPI chỉ của CS1; SUPER_ADMIN/HO thấy toàn hệ thống | Test cách ly: mock actor CS1 → count Lead chỉ đếm CS1 | 1–2 | `A1-2` (nên xong write trước để tránh đụng `lib/db-scope.ts`) |
| `A2-2` | Rà các panel KPI còn `db` trần | Soát `sales-dashboard.tsx`, `accountant-dashboard.tsx` (`db.payment.groupBy by centerId`), `teacher-dashboard.tsx`, `marketing-hr-dashboards.tsx`: panel nào đụng `Lead`/`Payment`/`Student`/`Enrollment` thì chuyển `scopedDb(actor)`; panel lọc theo `userId`/`teacherId` đã an toàn thì ghi chú để skip. Cập nhật chú thích known-gap trong `bao-cao.mdx §8`. | Không panel dashboard nào còn đọc model nhạy cảm bằng `db` trần | Snapshot KPI trước/sau cho SUPER_ADMIN không đổi (regression) | 1–2 | `A2-1` |

#### H9 — Signed URL cho ảnh PII + bài giảng (HIGH)

| ID | Hạng mục | Cách làm (file/hàm cụ thể + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| `A3-1` | Verify presign R2 trên staging | Bật `MEDIA_SIGNED_URL=true` ở staging; kiểm `lib/storage/signed-url.ts`: `keyFromPublicUrl(fileUrl)` strip đúng prefix `R2_PUBLIC_URL`, `signedMediaUrl(key, 600)` trả presigned GET sống, hết hạn → R2 `403`. Xác minh `resolveMediaUrl` fail-safe (lỗi ký → trả `fileUrl` gốc) không vô tình giữ link trần ở prod. | Presigned GET hoạt động, TTL 600s đúng; link hết hạn/sai ID → `403` | Manual + script verify presign trên staging | 1 | — |
| `A3-2` | Áp `resolveMediaUrl` cho bài giảng | `app/(portal)/portal/hinh-anh/page.tsx` đã gọi `resolveMediaUrl` cho từng `fileUrl`. Mở rộng sang `/portal/bai-giang`: bọc mọi `fileUrl` tài liệu/đính kèm bài giảng qua `resolveMediaUrl(url, MEDIA_SIGNED_URL_TTL_SECONDS)` (`media-key.ts`, 900s cho tài liệu tải về). Đảm bảo object key dựng qua `buildMediaObjectKey` (không nhúng tên HS, C6.5). | Mọi media phục vụ phụ huynh đi qua presign khi flag ON; không còn `fileUrl` trần trong response portal | Test render gallery + bài giảng với flag ON/OFF | 1–2 | `A3-1` |
| `A3-3` | Bật prod + fail-closed | Sau verify, đặt `MEDIA_SIGNED_URL=true` ở prod. Cân nhắc đổi nhánh fail-safe của `resolveMediaUrl` cho media PII sang **fail-closed có kiểm soát** (trả placeholder thay vì `fileUrl` trần) nếu ký lỗi — quyết định theo rủi ro, văn bản hóa. Cập nhật `hinh-anh-consent.mdx §6` (mặc định không còn OFF ở prod). | Flag ON ở prod, monitor 48h không tăng lỗi 5xx/403 sai; tài liệu cập nhật | Canary + theo dõi log R2 | 1–2 | `A3-2` |

:::caution
`resolveMediaUrl` hiện **fail-safe = trả `fileUrl` trần** khi ký lỗi (hinh-anh-consent.mdx §6). Với ảnh trẻ em đây là rủi ro rò rỉ PII — `A3-3` phải quyết định rõ giữ fail-safe (ưu tiên không vỡ trang) hay đổi fail-closed (ưu tiên bảo mật) và ghi vào ADR.
:::

#### M1 — Migrate ~219 file `@/lib/db` trần → `scopedDb` (MEDIUM)

| ID | Hạng mục | Cách làm (file/hàm cụ thể + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| `A4-1` | Phân loại allowlist theo độ nhạy | Đọc `lib/eslint/db-import-allowlist.mjs` (~219 entry). Gán nhãn mỗi file theo model chạm tới: **P0** (`Lead`/`Order`/`Student`/`Payment`), **P1** (model khác trong `SCOPED_MODELS`), **P2** (chỉ model không scope như `Post`/`OrgUnit`). Xuất bảng theo dõi để migrate theo lô. | Có danh sách P0/P1/P2 với số lượng từng nhóm; định nghĩa thứ tự migrate | — (chỉ phân loại) | 1–2 | — |
| `A4-2` | Migrate lô P0 (model nhạy cảm) | Với mỗi file P0: lấy `actor` qua `getActor()`/`resolveActor()`, đổi `import { db }` đọc/ghi model nhạy cảm sang `scopedDb(actor)`; giữ `db` trần cho thao tác hạ tầng (kèm `bypass: true` + `logScopeBypass` nếu cần). **Xóa file khỏi allowlist** sau khi migrate để ESLint khóa cứng. | Toàn bộ entry P0 = 0 trong allowlist; ESLint chặn import `@/lib/db` mới ở `app/(admin)`/`app/(portal)` | Lint xanh + test cách ly cho từng module P0 | 5–7 | `A1-2`, `A4-1` |
| `A4-3` | Migrate lô P1 (giai đoạn 2, tùy chọn trong sprint) | Lặp `A4-2` cho nhóm P1; có thể tách sang sprint kế. Mục tiêu sprint này: tổng allowlist ≤ 120. P2 chỉ cần ghi chú "an toàn" (model không `centerId`), không bắt buộc migrate. | Allowlist ≤ 120; báo cáo tiến độ về 0 cho các sprint sau | Lint + regression theo module | 3–6 | `A4-2` |

#### A-SE — Khép SCOPE_EXEMPT & fail-fast secret (MEDIUM)

| ID | Hạng mục | Cách làm (file/hàm cụ thể + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| `A5-1` | Chuẩn hóa `centerId` non-null cho 3 model | `ReportCard`, `EvaluationRound`, `Attendance` đang ở `SCOPE_EXEMPT` vì `centerId` nullable + round `TEACHER_EVAL` toàn hệ thống (`centerId = null`). Viết migration backfill `centerId` từ quan hệ Class/Enrollment; với round toàn hệ thống quyết định: tách flag `isGlobalRound` hoặc giữ exempt **có lý do văn bản hóa** trong comment `SCOPE_EXEMPT`. | Backfill xong, `centerId` non-null cho bản ghi center-scope; round toàn hệ thống được nhận diện rõ | Migration dry-run trên bản sao prod; đếm bản ghi `centerId IS NULL` còn lại = 0 (trừ global rounds) | 2 | — |
| `A5-2` | Đưa vào `SCOPED_MODELS` | Sau backfill, chuyển các model đủ điều kiện từ `SCOPE_EXEMPT` sang `SCOPED_MODELS` trong `lib/db-scope.ts`; rà `lib/lms/*` + `lib/eval/*` đang scope-check thủ công (qua `passesScope`) để gỡ phần trùng. Giữ test `[A0-04-T12-01]` (mỗi model `centerId` ở đúng 1 set). | Model đã backfill nằm trong `SCOPED_MODELS`; `[A0-04-T12-01]` xanh; không double-filter | Test cách ly đọc/ghi 3 model; regression LMS/eval | 1–2 | `A5-1`, `A1-2` |
| `A5-3` | Fail-fast HMAC secret ở prod | `secret()` trong `lib/portal/session.ts` lấy `NEXTAUTH_SECRET ?? AUTH_SECRET`, hiện chỉ `console.warn` khi thiếu. Đổi: ở `NODE_ENV === "production"` mà thiếu cả hai env → `throw` lúc khởi tạo (fail-fast), giữ `console.warn` ở dev. Đảm bảo `makeToken`/`verifyToken` (`active-site-token.ts`) không nhận secret rỗng. | Prod thiếu secret → app crash khi boot (không chạy với cookie không ký an toàn); dev vẫn warn | Test `secret()` ở 2 môi trường; kiểm `verifyToken` từ chối khi secret rỗng | 1 | — |

### 3. Trình tự thực hiện

:::tip[Nguyên tắc xếp lịch]
H1 (`lib/db-scope.ts`) là **đường găng** — nhiều hạng mục khác (H4, M1, A-SE) cùng chạm file này, nên làm H1 trước để tránh xung đột merge. H9 và A5-3 **độc lập hoàn toàn**, chạy song song ngay từ đầu.
:::

**Sprint 1 — Tuần 1 (đặt nền + quick wins song song):**
- `A1-1`, `A1-2`, `A1-3` — xây và test auto-scope write (luồng chính, 1–2 dev).
- Song song: `A3-1` → `A3-2` (signed URL), `A5-3` (fail-fast secret), `A4-1` (phân loại allowlist) — không đụng `lib/db-scope.ts`.

**Sprint 1 — Tuần 2 (rollout + lan tỏa):**
- `A1-4` (shadow → enforce write trên staging).
- `A2-1` → `A2-2` (dashboard, sau khi write-scope ổn định).
- `A3-3` (bật `MEDIA_SIGNED_URL` prod sau verify) + monitor 48h.
- `A5-1` → `A5-2` (backfill + đưa 3 model vào `SCOPED_MODELS`) — cần `A1-2` xong để write-scope phủ luôn model mới.
- Bắt đầu `A4-2` (migrate lô P0).

**Sprint 2 (tiếp nối, có thể tách):**
- Hoàn tất `A4-2`, chạy `A4-3` (lô P1) đưa allowlist ≤ 120.
- Bật `SCOPED_WRITE_ENFORCE` ON ở prod sau giai đoạn shadow sạch.

**Quan hệ trước–sau:** `A1-1` → `A1-2` → (`A1-3`, `A1-4`); `A1-2` là tiền đề cho `A2-1`, `A5-2`, `A4-2`. `A3-1` → `A3-2` → `A3-3`. `A5-1` → `A5-2`. Các nhánh H9 và A5-3 song song toàn phần với H1.

### 4. Rủi ro khi thực thi & phương án rollback

| Rủi ro | Mức | Phòng ngừa | Rollback |
|---|---|---|---|
| Auto-scope write chặn nhầm thao tác hợp lệ (false-positive) → vỡ nghiệp vụ ghi | Cao | Giai đoạn shadow 3–5 ngày chỉ log cảnh báo trước khi ném; cờ `SCOPED_WRITE_ENFORCE` | Tắt `SCOPED_WRITE_ENFORCE` (env) — quay về hành vi cũ tức thì, không deploy |
| Đệ quy nested `create` quét sai field → chặn nhầm hoặc bỏ sót | Trung bình | Giới hạn độ sâu, chỉ duyệt khóa quan hệ của `SCOPED_MODELS`; test nested chuyên biệt | Vô hiệu nhánh nested-check, giữ scope phẳng `data.centerId` |
| Bật `MEDIA_SIGNED_URL` prod → ảnh không hiển thị (presign lỗi/clock skew) | Trung bình | Verify staging `A3-1`; `resolveMediaUrl` fail-safe; canary | Đặt `MEDIA_SIGNED_URL=false` (env) — về `fileUrl` trần ngay |
| Backfill `centerId` sai cho `ReportCard`/`EvaluationRound` (round toàn hệ thống) | Trung bình | Dry-run trên bản sao prod; tách `global round` rõ ràng trước migrate | Migration `down` khôi phục `centerId = null`; tạm giữ model ở `SCOPE_EXEMPT` |
| Fail-fast secret làm prod không boot khi cấu hình thiếu | Thấp | Kiểm checklist env trước deploy; chỉ ném ở `production` | Set `NEXTAUTH_SECRET`/`AUTH_SECRET` rồi redeploy (đây là hành vi mong muốn) |
| Migrate allowlist gây xung đột merge diện rộng | Trung bình | Migrate theo lô nhỏ P0→P1, mỗi lô 1 PR; ESLint khóa cứng sau từng lô | Revert PR lô tương ứng (đổi import về `@/lib/db`, thêm lại entry allowlist) |

### 5. Tổng effort & mốc bàn giao

| Hạng mục | Effort (PD) |
|---|---|
| H1 — auto-scope write | 8–12 |
| H4 — dashboard scopedDb | 2–4 |
| H9 — signed URL ảnh + bài giảng | 3–5 |
| M1 — migrate allowlist (có thể tách giai đoạn) | 10–15 |
| A-SE — SCOPE_EXEMPT + fail-fast secret | 3–5 |
| **Tổng workstream** | **20–32 PD** (đã đếm M1 ở mức rút gọn trong sprint; phần P1 còn lại gối sang sprint sau) |

**Mốc bàn giao:**
- **M1 (cuối Tuần 1):** auto-scope write có test xanh ở staging (`A1-1..A1-3`); signed URL verify staging (`A3-1`); fail-fast secret (`A5-3`); allowlist đã phân loại (`A4-1`).
- **M2 (cuối Tuần 2 / hết Sprint 1):** dashboard sạch (`A2`); `MEDIA_SIGNED_URL` ON prod (`A3-3`); 3 model SCOPE_EXEMPT vào `SCOPED_MODELS` (`A5`); lô P0 allowlist = 0.
- **M3 (Sprint 2):** write-enforce ON prod sau shadow sạch; allowlist ≤ 120, lộ trình về 0 cho các sprint kế.

**Định nghĩa "Done" của workstream:** test `[A0-04]` write-path + test cách ly dashboard nằm trong CI và xanh; `[A0-04-T12-01]` tiếp tục bảo vệ phân loại model; không còn `db` trần ở model nhạy cảm trong `app/(admin)`/`app/(portal)`; ảnh PII + bài giảng phục vụ qua presigned URL trên prod.

---

## WS-B · Toàn vẹn Tiền & Ghi danh

> Workstream gia cố tầng tài chính - ghi danh: bảo đảm mọi mutation tiền/ghi danh là **nguyên tử**, có **một nguồn sự thật** duy nhất, hợp nhất hai luồng convert và hai luồng hoàn tiền, và đưa các fix nền đang treo vào pipeline. Phạm vi bám sát 4 hạng mục audit B0/H2/H3/M4 — không mở rộng tính năng.

### 1. Mục tiêu & Definition of Done

- **DoD-1 (B0):** Migration `20260629142518_lead_payment_enroll_fields` và các fix PH-1/PH-2/C4/C5 đã commit + push; `prisma migrate deploy` chạy thành công trên **cả 3 môi trường** (local/staging/prod); `prisma migrate status` báo `Database schema is up to date` ở mọi env. Không còn thay đổi nào nằm ngoài Git (working tree sạch — `git status` trống).
- **DoD-2 (H2):** Chỉ còn **một** đường convert đi qua `convertLeadV2`. Mọi lối vào v1 (`closeLeadAsEnrolled`) đều đi qua `evaluatePaymentGuard`; không thể tạo `Order`/ghi danh khi chưa có `Payment.saleStatus = "RECORDED"` hoặc tổng `finalPrice = 0`. Flag `CONVERT_V2_ENABLED` được gỡ sau khi cắt v1. Đạt 100% pass bộ test guard thanh toán + sĩ số + tiên quyết.
- **DoD-3 (H3):** Khi `RefundRequest` chuyển `APPROVED → PAID`, hệ thống tự sinh bút toán `refundPayment` (Payment `amount < 0`, `accountantStatus = "REFUNDED"`) **trong cùng transaction**. `getDebtRows`/`computeEnrollmentDebt` tính tiền thực nhận gồm cả `REFUNDED` → sổ công nợ khớp với sổ cái Payment ở mọi ghi danh đã hoàn (sai lệch = 0 VND khi đối soát).
- **DoD-4 (M4):** Không còn side-effect tiền/ghi danh chạy **ngoài** transaction tạo cửa sổ bất nhất: `recomputeOrder` chạy trong tx; email `PAYMENT_RECEIPT`/`ORDER_CONFIRMATION` và `publishEvent` đi qua **transactional outbox** (ghi event trong tx, worker đẩy sau).
- **DoD-5 (chung):** Mọi hàm tiền trong `lib/finance/payment.ts` và luồng convert có unit test + integration test cho nhánh atomic/rollback; coverage các hàm thuần (`computeRefund`, `computeEnrollmentDebt`, `evaluatePaymentGuard`) ≥ 90%.
- **DoD-6 (chung):** Có runbook rollback cho từng hạng mục (flag tắt nhanh, revert migration an toàn) được review và lưu trong repo.

### 2. Bảng công việc chi tiết

:::note[Quy ước]
Effort tính theo **ngày-người (PD)** cho 1 dev mid. Mỗi hạng mục lớn tách 2-5 task con. Tên file/hàm lấy thẳng từ tài liệu kỹ thuật hiện hành.
:::

| ID | Hạng mục | Cách làm (file/hàm + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| **B0.1** | Chạy test cho fix treo | Checkout working tree chứa migration `20260629142518_lead_payment_enroll_fields` + fix PH-1/PH-2/C4/C5. Chạy `pnpm test` (unit) + `pnpm prisma validate`. Khoanh vùng đúng các file thuộc PH-1/PH-2/C4/C5 (C5 = chống trùng mã đơn `withUniqueRetry` trong `lib/orders/code.ts`; C4 = dedupe phone trong `lib/crm/lead-qualify.ts`). | Toàn bộ test xanh; `prisma validate` không lỗi; diff đúng phạm vi 4 fix, không lẫn thay đổi lạ. | Chạy full test suite local; review diff thủ công. | 0.25 | — |
| **B0.2** | Commit + push | Tạo nhánh `fix/ws-b-pending-foundation`; `git add` đúng phạm vi; commit theo Conventional Commits, mô tả PH-1/PH-2/C4/C5 + migration. Mở PR, gắn reviewer. | PR merge vào nhánh tích hợp; `git status` sạch; CI xanh. | CI pipeline (lint + test + `prisma migrate diff`). | 0.25 | B0.1 |
| **B0.3** | Đưa `migrate deploy` vào pipeline | Thêm bước `prisma migrate deploy` vào job deploy (trước khi build runtime). Bảo đảm thứ tự: migrate → build → switch traffic. Tham số hóa `DATABASE_URL` theo env. | Pipeline có step migrate riêng, chạy idempotent; deploy staging tự áp migration. | Deploy thử lên staging, xem log step migrate. | 0.25 | B0.2 |
| **B0.4** | Xác minh migration mọi môi trường | Chạy `prisma migrate status` trên local/staging/prod. Nếu prod còn thiếu → lên kế hoạch cửa sổ bảo trì, backup DB trước khi deploy. | `migrate status` = up to date ở cả 3 env; có bản backup prod trước khi áp. | Đối chiếu danh sách `_prisma_migrations` giữa các env. | 0.25 | B0.3 |
| **H2.1** | Bật & đối chiếu v2 trên staging | Set `CONVERT_V2_ENABLED=true` ở staging. Cho chạy song song dữ liệu mẫu qua `submitConvertV2` → `convertLeadV2` (`lib/crm/convert-lead-v2.ts`). So sánh kết quả với v1 `convert-lead.ts`: số `Student`/`Enrollment` tạo ra, dedupe phụ huynh (`classifyParentMatch` trong `lib/crm/dedupe.ts`), nhánh `PARENT_CONFLICT`. | Bảng đối chiếu v1↔v2 cho ≥ 20 ca thật; mọi khác biệt được giải thích (v2 thêm guard/idempotency/dedupe là kỳ vọng). | Test kịch bản: lead `REGISTERED` có/không `Payment RECORDED`, học bổng toàn phần (`totalFinalPrice = 0`), conflict email≠phone. | 1.5 | B0.4 |
| **H2.2** | Bịt lỗ guard ở v1 `closeLeadAsEnrolled` | Trong `lib/crm/convert-lead.ts`, chèn `evaluatePaymentGuard({ hasRecordedPayment, totalFinalPrice })` trước khi tạo `Order`/`Enrollment`; tính `hasRecordedPayment` qua `db.payment.count({ where: { saleStatus: "RECORDED", order: { leadId } } })`. Trả `{ ok:false, code:"PAYMENT_REQUIRED" }` nếu fail. Đây là vá tạm để v1 không tạo Order khi chưa thu tiền **trong khi** chờ cắt sang v2. | v1 không còn tạo `Order` khi chưa có `Payment RECORDED` và `totalFinalPrice > 0`. | Unit test `evaluatePaymentGuard` (3 nhánh) + integration v1 bị chặn đúng. | 1.0 | H2.1 |
| **H2.3** | Cắt v1 delegate sang `convertLeadV2` | Chuyển thân `closeLeadAsEnrolled` thành wrapper gọi `convertLeadV2(actor, {...})` (map tham số 1 học viên → mảng `students`, sinh `idempotencyKey` như trong `actions.ts`). Bảo đảm giữ ràng buộc lead phải `REGISTERED` và CLAIM atomic `Lead.updateMany({ where:{ status:"REGISTERED" }, data:{ status:"ENROLLED" }})`. | Mọi caller cũ của v1 nhận kết quả từ v2; không còn nhánh tạo `Order/Invoice` trong transaction v1. | Re-check sĩ số lớp + tiên quyết khóa học sau convert; test double-submit (idempotency) + race 2 Sale. | 2.0 | H2.2 |
| **H2.4** | Gỡ feature flag & dọn code chết | Khi v2 ổn định trên prod, xóa nhánh `isConvertV2Enabled()` trong `lib/flags.ts` và gate trong `submitConvertV2` (`app/(admin)/admin/leads/[id]/convert/actions.ts`). Xóa hoặc đánh dấu deprecated phần lõi `convert-lead.ts` (giữ test regression nếu cần). | `CONVERT_V2_ENABLED` không còn được tham chiếu trong codebase (`grep` trống); chỉ còn một đường convert. | Full regression CRM convert; smoke test prod sau khi gỡ flag. | 1.0 | H2.3 |
| **H3.1** | Sinh bút toán hoàn khi `APPROVED → PAID` | Trong `hoan-tien/_actions.ts`, tại bước chuyển `RefundRequest` `APPROVED → PAID`, gọi `refundPayment({ paymentId, confirmedById, reason, amount: approvedAmount, expectedUpdatedAt })` (`lib/finance/payment.ts`) **trong cùng `db.$transaction`** với việc cập nhật `RefundStatus = "PAID"`. Chọn `paymentId` gốc từ snapshot `RefundRequest` (Payment `CONFIRMED` của enrollment). | Mỗi `RefundRequest PAID` sinh đúng 1 `Payment` `amount < 0`, `accountantStatus = "REFUNDED"`, `adjustmentOfId` trỏ gốc; rollback nếu một trong hai bước fail. | Integration: duyệt → PAID → kiểm tra tồn tại Payment âm; test rollback khi `refundPayment` trả `STALE_WRITE`. | 2.0 | B0.4 |
| **H3.2** | Đồng bộ tiền thực nhận trong `debt.ts` | Sửa `getDebtRows` và `computeEnrollmentDebt` (`lib/finance/debt.ts`) để filter payment gồm `accountantStatus: { in: ["CONFIRMED","REFUNDED"] }` (hiện chỉ `"CONFIRMED"`). Như vậy bút toán âm `REFUNDED` tự giảm `confirmedPaid` — khớp với cách `suggestEnrollmentRefund` (`lib/finance/refund.ts`) đã tính. | `confirmedPaid` ở trang `/admin/cong-no` phản ánh đúng tiền thực còn lại sau hoàn; đối soát công nợ vs sổ Payment lệch 0 VND. | Unit `computeEnrollmentDebt` với mảng có amount âm; integration: ghi danh đã hoàn hiển thị debt đúng. | 1.0 | H3.1 |
| **H3.3** | Chống hoàn trùng & nhất quán optimistic lock | Bảo đảm `refundPayment` luôn nhận `expectedUpdatedAt` (FIX-H9) khi gọi tự động; chống ca duyệt PAID hai lần bằng CLAIM `RefundRequest.updateMany({ where:{ status:"APPROVED" }, data:{ status:"PAID" }})` (count=0 → dừng). Tận dụng tính idempotent của `createRefundRequest` (1 PENDING/`(enrollmentId,trigger)`). | Không thể sinh 2 Payment âm cho cùng một `RefundRequest`; double-click PAID an toàn. | Test race 2 kế toán bấm PAID đồng thời; test idempotent createRefundRequest. | 1.0 | H3.1 |
| **M4.1** | Đưa `recomputeOrder` vào transaction | Trong `lib/orders/installments.ts`, `recordInstallmentPlan` và `markInstallmentPaid` hiện gọi `recomputeOrder(orderId)` **ngoài** tx. Refactor: cho `recomputeOrder(tx, orderId)` nhận `TxClient` và gọi bên trong cùng `db.$transaction` ghi installment → loại cửa sổ Order `paidAt/status` bất nhất. | Thay đổi `OrderInstallment` và tái tính `Order.status/paidAt` là nguyên tử; rollback đồng bộ. | Test rollback: ép lỗi sau create installment → Order không đổi trạng thái. | 1.5 | B0.4 |
| **M4.2** | Dựng bảng `OutboxEvent` + ghi trong tx | Thêm model `OutboxEvent` (`id`, `type`, `payload Json`, `status`, `createdAt`, `processedAt`) qua migration mới. Sửa `confirmPayment`/`convertLeadV2` để **ghi event vào outbox trong cùng tx** thay vì gọi `publishEvent` sau commit. Email trigger (`PAYMENT_RECEIPT`, `ORDER_CONFIRMATION`) cũng enqueue qua outbox. | Mọi event `payment.confirmed`, `lead.converted`, `consent.granted` được ghi trong tx; nếu tx rollback thì không có event nào. | Test: rollback tx → bảng outbox trống; commit → đúng N event. | 2.0 | M4.1 |
| **M4.3** | Worker đẩy outbox + handler hiện hữu | Viết worker (Vercel Cron/queue) quét `OutboxEvent` `status=PENDING` → gọi `publishEvent` + `sendEmailForTrigger`, rồi đánh dấu `processedAt`. Giữ handler `onLeadConverted` (`lib/crm/_handlers/lead-converted.ts`) idempotent. Bảo đảm at-least-once + idempotent consumer. | Email/event được đẩy sau commit, không mất khi worker retry; xử lý trùng an toàn. | Test: worker chạy 2 lần trên cùng event → 1 email; chèn lỗi mạng → retry thành công. | 1.5 | M4.2 |

### 3. Trình tự thực hiện

:::tip[Nguyên tắc xếp lịch]
B0 là **BLOCKER** — phải xong trước khi mọi hạng mục khác chạm tới schema/migration. H2 và H3 có thể chạy **song song** sau B0 (khác vùng code: CRM convert vs Finance refund). M4 phụ thuộc nền B0 và nên làm sau khi H2/H3 ổn định để tránh refactor transaction chồng chéo.
:::

**Sprint 1 — Tuần 1 (gia cố nền + mở hai mũi)**
- Ngày 1: **B0.1 → B0.4** (tuần tự, ~1 PD) — commit fix treo, đưa migrate vào pipeline, xác minh 3 env. Đây là cổng chặn; không bắt đầu việc khác đụng schema trước khi B0.4 xanh.
- Sau B0.4, **chạy song song 2 nhánh** (2 dev nếu có, hoặc tuần tự nếu 1 dev):
  - Nhánh CRM: **H2.1 → H2.2** (đối chiếu staging + bịt guard v1).
  - Nhánh Finance: **H3.1 → H3.2** (sinh bút toán khi PAID + đồng bộ debt.ts).

**Sprint 1 — Tuần 2 (hợp nhất luồng)**
- **H2.3** (cắt v1 delegate sang `convertLeadV2`) — việc nặng nhất, làm sau khi H2.2 đã chặn được lỗ guard.
- **H3.3** (chống hoàn trùng + optimistic lock) song song với H2.3.
- Bật `CONVERT_V2_ENABLED=true` trên prod cuối tuần 2 (sau soak staging ≥ 3 ngày), theo dõi.

**Sprint 2 — Tuần 3 (atomic side-effect + dọn dẹp)**
- **M4.1 → M4.2 → M4.3** tuần tự (outbox phụ thuộc nhau).
- **H2.4** (gỡ flag, dọn code chết) — chỉ thực hiện sau khi v2 chạy prod ổn định ≥ 1 tuần.
- Hardening: bổ sung test, đối soát công nợ vs sổ cái, viết runbook rollback.

Quan hệ phụ thuộc tóm tắt: `B0.* → (H2.* ∥ H3.*) → M4.* → H2.4`.

### 4. Rủi ro khi thực thi & phương án rollback

| Rủi ro | Mức | Phòng ngừa | Rollback |
|---|---|---|---|
| Migration `20260629142518_*` áp lên prod gây khóa bảng / lỗi cột | Cao | Backup DB trước; chạy `migrate deploy` trong cửa sổ bảo trì; review `migrate diff` | Restore từ backup; `migrate resolve --rolled-back` cho migration lỗi |
| Cắt v1 → v2 (`H2.3`) sót caller, convert hỏng diện rộng | Cao | Giữ `CONVERT_V2_ENABLED` làm kill-switch; soak staging; canary prod | Set `CONVERT_V2_ENABLED=false` → quay về v1 ngay (chưa thực hiện H2.4) |
| `refundPayment` tự động (`H3.1`) sinh bút toán âm sai số tiền | Cao | Mặc định `amount = approvedAmount` từ snapshot; bắt buộc `reason`; FIX-H9 optimistic lock | Bút toán immutable — ghi `adjustPayment` đối ứng để trung hòa, không xóa gốc |
| Sửa `debt.ts` thêm `REFUNDED` làm lệch báo cáo công nợ cũ | TB | Đối soát trước/sau trên tập dữ liệu prod sao chép | Revert filter về chỉ `"CONFIRMED"` (thay đổi thuần đọc, an toàn) |
| Outbox (`M4.2/M4.3`) đẩy trùng/mất email | TB | Consumer idempotent (`onLeadConverted` đã idempotent); at-least-once + đánh dấu `processedAt` | Tắt worker; fallback gọi `publishEvent` trực tiếp sau commit như cũ |
| Refactor `recomputeOrder` vào tx (`M4.1`) gây deadlock/timeout tx dài | TB | Giữ tx ngắn, chỉ aggregate trong cùng tx; đo thời gian tx | Revert về gọi `recomputeOrder` ngoài tx (giữ nhánh cũ sau cờ build) |

### 5. Tổng effort & mốc bàn giao

| Hạng mục | Effort (PD) | Ưu tiên |
|---|---|---|
| B0 — Commit fix nền + migration 3 env | 1.0 | BLOCKER |
| H2 — Hợp nhất 2 luồng convert về `convertLeadV2` | 5.5 | HIGH |
| H3 — Hợp nhất hoàn tiền: `RefundRequest` ↔ `refundPayment` + đồng bộ `debt.ts` | 4.0 | HIGH |
| M4 — Atomic side-effect / transactional outbox | 5.0 | MEDIUM |
| **Tổng** | **15.5 PD** (khoảng dao động **14–22 PD** tùy mức hardening & test) | — |

**Mốc bàn giao:**
- **Mốc 1 (cuối Tuần 1):** B0 hoàn tất (migration sạch 3 env); H2.1-H2.2 + H3.1-H3.2 demo trên staging.
- **Mốc 2 (cuối Tuần 2):** Một luồng convert duy nhất (`convertLeadV2`) bật prod; hoàn tiền tự sinh bút toán; công nợ khớp sổ cái — bàn giao DoD-2 & DoD-3.
- **Mốc 3 (cuối Tuần 3):** Outbox + atomic side-effect hoàn tất (DoD-4); gỡ flag `CONVERT_V2_ENABLED`; bàn giao runbook rollback + báo cáo test/coverage — nghiệm thu toàn workstream.

---

I have all the technical depth needed. Here is the workstream plan.

## WS-C · Hoàn thiện tính năng & Gỡ feature-flag

> Phạm vi: Bật và GA các tính năng đã build nhưng còn sau flag, hợp nhất các cặp 2-luồng song song và đóng các quyền còn thiếu. Tổng effort sơ bộ: 25–38 ngày-người (PD). Bám sát 4 hạng mục audit `[H5]`, `[H8]`, `[M2]`, `[M3]`.

### 1. Mục tiêu & Definition of Done

- **Học bạ thông suốt**: vai trò `TRAINING` (hoặc `CENTER_MANAGER` được xác nhận) duyệt/phát hành được `ReportCard` và `CourseCompletion` — không còn enrollment nào kẹt ở `PENDING_REVIEW` quá 24h vì thiếu người duyệt; chuỗi `DRAFT → PENDING_REVIEW → PUBLISHED` chạy được end-to-end trên staging.
- **3 flag GA trên production**: `SCORM_ENABLED`, `EVAL_V2_ENABLED`, `SESSION_LIFECYCLE_V2` đều `=true` trên prod, mỗi flag có ≥1 chu kỳ nghiệp vụ thật chạy thành công, và **nhánh code cũ tương ứng đã gỡ** (không còn dead branch).
- **RBAC v2 runtime**: `isSafeToEnableRbacV2()` trả `{ safe: true }` với `minCleanDays = 7` (tức `RbacShadowDiff` lệch = 0 liên tục 7 ngày); `RBAC_V2_ENABLED=true` theo cohort; UI `/admin/roles` có hiệu lực thật (đọc/ghi `RoleDef`/`RolePermission`).
- **Đóng 5 cặp 2-phase**: mỗi cặp (2 generator mã HV, EnrollmentStatus legacy/D5, TrialClass v1/v2, audit kép 9 bảng, `HomeworkAssignment.status`) hoàn tất chu trình `backfill → cutover → drop`, có migration kiểm chứng và 0 row đọc field cũ sau cutover.
- **An toàn vận hành**: mỗi lần bật flag/cutover đều có runbook rollback ≤ 5 phút (đổi env hoặc revert read-path), không mất dữ liệu.
- **Bằng chứng kiểm thử**: mỗi hạng mục có bộ e2e/test xanh trong CI và checklist nghiệm thu ký xác nhận.

:::note
Nguyên tắc xuyên suốt WS-C: **bật trên staging → chạy e2e → bật prod theo cohort/cơ sở → quan sát → gỡ nhánh cũ**. Không gỡ code cũ trước khi flag GA ổn định tối thiểu 1 chu kỳ nghiệp vụ.
:::

### 2. Bảng công việc chi tiết

#### H5 — Cấp quyền duyệt/phát hành học bạ cho `TRAINING` (HIGH · 1–2 PD)

| ID | Hạng mục | Cách làm (file/hàm + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| H5-1 | Chốt quyết định owner duyệt | Họp với khách hàng chốt: gán capability `review` cho `TRAINING` hay dồn lên `CENTER_MANAGER`. Soi `permissions.ts:382,390,391` để biết hiện `TRAINING` thiếu action `report-cards:review` + `course-completion:*`. Ghi quyết định vào ADR. | Có biên bản chốt + ADR ghi rõ vai nào giữ `review` | N/A | 0.25 | — |
| H5-2 | Thêm action vào matrix v1 | Trong `lib/auth/permissions.ts` thêm cho `TRAINING` (hoặc xác nhận `CENTER_MANAGER` đã có) các action: `report-cards:review`, `course-completion:approve`, `course-completion:publish` — khớp `capability: "review"` của `REPORT_CARD_TRANSITIONS` (`lib/lms/report-card-core.ts`). | `getEffectivePermissions(actor)` của `TRAINING` chứa 3 action; transition `PENDING_REVIEW → PUBLISHED` (`capability=review`) pass | Unit test matrix cho `TRAINING` | 0.5 | H5-1 |
| H5-3 | Đồng bộ scope T5 | Kiểm tra `checkEnrollmentScope` (`report-card-core.ts:372`): `TRAINING` là reviewer (`isReviewer=true`) nên bỏ qua ràng `assignedClassIds` nhưng vẫn phải qua `visibleCenterIds`. Xác nhận `TRAINING` có `isHoLevel=true` hoặc set `visibleCenterIds` đủ. | Reviewer `TRAINING` duyệt được học bạ mọi cơ sở trong tầm; bị chặn ngoài tầm với lỗi "Học bạ ngoài phạm vi cơ sở của bạn" | Unit `checkEnrollmentScope` cho reviewer | 0.25 | H5-2 |
| H5-4 | Seed RBAC v2 song song | Thêm `RolePermission` tương ứng cho `RoleDef.code` của `TRAINING` qua `setRolePermissions` (`lib/auth/rbac-service.ts`) để v2 không phát sinh lệch shadow khi bật. | Sau seed, `RbacShadowDiff` cho 3 action mới = 0 lệch | Chạy `evaluatePermission` so v1≡v2 | 0.5 | H5-2, M2-1 |
| H5-5 | E2E luồng học bạ | Test: GV `DRAFT → PENDING_REVIEW` (`capability=manage`) → `TRAINING` `PUBLISHED`; kiểm `buildPublishedSnapshot` đóng băng metrics; `RECALLED` cần `reason`. | Học bạ phát hành thành công, PH xem được snapshot qua `getPublishedReportCardForStudent` | Playwright e2e | 0.5 | H5-3 |

:::caution
H5 là nút thắt nghẽn học bạ — ưu tiên làm tuần 1. Nếu chốt dồn lên `CENTER_MANAGER`, vẫn phải kiểm `TRAINING` không vô tình mất quyền `manage` đang có.
:::

#### H8 — GA `SCORM` + `Eval V2` + `Session-Lifecycle V2` (HIGH · 8–14 PD)

| ID | Hạng mục | Cách làm (file/hàm + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| H8-1 | Bật `SCORM` trên staging | Set `SCORM_ENABLED=true` (gate `isScormEnabled()` tại `lib/flags.ts:382`). Smoke route `/admin/scorm/*` + `GET /api/scorm/asset/[...path]`. | Route hiện, asset resolver trả `302` presigned, không lỗi 404 do flag | Smoke manual | 0.5 | — |
| H8-2 | E2E ingest→play→điểm SCORM | Kịch bản: upload `.zip` (presigned R2 PUT) → event `scorm.uploaded` → `onScormUploaded()` (`lib/events/handlers/scorm-ingest.ts`) chạy `validateZipEntries()` + `parseManifest()` → `status TESTING` → publish → GV mở `/admin/scorm/play/[id]` → `signScormTicket` TTL 600s → iframe gọi `window.API`/`window.API_1484_11` → `LMSCommit` → `POST /api/scorm/runtime` upsert `ScormAttempt` (unique `packageId+userId`). Test cả gói SCORM 1.2 và 2004; test resume qua `entryCursor`; test zip lỗi → `FAILED`. | Điểm `scoreRaw/lessonStatus` ghi đúng vào `ScormAttempt`; gói hỏng vào `FAILED` không retry vô hạn; ticket sai/hết hạn trả 401/403 | E2E + unit `validateZipEntries`/`parseManifest`/`verifyScormTicket` | 2.5 | H8-1 |
| H8-3 | GA `SCORM` prod + gỡ nhánh cũ | Bật `SCORM_ENABLED=true` prod theo cơ sở pilot. Quan sát `ScormAccessLog` 3–5 ngày. Sau ổn định: gỡ các nhánh `if (!isScormEnabled()) return 404` không còn cần và dọn dead code ẩn menu. | 1 buổi học thật mở SCORM thành công; không lỗi P1/P2 | Theo dõi log + watermark/blur fail-open hoạt động | 1.0 | H8-2 |
| H8-4 | Bật `Eval V2` staging + e2e | Set `EVAL_V2_ENABLED=true` (`isEvalV2Enabled()`). Kịch bản: tạo `EvalForm` (`DRAFT→ACTIVE`) → `setRoundStatus("OPEN")` (`lib/eval/rounds.ts`) publish event `eval.opened` → HV/PH đủ điều kiện (`filterEligibleTeacherEvals` / `isParentEligibleForCenter`) nộp `EvalResponse`+`EvalAnswer` (chặn trùng unique) → `aggregateRound` ẩn danh → GV xem tổng hợp về mình (`opts.teacherId`). Test `isRoundOpen` biên `opensAt/closesAt`; test edit-lock `replaceQuestions` khi form đã có response. | Mở round → nộp → aggregate đúng công thức (`STAR_RATING` avg 2 chữ số; `RADIO/CHECKBOX` đếm option); không lộ danh tính ở view ẩn danh | E2E + unit `aggregateAnswers`/`validateAnswers`/`isRoundOpen` | 2.5 | — |
| H8-5 | GA `Eval V2` prod + gỡ nhánh cũ | Bật prod theo cohort. Xác nhận **không** đụng Survey NPS cũ (bảng khác). Gỡ nhánh ẩn menu khi flag OFF sau khi GA. | 1 đợt đánh giá thật chạy trọn; report ẩn danh đúng | Theo dõi + smoke | 1.0 | H8-4 |
| H8-6 | Bật `Session-Lifecycle V2` staging + e2e | Set `SESSION_LIFECYCLE_V2=true`. Kịch bản: GV "Hoàn tất buổi" → `completeSession` set `ClassSession.status=TAUGHT` → publish `session.taught` → `onSessionTaughtAssignHomework` (`lib/events/handlers/homework-assign.ts`) → `assignHomeworkForSession` tạo `HomeworkAssignment.createMany({skipDuplicates})`. Test 3 mode `AssignMode` (`NOW/CUSTOM_DUE/DEFER`) qua `computeHomeworkDueAt`; test replay idempotent (unique `classSessionId+examId+studentId`); test HV `PAUSED` bị loại, HV vào sau không back-assign. | Complete session v2 giao bài đúng, replay không trùng, notification dedupe theo `homework.assigned:{sessionId}:{studentId}` | E2E + unit `computeHomeworkDueAt` + idempotency | 2.0 | — |
| H8-7 | GA `Session-Lifecycle V2` prod + gỡ nhánh cũ | Bật prod theo cơ sở. Quan sát số bài giao vs sĩ số active. Gỡ nhánh lifecycle cũ. | Số `HomeworkAssignment` khớp `HOMEWORK_ACTIVE_STATUS`; 0 bài giao trùng | Theo dõi 3 ngày | 1.0 | H8-6 |

:::tip
3 flag độc lập nhau về mặt code → **chạy song song** được bởi 3 dev. Mỗi flag tự có cặp env staging/prod và runbook rollback riêng (đổi env, tức thì).
:::

#### M2 — GA RBAC v2 runtime & UI `/admin/roles` (MEDIUM · 6–10 PD)

| ID | Hạng mục | Cách làm (file/hàm + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| M2-1 | Dashboard `RbacShadowDiff` | Dựng trang quan sát đọc `RbacShadowDiff` (ghi bởi `recordPermissionShadow`, `lib/auth/shadow-report.ts`): group theo `action`/`userId`, hiển thị `v1` vs `v2`. Banner "shadow mode" toàn admin khi `RBAC_V2_ENABLED` OFF. | Dashboard liệt kê mọi lệch v1≠v2 kèm count; banner hiển thị | Smoke + seed lệch giả | 1.5 | — |
| M2-2 | Sửa lệch tới 0 | Với mỗi nhóm lệch: đối chiếu matrix v1 (`permissions.ts`) vs `RolePermission` (DB). Sửa bằng `setRolePermissions`/`assignUserOrgRole` (`rbac-service.ts`) cho khớp v1, hoặc fix `scopeMatches` nếu lỗi `scopeType`. Lặp tới `getShadowDiffStats` = 0. | `isSafeToEnableRbacV2({minCleanDays:7})` trả `{safe:true}` (lệch=0 trong 7 ngày) | So `evaluatePermission` v1≡v2 trên bộ action chính | 3.0 | M2-1 |
| M2-3 | UI `/admin/roles` hiệu lực | Wire trang `/admin/roles` vào mutation thật: CRUD `RoleDef`, `setRolePermissions`, `assignUserOrgRole`/`revokeUserOrgRole`, mỗi thao tác ghi `RbacAuditLog` (`reason` bắt buộc). Validate action qua `ACTION_REGISTRY`. | Tạo/sửa role + gán quyền trên UI phản ánh đúng vào `can()` v2; có audit | E2E admin roles | 2.0 | M2-2 |
| M2-4 | Flip `RBAC_V2_ENABLED` theo cohort | Bật `RBAC_V2_ENABLED=true` cho cohort nhỏ (vài user nội bộ) trước → toàn bộ. `decidePermission` chuyển trả `v2`. Theo dõi lệch realtime. | Cohort chạy v2 không phát sinh từ chối sai; rollback = xóa env tức thì | Canary + theo dõi | 1.0 | M2-3 |
| M2-5 | Gỡ matrix tĩnh v1 | Sau khi v2 GA ổn định ≥1 tuần: gỡ nhánh v1 trong `evaluatePermission`/`decidePermission`, dọn `permissions.ts` (giữ làm reference nếu cần), tháo banner shadow. | Runtime chỉ còn v2; CI xanh; không còn import v1 path | Regression toàn bộ guard | 1.0 | M2-4 |

:::caution
M2-2 (sửa lệch tới 0) là phần khó ước lượng nhất — phụ thuộc số lượng mismatch thực tế trong `RbacShadowDiff`. Bắt buộc đạt **7 ngày sạch** trước khi flip; không rút ngắn cổng `minCleanDays`.
:::

#### M3 — Đóng các cặp 2-phase (MEDIUM · 10–14 PD)

| ID | Hạng mục | Cách làm (file/hàm + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| M3-1 | Hợp nhất generator mã HV | Chốt chuẩn `genStudentCodeV2` (`CCx-YY-XXXXXX`, charset `STUDENT_CODE_V2_CHARSET`) làm duy nhất. Cập nhật `students/_actions.ts` luôn gọi `genStudentCodeV2`. Giữ `genStudentCode` (v1) chỉ cho row lịch sử, đánh dấu `@deprecated`. Backfill: HV `studentCode = null` (import batch) sinh mã v2. | Mọi HV mới dùng v2; không HV nào `studentCode=null`; v1 không còn được gọi từ action | Unit `genStudentCodeV2` retry unique + grep call-site | 2.0 | — |
| M3-2 | Đóng EnrollmentStatus legacy/D5 | Backfill row `ACTIVE` (legacy) → `STUDYING`, `CANCELLED` → `WITHDREW` theo quy ước nghiệp vụ (chốt với khách). Cutover: code chỉ ghi status D5; `ENROLLMENT_ACTIVE_STATUSES` (`lib/enrollment-status.ts`) giữ `ACTIVE` để đọc back-compat tới khi backfill xong rồi mới bỏ. Kiểm `canTransition` không vỡ. Drop nhánh legacy trong `ENROLLMENT_TRANSITIONS`. | 0 row trạng thái legacy còn hoạt động; sĩ số (`CAPACITY_COUNT_STATUSES`) tính đúng | Migration dry-run + unit `canTransition` | 2.5 | — |
| M3-3 | Hợp nhất TrialClass v1/v2 | Chốt v2 làm chuẩn. Sửa `convertLeadV2` (`lib/crm/convert-lead-v2.ts:194`) **bổ sung re-check sĩ số + check tiên quyết** (tái dùng `checkPrerequisites` + đếm `CAPACITY_COUNT_STATUSES` trong Serializable tx như `enrollStudent`). Migrate dữ liệu TrialClass v1 → v2; ẩn route v1. | `convertLeadV2` chặn lớp đầy + thiếu tiên quyết; chỉ còn 1 hệ TrialClass | E2E convert lead + unit guard | 2.5 | — |
| M3-4 | Đóng audit kép 9 bảng | Liệt kê 9 bảng audit chạy kép (vd `EnrollmentAuditLog`, `RbacAuditLog`, `AuditLog` qua `writeAudit`...). Chốt bảng đích duy nhất mỗi domain. Backfill bản ghi cũ sang đích, cutover writer về 1 đường, drop writer phụ. | Mỗi domain ghi 1 bảng audit; không double-write; truy vết liên tục | Kiểm đếm row trước/sau + smoke ghi audit | 2.5 | — |
| M3-5 | State machine `HomeworkAssignment.status` | Thêm bảng transition cho `HomeworkAssignmentStatus` (`ASSIGNED → SUBMITTED → GRADED`, `ASSIGNED → MISSED`) tương tự `ENROLLMENT_TRANSITIONS`/`REPORT_CARD_TRANSITIONS`. Guard mọi mutation status qua `canTransition`. Backfill row sai trạng thái. | Chuyển status trái phép bị chặn `INVALID_TRANSITION`; 0 row ở trạng thái không hợp lệ | Unit transition + e2e nộp/chấm | 2.0 | — |

:::note
M3 gồm 5 cặp độc lập domain → **phần lớn song song** được. Mỗi cặp theo checklist cố định: `backfill → cutover đọc/ghi field mới → drop field/nhánh cũ`, kèm migration có thể rollback.
:::

### 3. Trình tự thực hiện

Giả định 2–3 dev. Sprint 2 tuần.

| Tuần | Việc làm | Song song? |
|---|---|---|
| **Tuần 1** | H5 toàn bộ (H5-1→H5-5) — gỡ nghẽn học bạ ngay. Song song: H8-1→H8-2 (SCORM staging+e2e), H8-4 (Eval V2 staging+e2e), M2-1 (dashboard shadow), M3-1 (generator mã HV). | H5 / SCORM / EvalV2 / M2-1 / M3-1 chạy song song bởi các dev khác nhau |
| **Tuần 2** | H8-3/H8-5 (GA SCORM + Eval V2 prod), H8-6→H8-7 (Session-Lifecycle V2). M2-2 bắt đầu (sửa lệch — chạy nền tích lũy 7 ngày sạch). M3-2, M3-3 (Enrollment legacy, TrialClass+`convertLeadV2`). | GA flag + M3-2/M3-3 song song; M2-2 chạy nền |
| **Tuần 3** (đệm) | M2-3→M2-5 (UI roles → flip cohort → gỡ v1, **sau khi đủ 7 ngày sạch**). M3-4 (audit kép), M3-5 (`HomeworkAssignment` state machine). H8-3/H8-7 dọn dead code. | M3-4/M3-5 song song; M2 nối tiếp sau cổng 7 ngày |

**Ràng buộc thứ tự bắt buộc:**
- M2-4/M2-5 (flip + gỡ v1) **không thể** xong trong tuần 1 vì cổng `minCleanDays=7` của `isSafeToEnableRbacV2()` — phải khởi động M2-1/M2-2 sớm để đồng hồ 7 ngày chạy.
- Mỗi `H8-x GA prod` chỉ sau khi `e2e staging` xanh.
- M3 mỗi cặp: `drop` luôn là bước cuối, chỉ sau khi xác minh 0 row đọc field cũ.
- H5-4 (seed RBAC v2) phụ thuộc M2-1 để không tạo lệch shadow mới.

### 4. Rủi ro khi thực thi & phương án rollback

| Rủi ro | Mức | Phòng ngừa | Rollback |
|---|---|---|---|
| Bật `SCORM`/`Eval V2`/`Session V2` prod gây vỡ luồng thật | Cao | Bật staging + e2e trước; pilot 1 cơ sở | Đổi env flag về `false` (tức thì, không deploy) |
| Flip `RBAC_V2_ENABLED` gây từ chối quyền sai → khóa người dùng | Cao | Cổng 7 ngày lệch=0; flip theo cohort nhỏ trước | Xóa env `RBAC_V2_ENABLED` → `decidePermission` trả v1 ngay |
| Backfill EnrollmentStatus/mã HV/audit sai dữ liệu | Cao | Dry-run trên bản sao DB; migration idempotent; backup trước | Restore từ backup; migration có script đảo |
| `convertLeadV2` thêm guard làm rớt lead hợp lệ | Trung bình | Test biên sĩ số/tiên quyết; log lý do chặn | Tách guard sau flag riêng, tắt nếu cần |
| Gỡ nhánh cũ (v1 matrix / lifecycle cũ) lộ phụ thuộc ẩn | Trung bình | Grep call-site trước khi xóa; gỡ sau GA ≥1 tuần | Revert commit gỡ nhánh |
| Drop field 2-phase khi vẫn còn reader | Trung bình | Quét 0 row đọc field cũ trước drop; tách PR drop riêng | Migration thêm lại cột (nullable) |

### 5. Tổng effort & mốc bàn giao

| Hạng mục | Effort (PD) |
|---|---|
| H5 — Quyền duyệt học bạ `TRAINING` | 1–2 |
| H8 — GA SCORM + Eval V2 + Session V2 | 8–14 |
| M2 — RBAC v2 runtime + UI roles | 6–10 |
| M3 — Đóng 5 cặp 2-phase | 10–14 |
| **Tổng WS-C** | **25–38 PD** |

**Mốc bàn giao:**
- **Mốc 1 (cuối Tuần 1)**: H5 GA — học bạ thông suốt; SCORM + Eval V2 xanh e2e trên staging; dashboard `RbacShadowDiff` chạy; mã HV hợp nhất.
- **Mốc 2 (cuối Tuần 2)**: 3 flag (`SCORM_ENABLED`, `EVAL_V2_ENABLED`, `SESSION_LIFECYCLE_V2`) GA prod pilot; Enrollment legacy + TrialClass/`convertLeadV2` đóng; đồng hồ 7 ngày sạch RBAC đang chạy.
- **Mốc 3 (Tuần 3, đệm)**: `RBAC_V2_ENABLED` GA theo cohort + UI `/admin/roles` hiệu lực + gỡ matrix v1; audit kép và `HomeworkAssignment` state machine đóng; toàn bộ nhánh cũ đã gỡ, CI xanh.

---

Các file tài liệu nguồn đã đọc để lập kế hoạch: `D:\Web SataRobo\satarobo_Document\src\content\docs\lms\scorm.mdx`, `...\lms\danh-gia-hoc-ba.mdx`, `...\lms\bai-tap-ky-nang.mdx`, `...\auth\rbac-v2.mdx`, `...\sis-finance\enrollment-pricing.mdx`, `...\sis-finance\hoc-vien-codegen.mdx`, và `C:\Users\ADMIN\AppData\Local\Temp\claude\D--Web-SataRobo-satarobo-Document\fd5fc850-80f0-4b61-8868-b86580c824dd\scratchpad\satarobo_docs\docs\06-runtime-luong\phong-dao-tao.md`.

---

## WS-D · Gia cố HR · Kho · Public

> Workstream gia cố giai đoạn HOÀN THIỆN — khắc phục rủi ro mất dữ liệu/gian lận ở chấm công (`cham-cong/`) & kho (`products/`, `inventory/`), khôi phục tracking marketing trên public site, và chuẩn hóa các điểm bảo mật phụ ở portal/CSKH. Toàn bộ căn cứ bám sát kết quả audit (H6, H7, M6, M10, M7) và code thật trong tài liệu.

### 1. Mục tiêu & Definition of Done

- **Không mất dữ liệu lịch ca:** `importApprovedShifts` chuyển từ "đè toàn bộ tháng" sang upsert có preview/diff; 100% lần import có snapshot khôi phục được trong ≤ 1 thao tác; 0 case mất ca đã `APPROVED` khi import lỗi giữa chừng.
- **Khôi phục tracking ROAS:** GA4 + Meta Pixel mount xác nhận trên public site; `fbq` init snippet hoàn chỉnh; GA4 Realtime ghi nhận ≥ 1 session test và Meta Events Manager nhận `PageView` + `Lead` trong môi trường staging; CI có bước check tag tồn tại.
- **Chống gian lận công:** QR token chấm công xoay vòng (hết hạn ≤ 60–90s); server có sanity-check GPS (độ chính xác/khoảng cách/tốc độ); ≥ 95% checkin hợp lệ không bị chặn nhầm trên bộ test thực địa.
- **Tồn kho nhất quán:** mọi đường giảm tồn của `Product` đều guarded (không còn read-then-write trần); định nghĩa rõ ranh giới 3 hệ tồn (`ZMRoboKit` / `Product` / `StockBalance`); 0 case tồn âm dưới tải đồng thời (test k6/concurrent).
- **Toàn vẹn dữ liệu phụ:** `StudentRiskAlert` có partial unique index chặn trùng alert `OPEN`; đánh giá GV có đường đọc ẩn danh (aggregate); `Notification` lưu được read-state per phụ huynh.
- **Không hồi quy:** tất cả thay đổi có migration Prisma reversible + test tự động; build xanh, không phá vỡ guard quyền hiện hữu.

### 2. Bảng công việc chi tiết

| ID | Hạng mục | Cách làm (file/hàm cụ thể + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| **D1.1** | [H6] Snapshot trước khi đè lịch tháng | Trong `cham-cong/duyet-ca/_actions.ts::importApprovedShifts`: trước khi `deleteMany`, đọc toàn bộ `ShiftRegistration` của `[centerId, tháng]` và ghi vào bảng mới `ShiftImportSnapshot` (JSON các dòng cũ + `importBatchId`, `createdById`, `createdAt`). Thêm model + migration Prisma. | Mỗi lần import sinh đúng 1 snapshot chứa đủ số dòng tháng trước khi đè; snapshot truy vấn lại được theo `importBatchId`. | Unit: import 1 tháng có sẵn 50 ca → snapshot 50 dòng. Integration: kiểm tra rollback đọc lại đúng. | 1.0 | — |
| **D1.2** | [H6] Chuyển đè → upsert theo `[userId,date]` | Thay `deleteMany`+`createMany` bằng vòng `upsert` `ShiftRegistration` theo unique `[userId, date]` (đã có ở §6.2): set `shifts`, `status="APPROVED"`, `centerId`, `orgUnitId`. Các dòng có trong DB nhưng KHÔNG có trong file Excel → đánh dấu xử lý theo policy (giữ nguyên hoặc set về trạng thái cũ), KHÔNG xóa mù. Bọc trong 1 `db.$transaction`. | Import chỉ thay đổi đúng các ngày có trong file; ca ngoài phạm vi file không bị mất; toàn bộ thành công hoặc rollback nguyên khối. | Integration: file 30 dòng trên tháng có 50 dòng → đúng 30 dòng đổi, 20 dòng giữ. Test transaction abort giữa chừng → DB nguyên trạng. | 1.5 | D1.1 |
| **D1.3** | [H6] Preview/diff + validate đủ dòng trước commit | Tách 2 bước trong `shift-approval.tsx` (`cham-cong/duyet-ca/_components/`): (a) action `previewApprovedShifts(file)` trả diff `{added, changed, removed, totalRows}` không ghi DB; (b) nút "Xác nhận đè" gọi `importApprovedShifts(batchId)`. Validate: chặn nếu `totalRows > 5000`, chặn nếu số dòng = 0, cảnh báo nếu `removed` > ngưỡng (vd > 30% tháng). | UI hiển thị bảng diff trước khi commit; import bị chặn khi vượt 5000 dòng hoặc file rỗng; có xác nhận 2 bước. | E2E: upload file → thấy diff đúng → confirm → DB khớp diff. Test biên 5000/5001 dòng, file 0 dòng. | 1.0 | D1.2 |
| **D1.4** | [H6] Action rollback từ snapshot | Thêm `rollbackShiftImport(batchId)` trong `duyet-ca/_actions.ts`: guard `hr_attendance:view` + CENTER_MANAGER scoped `centerId`; transaction khôi phục `ShiftRegistration` từ `ShiftImportSnapshot`. Hiển thị nút "Hoàn tác lần import gần nhất" trên UI. | Hoàn tác đưa lịch tháng về đúng trạng thái trước import trong ≤ 1 thao tác; bị chặn nếu actor khác cơ sở. | Integration: import → rollback → so khớp snapshot 100%. Test scope CENTER_MANAGER cơ sở khác bị từ chối. | 1.0 | D1.1 |
| **D2.1** | [H7] Verify & mount GA4/MetaPixel vào layout | Xác minh `<GA4>` (`components/public/ga4.tsx`) và `<MetaPixel>` (`components/public/meta-pixel.tsx`) thực sự render trên public site. Theo §3.4: hiện `app/(public)/layout.tsx` chỉ có `<CookieConsent />`. Mount cả 2 component vào `app/(public)/layout.tsx` (hoặc xác nhận root layout đã có và còn hiệu lực), đảm bảo nằm trong cây render của mọi trang `(public)`. | Cả `<GA4>` và `<MetaPixel>` xuất hiện trong DOM trang public sau consent; không trùng lặp mount. | Manual: bật consent `analytics`+`marketing` → kiểm DOM có 2 `<Script>`. Kiểm không double-fire. | 0.5 | — |
| **D2.2** | [H7] Điền `fbq` init snippet | Trong `meta-pixel.tsx`, thay placeholder `/* fbq init snippet */` (§3.3) bằng snippet chuẩn Meta: khởi tạo `fbq`, `fbq('init', PIXEL_ID)`, `fbq('track','PageView')`. Dùng `NEXT_PUBLIC_META_PIXEL_ID`. Giữ nguyên gate `if (!PIXEL_ID || !granted) return null`. | `fbq` được định nghĩa và gọi `init`+`PageView` sau consent `marketing`; không lỗi console. | Manual: Meta Events Manager Test Events nhận `PageView`. Kiểm `typeof fbq === 'function'`. | 0.5 | D2.1 |
| **D2.3** | [H7] Kiểm thử GA4 Realtime + Meta Events Manager | Cấu hình env staging `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_TOKEN`. Chạy luồng consent→duyệt trang→submit form lead, đối chiếu: GA4 Realtime có session, Meta Events Manager có `PageView` (Pixel) + `Lead` (CAPI qua `lib/tracking/meta-capi.ts::sendMetaCapi`). Xác nhận panel "Trạng thái Tracking" ở `/marketing` (4 env) hiển thị xanh. | GA4 Realtime + Meta Events Manager ghi nhận đầy đủ event; panel `/marketing` xanh cả 4 chấm. | Manual end-to-end staging; checklist env. Kiểm CAPI `Lead` không phụ thuộc consent browser. | 1.0 | D2.2 |
| **D2.4** | [H7] CI check tag tracking | Thêm bước CI (vd Playwright smoke trên build preview) assert: layout public render `<GA4>`/`<MetaPixel>` khi env có giá trị; assert `fbq` snippet không còn chuỗi placeholder. Fail build nếu thiếu. | CI fail khi tracking component bị gỡ khỏi layout hoặc snippet trở lại placeholder. | CI pipeline xanh ở case đúng, đỏ ở case xóa tag. | 0.5 | D2.3 |
| **D3.1** | [M6] QR token xoay vòng (TOTP/nonce) | Thay `verifyQrToken(token, centerId)` (§6.1 — token cố định, không hết hạn) bằng token xoay vòng: server sinh token theo TOTP (`centerId` + time-step 60–90s + secret per-center) hiển thị trên `man-hinh/_components/qr-screen.tsx` (auto-refresh). `recordCheckin` verify token còn trong cửa sổ thời gian + chấp nhận lệch ±1 step. Lưu `nonce` đã dùng để chặn replay trong cùng step. | Token hết hạn ≤ 90s; token cũ bị từ chối; replay cùng nonce bị chặn. | Unit: verify token quá hạn → fail. Integration: scan token cũ 2 phút trước → bị chặn; replay → bị chặn. | 1.5 | — |
| **D3.2** | [M6] Server sanity-check GPS | Trong `recordCheckin` (`cham-cong/actions.ts`), bổ sung kiểm tra server-side ngoài geofence hiện có (`distanceMeters` ≤ `center.allowedRadiusMeters`): (a) từ chối nếu `accuracy` client > ngưỡng (vd > 100m); (b) tính tốc độ dịch chuyển giữa lần checkin trước cùng user → chặn nếu vượt ngưỡng phi lý (teleport); (c) lưu `accuracy` vào `EmployeeCheckin`. | Checkin với GPS độ chính xác kém hoặc dịch chuyển bất thường bị từ chối + log lý do; checkin hợp lệ không bị chặn nhầm. | Unit hàm sanity GPS (accuracy/speed). Integration: mock 2 checkin cách 1km trong 1 phút → chặn. | 1.5 | — |
| **D3.3** | [M6] Gắn thiết bị/IP cơ sở | Mở rộng `EmployeeCheckin`: lưu `deviceId`/`ipAddress` (từ request headers) và đối chiếu IP/subnet đăng ký của cơ sở (setting mới `attendance.allowedCheckinIps` per-center). Cảnh báo (không chặn cứng giai đoạn đầu) nếu IP ngoài danh sách. Thêm migration field. | Mỗi checkin lưu device/IP; checkin từ IP lạ được gắn cờ để audit. | Integration: checkin từ IP ngoài whitelist → bản ghi có cờ cảnh báo. | 1.0 | D3.2 |
| **D4.1** | [M10] Guarded decrement cho `adjustStockAction` | Trong `products/_actions.ts::adjustStockAction` (§2.5 — read-then-write, không TOCTOU guard): khi `quantity < 0`, thay `update({stockOnHand:newStock})` bằng guarded `updateMany({ where:{ id:productId, stockOnHand:{ gte: -quantity } }, data:{ stockOnHand:{ decrement: -quantity } } })`; nếu `count===0` → trả `{ ok:false, error:"Tồn kho không đủ" }`. Khi `quantity > 0` dùng `increment`. Ghi `ProductMovement` với `stockBefore/After` đọc lại trong transaction. | Không còn đường ghi `stockOnHand` qua read-then-write; tồn không bao giờ âm dưới đồng thời. | Concurrent test (k6/Promise.all 50 request) trên cùng product → không âm, số movement khớp. | 1.5 | — |
| **D4.2** | [M10] Đồng nhất guard cho mọi đường giảm tồn Product | Rà `createProductAction`/`updateProductAction`/`deleteProductAction` (§2.3): đảm bảo mọi đường chạm `stockOnHand` đều qua pattern guarded (hoặc bọc Serializable theo mẫu `runSerializable()` của inventory §3.8). Giữ guard "chặn sửa `stockOnHand` trực tiếp" hiện có. | Tất cả mutation tồn Product dùng chung 1 helper guarded; audit code không còn read-then-write. | Code review checklist + test mỗi action giảm tồn. | 0.5 | D4.1 |
| **D4.3** | [M10] Định nghĩa ranh giới 3 hệ tồn + bridge SALE→ISSUE | Viết tài liệu ranh giới: `ZMRoboKit` (marketing, không tồn) / `Product.stockOnHand` (tồn toàn cục bán-thuê) / `StockBalance` (tồn vật lý per-center). Quyết định & triển khai bridge: khi `ProductMovement` loại `SALE` phát sinh → có nên sinh `StockMovement` `ISSUE` tương ứng không. Nếu CÓ: thêm reconcile job đối chiếu; nếu KHÔNG: ghi rõ "3 hệ độc lập, không reconcile tự động" + cảnh báo vận hành. | Có quyết định ranh giới rõ ràng (tài liệu + code/flag); nếu bridge thì `SALE` sinh `ISSUE` đúng cặp; nếu không thì có cảnh báo tránh nhầm. | Integration (nếu bridge): tạo `SALE` → kiểm `ISSUE` sinh đúng item/center. Review nghiệp vụ với khách hàng. | 1.0 | D4.2 |
| **D5.1** | [M7] Partial unique index `StudentRiskAlert` | Theo §5.1 (ràng buộc idempotent hiện chỉ ở app, không có constraint DB): thêm migration Postgres partial unique index `CREATE UNIQUE INDEX ... ON "StudentRiskAlert"(studentId, type) WHERE status='OPEN'`. Cập nhật code tạo alert dùng `upsert`/bắt lỗi `P2002` thay vì check-then-insert. | DB chặn được 2 alert `OPEN` cùng `[studentId,type]`; tạo lại sau `RESOLVED` vẫn cho phép. | Concurrent test tạo 2 alert cùng key → chỉ 1 thành công. Test resolve→tạo lại OK. | 1.0 | — |
| **D5.2** | [M7] Bảng aggregate ẩn danh cho đánh giá GV | Theo §2.4 (`EvalResponse` ghi `studentId`/`enrollmentId`/`teacherId` — không ẩn danh). Tạo đường đọc tổng hợp ẩn danh: view/bảng `TeacherEvalAggregate` (per `teacherId`+`roundId`: count, avg sao, phân phối) tách khỏi danh tính. Quyền `evaluations:view-aggregate` chỉ thấy aggregate; `evaluations:view-detail` mới thấy danh tính. | Người có `view-aggregate` không truy ra học sinh nào đánh giá; số liệu tổng hợp đúng. | Unit tính aggregate. Test phân quyền: `view-aggregate` không lộ `studentId`. | 1.0 | — |
| **D5.3** | [M7] Bảng `NotificationRead` lưu read-state | Theo §5.2 (badge đếm 7 ngày, không lưu read-state). Thêm model `NotificationRead` unique `[notificationId, parentUserId]` + migration; action `markNotificationRead(notificationId)` ở `lib/portal/notifications.ts`; sửa `getParentNotificationCount` đếm chưa đọc thay vì cửa sổ 7 ngày; `getParentNotifications` trả cờ `read`. | Đã đọc thì không tính vào badge; trạng thái persist qua phiên. | Integration: đọc 1 thông báo → badge giảm; reload giữ trạng thái. | 1.0 | — |

### 3. Trình tự thực hiện

:::note[Nguyên tắc xếp lịch]
H6 (mất dữ liệu) và H7 (mất tracking doanh thu) ưu tiên cao nhất → làm trước. Các nhóm độc lập về file nên chạy song song được giữa 2 dev.
:::

**Sprint 1 — Tuần 1 (ưu tiên HIGH)**
- Song song 2 luồng:
  - Luồng A (HR data): `D1.1 → D1.2 → D1.3 → D1.4` (tuần tự, vì D1.2 phụ thuộc snapshot D1.1, UI/diff phụ thuộc upsert).
  - Luồng B (Tracking): `D2.1 → D2.2 → D2.3 → D2.4` (tuần tự, mỗi bước verify trước khi sang bước sau). Luồng B nhẹ hơn, dev B sau khi xong có thể hỗ trợ D4.x.
- Mốc cuối tuần 1: import lịch ca có preview + snapshot + rollback; GA4/Pixel mount và bắn event trên staging.

**Sprint 2 — Tuần 2 (ưu tiên MEDIUM)**
- Song song:
  - Luồng C (chống gian lận công): `D3.1 → D3.2 → D3.3`. D3.1 (token) và D3.2 (GPS) độc lập file nhau, có thể chia 2 người; D3.3 nối sau D3.2.
  - Luồng D (tồn kho): `D4.1 → D4.2 → D4.3`. D4.3 cần review nghiệp vụ với khách hàng → đặt cuối.
- Các task M7 (`D5.1`, `D5.2`, `D5.3`) độc lập hoàn toàn, là migration + bảng mới → chèn xen kẽ làm song song bất cứ lúc nào trong tuần 2 (không phụ thuộc C/D).
- Mốc cuối tuần 2: QR token xoay vòng + sanity GPS live; mọi đường giảm tồn Product guarded; 3 index/bảng M7 đã migrate.

**Lưu ý phụ thuộc chéo:** D4.x dùng lại mẫu `runSerializable()` của `inventory/movements/_actions.ts` (§3.8) — không tạo cơ chế mới. Tất cả migration Prisma gom review chung 1 lần cuối mỗi sprint để tránh xung đột schema.

### 4. Rủi ro khi thực thi & phương án rollback

| Rủi ro | Hạng mục | Ảnh hưởng | Phòng ngừa | Rollback |
|---|---|---|---|---|
| Upsert lịch ca xử lý sai dòng "removed" → mất ca ngoài file | D1.2 | Mất dữ liệu công | Preview diff bắt buộc (D1.3) + policy giữ-không-xóa | `rollbackShiftImport(batchId)` từ `ShiftImportSnapshot` (D1.4) |
| Token TOTP lệch đồng hồ server/màn hình → chặn nhầm checkin | D3.1 | NV không chấm được công | Chấp nhận lệch ±1 step; fallback token grace ngắn | Feature flag bật/tắt token xoay vòng về token cũ tạm thời |
| Sanity GPS quá nghiêm → false reject | D3.2 | Chặn nhầm checkin hợp lệ | Giai đoạn đầu chỉ cảnh báo/log, chưa chặn cứng (D3.3 tương tự) | Hạ ngưỡng qua setting, không cần deploy |
| Guarded decrement đổi hành vi `adjustStockAction` | D4.1 | Lỗi điều chỉnh tồn | Giữ nguyên schema `ProductMovement`; chỉ đổi cơ chế write | Revert action về bản cũ; migration không đụng dữ liệu |
| Partial unique index xung đột dữ liệu trùng sẵn có | D5.1 | Migration fail | Dọn alert OPEN trùng trước khi tạo index | Migration reversible: `DROP INDEX` |
| Bridge SALE→ISSUE gây double-count tồn | D4.3 | Sai số tồn | Quyết định ranh giới rõ + reconcile job đối chiếu | Tắt bridge bằng flag; giữ "3 hệ độc lập" |
| fbq snippet sai → mất tracking ngầm | D2.2 | Mất ROAS | CI check tag (D2.4) + verify Events Manager (D2.3) | Revert component; CAPI server-side vẫn hoạt động độc lập |

### 5. Tổng effort & mốc bàn giao

| Nhóm | Hạng mục | Effort (PD) |
|---|---|---|
| H6 — Import lịch ca an toàn | D1.1–D1.4 | 4.5 |
| H7 — Khôi phục tracking | D2.1–D2.4 | 2.5 |
| M6 — Chống gian lận chấm công | D3.1–D3.3 | 4.0 |
| M10 — Tồn kho nhất quán | D4.1–D4.3 | 3.0 |
| M7 — Toàn vẹn dữ liệu phụ | D5.1–D5.3 | 3.0 |
| **Tổng cộng** | | **17.0 PD** |

:::tip[Khớp ước lượng audit]
Tổng 17 PD nằm trong khoảng audit sơ bộ **12–18 ngày-người**, sát cận trên do tách task con chi tiết và bổ sung CI/test. Có thể nén còn ~14 PD nếu D3.3 (device/IP) và D4.3 (bridge) chuyển sang giai đoạn sau dưới dạng cảnh báo thay vì chặn cứng.
:::

**Mốc bàn giao:**
- **Hết Sprint 1 (cuối tuần 1):** bàn giao H6 + H7 — demo import lịch ca có preview/rollback trên staging; GA4 Realtime + Meta Events Manager ghi nhận event; panel `/marketing` xanh 4 env.
- **Hết Sprint 2 (cuối tuần 2):** bàn giao M6 + M10 + M7 — QR token xoay vòng + sanity GPS chạy thực địa; mọi đường giảm tồn Product guarded + tài liệu ranh giới 3 hệ tồn; 3 migration M7 (partial unique index, aggregate ẩn danh, `NotificationRead`) lên môi trường.
- **Nghiệm thu cuối:** toàn bộ test tự động + concurrent test xanh; checklist DoD mục 1 đạt 100%; review nghiệp vụ D4.3 (bridge SALE→ISSUE) chốt với khách hàng.

---

## WS-E · Hạ tầng vận hành & Tính năng tài chính mới

> Phạm vi: gia cố vận hành (Backup/DR, Redis fallback, cron serverless, báo cáo) và bổ sung cổng thanh toán online + phát hành hóa đơn. Bám sát 4 hạng mục audit `H10 / M9 / M5 / M8`, không mở rộng tính năng ngoài danh sách.

### 1. Mục tiêu & Definition of Done

- **DR chứng minh được:** thực hiện ít nhất 1 lần DR drill restore vào môi trường staging, đo **RTO thực ≤ 4–8h** và **RPO thực ≤ 24h** (riêng bảng tiền `Payment`/`Receipt`/`Order`/`Enrollment` đạt RPO ≤ 1h nhờ PITR), có **nhật ký drill** ký nhận.
- **Redis fail-mode tường minh:** 100% endpoint dùng rate-limit/cache có chính sách `fail-open`/`fail-closed` được ghi rõ trong code; OTP/đăng nhập = `fail-closed`; có circuit breaker + báo cáo Sentry khi Upstash lỗi.
- **Cron quan sát được:** 12 job trong `vercel.json` đều bọc try/catch → Sentry, có **alert backlog** khi `EmailQueue` hoặc `DomainEvent` outbox tồn đọng vượt ngưỡng; không còn lỗi "ẩn" (silent failure).
- **Cổng thanh toán online hoạt động:** khách thanh toán qua **VNPAY/TINGEE** (redirect + webhook + đối soát) cập nhật đúng `Order.status` và sinh `Payment`; UI phát hành **Invoice** dùng `nextInvoiceCode()` nối thông suốt từ màn hình kế toán.
- **Báo cáo không fetch raw lớn:** các trang `bao-cao/*` bỏ `take` 20k/50k/5k, chuyển sang `groupBy/aggregate` ở DB + cache theo kỳ + giới hạn khoảng thời gian mặc định; thời gian render p95 giảm ≥ 50%.
- **Không hồi quy tài chính:** toàn bộ test idempotency (`FIX-H8`), optimistic lock (`FIX-H9`), atomic order (`FIX-C5`) vẫn xanh sau khi thêm gateway.

:::note
Prod chạy serverless trên Vercel (region `hnd1`) + Supabase/Upstash/R2 — **không Docker**. Mọi thao tác hạ tầng đều thực hiện qua dashboard managed service và biến môi trường (`process.env.X`), không hardcode secret.
:::

---

### 2. Bảng công việc chi tiết

#### H10 — Backup/DR drill & PITR cho bảng tiền (HIGH)

| ID | Hạng mục | Cách làm (file/hàm + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| E1.1 | Chuẩn hóa runbook PITR | Bổ sung `Document/2-architecture-design/backup-pitr-runbook.md`: liệt kê đầy đủ bước restore Supabase PITR, biến `DATABASE_URL` (pooler `6543`) và `DIRECT_URL` (session pooler `5432`), username `postgres.<project-ref>`; checklist tiền điều kiện (snapshot mới nhất, branch staging). | Runbook có đủ lệnh chạy được, không còn placeholder; reviewer ngoài team theo runbook restore được. | Dry-run đọc runbook bởi 1 dev chưa từng làm. | 0.5–1 | — |
| E1.2 | Dựng môi trường staging restore | Tạo Supabase project/branch staging riêng; cấu hình `prisma migrate deploy` qua `DIRECT_URL`. Bật **PITR** và tăng tần suất backup cho schema tiền. | Staging restore được snapshot prod (đã ẩn danh PII nếu cần). | Smoke test kết nối Prisma + `prisma migrate status`. | 0.5–1 | E1.1 |
| E1.3 | Thực thi DR drill, đo RTO/RPO | Chạy restore thật từ snapshot + PITR tới mốc thời gian T; bấm giờ từ lúc bắt đầu tới lúc app staging healthy. Đối chiếu số bản ghi `Payment`/`Receipt`/`Order`/`Enrollment`/`Counter` giữa nguồn và đích để xác nhận không mất giao dịch tiền. | RTO thực ≤ 4–8h; RPO ≤ 24h tổng thể, ≤ 1h cho bảng tiền; **0** chênh lệch `Counter` (mã `INV`/`RCP`/`ORD`). | Script so khớp count + checksum bảng tiền. | 1–1.5 | E1.2 |
| E1.4 | Nhật ký drill & lịch định kỳ | Ghi `drill-log` (ngày, mốc T, RTO/RPO đo được, sự cố). Đặt lịch drill định kỳ (gợi ý hằng quý). | Nhật ký được ký nhận; có lịch nhắc drill kế tiếp. | Review biên bản với khách hàng. | 0.5–1 | E1.3 |

#### M9 — Redis fallback & gia cố cron serverless (MEDIUM)

| ID | Hạng mục | Cách làm (file/hàm + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| E2.1 | Định nghĩa fail-mode rate-limit | Trong wrapper rate-limit (Upstash REST, dùng `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`): bọc lệnh Redis trong try/catch, thêm tham số `failMode: "open" | "closed"` cho từng caller. OTP/đăng nhập + webhook secret = `fail-closed` (từ chối khi Redis lỗi); lead form/API public read = `fail-open` (cho qua, ghi cảnh báo). Cập nhật tài liệu `container-redis.md` mục "Fallback khi Redis lỗi". | Mỗi endpoint có fail-mode khai báo tường minh; OTP bị chặn khi Redis down. | Unit test giả lập Redis ném lỗi → assert hành vi từng mode. | 1–1.5 | — |
| E2.2 | Circuit breaker + Sentry cho Redis | Thêm circuit breaker đơn giản (đếm lỗi liên tiếp → mở mạch trong N giây, bỏ qua Redis tạm thời thay vì timeout mỗi request); báo cáo lỗi qua `SENTRY_DSN`. | Khi Upstash lỗi kéo dài, request không bị treo theo timeout; Sentry nhận event. | Test mô phỏng Upstash 5xx liên tiếp → mạch mở, latency không tăng. | 0.5–1 | E2.1 |
| E2.3 | Bọc lỗi 12 cron job | Với từng handler `/api/cron/*` trong `vercel.json` (`dispatch-events`, `email-queue`, `sla-check`, `zalo-token-refresh`, `class-reminder`, `renewal-reminder`, `marketing-alerts`, `debt-reminder`, `order-debt-reminder`, `assignment-due-soon`, `reserve-expiry`, `retention-scan`): bọc try/catch toàn thân, `Sentry.captureException` khi fail, trả status code phản ánh lỗi (không "nuốt" exception), tôn trọng `dedupeKey` idempotent đã có. | Không còn cron fail im lặng; mỗi lỗi đều có event Sentry kèm tên job. | Inject lỗi vào 1 handler → xác nhận Sentry + response không 200 giả. | 1–1.5 | E2.2 |
| E2.4 | Alert backlog outbox/queue | Mở rộng `/api/cron/dispatch-events` (DomainEvent outbox) và `/api/cron/email-queue`: sau mỗi lần chạy, đếm số bản ghi tồn đọng (`DomainEvent` chưa dispatch / `EmailQueue` chưa gửi); vượt ngưỡng → bắn cảnh báo Sentry/thông báo nội bộ. | Backlog vượt ngưỡng cấu hình → có alert trong vòng 1 chu kỳ cron. | Seed backlog giả vượt ngưỡng → assert alert. | 0.5–1 | E2.3 |

#### M5 — Cổng thanh toán online (VNPAY/TINGEE) + UI phát hành Invoice (MEDIUM)

| ID | Hạng mục | Cách làm (file/hàm + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| E3.1 | Lớp adapter gateway | Tạo `lib/finance/gateways/` với interface chung `PaymentGateway` (`createPaymentUrl`, `verifyWebhook`, `queryStatus`) và 2 adapter `vnpay.ts`, `tingee.ts`. Đọc enum `PaymentMethod` (đã có `VNPAY`/`TINGEE`) và flag `isActive`/`canBuyCourse|Package|Exam|Product` như `createOrderManualAction` đang dùng. Secret qua `process.env` (thêm nhóm biến gateway vào `.env.example`). | Adapter tạo được URL redirect và verify chữ ký mẫu của từng gateway. | Unit test ký/verify với vector mẫu của VNPAY/TINGEE. | 2–3 | — |
| E3.2 | Endpoint redirect + return | Route handler khởi tạo thanh toán: từ `Order` ở trạng thái `PENDING_PAYMENT`, gọi `createPaymentUrl` → redirect khách sang gateway; route `return` xử lý người dùng quay lại (chỉ hiển thị, **không** chốt tiền dựa trên return). | Khách được redirect đúng, quay lại thấy trạng thái chờ đối soát. | E2E (staging) đi hết luồng redirect sandbox. | 1.5–2.5 | E3.1 |
| E3.3 | Webhook đối soát + ghi Payment | Route `/api/webhook/payment/*`: `verifyWebhook` (chống giả mạo), idempotent theo mã giao dịch gateway (tái dùng `model IdempotencyKey`, `scope: "gateway.webhook"`). Khi hợp lệ → gọi `recordPayment` rồi `confirmPayment` trong `lib/finance/payment.ts` (giữ nguyên 2 lớp `FIX-H8` + guard `AC8` `updateMany(where accountantStatus="PENDING")`), từ đó `issueReceipt()` chạy trong tx; cập nhật `Order.status` qua `canTransition` (`PENDING_PAYMENT → CONFIRMED`) với `recomputeOrder` nếu là đơn trả góp. | Webhook trùng → 1 `Payment`/`Receipt` duy nhất; `Order` chuyển đúng trạng thái; sai chữ ký bị từ chối. | Test gửi webhook lặp + webhook giả chữ ký; assert idempotency. | 2–3.5 | E3.2 |
| E3.4 | UI phát hành Invoice | Thêm Server Action + form trong `app/(admin)/admin/payments/_actions.ts` gọi `nextInvoiceCode(tx, centerCode, year)` (format `INV-{CC}-{YYYY}-####`) phát hành Invoice cho khoản đã `CONFIRMED`; nút trên màn hình kế toán, scope qua `scopedDb(actor)` + `passesScope("Payment", row, actor)`, idempotency key cho nút bấm. | Kế toán phát hành Invoice 1 chạm; mã `INV` tăng atomic không trùng/không khoảng trống; scope cơ sở đúng. | Test sinh mã song song (no race) + test scope CS1 không phát Invoice của CS2. | 1.5–3 | E3.3 |
| E3.5 | Đối soát & audit | Job/đối soát định kỳ so khớp giao dịch gateway với `Payment`; ghi `writeAudit` (`module: "finance"`) cho mọi bước online; bổ sung trang trạng thái lệch (mismatch). | Giao dịch lệch được liệt kê; mỗi thao tác có audit trail. | Seed lệch → báo cáo đúng danh sách. | 1–2 | E3.4 |

:::caution
Tuyệt đối **không** chốt tiền dựa trên trang `return` của trình duyệt (người dùng có thể đóng tab); chỉ webhook đã verify + đối soát mới được đổi trạng thái tiền. Giữ nguyên cơ chế `STALE_WRITE` (`FIX-H9`) và `withUniqueRetry`/`Counter` (`FIX-C5`) để không phá vỡ tính toàn vẹn hiện có.
:::

#### M8 — Tối ưu báo cáo (bỏ fetch raw `take` lớn) (MEDIUM)

| ID | Hạng mục | Cách làm (file/hàm + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| E4.1 | Báo cáo Lead → `groupBy` | `app/(admin)/admin/bao-cao/lead/page.tsx`: thay `scopedDb(actor).lead.findMany({ take: 20_000 })` + `buildLeadReport` (reduce in-memory) bằng `db.lead.groupBy`/`aggregate` ở DB (theo `status`, `source`, `centerId`, theo tháng), giữ filter scope `centerId in visibleCenterIds`. | Không còn `take: 20_000`; phễu/nguồn/tháng tính ở DB; số liệu khớp baseline cũ. | Snapshot test so output mới vs cũ trên dataset mẫu. | 1–1.5 | — |
| E4.2 | Báo cáo Churn → aggregate | `app/(admin)/admin/bao-cao/churn/page.tsx`: bỏ `Enrollment ... take: 50_000` + `buildChurnReport` reduce; chuyển đếm `WITHDREW`/đang học/hoàn thành theo tháng & center sang `groupBy`. | Không còn `take: 50_000`; tỉ lệ churn khớp baseline. | So khớp số churn theo tháng/center. | 1–1.5 | — |
| E4.3 | Báo cáo Trung tâm & Doanh thu → aggregate | `bao-cao/trung-tam/page.tsx`: thay `db.payment.findMany({ take: 5_000 })` bằng `aggregate`/`groupBy` cho `summarizeFinance`, `revenueByMonth`, `revenueByCenter`. `bao-cao/doanh-thu`: dùng `groupBy` trên `Payment` (`accountantStatus="CONFIRMED"`) thay vì kéo raw. | Không còn `take` raw trong 2 trang; tổng tiền khớp baseline. | So khớp tổng `totalConfirmed`/`totalDebt`. | 1–1.5 | — |
| E4.4 | Giới hạn kỳ mặc định + cache | Thêm bộ lọc khoảng thời gian mặc định (vd 12 tháng gần nhất) cho các trang trên; cache kết quả theo kỳ (`unstable_cache`/revalidate theo tag, invalid khi có Payment mới qua `revalidatePath`). Giữ rule `animationDuration={300}` của chart. | Trang có default time-range; cache hit ở lần xem lại; render p95 giảm ≥ 50%. | Đo thời gian render trước/sau; test cache invalidation khi phát sinh Payment. | 0.5–1 | E4.1–E4.3 |

---

### 3. Trình tự thực hiện (theo sprint 2 tuần/sprint)

:::tip
Hai nhánh **hạ tầng** (H10, M9, M8) và **gateway** (M5) độc lập về code → chạy **song song** bằng 2 dev. M5 là đường găng (critical path) vì effort lớn nhất.
:::

- **Tuần 1**
  - Dev A (hạ tầng): `E1.1 → E1.2` (runbook + dựng staging); song song `E2.1` (fail-mode Redis).
  - Dev B (gateway): `E3.1` (adapter VNPAY/TINGEE) — không phụ thuộc hạ tầng.
- **Tuần 2**
  - Dev A: `E1.3 → E1.4` (DR drill, đo RTO/RPO, nhật ký) — **mốc M1**; tiếp `E2.2`.
  - Dev B: `E3.2 → E3.3` (redirect + webhook đối soát) — phần lõi tiền online.
- **Tuần 3**
  - Dev A: `E2.3 → E2.4` (bọc 12 cron + alert backlog) — **mốc M2**; bắt đầu `E4.1`.
  - Dev B: `E3.4 → E3.5` (UI Invoice + đối soát/audit) — **mốc M3**.
- **Tuần 4**
  - Dev A: `E4.2 → E4.3 → E4.4` (tối ưu báo cáo + cache) — **mốc M4**.
  - Dev B: hỗ trợ E4, hardening E2E gateway sandbox, regression test tài chính.
  - Hai dev: review chung, chạy full regression (`FIX-H8`/`H9`/`C5`), bàn giao.

Phụ thuộc cứng: `E1.3` cần `E1.2`; `E3.3` cần `E3.2` cần `E3.1`; `E3.4` cần `E3.3`. Nhóm `E4.x` không phụ thuộc M5 nên có thể kéo sớm nếu Dev A rảnh.

---

### 4. Rủi ro khi thực thi & phương án rollback

| Rủi ro | Mức | Phòng ngừa | Rollback |
|---|---|---|---|
| DR drill restore sai/đụng prod | Cao | Drill chỉ trên branch/project staging riêng; checklist xác minh không trỏ `DATABASE_URL` prod; ẩn danh PII | Hủy branch staging; prod không bị chạm |
| Webhook gateway giả mạo hoặc trùng lặp → sai tiền | Cao | `verifyWebhook` bắt buộc; idempotent qua `IdempotencyKey` + guard `AC8 updateMany`; chỉ webhook verify mới đổi trạng thái | Tắt `PaymentMethod.isActive` của gateway (`VNPAY`/`TINGEE`) → quay về QR tĩnh; reject Payment lỗi qua `rejectPayment` |
| `fail-closed` cấu hình nhầm khóa OTP toàn hệ thống | Trung bình | Phân loại fail-mode review 2 người; canary trên 1 endpoint trước | Đảo cờ `failMode` về `open` cho endpoint không nhạy cảm; circuit breaker tự bỏ qua Redis |
| Đổi `groupBy` làm lệch số liệu báo cáo | Trung bình | Snapshot test đối chiếu baseline `findMany` cũ trước khi xóa | Feature-flag giữ đường cũ; revert page về `findMany` |
| Cron alert backlog gây nhiễu (false positive) | Thấp | Ngưỡng cấu hình qua `SystemSetting`; theo dõi 1 chu kỳ trước khi bật cứng | Nâng ngưỡng hoặc tắt alert tạm thời, không ảnh hưởng job |
| Counter `INV`/`RCP` lệch khi phát hành song song | Trung bình | Dùng `nextInvoiceCode` atomic (`Counter.upsert increment`) trong tx; `withUniqueRetry` backstop `P2002` | Counter tự nhất quán nhờ tx; nếu lệch, đối soát E3.5 phát hiện |

---

### 5. Tổng effort & mốc bàn giao

| Hạng mục | Effort (PD) |
|---|---|
| H10 — DR drill & PITR | 3–5 |
| M9 — Redis fallback + cron | 3–5 |
| M5 — Gateway online + Invoice UI | 8–15 |
| M8 — Tối ưu báo cáo | 3–5 |
| **Tổng** | **15–28** (≈ 4 tuần với 2 dev) |

**Mốc bàn giao:**
- **M1 (cuối tuần 2):** Nhật ký DR drill với RTO/RPO thực đo được (H10 hoàn tất).
- **M2 (giữa tuần 3):** Redis fail-mode + 12 cron bọc Sentry + alert backlog (M9 hoàn tất).
- **M3 (cuối tuần 3):** Thanh toán online VNPAY/TINGEE + UI phát hành Invoice chạy trên staging (M5 hoàn tất).
- **M4 (cuối tuần 4):** Báo cáo tối ưu, p95 giảm ≥ 50%, full regression tài chính xanh, bàn giao toàn workstream.

---

I have sufficient technical depth. Here is the workstream plan.

## WS-F · Kiểm thử · QA · Tài liệu vận hành

> Phạm vi: phủ test tự động cho các luồng rủi ro cao, hoàn thiện runbook vận hành các C4 container, và xác minh 3 mâu thuẫn tài liệu cũ/mới để chốt độ tin cậy trước khi commit lô fix `PH‑1/PH‑2/C4/C5`. Bám sát §10 (12 nhóm test `T1`–`T12`, Playwright + Vitest, test DB Postgres local), §07 (deployment) và §11 (sổ nợ kỹ thuật).

:::caution Tiền đề bắt buộc
Lô fix `PH‑1` (split-brain Payment), `PH‑2` (Lead→`REGISTERED`), `C4/C5` và migration `20260629142518_lead_payment_enroll_fields` đang ở **working tree, chưa commit** (`satarobo-vn`). WS-F phải chạy test trên đúng working tree này; **commit + `prisma migrate deploy`** trước khi gắn CI gate, nếu không test sẽ phản ánh trạng thái cũ.
:::

### 1. Mục tiêu & Definition of Done

- **Phủ test rủi ro cao**: hoàn thành ≥ 5 nhóm test ưu tiên trong `T1`–`T12` (cách ly write-scope, payment 2 tầng + refund, `convertLeadV2` idempotency/sĩ số, smoke mỗi feature-flag ON), tất cả **xanh trong CI** (`e2e-a0` job, Postgres service `postgres:16`).
- **Gate CI đo lường được**: pipeline chặn merge khi test đỏ; coverage Vitest cho `lib/db-scope.ts`, `lib/crm/convert-lead-v2.ts`, luồng payment đạt ≥ 80% line trên các hàm trọng yếu.
- **4 feature-flag có smoke ON**: `SCORM_ENABLED`, `SESSION_LIFECYCLE_V2`, `EVAL_V2`, `MEDIA_SIGNED_URL` — mỗi flag có ít nhất 1 e2e smoke chạy với flag = ON, không vỡ route khi flag OFF (mặc định).
- **Runbook hết skeleton**: 6 trang container (`container-web/db/redis/email/cron/storage-r2`) + DR/PITR + migration 2-phase được điền đủ env bắt buộc, rate-limit policy, email retry, lịch 12 cron, ingest SCORM — không còn dòng "🚧 Sẽ chi tiết".
- **3 mâu thuẫn được chốt**: consent ảnh UI, `HomeworkAssignment.status`, `hasRecordedPayment "tạm false"` — mỗi mục có kết luận đối chiếu code (path:line thật) ghi vào sổ scope §11, trạng thái chuyển từ "VERIFY" sang "CONFIRMED/FIXED-PENDING".
- **Bàn giao**: 1 báo cáo QA tổng hợp (số test, pass-rate, coverage) + runbook đã review với khách hàng.

### 2. Bảng công việc chi tiết

| ID | Hạng mục | Cách làm (file/hàm cụ thể + bước kỹ thuật) | Tiêu chí nghiệm thu | Kiểm thử | Effort (PD) | Phụ thuộc |
|---|---|---|---|---|---|---|
| **F1.0** | Hạ tầng test (`A0-00`) | Dựng DB test theo §07: `pnpm db:test:up` (compose `docker-compose.test.yml`, `postgres:16`, `satarobo_test:5432`) hoặc fallback Postgres portable qua scoop (Windows không admin). Cấu hình `.env.test` `DATABASE_URL`/`DIRECT_URL` = `postgresql://postgres:postgres@127.0.0.1:5432/satarobo_test`; `pnpm db:test:deploy` apply migration; xác nhận `resetDb()` chỉ trỏ DB test, **không bao giờ** Supabase prod. | `pnpm test:e2e:a0` chạy được local + CI; `resetDb()` có guard chặn host khác `127.0.0.1/localhost`. | Smoke chạy 1 test rỗng để verify pipeline DB | 1.0 | Commit lô `PH‑1/PH‑2` |
| **F1.1** | E2E cách ly write-scope (`T1`, `A0-04 write`) | Test IDOR write: actor cơ sở CS1 gọi mutation trên record cơ sở CS2 phải bị chặn. Vì `lib/db-scope.ts` **chưa auto-scope WRITE + nested include**, viết test khẳng định guard thủ công `passesScope()` được gọi trong các action: `attendance/_actions.ts:markAttendance`, `classes/_actions.ts:cancelClassAction`, `parent-feedback/page.tsx:16-19`. Thêm case `Attendance`/`ReportCard` còn ở `SCOPE_EXEMPT` (`lib/db-scope.ts:42-57`) — assert tài liệu hoá rủi ro hoặc fail có chủ đích. | CS1 update/delete record CS2 → reject (403/throw); `passesScope` được verify gọi đúng; báo cáo liệt kê model còn `SCOPE_EXEMPT`. | Vitest integration trên DB test, 2 actor khác `centerId` | 2.0 | F1.0 |
| **F1.2** | Payment 2 tầng + refund atomic (`T?` payment) | Test luồng §06 xương sống: `recordPayment()` → `ensureOrderPaymentRecorded()` → `Payment(RECORDED)` → `maybeAdvanceLeadToRegistered()` → `Lead=REGISTERED` → `confirmPayment()` → `Receipt + Payment(CONFIRMED)` + event `payment.confirmed`. Kiểm tra **atomic**: rollback khi 1 bước lỗi (không để Payment lệch Receipt — split-brain `PH‑1`). Refund: `classes/_actions.ts:754 cancelClassAction` (hủy lớp + refund). Assert idempotency confirm qua `IdempotencyKey`/`dedupeKey` (§8.5). | Confirm 2 lần → 1 Receipt; lỗi giữa chừng → rollback toàn bộ; refund tạo bút toán đúng dấu; `payment.confirmed` phát đúng 1 lần. | Vitest + giả lập lỗi tầng DB; chạy song song 2 confirm | 2.5 | F1.0, F3 (hasRecordedPayment) |
| **F1.3** | `convertLeadV2` idempotency + sĩ số (`T?`) | Theo §11: `lib/crm/convert-lead-v2.ts:194` **không re-check sĩ số + không check tiên quyết**. Viết test 2 lead convert **song song** cùng lớp → assert không vượt sĩ số (hiện FAIL → đánh dấu test `expected-fail`/skip kèm issue, hoặc xác nhận cần fix lock). Test idempotency: gọi `convertLeadV2()` 2 lần cùng lead → tạo đúng 1 `User(PARENT)+Student+Enrollment`, phát `lead.converted`·`consent.granted` 1 lần. | Concurrent convert không vượt `maxStudents`; double-call → 1 Enrollment; event không nhân đôi. | Vitest concurrency (Promise.all 2 convert), DB test | 1.5 | F1.0 |
| **F1.4** | Smoke e2e mỗi feature-flag ON | 4 flag (`container-web.md:20`): `SCORM_ENABLED` (player `/admin/scorm/play/[id]`, ingest `lib/scorm/*`), `SESSION_LIFECYCLE_V2` (hoàn tất buổi v2), `EVAL_V2` (đánh giá GV — `phu-huynh.md:35`), `MEDIA_SIGNED_URL` (`lib/storage/*` signed URL). Mỗi flag: 1 Playwright smoke với flag=ON (route render, action cơ bản chạy) + 1 assert OFF không vỡ route. Set flag qua biến môi trường trong CI matrix. | 4 smoke ON xanh; route OFF không 500; ma trận CI có cột per-flag. | Playwright, CI matrix theo flag | 2.0 | F1.0 |
| **F2.1** | Runbook container web/db/redis | Điền `container-web.md`, `container-db.md`, `container-redis.md`: bảng **env đầy đủ** bắt buộc/tuỳ chọn (nhóm Database/Auth/Meta/Redis... theo `deployment.mdx`), pooler `6543` txn (`DATABASE_URL`) vs `5432` session (`DIRECT_URL`, username `postgres.<project-ref>`), **rate-limit policy** Upstash (`UPSTASH_REDIS_REST_URL/TOKEN`), cold start & giới hạn thời gian function. | Mỗi trang có bảng env (cột: biến · bắt buộc · mô tả), không còn "🚧 Sẽ chi tiết"; pooler note CRITICAL hiện diện. | Review chéo + dò link nội bộ | 1.5 | — (song song F1) |
| **F2.2** | Runbook email/cron/storage | `container-email.md`: **email retry** qua `EmailQueue` + cron `/api/cron/email-queue` (`*/5`), `RESEND_*`. `container-cron.md`: bảng **12 cron** thật (`deployment.mdx` 61-77: `dispatch-events *`, `sla-check */15`, `zalo-token-refresh 0 */6`, `retention-scan 0 7 * * 1`...). `container-storage-r2.md`: **ingest SCORM** (`lib/scorm/ingest/manifest/access/ticket`, CORS bucket, asset proxy `/api/scorm/asset/*`, vé 10p + watermark). | 3 trang điền đủ; bảng cron khớp `vercel.json`; quy trình ingest SCORM có các bước. | Đối chiếu `vercel.json` thực tế | 1.5 | — (song song) |
| **F2.3** | DR/PITR + migration 2-phase | Hoàn thiện runbook DR: RPO 24h / RTO 4–8h (Supabase backup), trỏ `Document/2-architecture-design/backup-pitr-runbook.md`, các bước restore PITR. **Migration 2-phase**: quy ước `prisma migrate deploy` qua `DIRECT_URL` (session pooler `5432`), expand→contract, rollback bằng migration nghịch; checklist commit migration `20260629142518_lead_payment_enroll_fields`. | Runbook DR có RPO/RTO + bước restore; có checklist migration 2-phase + lệnh rollback. | Dry-run restore trên DB test | 1.5 | F2.1 |
| **F3.1** | Verify consent ảnh UI | Đối chiếu `lib/lms/media-consent.ts:17,26` (`grantMediaConsent`/`revokeMediaConsent`): xác nhận chỉ test gọi → `/portal/hinh-anh` rỗng nếu không set tay. Ghi kết luận thật vào §11. | Kết luận có path:line; trạng thái cập nhật trong sổ scope. | Đọc code + chạy 1 case portal | 0.25 | — |
| **F3.2** | Verify `HomeworkAssignment.status` | Đối chiếu `lib/lms/assignment.ts:164` (`createMany` tạo `ASSIGNED`, không update) + `schema.prisma:3813`: xác nhận status **không chuyển** "Đã làm/Đã chấm". Ghi vào sổ. | Kết luận khẳng định/bác bỏ + bằng chứng line. | Đọc code + truy vấn DB test | 0.25 | — |
| **F3.3** | Verify `hasRecordedPayment "tạm false"` | Truy `ensureOrderPaymentRecorded()` / cờ `hasRecordedPayment` trong luồng `recordPayment`: xác nhận giá trị "tạm false" là hành vi thật hay tài liệu cũ. Cập nhật §11 + cấp dữ liệu cho F1.2. | Kết luận rõ ràng; nếu là bug → tạo issue link sang F1.2. | Đọc code payment | 0.25 | — |

:::note Map nhóm test §10
`T1`–`T12` (§10.3) là khung 12 nhóm. WS-F ưu tiên 5 nhóm rủi ro cao: **scope-write** (F1.1), **payment/refund** (F1.2), **convert** (F1.3), **idempotency webhook/confirm** (lồng trong F1.2/F1.3), **feature-flag smoke** (F1.4). Các nhóm còn lại (performance budget §10.1, Lighthouse) nằm ngoài phạm vi WS-F, chỉ ghi nhận liên kết.
:::

### 3. Trình tự thực hiện

**Sprint 1 — Tuần 1 (nền tảng + verify, chạy song song):**
- Làm trước: **F1.0** (hạ tầng test) — chặn mọi test phía sau, ưu tiên ngày 1.
- Song song không phụ thuộc: **F3.1/F3.2/F3.3** (0.75 PD, 1 dev) — kết quả F3.3 là input cho F1.2; nên hoàn tất trong 1–2 ngày đầu.
- Song song độc lập: **F2.1, F2.2** (runbook) — không đụng code, làm cùng lúc bởi người viết tài liệu.

**Sprint 1 — Tuần 2 (test rủi ro cao):**
- Sau F1.0: chạy **F1.1**, **F1.2** (cần F3.3), **F1.3** — có thể song song theo từng dev vì test độc lập dữ liệu (mỗi test `resetDb()`).
- **F2.3** (DR/migration) sau khi F2.1 xong.

**Sprint 2 — Tuần 3 (flag + gắn CI + chốt):**
- **F1.4** (smoke flag) — cần CI matrix, làm sau khi F1.1–F1.3 ổn định.
- Gắn tất cả vào CI gate `e2e-a0` (Postgres service), bật chặn merge khi đỏ.
- Review runbook với khách hàng; tổng hợp báo cáo QA bàn giao.

Lưu ý song song: F1.x (code/test) và F2.x (tài liệu) **độc lập** → 2 luồng người chạy song song. F1.2 **phải** chờ F3.3.

### 4. Rủi ro khi thực thi & phương án rollback

| Rủi ro | Khả năng/Ảnh hưởng | Phòng ngừa | Rollback |
|---|---|---|---|
| Test trỏ nhầm Supabase prod → `resetDb()` xoá dữ liệu | Thấp / Nghiêm trọng | Guard host trong `resetDb()` chỉ cho `127.0.0.1`; `.env.test` gitignore; CI dùng service riêng | Khôi phục PITR (RPO 24h) theo F2.3; revoke cred test |
| F1.3 phát hiện `convertLeadV2` thật sự vượt sĩ số khi song song | Cao / Trung bình | Đánh dấu test `expected-fail` + mở issue fix lock (ngoài WS-F), không tự sửa logic ngoài scope | Giữ test ở trạng thái skip có nhãn; không chặn merge |
| Lô `PH‑1/PH‑2` chưa commit → test phản ánh code cũ | Trung bình / Cao | Commit + `migrate deploy` trước khi gắn gate (tiền đề) | Tách branch test, chưa bật gate cho tới khi commit xong |
| Smoke flag ON làm vỡ route khác (side-effect SCORM/signed-url) | Trung bình / Trung bình | Chạy flag qua env trong CI matrix, không đổi mặc định OFF của prod | Tắt flag (mặc định OFF) — prod không ảnh hưởng |
| Runbook lệch thực tế `vercel.json`/`.env.example` | Trung bình / Thấp | Đối chiếu trực tiếp file nguồn khi điền | Sửa trang tài liệu (không ảnh hưởng runtime) |
| CI flaky do test song song chia sẻ DB | Trung bình / Trung bình | `resetDb()` mỗi test, DB ephemeral (không mount volume), chạy tuần tự nhóm ghi | Đổi sang chạy serial nhóm payment/convert |

### 5. Tổng effort & mốc bàn giao

- **Tổng effort**: **14.75 PD** (F1: 9.0 — gồm F1.0 1.0, F1.1 2.0, F1.2 2.5, F1.3 1.5, F1.4 2.0; F2: 4.5 — F2.1/F2.2/F2.3 mỗi 1.5; F3: 0.75). Nằm trong khoảng audit 10–18 PD.
- **Mốc M1 (cuối Tuần 1)**: hạ tầng test xanh (F1.0); 3 mục F3 đã chốt vào §11; runbook web/db/redis/email/cron/storage điền xong (F2.1, F2.2).
- **Mốc M2 (cuối Tuần 2)**: F1.1/F1.2/F1.3 xanh local; DR/PITR + migration 2-phase hoàn thiện (F2.3).
- **Mốc M3 (cuối Tuần 3 — bàn giao)**: F1.4 smoke 4 flag xanh; toàn bộ test vào CI gate `e2e-a0` chặn merge; báo cáo QA (số test, pass-rate, coverage ≥ 80% hàm trọng yếu) + runbook đã review khách hàng.

:::tip Điều kiện nghiệm thu cuối
WS-F coi là DONE khi: (1) CI `e2e-a0` xanh và chặn merge khi đỏ; (2) 6 trang container + DR/migration hết "🚧"; (3) sổ §11 cập nhật 3 kết luận F3 với path:line thật; (4) lô `PH‑1/PH‑2/C4/C5` đã commit kèm migration.
:::

Nguồn tham chiếu chính: `docs/10-yeu-cau-chat-luong/index.md` (§10), `docs/07-trien-khai/index.md` + `container-web.md` + `container-storage-r2.md`, `src/content/docs/trien-khai/deployment.mdx` (12 cron, env), `src/content/docs/trien-khai/docker.mdx` (DB test), `docs/11-rui-ro-no-ky-thuat/index.md` và `docs/06-runtime-luong/xuong-song-rbac.md` (path:line bằng chứng).

