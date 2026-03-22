# Redis Từ Gốc Đến Cách Dùng Trong Repo Này

## 1. Redis là gì

Redis là một in-memory data store.

Nói dễ hiểu:

- dữ liệu nằm chủ yếu trong RAM
- đọc/ghi cực nhanh
- thường dùng làm cache, counter, queue ngắn hạn, session, lock tạm

Redis không sinh ra để làm database giao dịch chính của hệ thống e-commerce.

Nếu em nhớ một câu thôi thì nhớ câu này:

> Redis dùng để tăng tốc và giữ trạng thái ngắn hạn, không phải nguồn sự thật cuối cùng cho dữ liệu sống còn.

## 2. Mental model đúng về Redis

Hãy tưởng tượng:

- `Postgres` là sổ cái chính thức
- `Redis` là cái bảng ghi nhanh đặt cạnh quầy

Khi cần tra thật nhanh:

- xem cache
- xem counter
- xem room chat gần nhất
- xem rate limit

thì Redis rất hợp.

Nhưng khi cần sự thật cuối cùng về:

- tiền
- tồn kho
- đơn hàng
- thanh toán

thì phải về `Postgres`.

## 3. Khi nào nên dùng Redis

### Rất nên dùng

- cache dữ liệu đọc nhiều
- session
- rate limiting
- counter realtime
- waiting room
- giữ trạng thái tạm có TTL
- leaderboard/hot ranking
- lưu recent messages để đọc nhanh

### Không nên dùng làm nguồn duy nhất

- inventory source of truth
- order source of truth
- payment ledger
- audit log
- dữ liệu bắt buộc không được mất

## 4. Repo này đang dùng Redis ở đâu

File chính:

- `apps/api/src/modules/redis/services/redis.service.ts`
- `apps/api/src/modules/chat/services/chat.service.ts`

### `RedisService` đang làm gì

Repo đang bọc `ioredis` thành một service dùng chung:

- tạo client từ `REDIS_URL`
- expose `instance`
- có `get` và `set`
- đóng kết nối khi module destroy

Đây là lớp adapter hạ tầng.

Ý đúng của nó là:

- business logic không tự tạo Redis client lung tung
- app có một điểm vào rõ ràng cho Redis

## 5. Giải thích code Redis đang có

Trong `RedisService`:

```ts
this.client = new Redis(this.configService.getOrThrow<string>('redisUrl'));
```

Ý nghĩa:

- đọc `redisUrl` từ config
- mở kết nối tới Redis

Trong hàm `set`:

```ts
if (!ttlSeconds) {
  return this.client.set(key, value);
}

return this.client.set(key, value, 'EX', ttlSeconds);
```

Ý nghĩa:

- nếu không có TTL thì key sống tới khi bị xóa
- nếu có TTL thì Redis tự hết hạn key sau `ttlSeconds`

Đây là pattern rất quan trọng.

Cache mà không có TTL thì nhiều lúc trở thành "rác sống lâu".

## 6. Giải thích code Redis trong chat service

File:

- `apps/api/src/modules/chat/services/chat.service.ts`

### Khi tạo message

Code đang làm:

1. ghi message vào Postgres trước
2. đẩy message mới vào Redis list
3. cắt list chỉ giữ 50 message mới nhất
4. emit event sang Kafka

Đoạn chính:

```ts
await this.redisService.instance.lpush(roomKey, JSON.stringify(chatMessage));
await this.redisService.instance.ltrim(roomKey, 0, 49);
```

Giải thích:

- `LPUSH`: nhét message mới vào đầu list
- `LTRIM 0 49`: chỉ giữ 50 phần tử đầu

Nói đơn giản:

- Redis đang đóng vai trò "cache recent messages"
- không phải lịch sử chat đầy đủ

Lịch sử đầy đủ vẫn nằm ở `Postgres`.

Đây là cách dùng đúng.

## 7. Khi đọc message thì Redis giúp gì

Trong `getRecentMessages`:

1. đọc `LRANGE` từ Redis
2. nếu có cache thì trả luôn
3. nếu cache miss thì query Postgres

Đây là mô hình cache read-through thủ công.

Lợi ích:

- người dùng mở room chat sẽ thấy message gần nhất nhanh hơn
- database đỡ phải query liên tục cho cùng một room nóng

## 8. Một số use case Redis rất hợp cho e-commerce

### Case 1: Cache PDP

Ví dụ trang product detail bị đọc rất nhiều.

Flow hợp lý:

1. đọc Redis theo key `product:pdp:<id>`
2. nếu miss thì query Postgres
3. serialize vào Redis với TTL

### Case 2: Rate limit login / OTP

Ví dụ:

- một IP chỉ được thử login 10 lần trong 5 phút

Redis cực hợp vì:

- increment nhanh
- expire nhanh
- logic đơn giản

### Case 3: Waiting room cho flash sale

Redis hợp để giữ:

- queue ngắn hạn
- token vào cửa
- counters

Nhưng quota thật và reservation quan trọng vẫn nên được chốt ở hệ thống có source of truth rõ ràng.

## 9. Sai lầm junior hay mắc với Redis

### Sai lầm 1: nghĩ nhanh thì dùng làm source of truth luôn

Đây là lỗi rất nguy hiểm.

Nhanh không đồng nghĩa với đúng.

### Sai lầm 2: không có key naming convention

Nên đặt key có pattern:

- `chat:room:<roomId>:messages`
- `product:pdp:<productId>`
- `rate-limit:login:<ip>`

Không có convention thì sau này dọn cache rất khổ.

### Sai lầm 3: cache mà không có invalidation

Cache chỉ có giá trị nếu em nghĩ rõ:

- khi nào set
- khi nào xóa
- khi nào hết hạn

### Sai lầm 4: nhét object phình to vào Redis

Redis ở RAM.

Dùng sai là tốn RAM rất nhanh.

## 10. Nếu system bắt đầu lớn thì cần chú ý gì

- hot key
- memory growth
- TTL strategy
- cache invalidation
- persistence config nếu cần
- cluster/sentinel nếu cần HA

Với chat, room cực nóng có thể tạo hot key.

Khi đó cần nghĩ thêm:

- room sharding
- giữ ít message hơn
- cache theo chunk
- websocket scale riêng

## 11. Kết luận senior muốn em nhớ

Redis rất mạnh, nhưng chỉ mạnh khi đặt đúng vai.

Nhớ công thức này:

- cần nhanh, tạm, đọc nhiều: nghĩ tới Redis
- cần đúng, audit, bền: nghĩ tới Postgres

Trong repo này, cách dùng Redis cho recent chat messages là đúng hướng vì:

- Postgres vẫn là sự thật
- Redis chỉ tăng tốc read path
