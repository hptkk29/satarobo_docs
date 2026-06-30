---
sidebar_position: 3
sidebar_label: "💰 Chi phí & Ngân sách"
description: "Mô hình chi phí: 3 cấu hình đội, phân bổ workstream, cột mốc thanh toán, độ nhạy & run-rate hạ tầng."
---

# MÔ HÌNH CHI PHÍ & NGÂN SÁCH — SATAROBO VN

> Mô hình tham chiếu để chủ dự án trình bày với khách hàng. Số liệu theo thị trường VN, có dải dao động. Lập 2026-06-30.

## Mô hình chi phí & ngân sách

> Phạm vi: khối lượng **còn lại** để hoàn thiện & gia cố SataRobo VN (đã build ~82%). Tất cả con số là **ước lượng có dải dao động**, dùng để hoạch định ngân sách — không phải báo giá cố định. Đơn vị khối lượng: **PD** (person-day, ngày-người hữu ích).

---

### 1. Giả định & phương pháp

**Đơn giá ngày-người (PD) theo cấp bậc — thị trường Đà Nẵng/HCM, 2026:**

| Cấp bậc | Dải đơn giá (tr VND/PD) | Trung tâm | Ghi chú |
|---|---|---|---|
| Junior | 1.2 – 1.8 | 1.5 | Task có hướng dẫn, ít rủi ro |
| Mid | 2.0 – 2.8 | 2.4 | Phần lớn task tính năng |
| Senior | 3.0 – 4.2 | 3.5 | Bảo mật, tiền-bạc, kiến trúc |
| Lead / PM | 4.0 – 5.5 | 4.5 | Review, điều phối, nghiệm thu |
| QA | 1.8 – 2.6 | 2.2 | Test, hồi quy, tài liệu |

**Phương pháp & tham số:**

- **Năng suất hữu ích (utilization):** 70–75% thời gian lịch là PD giao hàng thực (trừ họp, review, ngắt quãng, môi trường). Mô hình dùng **72%**.
- **Quy đổi thời gian:** thời gian lịch = `PD / (số người × 5 ngày/tuần × 72%)`.
- **Contingency:** **+15%** cho đội in-house (rủi ro ước lượng & phát sinh); **+10%** cho agency khoán (rủi ro đã chuyển một phần sang nhà cung cấp).
- **Đơn giá blended (bình quân gia quyền)** theo cơ cấu đội — dùng để quy đổi nhanh PD → chi phí.
- **Tỷ giá tham chiếu:** 1 USD ≈ **25,400 VND** (dùng cho chi phí hạ tầng SaaS tính bằng USD).
- **Chưa bao gồm:** thuế/VAT, phí giao dịch cổng thanh toán (tính theo % giao dịch), chi phí phần cứng/thiết bị, license thiết kế.

:::note
Khối lượng trung tâm **~125 PD** (dải 96–156). Hai kịch bản phạm vi: **(1) Go-live an toàn tối thiểu ~45 PD** (B0 + toàn bộ HIGH); **(2) Hoàn thiện toàn bộ ~125 PD**.
:::

---

### 2. Ba cấu hình đội — so sánh

| Tiêu chí | (A) In-house tinh gọn | (B) In-house chuẩn ⭐ | (C) Agency thuê ngoài |
|---|---|---|---|
| **Thành phần** | 1 Senior + 1 Mid + 0.5 QA | 1 Lead/PM (50%) + 1 Senior + 1–2 Mid + 1 QA | 3 dev khoán theo ngày + PM phía vendor |
| **Quy mô (người)** | 2.5 | 3.5–4 | 3 (+ điều phối) |
| **Throughput (PD/tuần)** | ~9 | ~13 | ~12 |
| **Đơn giá blended (tr/PD)** | 2.8 | 3.2 | 4.5 |
| **KB(1) ~45 PD — thời gian** | ~5 tuần | ~3.5 tuần | ~4 tuần |
| **KB(1) — chi phí nhân sự*** | ~145 tr | ~166 tr | ~222 tr |
| **KB(2) ~125 PD — thời gian** | ~14 tuần (~3.5 th) | ~9.5 tuần (~2.4 th) | ~10.5 tuần |
| **KB(2) — chi phí nhân sự*** | ~402 tr | ~460 tr | ~620 tr |
| **Ưu điểm** | Rẻ nhất, gọn | Cân bằng tốc độ/chất lượng, giữ tri thức nội bộ | Nhanh khởi động, không gánh tuyển dụng |
| **Rủi ro** | Thiếu người review bảo mật/tiền; chậm nếu nghỉ | Chi phí Lead/PM; cần tuyển đúng | Đắt nhất; rủi ro bàn giao tri thức & vận hành sau dự án |

