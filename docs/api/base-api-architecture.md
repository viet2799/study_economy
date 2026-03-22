# API Base Architecture

File này giải thích cách tổ chức `apps/api` để sau này mở rộng `user`, `order`, `product`, `inventory`, `payment` mà không bị dính chặt vào framework hay vendor cụ thể.

Tài liệu liên quan:

- `docs/api/README.md`
- `docs/api/module-template.md`

## 1. Tư duy tổ chức

Nguyên tắc chính:

- `Controller` chỉ nhận request, validate DTO, trả response.
- `Use case` xử lý nghiệp vụ theo đúng một mục tiêu cụ thể.
- `Repository interface` là cổng vào persistence.
- `Infrastructure adapter` như `Prisma`, `Redis`, `Kafka`, `Keycloak` chỉ là lớp ngoài.
- `Common` chỉ chứa cross-cutting concern, không chứa business logic.

Mục tiêu là khi đổi từ `Prisma` sang adapter khác, hoặc thay service bên thứ 3, phần business không phải đập đi viết lại.

## 2. Cấu trúc module

Mỗi domain nên đi theo khung này:

```text
src/modules/<domain>/
  application/
    dto/
    use-cases/
  domain/
    entities/
    repositories/
  infrastructure/
    repositories/
    services/
  <domain>.controller.ts
  <domain>.module.ts
  <domain>.constants.ts
```

`users` hiện là module mẫu để bạn copy pattern này cho `order`, `product`, `inventory`.

## 3. Security với Keycloak

Base hiện dùng `nest-keycloak-connect`:

- Global `AuthGuard`: verify access token.
- Global `ResourceGuard`: sẵn chỗ để bật policy/resource theo Keycloak.
- Global `RolesGuard`: đọc metadata từ `@Roles({ roles: [...] })`.
- `@Public()`: bypass auth.
- `@AuthenticatedUser()`: lấy user đã map từ token.

`KeycloakUserContextGuard` map `realm_access.roles` và `resource_access` vào object user nội bộ để controller không phải parse token.

## 4. Validation và response

`ValidationPipe` global đã bật:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

Data lạ phải bị chặn ở boundary, không được trôi xuống use case.

Response được format thống nhất bởi interceptor:

```json
{
  "data": {},
  "message": "Request processed successfully",
  "status": "success",
  "statusCode": 200,
  "path": "/users/me",
  "timestamp": "..."
}
```

Muốn đổi message thì dùng `@ResponseMessage(...)`.

## 5. Repository pattern

`BaseRepository` là contract CRUD tối thiểu.

`BasePrismaRepository` là adapter base để giảm lặp cho Prisma repository.

Khi domain cần query đặc thù, hãy khai báo thêm ở repository interface domain thay vì nhét tùy tiện vào service.

## 6. Persistence và migration

- `Postgres` là source of truth.
- Không dùng `db push` ở production flow.
- Container API chạy `prisma migrate deploy`.
- Migration SQL được commit trong repo để review rõ hơn.

## 7. Khi thêm domain mới

Ví dụ `orders`:

1. Chốt entity và repository contract ở `domain`.
2. Viết use case ở `application`.
3. Viết adapter Prisma hoặc external service ở `infrastructure`.
4. Controller chỉ điều hướng vào use case.
5. Nếu gọi service ngoài như shipping hoặc payment, tạo port/interface trước rồi mới viết adapter.

## 8. Những điều nên tránh

- Không inject `PrismaService` thẳng vào mọi service nghiệp vụ.
- Không để controller chứa query database.
- Không để DTO đóng vai entity.
- Không parse raw token ở từng endpoint.
- Không gom business vào các module kỹ thuật mơ hồ.

## 9. Local setup

1. `cp .env.example .env`
2. Điền `KEYCLOAK_REALM_PUBLIC_KEY` nếu muốn offline validation đầy đủ.
3. `docker compose up -d --build`
4. `npm run prisma:migrate:deploy --workspace @studybase/api`
5. Mở `http://localhost:3001/docs`

Realm mẫu ở `realm/studybase-realm.json`.

User test mặc định:

- username: `demo`
- password: `demo123`
