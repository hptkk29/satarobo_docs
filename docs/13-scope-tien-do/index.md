---
sidebar_position: 1
sidebar_label: "📊 Bản scope kiểm soát"
description: "Bản scope tổng kiểm soát tiến độ SataRobo — % toàn dự án, theo module, tồn đọng, rủi ro, thời gian & kinh phí."
---

# BẢN SCOPE KIỂM SOÁT DỰ ÁN — SATAROBO VN

> **Mục đích:** một bản đồ duy nhất để chủ dự án kiểm soát toàn bộ tiến trình — đã làm bao nhiêu trong từng module, bao nhiêu trên toàn dự án, tồn đọng nghiêm trọng, giải pháp, rủi ro, và thời gian & kinh phí hoàn thành.

| Thông tin | Giá trị |
|---|---|
| Ngày lập | 2026-06-30 |
| Nguồn dữ liệu | (1) Tài liệu chi tiết Astro/Starlight (~70 trang `.mdx`, mô tả "đúng theo code hiện tại" — đồng bộ `main` commit `bfd2ca3`) + (2) Tài liệu kiến trúc arc42 GitHub `hptkk29/satarobo_docs` (12 chương) |
| Cách chấm | Audit có cấu trúc ~200 tính năng con qua 16 tác nhân đọc song song, theo taxonomy trạng thái của chính dự án (✅ wired / 🟡 partial / 🧩 schema-only / 🔴 broken) |
| Hệ thống | Modular monolith **Next.js 16** (App Router, React 19, TS strict) · 3 tên miền (Public/Admin/Portal) · PostgreSQL Supabase + Prisma 5 (170+ models) · RBAC 9 vai trò · Vercel + Cron |

---

## 0. Phương pháp chấm điểm & độ tin cậy (đọc trước khi dùng số liệu)

Bản scope này chấm tiến độ **từ tài liệu phản chiếu mã nguồn**, không phải đọc trực tiếp repo code. Tài liệu tự khẳng định bám sát code tại commit `bfd2ca3` và dùng sẵn bộ nhãn trạng thái đối chiếu code thực, nên độ tin cậy ở mức **trung bình–cao**, nhưng có 3 lưu ý:

1. **% là ước lượng có trọng số**, suy ra từ nhãn trạng thái + bằng chứng (tên hàm, file, số Phase). Sai số kỳ vọng ±5–8% mỗi module.
2. **Tính năng "đã build nhưng sau feature-flag TẮT"** (SCORM, Eval V2, Convert V2, Session Lifecycle V2, Signed-URL ảnh) được tính là **partial** — vì code có nhưng **chưa chạy thực tế cho người dùng**.
3. Một số mâu thuẫn giữa tài liệu cũ (§11 risk register) và trang chi tiết mới đã được ghi chú "cần xác minh".

> **Khuyến nghị:** trước khi chốt ngân sách, nên cho 1 dev đối chiếu chọn mẫu ~15 hàm/Phase nêu trong bản này với repo thật (1–2 ngày) để hiệu chỉnh số.

---

## 1. TÓM TẮT ĐIỀU HÀNH

**Hệ thống đã được xây dựng phần lớn và đang vận hành** (riêng Admin có ~196 trang `page.tsx`). Đây không phải dự án mới khởi động — mà là dự án ở giai đoạn **hoàn thiện & gia cố (hardening)**.

| Chỉ số | Giá trị | Diễn giải |
|---|---|---|
| **Hoàn thiện tính năng (feature completion)** | **≈ 82%** | Trung bình có trọng số 13 module |
| **Sẵn sàng vận hành an toàn (production-readiness)** | **≈ 75%** | Thấp hơn do khoảng trống bảo mật đa cơ sở + toàn vẹn tiền + fix chưa commit |
| **Phần còn lại** | **≈ 18% tính năng** | Chủ yếu là *đóng nợ kỹ thuật* + *bật/dọn feature-flag* + *gia cố bảo mật/tiền*, không phải xây mới từ đầu |
| **Tồn đọng nghiêm trọng (HIGH)** | **10 hạng mục** + 1 blocker chưa commit | Xem §5 |
| **Thời gian hoàn thành toàn bộ** | **~3–4 tháng** (đội 2–3 người) | Bản tối thiểu go-live an toàn: **~5–6 tuần** |
| **Kinh phí hoàn thành toàn bộ** | **~400 triệu VND** (dải 300–700tr) | Theo đơn giá thị trường VN; xem §8 để hiệu chỉnh theo đội/đơn giá thật |

**3 điều quan trọng nhất chủ dự án cần biết ngay:**

1. 🔴 **Cách ly dữ liệu đa cơ sở mới chặn ở chiều ĐỌC, chưa chặn chiều GHI** → đây là rủi ro bảo mật & vi phạm mục tiêu cốt lõi #1 (CS1 không được đụng dữ liệu CS2). Đây là việc **ưu tiên số 1**.
2. 🔴 **Một loạt fix về tiền/ghi danh đang nằm ở "working tree, CHƯA COMMIT"** (PH-1 split-brain Payment, PH-2 Lead→REGISTERED, C4/C5 + migration `20260629142518`). Phải **commit + chạy migration** ngay, nếu không có nguy cơ mất thay đổi nền và lệch môi trường.
3. 🟡 **Phần lớn nợ kỹ thuật là "2 luồng song song chưa hợp nhất"** (2 hệ convert, 2 hệ học thử, 2 hệ trạng thái ghi danh, 2 generator mã HV, RBAC v1/v2, audit kép...). Không nguy hiểm tức thời nhưng **càng để lâu càng đắt** và dễ sinh bug hồi quy.

