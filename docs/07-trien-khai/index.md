# 7. Triển khai — C4 Deployment

> arc42 §7 — *Deployment View* · **C4 Deployment**. Hệ thống chạy trên hạ tầng nào, mỗi container/dịch vụ ("concern") đảm nhiệm gì.

## 7.1 Sơ đồ triển khai (C4 Deployment)

```mermaid
C4Deployment
  title C4 Deployment — Sata Robo (Vercel + managed services)
  Deployment_Node(vercel, "Vercel (region hnd1)", "Serverless / Edge") {
    Container(web, "Next.js App", "RSC + Server Actions")
    Container(cron, "Cron Functions", "Vercel Cron")
  }
  Deployment_Node(supa, "Supabase", "Managed Postgres") {
    ContainerDb(db, "PostgreSQL", "pooler 6543 (runtime) / 5432 (migrate)")
  }
  Deployment_Node(cf, "Cloudflare", "R2") {
    Container(r2, "R2 Bucket", "Object storage")
  }
  Deployment_Node(up, "Upstash", "Serverless Redis") {
    Container(redis, "Redis", "Rate limit / cache")
  }
  Deployment_Node(ext, "SaaS ngoài", "") {
    Container(resend, "Resend", "Email")
    Container(meta, "Meta / Zalo", "Lead / ZNS")
  }
  Deployment_Node(dev, "Dev/Test (Docker local)", "docker / scoop") {
    ContainerDb(testdb, "Postgres 16", "satarobo_test :5432")
  }
  Rel(web, db, "Prisma pooler", "SQL/TLS")
  Rel(web, r2, "S3 API (presigned)", "HTTPS")
  Rel(web, redis, "rate limit", "HTTPS")
  Rel(cron, resend, "gửi email queue", "HTTPS")
  Rel(meta, web, "webhook lead", "HTTPS")
```

## 7.2 Danh mục container / dịch vụ

| Container / dịch vụ | Loại | Concern | Trang chi tiết |
|---|---|---|---|
| **Next.js App** | Vercel serverless | Render UI + Server Actions + API | [→ Web](./container-web) |
| **Cron Functions** | Vercel Cron | Email queue, SLA, dispatcher DomainEvent | [→ Cron](./container-cron) |
| **PostgreSQL** | Supabase managed | CSDL chính (Prisma) | [→ Database](./container-db) |
| **R2 Storage** | Cloudflare | File/ảnh/SCORM (presigned) | [→ Storage](./container-storage-r2) |
| **Redis** | Upstash | Rate limit / cache | [→ Redis](./container-redis) |
| **Email** | Resend | Email giao dịch (qua queue) | [→ Email](./container-email) |

:::note Sản xuất = serverless, không Docker
Production chạy **serverless trên Vercel** (không đóng gói Docker). **Docker** dùng cho **dev/test** (Postgres local) — xem mục 7.3. Trong C4, "container" là *đơn vị triển khai logic*, không nhất thiết là Docker container.
:::

## 7.3 Docker cho dev/test (local dependencies)

Mô phỏng phụ thuộc khi phát triển/test offline (Postgres bắt buộc; Redis tuỳ chọn):

```yaml title="docker-compose.dev.yml"
services:
  db:
    image: postgres:16
    container_name: satarobo-test-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: satarobo_test
    ports:
      - "5432:5432"
    volumes:
      - sr_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10

  # Tuỳ chọn — rate limit local (prod dùng Upstash)
  redis:
    image: redis:7-alpine
    container_name: satarobo-redis
    ports:
      - "6379:6379"

volumes:
  sr_pgdata:
```

```bash
docker compose -f docker-compose.dev.yml up -d
# .env.test:
#   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/satarobo_test"
#   DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/satarobo_test"
npx prisma migrate deploy   # apply schema lên DB test
```

> ⚠️ Test **không bao giờ** trỏ Supabase prod/dev — `resetDb()` xoá sạch DB. Không có Docker (Windows, không quyền admin) → dùng **Postgres portable qua scoop**.

## 7.4 CI/CD

- **Tài liệu này**: `.github/workflows/deploy.yml` build Docusaurus → GitHub Pages.
- **Ứng dụng** (`satarobo-vn`): Vercel deploy + GitHub Actions cho test E2E (Postgres service trong CI).

> 🚧 Mỗi trang container chi tiết hoá: env, port, scaling, giới hạn, lỗi thường gặp ở bước 2.
