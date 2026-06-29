---
sidebar_position: 5
title: 👪 Phụ huynh
---

# 👪 Luồng Phụ huynh (Portal — hocvien.satarobo.vn)

> Mức: **✅ wired**. Nơi thao tác: **portal**. Nguồn: `docs/luong-lms-hien-trang.md` §5.

## Tóm tắt
Phụ huynh (`PARENT`) đăng nhập portal để theo dõi & thay con tương tác. Một tài khoản quản nhiều con, chọn "con đang xem" qua cookie active-site ký HMAC. Mọi truy cập dữ liệu qua `requireActiveStudent`/`getPortalContext` + verify `Student.parentUserId` (không lộ `studentId` trên URL). Học phí chỉ hiện `Payment` đã được kế toán xác nhận; ảnh lớp bị chặn sau `StudentConsent`.

## Điểm vào chính
| Route | Mục đích |
|---|---|
| `/login`, `/kich-hoat` | Đăng nhập · kích hoạt OTP |
| `/portal`, `/portal/hoc-phi` | Dashboard · học phí + biên lai CONFIRMED |
| `/portal/lich-hoc`, `/portal/hinh-anh` | Lịch + điểm danh · ảnh lớp (consent) |
| `/portal/yeu-cau`, `/portal/danh-gia(-gv)`, `/portal/khao-sat` | Yêu cầu · đánh giá · khảo sát |
| `/portal/tin-nhan`, `/portal/thong-bao` | Nhắn tin GV · thông báo |

## Các bước (khung)
| # | Bước | Trạng thái |
|---|---|---|
| 1 | Kích hoạt tài khoản (OTP email) | ✅ |
| 2 | Đăng nhập & session | ✅ |
| 3 | Context portal & chọn con | ✅ |
| 4 | Dashboard (công nợ, học bù, thông báo) | ✅ |
| 5 | Học phí & thanh toán | ✅ |
| 6 | Hồ sơ PH & con | ✅ |
| 7 | Học tập của con (bài tập/thi/kết quả/học bạ) | ✅ |
| 8 | Hình ảnh (gate consent) | 🟡 |
| 9 | Yêu cầu phụ huynh | ✅ |
| 10 | Đánh giá dịch vụ | ✅ |
| 11 | Đánh giá GV (flag EVAL_V2) | 🟡 |
| 12 | Nhận xét buổi | ✅ |
| 13 | Tin nhắn 1-1 với GV | ✅ |
| 14 | Thông báo | ✅ |
| 15 | Khảo sát (NPS + CENTER_SURVEY) | 🟡 |
| 16 | SataCoin | ✅ |

## ⚠️ Khoảng trống nổi bật
- 🔴 **Không có UI cấp/thu hồi consent ảnh** (`grant/revokeMediaConsent` chỉ test gọi) → `/portal/hinh-anh` luôn rỗng nếu không set tay.
- 🟡 `/admin/parent-feedback` **không cách ly cơ sở** (CENTER_MANAGER thấy toàn hệ thống).
- 🟡 `createParentRequest` không phát event / không notify staff.
- 🟡 Không thanh toán online; không thấy số tiền khoản chờ/bị từ chối (chỉ badge — AC1).

> 🚧 **Chi tiết từng bước** với `file:line` đang được bổ sung ở bước 2.
