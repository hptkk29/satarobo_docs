# 1. Giới thiệu & Mục tiêu

> arc42 §1 — *Introduction and Goals*. Hệ thống làm gì, cho ai, mục tiêu chất lượng nào quan trọng nhất, và ai là bên liên quan.

## 1.1 Tổng quan yêu cầu

**Sata Robo VN** là nền tảng số hoá vận hành cho Công ty CP Công nghệ Giáo dục Sata Robo (Đà Nẵng), gồm 3 mặt trong **một** app Next.js:

- **Public** (`satarobo.vn`) — brand hub: trang chủ, khoá học, vinh danh, tin tức, tuyển dụng, liên hệ; thu hút & nhận **lead**.
- **Admin CMS** (`admin.satarobo.vn`) — vận hành đào tạo: CRM lead, ghi danh, lớp học, buổi học, điểm danh, học bạ, tài chính, kho, nhân sự, marketing.
- **Portal phụ huynh** (`hocvien.satarobo.vn`) — phụ huynh theo dõi & thay con tương tác: học phí, lịch học, bài tập/bài thi, học bạ, ảnh lớp, yêu cầu, đánh giá.

Hai khoá chủ lực: **Lập trình Robot** (offline K‑9, slug `laptrinhrobot`) và **Luyện thi RoboSim** (`luyenthirobosim`). Phạm vi cốt lõi: **vận hành đào tạo offline** Sata 1–8 + Combo 1&2.

## 1.2 Mục tiêu chất lượng (top)

| # | Mục tiêu | Vì sao | Tham chiếu |
|---|---|---|---|
| 1 | **Cách ly cơ sở (multi-center)** | CS1 không được xem/sửa dữ liệu CS2 | [§8 scopedDb](/08-khai-niem-xuyen-suot), test CI bắt buộc |
| 2 | **Toàn vẹn tiền & ghi danh** | Tiền/enrollment phải atomic, không split-brain | [§6 Xương sống](/06-runtime-luong/xuong-song-rbac) |
| 3 | **Bảo mật & quyền tối thiểu** | PII học sinh/phụ huynh, RBAC theo hành động | [§8](/08-khai-niem-xuyen-suot) |
| 4 | **Hiệu năng public** | Lighthouse ≥ 85 mobile, LCP < 2.5s | [§10 Chất lượng](/10-yeu-cau-chat-luong) |
| 5 | **Mở rộng tổ chức không sửa code** | Mở CS mới = thêm data (OrgUnit tree) | [§4 Chiến lược](/04-chien-luoc-giai-phap) |

## 1.3 Bên liên quan (stakeholders)

| Vai trò | Quan tâm |
|---|---|
| CEO / Ban GĐ | Tăng trưởng, số liệu vận hành, chi phí |
| Phòng Đào tạo | Giáo trình, lớp, học liệu, chất lượng dạy |
| Giáo viên | Lớp mình, điểm danh, chấm bài, học bạ |
| Quản lý cơ sở (CENTER_MANAGER) | Vận hành lớp theo cơ sở, duyệt |
| Sale/CSM | Lead → convert → ghi danh |
| Kế toán | Học phí, xác nhận thanh toán, công nợ |
| Marketing | Phễu, quảng cáo, chi phí/CPL |
| Phụ huynh | Tiến độ con, học phí, tương tác |

→ Chi tiết vai trò & luồng: [§6 Runtime](/06-runtime-luong).
