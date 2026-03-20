# Project Memory

## Dự án này là gì

Đây là base project cho hệ thống:

- `NestJS` backend
- `Next.js` frontend
- `Postgres` qua Prisma
- `Redis`
- `Kafka`
- `Socket.IO`
- `Keycloak`
- `Docker`

## Trạng thái hiện tại

- Repo hiện mới là base project.
- Schema thực tế mới có `ChatMessage`.
- Đã có bộ tài liệu thiết kế e-commerce high-scale trong `docs/ecommerce/`.

## Quyết định kiến trúc đã chốt

- `Postgres` là source of truth cho giá, tồn, đơn hàng, payment, fulfillment.
- `Redis` chỉ dùng cho cache, session, rate limit, waiting room, trạng thái ngắn hạn.
- `Kafka` là event backbone cho analytics, personalization, cache invalidation, audit, downstream consumers.
- Các tích hợp ngoài như mail, shipping provider phải xử lý bất đồng bộ.
- Core commerce phải tách `write path` khỏi `read path`.

## Tài liệu quan trọng

- `docs/ecommerce/00-overview.md`
- `docs/ecommerce/01-ba-analysis.md`
- `docs/ecommerce/02-be-architecture.md`
- `docs/ecommerce/03-database-design.md`

## Điều không được quên

- Không hứa "không thể sập" theo nghĩa tuyệt đối.
- Thiết kế phải ưu tiên:
  - không sai giá
  - không sai tồn
  - không oversell
  - service phụ hỏng không được kéo chết checkout
