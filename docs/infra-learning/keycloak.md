# Keycloak Từ Gốc Đến Cách Dùng Trong Repo Này

## 1. Keycloak là gì

Keycloak là một Identity and Access Management system.

Nói dễ hiểu:

- quản user
- quản login
- phát token
- quản role / permission
- hỗ trợ chuẩn `OAuth2` và `OpenID Connect`

Thay vì tự viết login/register/refresh token/RBAC từ đầu, em dùng Keycloak để tập trung hóa phần auth.

## 2. Khi nào nên dùng Keycloak

### Nên dùng

- có nhiều service / app cùng dùng chung auth
- cần SSO
- cần central role management
- cần chuẩn OAuth2/OIDC
- cần tách identity khỏi business service

### Có thể overkill nếu

- app rất nhỏ
- chỉ có một service đơn giản
- chưa có nhu cầu role/permission phức tạp

## 3. Mental model đúng về Keycloak

### Realm

Một "thế giới auth" riêng.

Thường mỗi sản phẩm/hệ thống sẽ có realm riêng.

### Client

Ứng dụng nào dùng Keycloak.

Ví dụ trong repo này:

- `studybase-api`
- `studybase-web`

### User

Người dùng thật.

### Role

Quyền.

Có thể là:

- realm role
- client role

### Token

Sau khi login, Keycloak cấp token.

API nhận token này để biết:

- user là ai
- role gì
- client nào

## 4. Repo này đang dùng Keycloak ở đâu

Các file quan trọng:

- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/keycloak-auth.service.ts`
- `apps/api/src/common/guards/keycloak-user-context.guard.ts`
- `apps/api/src/common/guards/roles.guard.ts`
- `apps/api/src/common/decorators/public.decorator.ts`
- `apps/api/src/common/decorators/roles.decorator.ts`
- `apps/api/src/common/decorators/authenticated-user.decorator.ts`

## 5. Cấu trúc auth hiện tại của repo

### Lớp 1: `nest-keycloak-connect`

Trong `AuthModule`, repo dùng `KeycloakConnectModule.registerAsync(...)`.

Ý nghĩa:

- cấu hình Keycloak ở một chỗ
- global auth guard chạy tự động
- gắn Keycloak vào NestJS đúng kiểu framework-friendly

### Lớp 2: Global guards

Trong `AppModule`, repo đang đăng ký global:

- `AuthGuard`
- `ResourceGuard`
- `KeycloakUserContextGuard`
- `RolesGuard`

Tư duy đúng ở đây:

- dev viết controller không phải lặp đi lặp lại auth logic
- mặc định endpoint là private
- chỉ route nào public mới gắn `@Public()`

### Lớp 3: mapping token về user nội bộ

`KeycloakUserContextGuard` decode token và map về object `CurrentUser`.

Nó gom:

- `sub`
- `username`
- `email`
- `firstName`
- `lastName`
- `realm roles`
- `resource_access`

Mục tiêu:

- controller và service không tự parse raw token nữa

## 6. Giải thích `KeycloakAuthService`

Service này đang được dùng để verify token cho WebSocket.

Tại sao cần service riêng?

Vì HTTP guard và WebSocket handshake không giống hệt nhau.

### Constructor đang làm gì

Nó đọc:

- `keycloakAuthServerUrl`
- `keycloakRealm`
- `keycloakClientId`
- `keycloakRealmPublicKey`

Sau đó dựng:

- `issuer`
- `jwks`
- hoặc public key local

Tư duy đúng:

- nếu có `realm public key` thì verify offline
- nếu không có thì fallback sang JWKS endpoint

## 7. Verify offline nghĩa là gì

Offline validation nghĩa là:

- API tự verify JWT bằng public key
- không cần mỗi request lại gọi Keycloak introspection endpoint

Lợi ích:

- nhanh hơn
- giảm tải cho Keycloak
- ít phụ thuộc mạng hơn

Đây là lý do biến `KEYCLOAK_REALM_PUBLIC_KEY` quan trọng.

## 8. `@Public()`, `@Roles()`, `@AuthenticatedUser()` là gì

### `@Public()`

Route không cần login.

Ví dụ:

- health check
- auth ping

### `@Roles({ roles: ['admin'] })`

Route chỉ role phù hợp mới vào được.

### `@AuthenticatedUser()`

Lấy user đã được map sẵn từ token.

Nhờ vậy controller gọn hơn rất nhiều.

## 9. Flow một request protected đi qua hệ thống thế nào

### HTTP flow

1. client gửi access token
2. `AuthGuard` của Keycloak check token
3. `KeycloakUserContextGuard` map token payload thành `CurrentUser`
4. `RolesGuard` check role nếu route yêu cầu
5. controller nhận `@AuthenticatedUser()`

Đây là flow rất sạch.

## 10. Flow WebSocket đang làm thế nào

Trong `ChatGateway.handleConnection(...)`:

1. lấy token từ socket handshake
2. verify token qua `KeycloakAuthService`
3. gắn user vào `client.data.user`

Sau đó các event tiếp theo dùng `client.data.user`.

Đây là pattern chuẩn cho socket auth.

## 11. Ví dụ thực tế nên dùng Keycloak khi nào

### Case 1: admin portal + web app + mobile app

Nếu cả 3 app đều cần login chung:

- Keycloak rất hợp

### Case 2: role phức tạp

Ví dụ:

- admin
- operator
- warehouse-manager
- support
- finance

Thì central role management rất đáng giá.

## 12. Sai lầm junior hay mắc với Keycloak

### Sai lầm 1: tưởng Keycloak thay business user hoàn toàn

Không hẳn.

Keycloak lo identity.

App của em vẫn có thể cần bảng `User` riêng để giữ:

- profile business
- flags nội bộ
- settings riêng của hệ thống

Repo này đang có model `User` chính vì lý do đó.

### Sai lầm 2: nhét mọi permission vào role bừa bãi

Lúc đầu tưởng nhanh.
Sau này role nổ tung.

Phải thiết kế role cẩn thận.

### Sai lầm 3: route nào cũng tự parse token

Sai.

Hãy để guard/decorator lo việc đó.

## 13. Kết luận senior muốn em nhớ

Keycloak giải quyết bài toán identity và authorization tập trung.

Trong repo này, cách dùng hiện tại là đúng hướng vì:

- auth được đưa về global guards
- role được check bằng decorator
- websocket có verify token riêng
- app vẫn giữ `User` table riêng để nối identity với dữ liệu business nội bộ
