# Studybase Base

## Mục tiêu

Base project này được dựng để làm nền cho hệ thống dùng:

- NestJS cho backend API
- NextJS cho frontend
- Postgres qua Prisma
- Redis
- Kafka
- Socket.IO để làm chat realtime
- Keycloak để xác thực
- Docker để chạy đồng bộ hạ tầng

## Cấu trúc đã tạo

```text
studybase/
  apps/
    api/    -> NestJS backend
    web/    -> NextJS frontend
  realm/    -> file import realm cho Keycloak
  .env.example
  docker-compose.yml
  doc.md
```

## Những gì đã làm

### 1. Backend NestJS base

Đã tạo các module base:

- `PrismaModule`: kết nối Postgres qua Prisma
- `RedisModule`: bọc `ioredis` để dùng lại dễ
- `KafkaModule`: bọc producer/consumer bằng `kafkajs`
- `AuthModule`: verify access token từ Keycloak bằng JWKS
- `ChatModule`: API chat + Socket.IO gateway
- `HealthModule`: endpoint health check

Đã thêm các phần dùng chung:

- env config tập trung
- `Public` decorator
- `CurrentUser` decorator
- global auth guard cho Keycloak
- global validation pipe
- global response interceptor
- global exception filter

### 2. Prisma + Postgres

Đã tạo `schema.prisma` với model:

- `ChatMessage`

Chat message được lưu vào Postgres, đồng thời cache message gần nhất trong Redis.

### 3. Redis

Redis đang được dùng cho:

- cache 50 tin nhắn gần nhất theo room chat

Có thể mở rộng tiếp cho:

- session
- rate limit
- queue state
- OTP / token tạm

### 4. Kafka

Đã tạo service Kafka base để:

- connect producer
- connect consumer
- publish event
- subscribe topic

Hiện tại khi tạo chat message, backend sẽ emit event vào topic:

- `chat.messages`

### 5. Socket chat

Đã tạo:

- namespace `/chat`
- event `room:join`
- event `room:history`
- event `room:message`
- event `room:message:ack`

Luồng chạy:

1. Client kết nối socket kèm token Keycloak
2. Gateway verify token
3. User join room
4. Server trả lịch sử chat
5. User gửi message realtime
6. Message được lưu DB + cache Redis + emit Kafka + broadcast socket

### 6. Keycloak

Đã thêm:

- `realm/studybase-realm.json`
- realm `studybase`
- client `studybase-api`
- client `studybase-web`
- user demo:
  - username: `demo`
  - password: `demo123`

Backend verify JWT từ Keycloak bằng public keys của realm.

### 7. Frontend NextJS

Đã tạo trang demo:

- login qua Keycloak
- kết nối Socket.IO
- join room chat
- gửi và nhận tin nhắn realtime

Frontend hiện là base demo để nối feature nhanh, chưa chia domain lớn.

### 8. Docker

Đã tạo `docker-compose.yml` để chạy:

- Postgres
- Redis
- Kafka
- Keycloak
- API
- Web

Đã thêm `Dockerfile` riêng cho:

- `apps/api`
- `apps/web`

## Cách dùng

### 1. Tạo env

Copy file:

```bash
cp .env.example .env
```

### 2. Cài package

```bash
npm install
```

### 3. Generate Prisma client

```bash
npm run prisma:generate --workspace @studybase/api
```

### 4. Chạy local dev

Chạy hạ tầng:

```bash
docker compose up -d postgres redis kafka keycloak
```

Chạy backend:

```bash
npm run dev:api
```

Chạy frontend:

```bash
npm run dev:web
```

### 5. Chạy full bằng Docker

```bash
docker compose up -d --build
```

## Endpoint base

### API

- `GET /`
- `GET /health`
- `GET /auth/ping`
- `GET /auth/me`
- `GET /chat/rooms/:roomId/messages`
- `POST /chat/messages`

### Socket

Namespace:

- `/chat`

Events:

- `room:join`
- `room:history`
- `room:message`
- `room:message:ack`

## Ghi chú

- Base này ưu tiên dễ mở rộng hơn là làm quá nhiều business logic sẵn.
- Keycloak trong Docker đang chạy `start-dev` để setup nhanh.
- Nếu muốn production hơn, bước tiếp theo nên thêm:
  - migration strategy rõ ràng
  - refresh token flow
  - role-based guard
  - structured logger
  - testing
  - CI/CD
