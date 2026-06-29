---
sidebar_position: 4
title: Container — R2 Storage
---

# Container — Cloudflare R2 (storage)

> 🚧 **Khung**. Concern: lưu file/ảnh/SCORM, phục vụ qua presigned URL.

| Thuộc tính | Giá trị |
|---|---|
| Loại | Cloudflare R2 (S3-compatible) |
| Thư mục code | `lib/storage/*` |
| Upload | Presigned PUT (`/api/{admin,portal}/upload-url`) |
| Phục vụ | Signed URL (flag `MEDIA_SIGNED_URL`) |
| SCORM | CORS bucket cho player; asset proxy `/api/scorm/asset/*` |

## Lưu ý bảo mật
- Ảnh học viên gate `StudentConsent` + tag (`isClassWide` / tag con).
- ⚠️ Tài liệu bài giảng (`/portal/bai-giang`) hiện lộ `fileUrl` thô — xem [§11](/11-rui-ro-no-ky-thuat).

## Sẽ chi tiết
- [ ] Cấu trúc key, vòng đời file, TTL signed URL.
- [ ] Quy trình ingest SCORM.
