# 10. Yêu cầu chất lượng

> arc42 §10 — *Quality Requirements*. Cây chất lượng & kịch bản chất lượng.

> 🚧 **Khung** — sẽ bổ sung kịch bản đo lường ở bước 2.

## 10.1 Performance budget
| Loại trang | Mục tiêu |
|---|---|
| Public client | Lighthouse ≥ 85 mobile · LCP < 2.5s · CLS < 0.1 |
| Admin | ≥ 90 mobile (tối giản animation) |
| Animation | client ≤ 600ms (strategic) · admin = CSS transition |

## 10.2 Kịch bản chất lượng (mẫu)
| Thuộc tính | Kịch bản |
|---|---|
| Bảo mật | CS1 cố đọc lớp CS2 → bị `scopedDb` chặn (test CI) |
| Toàn vẹn | 2 lead convert song song cùng lớp → không vượt sĩ số (⚠️ hiện `convertLeadV2` chưa re-check) |
| Idempotency | Webhook Meta gửi 2 lần → chỉ tạo 1 lead |
| Khả dụng | Supabase backup RPO 24h / RTO 4–8h |

## 10.3 Kiểm thử
- 12 nhóm test T1–T12 (Playwright + Vitest), quy trình Task → Test → Check.
- Test DB = Postgres local (Docker), không Supabase.

## Sẽ chi tiết
- [ ] Cây chất lượng đầy đủ + ánh xạ tới test.
