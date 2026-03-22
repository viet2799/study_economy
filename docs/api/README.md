# API Docs

Tài liệu này là điểm vào cho phần `apps/api`.

Nếu mới mở repo hoặc chuyển máy, hãy đọc theo thứ tự:

1. `docs/handoff/project-memory.md`
2. `docs/handoff/current-status.md`
3. `docs/handoff/next-steps.md`
4. `docs/api/base-api-architecture.md`
5. `docs/api/module-template.md`

## 1. Mục tiêu của API base này

API này đang được dựng như một base project cho hệ thống có xu hướng scale:

- `NestJS`
- `Prisma + Postgres`
- `Redis`
- `Kafka`
- `Keycloak`
- `Socket.IO`

Điểm quan trọng không phải là gom thật nhiều công nghệ, mà là đặt chúng đúng chỗ:

- `Postgres`: nguồn sự thật cho dữ liệu giao dịch
- `Redis`: cache và trạng thái ngắn hạn
- `Kafka`: event backbone
- `Keycloak`: identity và authorization

## 2. Hiện repo đang có gì

### Foundation

- Bootstrap NestJS với global `ValidationPipe`
- Global exception filter
- Global response interceptor
- `Pino` logger
- `Swagger` tại `/docs`
- Env validation bằng `class-validator`

### Security

- `nest-keycloak-connect`
- Global `AuthGuard`
- Global `ResourceGuard`
- Global `RolesGuard`
- `@Public()`
- `@Roles({ roles: [...] })`
- `@AuthenticatedUser()`

### Persistence

- `PrismaService`
- Migration flow qua `prisma migrate deploy`
- Mẫu `BaseRepository`
- Mẫu `BasePrismaRepository`

### Domain sample

- `users` module để làm chuẩn nhân rộng
- `chat` module giữ làm demo cho REST + WebSocket + Redis + Kafka

## 3. Cấu trúc thư mục nên hiểu như thế nào

### `src/common`

Chứa các concern dùng chung:

- config
- decorators
- filters
- guards
- interceptors
- logger
- repository base classes

Không để business logic của từng domain ở đây.

### `src/modules/<domain>`

Mỗi domain nên tự chứa:

- controller
- application use cases
- domain contracts
- infrastructure adapters

Nghĩa là module được tổ chức theo domain, không theo kiểu "services chung", "repositories chung" mơ hồ.

## 4. Chạy local

### Bước 1: chuẩn bị env

```bash
cp .env.example .env
```

Biến quan trọng:

- `DATABASE_URL`
- `REDIS_URL`
- `KAFKA_BROKERS`
- `KEYCLOAK_AUTH_SERVER_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_SECRET`
- `KEYCLOAK_REALM_PUBLIC_KEY`

Nếu muốn offline token validation thực sự đầy đủ thì phải điền `KEYCLOAK_REALM_PUBLIC_KEY`.

### Bước 2: chạy hạ tầng

```bash
docker compose up -d --build
```

Compose hiện sẽ dựng:

- `postgres`
- `redis`
- `kafka`
- `keycloak`
- `api`
- `web`

### Bước 3: generate Prisma client

```bash
npm run prisma:generate --workspace @studybase/api
```

### Bước 4: migrate database

```bash
npm run prisma:migrate:deploy --workspace @studybase/api
```

### Bước 5: chạy API dev

```bash
npm run dev:api
```

Swagger:

- `http://localhost:3001/docs`

Health check:

- `GET /health`

Auth ping:

- `GET /auth/ping`

## 5. Keycloak local setup

Realm mẫu nằm ở:

- `realm/studybase-realm.json`

User test mặc định:

- username: `demo`
- password: `demo123`

Client chính cho API:

- `studybase-api`

Client cho web:

- `studybase-web`

## 6. Nguyên tắc viết code trong repo này

### Boundary rule

- DTO chặn input ở controller boundary
- Use case xử lý logic
- Repository là cổng truy cập dữ liệu
- External SDK nằm ở adapter, không nằm trong use case

### Dependency rule

Lớp trong không biết lớp ngoài.

Ví dụ đúng:

- use case biết `UserRepository`
- use case không biết `PrismaService`

Ví dụ sai:

- service nghiệp vụ import trực tiếp Prisma rồi query lung tung

### Response rule

Controller không tự format response lặp đi lặp lại.
Format chung đi qua interceptor.

### Error rule

Không trả raw error stack ra frontend.
Mọi lỗi HTTP đi qua global filter.

## 7. Khi cần thêm module mới

Hãy đọc:

- `docs/api/module-template.md`
- `docs/infra-learning/README.md`

Đó là file mẫu để triển khai `order`, `product`, `inventory`, `payment`.

Nếu muốn học sâu từng công nghệ nền đang có trong repo, đọc thêm:

- `docs/infra-learning/redis.md`
- `docs/infra-learning/socket.md`
- `docs/infra-learning/kafka.md`
- `docs/infra-learning/rabbitmq.md`
- `docs/infra-learning/keycloak.md`
- `docs/infra-learning/prisma.md`

## 8. Những lỗi dễ mắc khi mở rộng repo

- Nhét query Prisma trực tiếp vào controller
- Dùng DTO như domain entity
- Coi Redis như source of truth
- Parse token thủ công ở từng route
- Viết module theo lớp kỹ thuật thay vì theo domain
- Chạy `prisma db push` như production flow

## 9. Trạng thái hiện tại nên hiểu ngắn gọn

- Repo đã có base tốt để tiếp tục làm commerce core
- Chưa có các module domain chính như `order`, `inventory`, `pricing`
- `users` mới là module tham chiếu để nhân rộng pattern
- `chat` là module demo, không phải trọng tâm commerce

## 10. Gợi ý thứ tự phát triển tiếp

Theo handoff và docs ecommerce, thứ tự nên là:

1. `catalog`
2. `sku`
3. `warehouse`
4. `inventory_balances`
5. `inventory_reservations`
6. `orders`
7. `order_items`
8. `outbox_events`

Sau đó mới mở rộng:

- payment
- shipment
- flash sale
- analytics
