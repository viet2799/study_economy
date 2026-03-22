# Subagents Handoff

Tài liệu này ghi lại các subagent đã được tạo trong phiên làm việc này để khi mở repo ở app Codex khác có thể đọc nhanh và hiểu:

- đã tạo những vai trò nào
- scope của từng agent là gì
- agent nào đã phản hồi gì
- chỗ nào bị mất và đã khôi phục bằng tóm tắt

## Mục tiêu của phiên này

- đọc toàn bộ `docs/`
- chia các cụm tài liệu thành các subagent theo domain
- tạo thêm các subagent chuyên trách cho DevOps và Frontend
- khôi phục lại ngữ cảnh của agent database sau khi bị xóa nhầm

## Docs Đã Được Đọc

Đã đọc toàn bộ các file sau:

1. `docs/handoff/README.md`
2. `docs/handoff/project-memory.md`
3. `docs/handoff/current-status.md`
4. `docs/handoff/next-steps.md`
5. `docs/handoff/bootstrap-prompt.md`
6. `docs/handoff/session-template.md`
7. `docs/ecommerce/00-overview.md`
8. `docs/ecommerce/01-ba-analysis.md`
9. `docs/ecommerce/02-be-architecture.md`
10. `docs/ecommerce/03-database-design.md`

## Các Subagent Đã Tạo

### 1. Handoff / Project Context

- Tên: `Carver`
- Vai trò: giữ bối cảnh dự án, current status, next steps, thứ tự triển khai và rủi ro lệch scope

Tóm tắt phản hồi:

- Repo hiện mới là base project.
- Đã có backend, frontend, Redis, Kafka, Keycloak, Docker.
- Commerce core chưa được hiện thực hóa.
- Thứ tự triển khai nên là:
  - `catalog + sku + warehouse + idempotency + outbox`
  - `inventory_balances + inventory_reservations + inventory_movements`
  - `orders + order_items + order_status_history + fulfillment_allocations`
  - sau đó mới tới `pricing`, `shipping`, `flash-sale`, `analytics/personalization`
- Domain ưu tiên trước mắt:
  - `catalog`
  - `sku`
  - `warehouse`
  - `inventory`
  - `order`
  - `outbox`
- Rủi ro lớn:
  - mở rộng quá sớm sang payment/shipping/analytics
  - dựng schema quá rộng ngay từ đầu

### 2. BA E-commerce

- Tên: `Pauli`
- Vai trò: business goals, NFR, acceptance criteria, edge cases, fairness flash-sale, domain boundaries từ góc nhìn BA

Tóm tắt phản hồi:

- Agent đã xác nhận sẽ bám `docs/ecommerce/00-overview.md`, `docs/ecommerce/01-ba-analysis.md`, và các handoff docs.
- Phạm vi nó giữ là:
  - mục tiêu kinh doanh
  - NFR
  - acceptance criteria
  - edge cases
  - roadmap theo phase
  - fairness cho flash-sale
  - perceived latency
  - domain boundaries từ góc nhìn BA

### 3. Backend Architecture

- Tên: `Turing`
- Vai trò: bounded contexts backend, transactional boundaries, outbox, idempotency, async boundaries, service boundaries trong NestJS

Tóm tắt phản hồi:

- `Postgres` là source of truth cho price, inventory, order, payment, fulfillment.
- `Redis` chỉ cho cache, session, rate limit, waiting room, trạng thái ngắn hạn.
- `Kafka` phải đi qua `outbox`, không publish trực tiếp từ business code trước khi transaction commit.
- Core commerce phải tách `write path` và `read path`.
- Checkout, payment callback, shipping callback đều phải idempotent.
- Service boundaries trong NestJS phải theo bounded context.

### 4. Database / Schema

- Agent gốc: `Euler`
- Vai trò: schema, table design, FK/unique/index, partitioning, retention, Prisma migration direction

Tóm tắt phản hồi gốc:

- Nguồn sự thật chính:
  - `docs/ecommerce/03-database-design.md`
  - `docs/handoff/current-status.md`
  - `docs/handoff/next-steps.md`