`*` Đã gồm contingency (in-house +15%, agency +10%). Con số làm tròn.

:::tip
Cấu hình **(B)** được khuyến nghị cho phạm vi hoàn thiện toàn bộ: rút ngắn ~30% thời gian so với (A), có **Lead review** cho các workstream nhạy cảm (tiền, bảo mật đa cơ sở), và giữ tri thức trong nội bộ để vận hành lâu dài.
:::

---

### 3. Phân bổ chi phí theo workstream — cấu hình khuyến nghị (B), blended 3.2 tr/PD

| WS | Hạng mục | PD central | Đơn giá (tr/PD) | Chi phí (tr VND) | % ngân sách |
|---|---|---:|---:|---:|---:|
| WS-A | Bảo mật & cách ly đa cơ sở | 25 | 3.5 (Senior) | 87.5 | ~21% |
| WS-B | Toàn vẹn tiền & ghi danh | 18 | 3.5 (Senior) | 63.0 | ~15% |
| WS-C | Hoàn thiện tính năng & gỡ flag | 30 | 2.9 (Mid+) | 87.0 | ~21% |
| WS-D | Gia cố HR/Kho/Public | 15 | 2.6 (Mid) | 39.0 | ~9% |
| WS-E | Hạ tầng + cổng thanh toán + invoice | 22 | 3.3 | 72.6 | ~17% |
| WS-F | QA/Test/Tài liệu vận hành | 14 | 2.2 (QA) | 30.8 | ~7% |
| **Cộng** | | **124** | **~3.06 bq** | **~380** | **~91%** |
| | Lead/PM & điều phối (50%, xuyên suốt) | — | — | ~38 | ~9% |
| **Tổng trước contingency** | | | | **~418** | **100%** |
| **Tổng + contingency 15%** | | | | **~480** | |

:::note
Hai WS nhạy cảm nhất về rủi ro tài chính/pháp lý — **WS-A** và **WS-B** — chiếm ~36% ngân sách và nên do **Senior + Lead review**. Cổng thanh toán online trong **WS-E** (~8–15 PD) có thể tách **Giai đoạn 2** để giảm ~30–48 tr khỏi ngân sách go-live.
:::

---

### 4. Hai kịch bản ngân sách

| Kịch bản | Phạm vi | PD (central) | Thời gian (cấu hình B) | Chi phí nhân sự (central) | Dải dao động |
|---|---|---:|---|---:|---|
| **(1) Go-live an toàn tối thiểu** | B0 + toàn bộ HIGH | ~45 | ~3.5 tuần | **~166 tr** | 120 – 215 tr |
| **(2) Hoàn thiện toàn bộ** | Tất cả WS A–F | ~125 | ~9.5 tuần (~2.4 th) | **~480 tr** | 360 – 600 tr |
| **(2b) Hoàn thiện − cổng TT (G2)** | Trừ cổng thanh toán online | ~113 | ~8.5 tuần | **~430 tr** | 330 – 540 tr |

- Dải dao động phản ánh **khối lượng** (96–156 PD) **×** biến động **đơn giá** (Mục 7), không cộng dồn hai cực để tránh phóng đại.
- KB(1) mở đường go-live sớm; phần còn lại (~80 PD) triển khai song song/sau đó theo cuốn chiếu.

---

### 5. Cột mốc thanh toán (gắn deliverable nghiệm thu được)

Cho kịch bản **(2) Hoàn thiện toàn bộ** — tổng ~480 tr (gồm contingency):

| Mốc | Deliverable | Điều kiện nghiệm thu | % | Giá trị (tr) |
|---|---|---|---:|---:|
| **M1** | Ký HĐ & khởi động | Chốt phạm vi, backlog, môi trường staging sẵn sàng | 15% | ~72 |
| **M2** | WS-A + WS-B hoàn tất | Cách ly đa cơ sở pass kiểm thử thâm nhập nội bộ; bút toán tiền cân đối (reconciliation) đạt; không lỗi blocker | 25% | ~120 |
| **M3** | WS-C + WS-D — gỡ feature flag | Các tính năng gỡ flag chạy ổn trên staging ≥5 ngày, không lỗi nghiêm trọng; HR/Kho/Public pass UAT | 30% | ~144 |
| **M4** | WS-E — hạ tầng + cổng TT + invoice | Cổng thanh toán online giao dịch thật thành công (sandbox→live); invoice xuất đúng; monitoring/alert (`Sentry`) hoạt động | 15% | ~72 |
| **M5** | Nghiệm thu cuối + WS-F | Bộ test hồi quy xanh; tài liệu vận hành & runbook bàn giao; go-live production ổn định ≥7 ngày | 15% | ~72 |