---

## 2. PHẠM VI DỰ ÁN (SCOPE)

**Trong phạm vi (3 mặt, 1 app):**
- **Public** `satarobo.vn` — brand hub: trang chủ, khóa học, tin tức, tuyển dụng, học cụ, vinh danh, liên hệ; thu **lead** Messenger-first theo phễu **SR.QD.217** (L1→L2→L3).
- **Admin CMS** `admin.satarobo.vn` — vận hành: CRM, ghi danh, lớp/buổi học, điểm danh, học bạ, tài chính, kho, nhân sự, marketing.
- **Portal phụ huynh** `hocvien.satarobo.vn` — học phí, lịch, bài tập/thi, học bạ, ảnh lớp, yêu cầu, đánh giá. *(Học viên KHÔNG có tài khoản riêng — truy cập qua tài khoản phụ huynh, ADR-008.)*

**Ngoài phạm vi (đã loại):** AI camera/sinh trắc, Web3/NFT, marketplace, login học sinh riêng, LMS video online, AI learning-path.

**Ràng buộc kỹ thuật (FROZEN — không đổi nếu không hỏi):** Next.js 16 · React 19 · TS strict · PostgreSQL Supabase · Prisma 5 · Auth.js v5 · Cloudflare R2 · Resend · Upstash Redis · Sentry · Vercel `hnd1` · pnpm 11. **Không** microservice, **không** message broker (dùng DB-queue + Cron).

**5 mục tiêu chất lượng cốt lõi (§1):** (1) Cách ly cơ sở multi-center · (2) Toàn vẹn tiền & ghi danh atomic · (3) Bảo mật & quyền tối thiểu (PII trẻ em) · (4) Hiệu năng public (Lighthouse ≥85) · (5) Mở rộng tổ chức không sửa code (OrgUnit tree).

> ⚠️ **Tình trạng:** Mục tiêu #1 (#cách ly) và #2 (#toàn vẹn tiền) hiện đang có khoảng trống nghiêm trọng nhất — xem §5.

---

## 3. TIẾN ĐỘ THEO MODULE & TOÀN DỰ ÁN

### 3.1 Bảng tiến độ tổng — 13 module

> **Trọng số** = ước lượng công sức xây dựng của module so với toàn dự án (1–10). **Đóng góp** = phần của module trong 100% toàn dự án.

| # | Module | Hoàn thành | Còn lại | Trọng số | Tỷ trọng | Trạng thái nổi bật |
|---|---|:---:|:---:|:---:|:---:|---|
| 1 | **Auth & Phân quyền (RBAC)** | 80% | 20% | 8 | 9.4% | RBAC v1 chạy tốt; v2 shadow OFF; **write-scope chưa chặn** 🔴 |
| 2 | **CRM & Tuyển sinh** | 81% | 19% | 9 | 10.6% | Phễu/SLA/hoa hồng tốt; **2 luồng convert, v1 bỏ guard tiền** 🔴 |
| 3 | **LMS & Đào tạo** | 84% | 16% | 9 | 10.6% | Lõi mạnh; **SCORM + Eval V2 build xong nhưng flag OFF** 🟡 |
| 4 | **SIS — Học viên & Ghi danh** | 83% | 17% | 8 | 9.4% | Vòng đời/định giá tốt; 2 hệ enrollment + 2 mã HV song song 🟡 |
| 5 | **Tài chính** | 83% | 17% | 8 | 9.4% | Đơn/thu/biên lai atomic tốt; **2 luồng hoàn tiền tách rời** 🔴 |
| 6 | **Portal Phụ huynh** | 84% | 16% | 7 | 8.2% | Học tập/thi tốt; đánh giá/khảo sát flag OFF; ảnh lộ URL thô 🟡 |
| 7 | **Public / Brand & Marketing** | 84% | 16% | 4 | 4.7% | Web/SEO/CMS tốt; **GA4+Pixel có thể chưa mount** 🔴 |
| 8 | **Nhân sự (HR) & Chấm công** | 88% | 12% | 5 | 5.9% | Chấm công/chỉnh công tốt; **import ca đè cả tháng** 🔴 |
| 9 | **Sản phẩm & Kho** | 92% | 8% | 5 | 5.9% | Hoàn thiện nhất; 3 hệ tồn kho độc lập chưa reconcile 🟡 |
| 10 | **Hệ thống · Cấu hình · Báo cáo** | 82% | 18% | 7 | 8.2% | **Dashboard QL dùng raw db (rò liên cơ sở)** 🔴; audit phân mảnh |
| 11 | **Tầng dữ liệu (ERD/Schema)** | 78% | 22% | 7 | 8.2% | Schema mạnh; nhiều 2-phase migration chưa đóng 🟡 |
| 12 | **Hạ tầng & Triển khai** | 72% | 28% | 4 | 4.7% | Vercel/Supabase chạy; **DR chưa drill; Redis fallback chưa định nghĩa** 🟡 |
| 13 | **UX Flows (giao diện thực)** | 89% | 11% | 4 | 4.7% | UI↔action↔DB đa số đã nối; ô search global có thể tĩnh 🟡 |