- Hiện trạng đã xác nhận:
  - `apps/api/prisma/schema.prisma` hiện mới chỉ có `ChatMessage`
  - chưa có migration commerce core
- Hướng triển khai an toàn:
  - `products`
  - `skus`
  - `warehouses`
  - `inventory_balances`
  - `inventory_reservations`
  - `orders`
  - `order_items`
  - `outbox_events`
  - sau đó mới chốt migration và mapping sang module NestJS

Lưu ý:

- Agent database đã bị xóa nhầm trong quá trình làm việc.
- Đã thử tạo lại nhưng vướng giới hạn tối đa `6` subagent.
- Vì vậy phần ngữ cảnh của agent này được khôi phục thủ công bằng chính nội dung phản hồi đã lưu lại trong thread.

### 5. Senior DevOps

- Tên: `Beauvoir`
- Vai trò: local/dev environment, Docker Compose, env/config/secrets, bootstrapping Postgres/Redis/Kafka/Keycloak, CI/CD, observability, deployment readiness, reliability guardrails

Tóm tắt phản hồi:

- Agent đã xác nhận scope:
  - `local/dev` và `Docker Compose`
  - `env/config/secrets`
  - bootstrapping hạ tầng
  - CI/CD và deployment readiness
  - observability: logs, metrics, tracing
  - backup/restore và vận hành thực tế
- Agent cũng giữ đúng các ràng buộc kiến trúc:
  - `Postgres` là source of truth
  - `Redis` không giữ truth
  - `Kafka` phải đi qua `outbox`
  - service phụ hỏng không được kéo chết checkout

### 6. Senior Frontend Next.js

- Tên: `Lorentz`
- Vai trò: frontend architecture với Next.js, app router, data fetching, server/client boundaries, cache/revalidation, auth với Keycloak, UI states cho catalog/PDP/cart/checkout, SEO, a11y, performance

Tóm tắt phản hồi:

- Agent đã xác nhận sẽ bám `docs/handoff/*.md` và `docs/ecommerce/*.md`.
- Các trục review/chuyên môn của nó là:
  - structure app router
  - server/client boundary
  - caching/revalidation
  - auth với Keycloak
  - states cho catalog/PDP/cart/checkout
  - lỗi và fallback
  - SEO/a11y
  - guardrails để frontend không hứa sai giá/tồn

## Các Kết Luận Đã Chốt Trong Phiên

- `docs/` đã được đọc hết trước khi tạo subagent.
- Các subagent được chia theo domain thực tế, không chia theo từng file rời.
- Những vai trò đang có:
  - context/handoff
  - BA
  - backend architecture
  - database/schema
  - DevOps
  - frontend Next.js
- Cả các agent đều đang bám cùng một set nguyên tắc:
  - `Postgres` là source of truth
  - `Redis` chỉ là lớp tăng tốc/trạng thái ngắn hạn
  - `Kafka` là event backbone và phải đi qua `outbox`
  - core commerce phải tách `write path` khỏi `read path`
  - checkout không được phụ thuộc vào service phụ
  - không được hứa sai giá
  - không được hứa sai tồn
  - không được oversell

## Vấn Đề Phát Sinh Trong Phiên

- Agent `Database Engineer` bị xóa nhầm.
- Đã thử:
  - tạo lại agent mới
  - resume agent cũ
- Cả hai đều bị chặn bởi giới hạn thread subagent tối đa.
- Đã khôi phục lại nội dung quan trọng của agent database bằng handoff này.

## Nếu Mở Ở App Codex Khác

Hãy đọc theo thứ tự:

1. `docs/handoff/project-memory.md`
2. `docs/handoff/current-status.md`
3. `docs/handoff/next-steps.md`
4. `docs/handoff/subagents-handoff.md`
5. toàn bộ `docs/ecommerce/*.md`

Sau đó có thể tiếp tục bằng một trong các hướng:

- dùng agent database để draft `Prisma schema` cho commerce core
- dùng agent DevOps để rà soát gap hạ tầng hiện tại
- dùng agent FE để chốt frontend boundaries cho catalog/PDP/cart/checkout
- dùng agent BE để chốt transaction boundary và module boundaries