:::caution
Mỗi mốc chỉ giải ngân khi **deliverable nghiệm thu được kiểm chứng** (demo + checklist ký nhận), không theo thời gian. Với KB(1) Go-live tối thiểu, gộp còn 3 mốc: M1 (20%) → M2 an toàn (50%) → nghiệm thu go-live (30%).
:::

---

### 6. Chi phí vận hành hạ tầng (run-rate) — ước tính/tháng

| Dịch vụ | Vai trò | Trong giai đoạn build (tr/th) | Sau go-live, tải nhỏ (tr/th) | Sau go-live, tăng trưởng (tr/th) |
|---|---|---|---|---|
| `Vercel` (Pro) | Hosting Next.js | 0.5 – 0.8 | 0.5 – 1.0 | 1.0 – 2.5 |
| `Supabase` (Pro) | Postgres + Auth + Storage | 0.65 – 1.0 | 0.65 – 1.5 | 1.5 – 4.0 |
| `Upstash` (Redis/QStash) | Cache, rate-limit, queue | 0 – 0.5 | 0.2 – 0.8 | 0.5 – 1.5 |
| `Cloudflare R2` | Lưu trữ file/ảnh | 0.1 – 0.3 | 0.1 – 0.5 | 0.3 – 1.2 |
| `Resend` | Email giao dịch | 0 – 0.3 | 0.2 – 0.5 | 0.5 – 1.2 |
| `Sentry` | Giám sát lỗi/hiệu năng | 0 – 0.5 | 0.3 – 0.7 | 0.5 – 1.5 |
| Domain / Cloudflare / DNS | Hạ tầng phụ | 0.1 – 0.2 | 0.1 – 0.2 | 0.1 – 0.3 |
| **Cộng run-rate** | | **~1.5 – 4.0** | **~2.0 – 5.0** | **~4.5 – 12.0** |

:::note
**Phí cổng thanh toán** (VNPay/MoMo/ZaloPay…) ~**1.5–2.2%/giao dịch** — biến phí theo doanh thu, không nằm trong run-rate cố định ở trên. Quy đổi USD theo tỷ giá tham chiếu 25,400 VND/USD; phần lớn dịch vụ có bậc free đủ cho giai đoạn đầu.
:::

---

### 7. Bảng độ nhạy — chi phí KB(2) theo đơn giá × khối lượng

Chi phí nhân sự (tr VND), **trước** contingency:

| Đơn giá blended ↓ \ Khối lượng → | 100 PD | 125 PD (central) | 155 PD |
|---|---:|---:|---:|
| **2.5 tr/PD** (đội tinh gọn) | 250 | **312** | 387 |
| **3.2 tr/PD** (chuẩn ⭐) | 320 | **400** | 496 |
| **4.5 tr/PD** (agency) | 450 | **562** | 697 |

> Ô trung tâm khuyến nghị: **125 PD × 3.2 tr/PD ≈ 400 tr** (≈ **460–480 tr** sau contingency 15%). Cực thấp ~250 tr, cực cao ~700 tr (chỉ xảy ra nếu vừa thuê agency vừa vượt phạm vi).

---

### 8. Tóm tắt cho khách hàng & khuyến nghị

:::tip
**Tóm tắt:** Để đưa SataRobo VN từ ~82% lên hoàn thiện & gia cố toàn bộ, ngân sách nhân sự ước tính **~460–480 triệu VND** (dải 360–600 tr tùy đơn giá và khối lượng phát sinh), thời gian **~2.4 tháng** với đội in-house chuẩn 3–4 người. Nếu ưu tiên ra mắt sớm, kịch bản **Go-live an toàn tối thiểu** chỉ cần **~166 triệu VND** và **~3.5 tuần**, tập trung vào bảo mật đa cơ sở và toàn vẹn tiền — phần còn lại triển khai cuốn chiếu. Chi phí vận hành hạ tầng SaaS ở mức thấp, **~2–5 triệu VND/tháng** giai đoạn đầu, tăng dần theo lượng người dùng.
:::

**Khuyến nghị:** chọn **Cấu hình (B) — In-house chuẩn** với **Lead/PM review** cho WS-A và WS-B; **tách cổng thanh toán online thành Giai đoạn 2** để go-live nhanh và an toàn hơn; thanh toán theo **5 cột mốc gắn nghiệm thu** (Mục 5) để kiểm soát rủi ro hai phía. Giữ contingency 15% và rà soát lại khối lượng sau mốc M2 để chốt ngân sách phần còn lại.