### 3.2 Tỷ lệ hoàn thành toàn dự án

```
% toàn dự án = Σ(% module × trọng số) / Σ(trọng số) = 7041 / 85 ≈ 82.8%
```

| Thước đo | Kết quả |
|---|---|
| **Hoàn thành tính năng (đã build)** | **≈ 82–83%** |
| **Còn lại** | **≈ 17–18%** |
| **Sẵn sàng vận hành an toàn** | **≈ 75%** *(sau khi trừ khoảng trống bảo mật/tiền & blocker chưa commit)* |

> **Lưu ý double-count nhẹ:** "UX Flows" (M13) và "Tầng dữ liệu" (M11) là các lớp xuyên suốt của các module nghiệp vụ; chúng được giữ riêng để theo dõi nhưng có chồng lấn công sức với M1–M10. Nếu loại 2 lớp này khỏi mẫu số, % toàn dự án gần như không đổi (~83%).

---

## 4. CHI TIẾT TỪNG MODULE (đã xong / đang dở / còn lại)

### M1 · Auth & Phân quyền (RBAC) — 80%
- **Đã xong (✅):** Đăng nhập Credentials+JWT (95%), OTP phụ huynh email (90%), real-time session invalidation theo `tokenVersion` (95%), định tuyến host×role + chống open-redirect (95–100%), **RBAC v1 ma trận tĩnh 143 quyền/8 vai trò đang chạy production** (92%), per-user grant ALLOW/DENY (85%), field-level visibility lương/PII (90%), scopedDb **đọc** (80%).
- **Đang dở (🟡):** RBAC v2 động (OrgUnit + scope) build xong nhưng **shadow, flag OFF** (60%); cây OrgUnit dual-write (65%); EmployeeOrgAssignment (60%).
- **Còn lại / 🔴:** **scopedDb chưa auto-scope GHI** (15% — xem #1 §5); migrate ~219 file còn `import @/lib/db` trần; đưa ReportCard/Attendance/EvaluationRound ra khỏi `SCOPE_EXEMPT`; đạt 7 ngày `RbacShadowDiff = 0` rồi bật v2; build SMS OTP; refresh grant không cần re-login; gỡ legacy role shim.

### M2 · CRM & Tuyển sinh — 81%
- **Đã xong (✅):** Phễu 15 trạng thái + guard chuyển (85%), webhook đa kênh + verify 2 lớp + idempotent (90%), chống trùng 2 tầng (90%), Messenger 2 chiều (85%), chia lead 3 chế độ (80%), bàn giao/transfer/bulk (85%), SLA engine + cron (85%), học thử V2 (85%), commission 4 tầng + bảng kê (85%), ROAS/CPL/CPA + Meta CAPI (75–85%).
- **Đang dở (🟡):** **Convert V2 đầy đủ guard nhưng flag OFF** (60%); webhook replay chỉ Messenger (65%); học thử legacy song song (55%); ConvertConflict (65%).
- **Còn lại / 🔴:** Hợp nhất 2 luồng convert (xem #2 §5); replay cho Lead Ads/Zalo; xác minh `hasRecordedPayment` (caution "tạm false"); hợp nhất 2 generator auto-assign; verify env Meta production (thiếu token → mất tracking).

### M3 · LMS & Đào tạo — 84%
- **Đã xong (✅):** Giáo trình/lesson versioning + optimistic lock (88–90%), khóa học/gói/tiên quyết DAG (86%), bài tập + rubric robotics + auto-giao qua event (90%), buổi học lifecycle + checklist (86%), vòng đời lớp + duyệt (90%), sinh buổi né holiday (90%), **điểm danh idempotent + auto học bù** (88%), học bù liên cơ sở (90%), học bạ state machine + PDF (85–86%).
- **Đang dở (🟡):** **SCORM runtime đầy đủ nhưng flag OFF** (72%); **Eval V2 (đánh giá năng lực) đầy đủ nhưng flag OFF** (70%); session-lifecycle V2 flag OFF (50%); kỹ năng robotics — thiếu UI nhập (72%); hoàn thành/chứng chỉ — chưa kiểm chứng UI (60%).
- **Còn lại / 🔴:** **Cấp quyền duyệt/phát hành học bạ cho vai trò TRAINING** (đang thiếu — xem #5 §5); bật & smoke-test SCORM/Eval V2; sửa `genCertCode` entropy thấp + guard tiêu chí trước khi cấp chứng chỉ; đưa `markAttendance` về matrix `attendance:edit`; hoàn tất 2-phase `AttendanceStatus` & dual-pointer `ClassSession`.

### M4 · SIS — Học viên & Ghi danh — 83%
- **Đã xong (✅):** Data model Student + soft delete (95%), Counter atomic (100%), vòng đời + 12 action (bảo lưu/rút/resume) (90–95%), tài khoản PH + liên kết con + OTP (85%), xếp lớp Serializable chống vượt sĩ số + tiên quyết (92%), đổi/chuyển lớp + audit (88–90%), **pricing engine + snapshot giá bất biến** (80–95%).
- **Đang dở (🟡):** 2 generator mã HV song song (80%); 2 hệ EnrollmentStatus legacy+D5 (82%); CourseDiscount/CoursePackage pricing (60–70%); GRADUATED transition (40%); migrate `centerId→orgUnitId` mới 30%.
- **Còn lại / 🔴:** Hoàn tất migrate orgUnitId (PR-D); chốt 1 chuẩn mã HV + back-fill; back-fill enrollment legacy→D5; **xây UI cấp/thu hồi StudentConsent** (schema-only); gỡ field `tuition` legacy + fallback giá hardcode.

### M5 · Tài chính — 83%
- **Đã xong (✅):** Tạo đơn atomic + race guards (95%), state machine Order + optimistic lock (95%), mã đơn atomic (98%), trả góp 2 đợt (90%), **thanh toán 2 tầng record/confirm + idempotency** (95%), biên lai nguyên tử (92%), reject/adjust/refund + audit (90%), công nợ/aging + nhắc nợ cron (85–90%), voucher (90%), portal hiển thị tài chính (88%).
- **Đang dở (🟡):** Quy trình duyệt RefundRequest (70%); cổng thanh toán online (10% — chỉ QR tĩnh); phát hành Invoice (25% — util có, chưa nối UI).
- **Còn lại / 🔴:** **Hợp nhất 2 luồng hoàn tiền** (auto bút toán khi APPROVED→PAID — xem #3 §5); đồng bộ "tiền thực nhận" giữa công nợ và hoàn tiền; đưa `recomputeOrder` + side-effect vào tx/outbox; **tích hợp cổng thanh toán online thật** (VNPAY/TINGEE webhook); nối UI phát hành hóa đơn; hỗ trợ OrderType COMBO.

### M6 · Portal Phụ huynh — 84%
- **Đã xong (✅):** Session/ownership cookie HMAC chống IDOR (95%), dashboard 2 cấp (92%), bài giảng (90%), bài tập (90%), **bài thi tính giờ + tự chấm** (92%), kết quả học tập (90%), nhận xét GV (90%), SataCoin đọc (85%), lịch học (92%), điểm danh 5 chỉ số (90%), yêu cầu/báo vắng (88–92%), tin nhắn 2 chiều (85%), gallery ảnh + consent (85%), đánh giá trung tâm (88%).
- **Đang dở (🟡):** Học bạ — fallback 2 hệ (78%); **đánh giá GV + khảo sát NPS round-based flag OFF** (58–62%); signed-URL ảnh flag OFF (50%); cảnh báo rủi ro/chăm sóc HV — chưa rõ cơ chế tự sinh (65–70%); công nợ chỉ-đọc, không có thanh toán online (70%).
- **Còn lại / 🔴:** Bật & QA Eval V2; **bật MEDIA_SIGNED_URL + xử lý ảnh/tài liệu lộ URL thô** (xem #9 §5); hợp nhất 2 luồng khảo sát; thêm trạng thái đã đọc cho thông báo; quyết định ẩn danh đánh giá GV; thêm unique constraint idempotency RiskAlert; đưa `MakeupNeed` vào transaction (đang `.catch(()=>{})` nuốt lỗi); **fail-fast khi thiếu secret HMAC ở prod**.

### M7 · Public / Brand & Marketing — 84%
- **Đã xong (✅):** Engine RSC+ISR (95%), trang chủ/tin tức/tuyển dụng/học cụ/liên hệ/legal (85–95%), layout + CookieConsent NĐ13 (90–93%), SEO metadata + 11 JSON-LD (92%), Meta CAPI server-side (80%), CMS tin tức + nội dung website (85–90%), marketing dashboard + funnel (85–88%), popup chiến dịch (88%).
- **Đang dở (🟡):** Khóa học — 2 nguồn DB+hardcode (78%); vinh danh — tạm ẩn nav (72%); **GA4 + Meta Pixel có thể chưa mount** (50%).
- **Còn lại / 🔴:** **Verify & mount GA4/Pixel vào layout** (xem #7 §5); điền `fbq` snippet thật (đang placeholder); chốt DB là single-source cho course; sửa quyền `site-content` (đang mượn `honors:settings`); soft-delete cho News; tham số hóa Graph API version.

### M8 · Nhân sự (HR) & Chấm công — 88%
- **Đã xong (✅):** Hồ sơ NV CRUD (90%), **đổi vai trò + audit + bump tokenVersion** (95%), field-level visibility (95%), hồ sơ GV + gán lớp + đánh giá (90%), **checkin QR + geofence** (88%), đăng ký ca cá nhân (86%), duyệt ca Excel (85%), **chỉnh công + audit trail** (90%), checklist cơ sở (90%), tuyển dụng + vinh danh (85–88%).
- **Còn lại / 🔴:** **`importApprovedShifts` đè cả tháng không rollback** → thêm preview/diff/upsert + snapshot (xem #6 §5); QR token cố định → rotation/TOTP + sanity GPS (chống spoof chấm công); soft-delete cho NV; kiểm chứng luồng import Excel NV (chưa rõ action).

### M9 · Sản phẩm & Kho — 92% *(hoàn thiện nhất)*
- **Đã xong (✅):** Học cụ ZMRobo CRUD + editor (90–95%), sản phẩm CRUD + audit (95%), điều chỉnh tồn + movement snapshot (85–95%), kho per-center RECEIPT/ISSUE/TRANSFER (95%), chống âm tồn guarded (95%), recordAdjustment Serializable (90%), kiểm kê InventoryAudit (92%), dashboard tồn kho (90%).
- **Còn lại / 🟡:** Thêm TOCTOU guard cho `adjustStockAction` (Product); reconcile 3 hệ tồn kho (Kit/Product toàn cục/StockBalance per-center); soft-delete cho Kit; `submitAudit` ghi đè tuyệt đối có thể mất movement xen giữa.

### M10 · Hệ thống · Cấu hình · Báo cáo — 82%
- **Đã xong (✅):** Admin shell gate 4 lớp (95%), sidebar 13 nhóm lọc quyền (95%), quản lý tài khoản/email template/log/queue, audit log viewer, tích hợp ngoài, báo cáo + dashboard theo vai trò.
- **Còn lại / 🔴:** **`ManagerDashboard` dùng raw db (rò dữ liệu liên cơ sở cho CENTER_MANAGER)** → chuyển scopedDb (xem #4 §5); sửa lệch guard audit-log (`users:manage` vs `audit-logs:view`); hợp nhất viewer audit (5+ bảng phân mảnh); báo cáo `take` lớn (20k–50k bản ghi) chưa phân trang/aggregate; **dọn các flag OFF lâu** (convertV2/sessionLifecycleV2/mediaSignedUrl/evalV2/scorm); hoàn thiện tích hợp VietQR/Zalo/MISA (mới config + log).

### M11 · Tầng dữ liệu (ERD/Schema) — 78%
- **Đã xong (✅):** Schema 170 model/120 enum chia 5 bounded context (90%+); Outbox DomainEvent idempotent (85%); Counter 11 loại mã (90%); scopedDb đọc (85%); soft-delete + sổ cái bất biến (90%).
- **Còn lại / 🔴:** Hợp nhất audit kép (~9 bảng audit riêng → `AuditLog`); **đóng hàng loạt 2-phase migration** (centerId→orgUnitId, Department→departmentId, Lead.childName legacy, Enrollment.tuition, TrialClass v1...); bật runtime cho `CoinRuleConfig` (schema-only); đưa partial-unique index (ngoài Prisma) vào version control + test; cân nhắc DB-constraint cho tính bất biến sổ cái (hiện chỉ app-layer).

### M12 · Hạ tầng & Triển khai — 72% *(thấp nhất)*
- **Đã xong (✅):** Vercel serverless + Supabase pooler (xử lý IPv6 quirk) (90%), 12 Vercel Cron idempotent (85%), quản lý env/secrets (85%), Docker test env + fallback scoop (85%).
- **Đang dở (🟡):** R2 storage + signed-URL flag (70%); Redis rate-limit (65% — **fallback chưa định nghĩa**); email infra (70%); CI/CD (75%); observability Sentry (75%); tài liệu container phần lớn còn skeleton (40%).
- **Còn lại / 🔴:** **Bật auto-scope WRITE** (xem #1); **xử lý `/portal/bai-giang` lộ fileUrl thô** (#9); **chạy DR drill thật** chứng minh RPO 24h/RTO 4–8h (#10); định nghĩa Redis fallback fail-open/closed; hoàn thiện runbook container; (tùy chọn) Dockerfile self-host để giảm khóa nhà cung cấp.

### M13 · UX Flows — 89%
- **Đã xong (✅):** Login/activation OTP (92–95%), admin shell + sidebar (95%), dashboard 6 vai trò + PendingTasks (90%), mẫu CMS list/form/2-click delete (95%), modal vòng đời HV (92%), import Excel HV/lead (88%), kanban + đổi trạng thái lead optimistic (92%), lưới điểm danh (95%), học bù + học bạ (90%), mẫu UX dùng chung (toast/transition) (95%).
- **Còn lại / 🟡:** **Ô tìm kiếm global Topbar có thể là UI tĩnh** (40% — cần verify/implement); hợp nhất 2 luồng convert UI; chuẩn hóa UX xóa (news dùng `confirm()` native) + màu nút; phân trang/realtime cho Messenger Inbox; bật/kiểm chứng mục sidebar theo flag scorm/eval.

---

## 5. TỒN ĐỌNG NGHIÊM TRỌNG (HIGH) + BLOCKER & GIẢI PHÁP

### 5.1 Blocker phải xử lý NGAY (chặn an toàn vận hành)

| # | Blocker | Bằng chứng | Giải pháp |
|---|---|---|---|
| B0 | **Fix tiền/ghi danh chưa commit** — PH-1 (split-brain Payment), PH-2 (Lead→REGISTERED), C4/C5 + migration `20260629142518_lead_payment_enroll_fields` đang ở **working tree** | §11 `:::warning Chưa commit` | Commit + push ngay sau khi chạy test; gắn `prisma migrate deploy` vào pipeline. Rủi ro mất thay đổi nền nếu reset/clean nhầm. **0.5–1 ngày.** |

### 5.2 Tồn đọng nghiêm trọng (HIGH) — bảng kiểm soát

| # | Vấn đề | Module | Mức độ | Vi phạm mục tiêu | Giải pháp đề xuất | Ước lượng |
|---|---|---|:---:|---|---|:---:|
| 1 | **scopedDb không auto-scope GHI** (create/update/delete/upsert + nested include) → IDOR write, CS1 có thể ghi/sửa dữ liệu CS2 | Auth/Data/Infra | 🔴 Cao | #1 Cách ly cơ sở | Mở rộng Prisma Extension chặn write: validate `centerId` của payload + `where`; đệ quy include; **fail-closed**; thêm test CI cho write-path (như `[A0-04]` cho read) | 8–12 ngày |
| 2 | **2 luồng convert; v1 `closeLeadAsEnrolled` bỏ qua guard thanh toán** → ghi danh + tạo Order khi chưa thu tiền, nguy cơ double-enroll | CRM | 🔴 Cao | #2 Toàn vẹn tiền | Bật `CONVERT_V2_ENABLED` ở staging → đối chiếu → cắt v1 chỉ còn delegate sang `convertLeadV2` (đã có guard + idempotency SHA-256 + dedupe) → gỡ flag | 5–7 ngày |
| 3 | **2 luồng hoàn tiền tách rời** — duyệt `RefundRequest` không tự sinh bút toán `refundPayment`; kế toán ghi sổ tay → lệch sổ cái/công nợ | Finance | 🔴 Cao | #2 Toàn vẹn tiền | Khi `APPROVED→PAID`, trong cùng action gọi `refundPayment` (Payment âm) atomic; đồng bộ tập trạng thái "tiền thực nhận" ở `debt.ts` | 3–5 ngày |
| 4 | **`ManagerDashboard` dùng raw db, không scopedDb** → CENTER_MANAGER thấy lead/HV/payment toàn hệ thống | System | 🔴 Cao | #1 Cách ly cơ sở | Thay `db` → `scopedDb(actor)` ở dashboard + các query KPI; test CENTER_MANAGER chỉ thấy cơ sở mình | 2–4 ngày |
| 5 | **Vai trò TRAINING thiếu quyền duyệt/phát hành ReportCard & CourseCompletion** → nghẽn quy trình học bạ cuối kỳ | LMS | 🔴 Cao | Quy trình nghiệp vụ | Thêm capability `review` (report-cards + course-completion) cho TRAINING trong `permissions.ts:382,390,391` (hoặc xác nhận chủ ý dồn lên CENTER_MANAGER) | 1–2 ngày |
| 6 | **`importApprovedShifts` đè TOÀN BỘ lịch tháng** (`deleteMany→createMany`, tối đa 5000 dòng, không rollback) → mất dữ liệu ca nếu Excel sai | HR | 🔴 Cao | Toàn vẹn dữ liệu | Thêm preview/diff trước commit; **upsert theo `[userId,date]`** thay vì xóa cả tháng; snapshot trước khi đè để rollback | 3–4 ngày |
| 7 | **GA4 + Meta Pixel có thể không mount trên public site** → mất toàn bộ tracking marketing/ROAS | Public | 🔴 Cao | #4 Đo lường MKT | Verify layout có mount 2 component; điền `fbq` snippet thật; kiểm GA4 realtime + Meta Events Manager; thêm CI check sự hiện diện tag | 2–3 ngày |
| 8 | **SCORM + Eval V2 build hoàn chỉnh nhưng flag OFF** → "đã làm" nhưng chưa chạy thực, rủi ro vỡ khi bật (code rot) | LMS/Portal | 🔴 Cao | Giá trị sử dụng | Rollout có kiểm soát: bật staging → e2e (upload→ingest→play→điểm; mở round→nộp→aggregate) → bật prod theo cơ sở; chạy CI với flag ON định kỳ | 5–8 ngày |
| 9 | **`/portal/bai-giang` + ảnh học sinh phục vụ qua fileUrl R2 thô** (`MEDIA_SIGNED_URL` OFF) → rò rỉ ảnh/tài liệu trẻ em (PII) | Portal/Infra | 🔴 Cao | #3 Bảo mật PII | Bật `MEDIA_SIGNED_URL` prod sau khi verify presign; **fail-closed** (ẩn ảnh) thay vì fallback URL trần với media nhạy cảm; áp signed-URL cả tài liệu bài giảng | 3–5 ngày |
| 10 | **Backup/DR mới ở mức MỤC TIÊU** (RPO 24h/RTO 4–8h), chưa drill → có thể mất tới 24h dữ liệu tiền/ghi danh | Infra | 🔴 Cao | #2/khả dụng | Chạy DR drill (restore vào staging), đo RTO/RPO thực; cân nhắc PITR + tần suất backup cao hơn cho bảng tiền/enrollment; ghi nhật ký drill | 3–5 ngày |

> **Cần xác minh sớm (mâu thuẫn tài liệu):** §11 (sổ rủi ro cũ) ghi *"Consent ảnh không có UI cấp/thu hồi"* và *"HomeworkAssignment.status không bao giờ chuyển"*, nhưng trang chi tiết mới mô tả `grant/revokeMediaConsent` và state machine bài tập đã hiện thực. Cần 1 dev đối chiếu code 0.5 ngày để biết các mục này đã được sửa hay chưa.

### 5.3 Nợ kỹ thuật MEDIUM nổi bật (không chặn nhưng phải xử lý)

- **~219 file còn `import @/lib/db` trần** (bỏ qua scopedDb) — migrate theo lô, allowlist → 0.
- **RBAC v1 (chạy) + v2 (shadow) song song** lâu dài — UI `/admin/roles` cấu hình nhưng chưa hiệu lực → dễ hiểu nhầm. Cần dashboard `RbacShadowDiff`, đặt mốc flip.
- **Hàng loạt cặp "2 luồng song song"**: TrialClass v1/v2, Assignment/HomeworkAssignment, EnrollmentStatus legacy/D5, 2 generator mã HV, audit kép 9 bảng, NPS legacy/round-based.
- **Side-effect ngoài transaction** nhiều nơi (email/event/`recomputeOrder`/`MakeupNeed`) → nên đưa vào outbox.
- **Idempotency chỉ ở app-layer** (RiskAlert thiếu unique constraint; tính bất biến sổ cái không có DB-constraint).
- **QR chấm công token cố định + tin GPS client** → rủi ro gian lận công.
- **Báo cáo kéo bản ghi thô lớn** (20k–50k) trong RSC → chậm/timeout.

---

## 6. RỦI RO & DỰ PHÒNG (Risk Register)

| Rủi ro | Tác động | Khả năng | Dự phòng |
|---|---|:---:|---|
| **Rò rỉ dữ liệu chéo cơ sở** (write-scope chưa chặn, dashboard raw db, model mới quên `SCOPED_MODELS`) | Cao — vi phạm cam kết multi-tenant, lộ lead/HV/tài chính | Trung bình | Ưu tiên #1 §5; giữ test CI `[A0-04]`; checklist PR cho route/model mới |
| **Lệch sổ cái tiền** (hoàn tiền tách rời, side-effect ngoài tx, debt vs refund) | Cao — báo cáo doanh thu/công nợ sai, khó đối soát | Trung bình | Tự động hóa bút toán; outbox; job đối soát định kỳ |
| **Bật feature-flag lộ bug chưa test prod** (5 flag OFF lâu) | Trung bình–Cao — vỡ luồng khi GA | Cao | CI/e2e với flag ON trên staging; bật theo cơ sở; coi flag-OFF là "partial" |
| **Mất dữ liệu vận hành** (DR chưa drill, import ca đè tháng, hard-delete nhiều nơi) | Cao | Thấp–Trung bình | DR drill; soft-delete; preview/rollback cho import |
| **Lộ PII trẻ em** (ảnh URL thô, consent, secret HMAC chỉ warn) | Cao — pháp lý/uy tín | Trung bình | Signed-URL fail-closed; fail-fast secret; audit ảnh APPROVED không tag |
| **Mất tracking marketing** (GA4/Pixel chưa mount, thiếu env Meta) | Trung bình — ROAS/CPL sai | Trung bình | Mount + verify; health-check + alert khi sync 0 record |
| **Phụ thuộc 1 vùng + chuỗi SaaS** (Vercel/Supabase/Upstash/R2/Resend) | Cao nếu sự cố nhà cung cấp | Thấp | Monitor status; runbook DR; (tương lai) Dockerfile self-host |
| **Cutover RBAC v2 / migrate orgUnitId sai** | Cao — sai quyền/scope diện rộng | Trung bình | Shadow diff = 0 trước flip; bật theo cohort; cờ rollback tức thì |
| **Nợ kỹ thuật tích tụ** (split-brain, schema 170 model phình to) | Trung bình — bug hồi quy, onboarding chậm | Cao | Đặt mốc sunset từng cặp 2-phase; `@deprecated` rõ; giữ ERD đồng bộ main |
| **Audit dựa tài liệu, chưa soi code trực tiếp** | Thấp–Trung bình — sai số ước lượng | Trung bình | Đối chiếu chọn mẫu 15 hàm/Phase với repo (1–2 ngày) |

---

## 7. KẾ HOẠCH HOÀN THÀNH (theo workstream)

> Thứ tự ưu tiên: **An toàn (bảo mật + tiền) → Hoàn thiện trải nghiệm (gỡ flag) → Gia cố vận hành → Dọn nợ.**

| WS | Workstream | Hạng mục chính | Ưu tiên | Effort (ngày-người) |
|---|---|---|:---:|:---:|
| **A** | Bảo mật & cách ly đa cơ sở | #1 write-scope, #4 dashboard, #9 signed-URL, secret fail-fast, migrate 219 file (lô đầu), SCOPE_EXEMPT | P0 | 20–32 |
| **B** | Toàn vẹn tiền & ghi danh | B0 commit/migrate, #2 hợp nhất convert, #3 hợp nhất hoàn tiền, recompute/side-effect→outbox, debt↔refund | P0 | 14–22 |
| **C** | Hoàn thiện tính năng & gỡ flag | #5 quyền TRAINING, #8 bật SCORM/EvalV2, sessionLifecycleV2, hợp nhất TrialClass/Enrollment/mã HV, audit kép, HomeworkAssignment.status | P1 | 25–38 |
| **D** | Gia cố HR/Kho/Public | #6 import ca, #7 GA4/Pixel, QR token, TOCTOU kho, RiskAlert constraint, notification read-state | P1 | 12–18 |
| **E** | Hạ tầng & tính năng mới | #10 DR drill, Redis fallback, cron monitoring, báo cáo aggregate, **cổng thanh toán online (VNPAY/TINGEE)**, phát hành Invoice | P2 | 15–28 |
| **F** | QA / E2E / Tài liệu vận hành | E2E cho write-scope/payment/refund/flags, hoàn thiện runbook container/DR | P2 | 10–18 |
| | **TỔNG** | | | **96–156 (≈125)** |

**Phụ thuộc quan trọng:** B0 (commit/migrate) phải làm trước A & B. RBAC v2 cutover (C) phụ thuộc shadow-diff sạch (A). Cổng thanh toán online (E) là **tính năng mới** — có thể tách giai đoạn 2 nếu cần go-live nhanh.

---

## 8. THỜI GIAN & KINH PHÍ HOÀN THÀNH

### 8.1 Giả định (chủ dự án có thể chỉnh)

| Tham số | Giá trị giả định | Ghi chú |
|---|---|---|
| Khối lượng còn lại | **~125 ngày-người** (dải 96–156) | Từ §7 |
| Đội ngũ | 2 full-stack (mid/senior) + 0.5 QA + 0.3 tech-lead/PM | Quy mô hợp lý cho codebase này |
| Năng suất thực | ~2.2 ngày-người hữu ích / ngày lịch | Đã trừ họp/review/CR |
| Dự phòng (contingency) | +25% | Cho các migration & cutover rủi ro |
| Đơn giá blended (gồm overhead) | **3.2 triệu VND / ngày-người** (dải 2.5–4.5) | Đơn giá thị trường VN senior full-stack |

### 8.2 Hai kịch bản

| Kịch bản | Phạm vi | Thời gian | Kinh phí (central) |
|---|---|---|---|
| **(1) Go-live an toàn tối thiểu** | B0 + toàn bộ HIGH §5 (WS-A lõi + WS-B lõi) — chưa gỡ hết flag, chưa cổng thanh toán online | **~5–6 tuần** | ~45 ngày-người → **~145 triệu VND** (dải 110–200tr) |
| **(2) Hoàn thiện toàn bộ + gia cố** | Tất cả WS A→F, gỡ hết flag, đóng 2-phase, DR drill, cổng thanh toán online | **~3–4 tháng** | ~125 ngày-người → **~400 triệu VND** (dải 300–700tr) |

*(Cộng thêm chi phí vận hành hạ tầng SaaS ~10–25 triệu VND/tháng trong suốt giai đoạn — Vercel/Supabase/Upstash/R2/Resend/Sentry.)*

### 8.3 Bảng độ nhạy kinh phí — Kịch bản (2) hoàn thiện toàn bộ (VND)

| Đơn giá \ Khối lượng | 100 ngày-người | 125 ngày-người | 155 ngày-người |
|---|:---:|:---:|:---:|
| **2.5 tr/ngày** | 250 tr | 313 tr | 388 tr |
| **3.2 tr/ngày** (central) | 320 tr | **400 tr** | 496 tr |
| **4.5 tr/ngày** | 450 tr | 563 tr | 698 tr |

> **Đòn bẩy chi phí lớn nhất:** (a) đơn giá/đội ngũ thật của bạn, (b) có làm cổng thanh toán online ngay không (tiết kiệm ~15–25 ngày-người nếu hoãn sang giai đoạn 2). Gửi tôi đơn giá & quy mô đội thật, tôi tính lại chính xác.

---

## 9. KHUYẾN NGHỊ & BƯỚC TIẾP THEO

1. **Tuần 1 — chặn rủi ro:** Commit + chạy migration B0; bắt đầu WS-A (#1 write-scope) & #4 dashboard scopedDb; verify GA4/Pixel (#7). Đây là các việc rẻ-tác-động-cao.
2. **Tuần 1 — xác minh:** 1 dev đối chiếu ~15 hàm/Phase + 3 mục "cần xác minh" (consent ảnh, HomeworkAssignment.status, `hasRecordedPayment`) với repo thật để hiệu chỉnh % và xác nhận sổ rủi ro §11 còn đúng không.
3. **Tháng 1 — toàn vẹn tiền:** Hoàn tất WS-B (hợp nhất convert + hoàn tiền). Sau mốc này hệ thống đạt **"go-live an toàn"**.
4. **Tháng 2–3 — hoàn thiện:** Gỡ lần lượt 5 feature-flag (mỗi flag = bật staging → e2e → prod theo cơ sở → gỡ nhánh cũ); đóng các 2-phase migration; DR drill.
5. **Quản trị tiến độ:** Dùng 2 file kèm theo (`MA-TRAN-MODULE.csv`, `SO-TON-DONG-RUI-RO.csv`) làm bảng theo dõi sống — cập nhật cột % và trạng thái issue hằng tuần.
6. **Nguyên tắc kiểm soát:** **Coi mọi tính năng sau feature-flag OFF là "chưa xong"** cho tới khi chạy prod thực tế — đây là nguồn lệch lớn nhất giữa "báo cáo đã làm" và "người dùng dùng được".

## Tài liệu liên quan

- 📋 **[Kế hoạch triển khai chi tiết](./ke-hoach)** — 6 workstream sprint-ready (task · file/hàm · nghiệm thu · effort).
- 💰 **[Mô hình chi phí & ngân sách](./chi-phi)** — 3 cấu hình đội, phân bổ theo workstream, cột mốc thanh toán.
- 🗂️ File theo dõi (CSV): [MA-TRAN-MODULE.csv](pathname:///scope/MA-TRAN-MODULE.csv) · [SO-TON-DONG-RUI-RO.csv](pathname:///scope/SO-TON-DONG-RUI-RO.csv)

