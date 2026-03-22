# Postgres Cho Junior Trong Repo Nay

Tài liệu này viết theo kiểu senior dạy junior, nhưng bám vào chính repo này. Mục tiêu là giúp bạn hiểu:

- Postgres là gì và mạnh ở đâu
- Khi nào nên dùng Postgres, khi nào không nên ép nó làm việc sai chỗ
- Cách suy nghĩ khi thiết kế database
- Index là gì, vì sao quan trọng, và thiết kế thế nào cho đúng
- Cách đọc `schema.prisma` hiện tại trong repo
- Cách áp dụng tư duy này cho core commerce: `products`, `skus`, `warehouses`, `inventory`, `orders`, `outbox`

---

## 1. Postgres Là Gì

Postgres là một hệ quản trị cơ sở dữ liệu quan hệ. Nói đơn giản:

- Nó lưu dữ liệu có cấu trúc theo bảng
- Nó hỗ trợ quan hệ giữa các bảng bằng khóa chính, khóa ngoại
- Nó đảm bảo tính đúng đắn của dữ liệu rất tốt
- Nó xử lý transaction tốt, tức là một nhóm thao tác phải thành công cùng nhau hoặc thất bại cùng nhau
- Nó có hệ sinh thái mạnh: index, view, constraint, JSONB, full-text search, partitioning, replication

Nếu phải nói ngắn gọn:

- `Postgres` dùng để lưu sự thật của hệ thống
- Không dùng Postgres chỉ vì "nó phổ biến"
- Dùng Postgres vì cần dữ liệu đúng, truy vấn rõ, audit được, và có transaction

---

## 2. Khi Nào Dùng Postgres

Dùng Postgres khi bạn cần một trong các thứ sau:

- Dữ liệu phải đúng, không được mơ hồ
- Có nhiều quan hệ giữa các thực thể
- Cần transaction nhiều bước
- Cần audit trail
- Cần query linh hoạt, join, filter, sort
- Cần ràng buộc dữ liệu bằng `UNIQUE`, `NOT NULL`, `FOREIGN KEY`

Ví dụ rất hợp:

- e-commerce
- đơn hàng
- thanh toán
- kho
- user/account
- billing
- hệ thống nội bộ có báo cáo

---

## 3. Khi Nào Không Nên Ép Postgres

Không nên dùng Postgres làm mọi thứ nếu bài toán không phù hợp:

- Log thuần append volume cực lớn, ít query phức tạp
- Event stream kiểu queue backbone
- Cache ngắn hạn cần TTL cực nhiều và độ trễ rất thấp
- Search full-text phức tạp kiểu engine tìm kiếm chuyên dụng

Ví dụ:

- Redis hợp cho cache, session, rate limit
- Kafka hợp cho event stream
- Elasticsearch hợp cho search text phức tạp

Tư duy đúng là:

- Postgres là nguồn sự thật
- Các hệ khác là lớp phụ trợ

---

## 4. Tư Duy Đúng Khi Thiết Kế Database

Đây là phần quan trọng nhất.

### 4.1 Thiết kế theo câu hỏi truy vấn

Đừng bắt đầu bằng "mình muốn có bảng gì". Hãy bắt đầu bằng:

- user sẽ hỏi hệ thống câu gì
- query nào chạy nhiều nhất
- dữ liệu nào phải đúng 100%
- dữ liệu nào có thể chậm vài giây

Ví dụ:

- "Lấy danh sách sản phẩm theo category"
- "Kiểm tra SKU này còn tồn không"
- "Tạo đơn và giữ hàng cùng lúc"
- "Xem lịch sử đơn theo user"

Từ query, mới suy ra bảng và index.

### 4.2 Tách source of truth và read path

Một lỗi rất hay gặp là dùng cùng một cấu trúc cho cả ghi và đọc.

Đúng hơn là:

- Write path: tối ưu cho đúng dữ liệu
- Read path: tối ưu cho đọc nhanh

Ví dụ:

- `inventory_balances` là bảng nóng để checkout
- `inventory_movements` là ledger để audit
- `sales_agg_minute` là bảng tổng hợp để dashboard

### 4.3 Normalization trước, denormalization có kiểm soát sau

Normalization nghĩa là tách dữ liệu để tránh lặp và sai lệch.

