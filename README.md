# Sata Robo — Tài liệu Kiến trúc (C4 + arc42)

Site tài liệu kiến trúc cho hệ thống **Sata Robo VN** (brand hub + admin CMS + portal phụ huynh), dựng bằng [Docusaurus](https://docusaurus.io/) 3, trình bày theo chuẩn **[arc42](https://arc42.org/)** (12 chương) với các view kiến trúc theo mô hình **[C4](https://c4model.com/)** (Context → Container → Component → Deployment) render bằng **Mermaid**.

> Nguồn nội dung nghiệp vụ LMS: bám theo `docs/luong-lms-hien-trang.md` của repo `satarobo-vn`, được tái cấu trúc theo C4/arc42.

## Chạy local

```bash
npm install
npm start          # dev server: http://localhost:3000
npm run build      # build tĩnh ra ./build
npm run serve      # xem thử bản build
npm run typecheck  # kiểm tra TypeScript config
```

> Yêu cầu Node.js ≥ 18 (CI dùng Node 20).

## Deploy lên GitHub Pages

1. Tạo repository GitHub và push toàn bộ thư mục này lên nhánh `main`.
2. Vào **Settings → Pages → Build and deployment → Source** → chọn **GitHub Actions**.
3. Mỗi lần push `main`, workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) sẽ build và deploy. Site sẽ ở: `https://<owner>.github.io/<repo>/`.

`url` và `baseUrl` trong [`docusaurus.config.ts`](docusaurus.config.ts) **tự khớp** với owner/tên repo nhờ biến `DOCS_ORG` / `DOCS_REPO` truyền từ CI. Khi chạy local, mặc định là `satarobo` / `satarobo_document` — sửa trong config nếu cần.

## Cấu trúc tài liệu (arc42 + C4, chia theo tầng)

| Chương | Thư mục `docs/` | Nội dung | View C4 |
|---|---|---|---|
| 1 | `01-gioi-thieu-muc-tieu` | Giới thiệu & mục tiêu | — |
| 2 | `02-rang-buoc` | Ràng buộc (tech stack frozen, tổ chức) | — |
| 3 | `03-pham-vi-boi-canh` | Phạm vi & bối cảnh | **C4 L1 — System Context** |
| 4 | `04-chien-luoc-giai-phap` | Chiến lược giải pháp | — |
| 5 | `05-khoi-xay-dung` | Khối xây dựng — **chia theo tầng** | **C4 L2/L3 — Container & Component** |
| 6 | `06-runtime-luong` | Runtime view — **tất cả luồng LMS theo vai trò** | **C4 Dynamic** |
| 7 | `07-trien-khai` | Triển khai — **chi tiết từng container/dịch vụ** | **C4 Deployment** |
| 8 | `08-khai-niem-xuyen-suot` | Khái niệm xuyên suốt (RBAC, scopedDb, DomainEvent…) | — |
| 9 | `09-quyet-dinh-kien-truc` | Quyết định kiến trúc (ADR) | — |
| 10 | `10-yeu-cau-chat-luong` | Yêu cầu chất lượng | — |
| 11 | `11-rui-ro-no-ky-thuat` | Rủi ro & nợ kỹ thuật (sổ gaps) | — |
| 12 | `12-thuat-ngu` | Thuật ngữ | — |

### 5 tầng kiến trúc (chương 5)

```
Trình bày (Presentation)  → app/(public|admin|portal|auth) — RSC + client components
Ứng dụng (Application)    → Server Actions, API routes, validators (Zod)
Nghiệp vụ (Domain)        → lib/* (crm, lms, finance, auth, events, scorm, …)
Dữ liệu (Data)            → Prisma + PostgreSQL (Supabase), 200+ models
Tích hợp (Integration)    → R2, Resend, Upstash Redis, Sentry, Meta/Zalo, GA4
```

## Trạng thái

🚧 Đang xây theo 2 bước: **(1) khung** (cấu trúc + sơ đồ C4 tổng + skeleton) → **(2) chi tiết** từng tầng & từng luồng. Trang nào còn skeleton sẽ có nhãn 🚧.
