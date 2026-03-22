# Module Template

File này là mẫu tư duy để thêm một module mới trong `apps/api`.

Mục tiêu là mỗi domain mới được thêm vào mà vẫn giữ:

- module rõ ràng
- dependency injection sạch
- business không dính chặt vào Prisma hay vendor
- test/maintenance về sau đỡ đau

## 1. Khi nào cần tách thành module riêng

Hãy tách thành module riêng khi domain có:

- controller riêng
- use case riêng
- repository riêng
- state hoặc rule nghiệp vụ riêng

Ví dụ nên là module riêng:

- `users`
- `orders`
- `products`
- `inventory`
- `pricing`
- `payments`

Không nên gom vào `common` chỉ vì "tạm thời ít code".

## 2. Cấu trúc chuẩn

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

## 3. Ý nghĩa từng lớp

### `application`

Đây là nơi viết use case.

Ví dụ:

- `CreateOrderUseCase`
- `ReserveInventoryUseCase`
- `GetProductDetailUseCase`

Use case nên:

- làm đúng một việc rõ ràng
- phụ thuộc vào interface/port
- không phụ thuộc trực tiếp vào ORM hay SDK ngoài

### `domain`

Đây là contract của domain:

- entity shape
- repository interface
- enum/value object nếu cần

### `infrastructure`

Đây là adapter thật:

- Prisma repository
- Redis adapter
- Kafka publisher
- shipping provider client

Lớp này được phép biết vendor cụ thể.

## 4. Quy trình thêm module mới

Ví dụ thêm `orders`:

### Bước 1: tạo constants

Tạo token inject để không bind thẳng vào class cụ thể.

Ví dụ:

```ts
export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
```

### Bước 2: định nghĩa entity

Entity phải phản ánh domain, không phải raw DTO.

Ví dụ:

```ts
export interface OrderEntity {
  id: string;
  orderNo: string;
  customerId: string;
  status: string;
  createdAt: Date;
}
```

### Bước 3: định nghĩa repository interface

Ví dụ:

```ts
export interface OrderRepository {
  findByOrderNo(orderNo: string): Promise<OrderEntity | null>;
  createOrder(data: CreateOrderInput): Promise<OrderEntity>;
}
```

### Bước 4: viết use case

Ví dụ:

```ts
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository
  ) {}

  execute(input: CreateOrderInput) {
    return this.orderRepository.createOrder(input);
  }
}
```

### Bước 5: viết infrastructure repository

Ví dụ adapter Prisma:

```ts
@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderNo(orderNo: string): Promise<OrderEntity | null> {
    const record = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!record) {
      return null;
    }

    return {
      id: record.id,
      orderNo: record.orderNo,
      customerId: record.customerId,
      status: record.status,
      createdAt: record.createdAt
    };
  }
}
```

### Bước 6: wiring trong module

```ts
@Module({
  controllers: [OrdersController],
  providers: [
    CreateOrderUseCase,
    PrismaOrderRepository,
    {
      provide: ORDER_REPOSITORY,
      useExisting: PrismaOrderRepository
    }
  ]
})
export class OrdersModule {}
```

## 5. Controller nên mỏng thế nào

Controller chỉ nên:

- nhận request
- nhận DTO
- lấy user từ decorator
- gọi use case

Controller không nên:

- query Prisma trực tiếp
- chứa transaction logic
- parse token thủ công
- chứa business rule dài

## 6. DTO nên đặt ở đâu

Đặt ở `application/dto`.

Vì DTO là boundary của use case và controller, không phải contract persistence.

Ví dụ:

```ts
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  skuId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
```

## 7. Khi nào dùng repository base

Nếu domain cần CRUD khá tiêu chuẩn, có thể reuse:

- `BaseRepository`
- `BasePrismaRepository`

Nhưng nếu domain có query phức tạp hoặc cần transaction riêng, đừng ép mọi thứ vào CRUD base cho "đẹp". Base chỉ để giảm lặp, không phải để bóp méo domain.

## 8. Cách nghĩ về external service

Ví dụ shipping provider như `GHTK`.

Đừng gọi SDK trực tiếp trong use case.

Nên làm như sau:

1. Tạo interface ở domain/application boundary
2. Use case phụ thuộc vào interface đó
3. Adapter thật của `GHTK` nằm ở `infrastructure/services`

Mục tiêu là khi đổi provider, bạn chỉ đổi adapter.

## 9. Cách nghĩ về transaction

Transaction nên được quản lý ở nơi orchestration hợp lý.

Ví dụ create order:

- validate input
- lock/check inventory
- create order
- create order item
- reserve stock
- write outbox

Những bước này không nên bị tách rời bừa bãi giữa nhiều service không có boundary rõ ràng.

## 10. Checklist trước khi merge module mới

- Có DTO validate input chưa
- Controller đã mỏng chưa
- Use case có phụ thuộc interface thay vì Prisma trực tiếp chưa
- Repository có map từ persistence record về entity chưa
- Không để Redis thành source of truth
- Nếu có event, đã nghĩ tới outbox chưa
- Nếu có auth, đã dùng `@AuthenticatedUser()` và `@Roles()` đúng chưa
- Đã thêm Swagger annotation ở controller chưa

## 11. Module mẫu hiện tại

Muốn nhìn code mẫu thực tế, xem:

- `apps/api/src/modules/users`

Đây là module tham chiếu để copy structure cho các domain tiếp theo.