Ví dụ:

- `products` là sản phẩm cha
- `skus` là biến thể bán thật sự

Không nhét hết size, màu, barcode, giá, tồn vào một bảng product lớn.

Denormalization chỉ nên dùng khi:

- cần tăng tốc đọc
- chấp nhận đồng bộ phức tạp hơn
- đã hiểu rõ pattern truy vấn

### 4.4 Mọi thứ quan trọng phải có lý do

Nếu thêm một cột hoặc một bảng, phải trả lời được:

- Nó phục vụ query nào?
- Nó có phải source of truth không?
- Nó có cần unique không?
- Nó có cần FK không?
- Nó có cần index không?
- Nó có TTL hay retention không?

---

## 5. Cách Dùng Postgres Cơ Bản

### 5.1 CRUD

```sql
INSERT INTO users (email, username)
VALUES ('a@example.com', 'alice');
```

```sql
SELECT id, email, username
FROM users
WHERE email = 'a@example.com';
```

```sql
UPDATE users
SET username = 'alice_1'
WHERE id = '...';
```

```sql
DELETE FROM users
WHERE id = '...';
```

### 5.2 Join

```sql
SELECT o.id, o.order_no, oi.sku_id, oi.quantity
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.customer_id = '...';
```

Join là lý do database quan hệ rất mạnh:

- không cần copy dữ liệu bừa
- vẫn lấy được dữ liệu đúng theo quan hệ

### 5.3 Transaction

Transaction là nhóm thao tác phải đi cùng nhau.

```sql
BEGIN;

UPDATE inventory_balances
SET reserved_qty = reserved_qty + 1
WHERE warehouse_id = 'w1' AND sku_id = 's1';

INSERT INTO orders (...);
INSERT INTO order_items (...);

COMMIT;
```

Nếu một bước fail:

```sql
ROLLBACK;
```

Ý nghĩa:

- hoặc mọi thứ thành công
- hoặc không có gì xảy ra

Đây là thứ cực quan trọng cho checkout, payment, inventory reservation.

---

## 6. Index Là Gì

Index là cấu trúc phụ giúp database tìm dữ liệu nhanh hơn.

Ví dụ đơn giản:

- Không có index: database quét nhiều dòng để tìm
- Có index: database đi thẳng vào vị trí cần tìm

Nó giống mục lục của sách.

### 6.1 Index giúp gì

- tăng tốc `WHERE`
- tăng tốc `JOIN`
- tăng tốc `ORDER BY`
- giúp truy vấn theo key nhanh

### 6.2 Index có giá của nó

Index không miễn phí:

- insert chậm hơn
- update chậm hơn
- delete chậm hơn
- tốn dung lượng

Nên đừng index lung tung.

### 6.3 Khi nào nên index

Nên index khi cột đó:

- nằm trong `WHERE`
- nằm trong `JOIN`
- nằm trong `ORDER BY`
- là business key cần unique
- là pattern query nóng

### 6.4 Khi nào không nên index

Không nên index khi:

- bảng nhỏ
- cột ít được lọc
- cột thay đổi liên tục nhưng ít đọc
- không có query thực tế

---

## 7. Giải Thích Index Trong Schema Hiện Tại

File hiện tại của repo đang có:

`/Users/vietnguyenduc/Documents/Code/Study/study_economy/apps/api/prisma/schema.prisma`

```prisma
model ChatMessage {
  id        String   @id @default(cuid())
  roomId    String
  userId    String
  username  String
  message   String
  createdAt DateTime @default(now())

  @@index([roomId, createdAt])
}
```

### Giải thích từng phần

- `id String @id @default(cuid())`
  - `id` là khóa chính
  - `cuid()` tạo ID dạng string đủ an toàn cho nhiều hệ thống

- `roomId String`
  - room chat mà message thuộc về
  - đây là cột cực quan trọng để query message theo phòng

- `userId String`
  - ai gửi message

- `username String`
  - snapshot tên người gửi tại thời điểm lưu message
  - nếu username đổi sau này, message cũ vẫn giữ thông tin cũ

- `message String`
  - nội dung chat

- `createdAt DateTime @default(now())`
  - thời điểm tạo message

- `@@index([roomId, createdAt])`
  - đây là index rất hợp lý
  - vì query phổ biến thường là:

