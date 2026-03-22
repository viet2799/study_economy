# Prisma Từ Gốc Đến Cách Dùng Trong Repo Này

## 1. Prisma là gì

Prisma là một ORM / database toolkit theo hướng type-safe, schema-first.

Nói dễ hiểu:

- em mô tả model trong `schema.prisma`
- Prisma generate ra client typed
- em query DB qua client đó

Điểm mạnh lớn nhất:

- type an toàn
- query rõ ràng
- migration tương đối dễ kiểm soát

## 2. Repo này đang dùng Prisma ở đâu

Các file quan trọng:

- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/prisma/prisma.service.ts`
- `apps/api/src/modules/chat/services/chat.service.ts`
- `apps/api/src/modules/users/infrastructure/repositories/prisma-user.repository.ts`

## 3. Mental model đúng về Prisma

### `schema.prisma`

Là nơi mô tả data model.

Ví dụ repo hiện có:

- `ChatMessage`
- `User`

### `prisma generate`

Generate ra Prisma Client typed.

### `PrismaService`

Là wrapper của `PrismaClient` để NestJS inject dễ dàng.

### Repository

Business không nên query Prisma lung tung ở khắp nơi.

Nên gom vào repository hoặc infrastructure adapter có chủ đích.

## 4. Giải thích `PrismaService`

Trong repo:

```ts
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.once('beforeExit', async () => {
      await app.close();
    });
  }
}
```

Ý nghĩa:

- app start thì mở kết nối DB
- app shutdown thì đóng gọn

Đây là cách NestJS hay dùng để bọc Prisma.

## 5. Giải thích schema đang có

### `ChatMessage`

Model này phục vụ chat demo:

- `roomId`
- `userId`
- `username`
- `message`
- `createdAt`

Có index:

```prisma
@@index([roomId, createdAt])
```

Ý nghĩa:

- query lịch sử chat theo room và thời gian nhanh hơn

### `User`

Model này không thay Keycloak.

Nó giữ profile nội bộ của app:

- `keycloakId`
- `email`
- `username`
- `roles`

Đây là cách nghĩ đúng:

- Keycloak giữ identity
- app có thể vẫn cần user record riêng

## 6. Chat service đang dùng Prisma thế nào

Trong `createMessage`:

```ts
const chatMessage = await this.prismaService.chatMessage.create({
  data: {
    roomId: dto.roomId,
    message: dto.message,
    userId: user.sub,
    username: user.username ?? user.email ?? user.sub
  }
});
```

Ý nghĩa:

- tạo record mới trong bảng `ChatMessage`
- dữ liệu đầu vào đã được validate từ DTO trước đó

Trong `getRecentMessages`:

```ts
const messages = await this.prismaService.chatMessage.findMany({
  where: { roomId },
  orderBy: { createdAt: 'desc' },
  take: 20
});
```

Đây là query rất đọc được:

- lấy message theo room
- sort giảm dần theo thời gian
- lấy 20 record

Đây là một trong những lý do Prisma được junior thích: query rất rõ và ít "magic".

## 7. User repository đang dùng Prisma thế nào

Trong `PrismaUserRepository`, repo không vứt raw Prisma object thẳng lên application.

Nó có bước map về `UserEntity`.

Đây là chỗ rất quan trọng:

- persistence model khác domain model là chuyện bình thường
- app nên kiểm soát object nào đi ra khỏi infrastructure layer

## 8. Khi nào Prisma rất hợp

### Hợp

- team TypeScript
- muốn type-safe query
- muốn schema rõ ràng
- muốn migration có chủ đích
- muốn onboarding dev mới nhanh

### Có thể thấy hạn chế khi

- query SQL siêu đặc thù, rất custom
- cần tối ưu cực sâu bằng raw SQL nhiều nơi
- mô hình relation cực phức tạp và team muốn kiểm soát SQL rất sát

Nhưng kể cả vậy, Prisma vẫn có `queryRaw` khi thật sự cần.

## 9. Prisma so với TypeORM: cải tiến ở đâu

Đây là phần rất nhiều junior hỏi.

## 9.1 Prisma thường dễ chịu hơn TypeORM ở những điểm sau

### 1. Type-safety tốt hơn

Prisma generate client từ schema.

Nên khi query:

- autocomplete tốt
- type rất rõ
- ít cảnh "runtime mới biết sai"

### 2. Schema-first rõ ràng hơn

Em nhìn `schema.prisma` là thấy model tổng thể.

TypeORM thường đi theo decorator trên entity class, nhiều lúc đọc tổng thể không rõ bằng.

### 3. Query dễ đọc

Prisma query object khá thẳng.

TypeORM nhiều khi junior bị ngợp giữa:

- repository API
- query builder
- decorators
- eager/lazy relation

### 4. Migration flow thường rõ hơn

Prisma migration nhìn rất thẳng:

- đổi schema
- generate migration
- deploy migration

### 5. Ít "magic runtime" hơn

Prisma ít mang cảm giác "ORM đang âm thầm làm gì đó sau lưng mình" hơn TypeORM.

## 9.2 TypeORM vẫn có điểm mạnh riêng

Đừng biến chuyện này thành fanboy.

TypeORM vẫn có chỗ mạnh:

- gần phong cách entity/repository truyền thống hơn
- query builder quen với nhiều dev lâu năm
- decorator style có người thích hơn

Nhưng với team TypeScript hiện đại, Prisma thường cho trải nghiệm ổn định hơn.

## 10. Sai lầm junior hay mắc với Prisma

### Sai lầm 1: query Prisma khắp nơi

Nếu service nào cũng inject Prisma rồi query tự do, code sẽ rất nhanh bừa.

### Sai lầm 2: nghĩ type-safe là không cần hiểu SQL

Sai.

Type-safe không cứu được:

- index tệ
- query nặng
- N+1
- transaction sai

### Sai lầm 3: dùng `db push` như production flow

Cho local chơi được.
Cho production là rất nguy hiểm.

Repo này đã chuyển hướng đúng sang migration flow.

## 11. Khi nào vẫn cần raw SQL

Prisma rất tốt, nhưng không phải mọi query đều nên cố nhồi vào ORM.

Khi gặp:

- query quá đặc thù
- bulk operation tối ưu
- window function phức tạp
- tuning cực sâu

thì raw SQL vẫn là vũ khí hợp lý.

Senior không cực đoan ORM.

Senior dùng đúng công cụ đúng chỗ.

## 12. Kết luận senior muốn em nhớ

Prisma là công cụ rất hợp để xây base project kiểu repo này vì:

- rõ schema
- type an toàn
- query dễ đọc
- dễ onboarding

Nhưng đừng hiểu lầm:

- Prisma không thay hiểu biết database
- Prisma không thay transaction design
- Prisma không thay index strategy

Nó chỉ giúp em code phần data access sáng sủa và ít lỗi hơn TypeORM trong rất nhiều tình huống thực tế.