```sql
SELECT *
FROM ChatMessage
WHERE roomId = 'room-1'
ORDER BY createdAt DESC
LIMIT 50;
```

Index này giúp:

- tìm nhanh message trong một phòng
- sắp xếp theo thời gian nhanh hơn
- load lịch sử chat hiệu quả

### Có thể cải thiện gì

Nếu query thường là "lấy message mới nhất trong room", index này là đúng hướng.

Nếu muốn tối ưu hơn nữa, trong Postgres thật có thể cân nhắc:

- index theo `(roomId, createdAt DESC)`
- hoặc pagination theo cursor thay vì offset lớn

Nhưng chỉ làm khi đo thấy cần.

### `User` model hiện tại

```prisma
model User {
  id         String   @id @default(cuid())
  keycloakId String   @unique
  email      String?  @unique
  username   String?
  firstName  String?
  lastName   String?
  roles      Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

Ý nghĩa:

- `keycloakId` là ID từ Keycloak, phải unique
- `email` optional nhưng nếu có thì phải unique
- `roles Json` cho phép lưu danh sách quyền linh hoạt
- `updatedAt @updatedAt` tự cập nhật mỗi lần record đổi

Điểm cần lưu ý:

- `roles Json` hợp nếu quyền còn đơn giản
- nếu hệ thống quyền phức tạp, nên tách bảng role/permission rõ hơn

---

## 8. Cách Nghĩ Khi Thiết Kế DB Cho Commerce

Repo này đang đi theo core commerce lớn. Cách nghĩ đúng không phải là "tạo bảng cho đủ", mà là:

### 8.1 Product không phải SKU

- `products` là sản phẩm cha
- `skus` là đơn vị bán thật

Ví dụ:

- áo thun màu đen size M là một SKU
- một product có nhiều SKU theo size/màu

Không được trộn product và SKU vào một bảng duy nhất.

### 8.2 Inventory phải tách thành balance và movement

- `inventory_balances` là trạng thái hiện tại
- `inventory_movements` là lịch sử thay đổi

Lý do:

- checkout cần đọc rất nhanh
- audit cần biết tồn thay đổi vì sao

### 8.3 Reservation phải có TTL

Giữ hàng là trạng thái tạm thời.

- nếu user không checkout kịp thì phải nhả tồn
- nếu không có TTL, hệ thống sẽ chết vì hold giả

### 8.4 Order phải lưu snapshot

Khi tạo đơn, phải lưu:

- giá lúc mua
- phí ship lúc đó
- discount lúc đó
- địa chỉ lúc đó
- warehouse lúc đó

Không được chỉ tham chiếu về bảng giá hiện hành.

Vì sau này giá có thể đổi, nhưng đơn cũ không được đổi theo.

### 8.5 Outbox là để event không mất

Khi transaction đã commit mà event chưa bắn ra ngoài thì dùng `outbox_events`.

Tư duy:

- dữ liệu chính ghi vào Postgres
- event được đẩy ra Kafka/consumer sau

Đây là cách an toàn hơn nhiều so với "commit xong rồi bắn Kafka luôn".

---

## 9. Ví Dụ Thiết Kế Core Commerce

### 9.1 `products`

Mục đích:

- lưu thông tin sản phẩm cha
- slug, brand, category

Nên có:

- `id`
- `product_code`
- `slug`
- `brand_id`
- `status`

### 9.2 `skus`

Mục đích:

- lưu biến thể bán thật
- size, màu, barcode

Nên có:

- `id`
- `sku_code`
- `barcode`
- `product_id`
- `status`
- `attrs_jsonb` hoặc cột chuẩn hóa

### 9.3 `warehouses`

Mục đích:

- master data cho kho

Nên có:

- `warehouse_code`
- `region`
- `status`

### 9.4 `inventory_balances`

Mục đích:

- tồn hiện tại theo `warehouse + sku`

Nên có:

- `warehouse_id`
- `sku_id`
- `on_hand_qty`
- `reserved_qty`
- `available_qty`

Unique quan trọng:

- `(warehouse_id, sku_id)`

### 9.5 `inventory_reservations`

Mục đích:

- giữ hàng cho checkout

Nên có:

- `reservation_no`
- `order_id`
- `order_item_id`
- `warehouse_id`
- `sku_id`
- `qty`
- `status`
- `expires_at`

### 9.6 `orders`

Mục đích:

- lưu đơn gốc

Nên có:

- `order_no`
- `customer_id`
- `status`
- `payment_status`
- `fulfillment_status`
- `placed_at`

### 9.7 `order_items`

Mục đích:

- dòng hàng của đơn

Nên có:

- `order_id`
- `line_no`
- `sku_id`
- `quantity`
- `unit_price`
- `discount_amount`

### 9.8 `outbox_events`

Mục đích:

- lưu event chờ phát ra Kafka

Nên có:

- `aggregate_type`
- `aggregate_id`
- `event_type`
- `payload`
- `status`
- `available_at`

---

## 10. Cách Thiết Kế Index Cho Commerce

Đây là phần junior hay làm sai nhất.

### 10.1 Nguyên tắc thực chiến

Không index theo cảm giác. Index theo query thật.

Ví dụ:

- query lấy đơn theo khách hàng
- query lấy tồn theo `warehouse + sku`
- query lấy event pending trong outbox
- query lấy item của một order

### 10.2 Ví dụ index hợp lý

- `products(slug)` để tìm PDP nhanh
- `skus(sku_code)` để lookup biến thể
- `inventory_balances(warehouse_id, sku_id)` để checkout nhanh
- `inventory_reservations(order_id)` để tra reservation của đơn
- `orders(customer_id, placed_at DESC)` để xem lịch sử mua
- `order_items(order_id)` để load chi tiết đơn
- `outbox_events(status, available_at)` để worker quét event pending

### 10.3 Câu hỏi trước khi thêm index

Hỏi 5 câu này:

1. Query nào dùng cột này?
2. Tần suất query bao nhiêu?
3. Bảng có lớn không?
4. Có bao nhiêu lần ghi mỗi ngày?
5. Index này có đáng chi phí ghi thêm không?

Nếu không trả lời được, chưa nên thêm index.

---

## 11. Prisma Khi Viết Schema

Prisma là lớp mô tả schema và map sang database.

Ví dụ:

```prisma
model Product {
  id        String   @id @default(cuid())
  code      String   @unique
  slug      String   @unique
  brandId   String
  status    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([brandId])
}
```

Ý nghĩa:

- `@id` là primary key
- `@unique` là unique constraint
- `@@index` là index thường
- `@default(now())` là default timestamp
- `@updatedAt` tự update khi record thay đổi

Khi thiết kế Prisma:

- đừng copy bảng một cách máy móc
- hãy dùng Prisma để phản ánh đúng domain
- vẫn phải nghĩ như người thiết kế Postgres thật

---

## 12. Checklist Trước Khi Tạo Một Bảng Mới

Trước khi tạo bảng, trả lời:

- Bảng này có tồn tại vì domain thật hay chỉ để tiện code?
- Bảng này là source of truth hay cache?
- Có FK nào bắt buộc không?
- Có unique business key không?
- Query nóng nhất là gì?
- Index nào cần cho query nóng đó?
- Dữ liệu này có cần retention/TTL không?
- Có cần audit trail không?

Nếu chưa trả lời được, đừng tạo bảng.

---

## 13. Sai Lầm Thường Gặp

- Nhét quá nhiều thứ vào một bảng lớn
- Dùng JSON cho mọi thứ
- Không có unique key cho business object
- Không có transaction cho flow quan trọng
- Không có snapshot cho order
- Không có index cho query nóng
- Dùng Redis thay Postgres cho dữ liệu phải đúng
- Không có outbox mà bắn event trực tiếp

---

## 14. Tóm Tắt Tư Duy Senior

Khi thiết kế DB, đừng hỏi:

- "Mình tạo bao nhiêu bảng?"

Hãy hỏi:

- "Dữ liệu nào là sự thật?"
- "Ai đọc cái gì nhiều nhất?"
- "Chỗ nào cần đúng tuyệt đối?"
- "Chỗ nào được phép trễ?"
- "Index nào phục vụ query thật?"
- "Transaction nào phải atomic?"

Nếu bạn giữ được mấy câu này, bạn sẽ thiết kế DB tốt hơn rất nhiều người chỉ biết viết schema cho chạy được.

