# Backend Architecture Notes

Tài liệu này tổng hợp góc nhìn `Senior BE NestJS` dựa trên phân tích nghiệp vụ của BA, với trọng tâm là kiến trúc dữ liệu, transactional boundaries và vai trò của Postgres, Redis, Kafka.

## 1. Nguyên tắc backend

- `Postgres` là `source of truth`.
- `Redis` là lớp tăng tốc và trạng thái ngắn hạn.
- `Kafka` là trục phát sự kiện nghiệp vụ.
- Không publish event trực tiếp từ business code ra Kafka nếu transaction chính chưa commit.
- Mọi tích hợp ngoài phải đi qua async boundary.

## 2. Bounded Contexts Từ Góc Nhìn Backend

- `Catalog`
- `Pricing & Promotion`
- `Inventory`
- `Flash Sale`
- `Order Management`
- `Payment`
- `Fulfillment & Shipping`
- `Integration & Eventing`
- `Analytics/Personalization`

## 3. Thiết kế dữ liệu mức cao

### Product Và SKU

- `products`
- `skus`

Mục đích: tách `product` khỏi `sellable unit`. Giá, tồn, barcode, size, màu phải nằm ở cấp `SKU`.

### Pricing

- `price_lists`
- `sku_prices`
- `price_audit_logs`

Mục đích: lưu được giá theo kênh, vùng, thời gian hiệu lực và có lịch sử thay đổi.

### Inventory

- `warehouses`
- `inventory_balances`
- `inventory_reservations`
- `inventory_movements`
- `stock_transfers`

Mục đích: vừa có trạng thái nóng để phục vụ checkout, vừa có ledger để audit và rebuild.

### Flash Sale

- `flash_sale_campaigns`
- `flash_sale_campaign_skus`
- `flash_sale_queue_tickets`
- `flash_sale_claims`

Mục đích: tách fairness khỏi tồn thường. Không dùng tồn bình thường để xử lý cạnh tranh flash-sale.

### Order

- `orders`
- `order_items`
- `order_status_history`
- `order_payments`

Mục đích: lưu đơn, snapshot giá tại thời điểm mua, lịch sử trạng thái và giao dịch thanh toán.

### Fulfillment Và Shipping

- `fulfillment_allocations`
- `shipments`
- `shipment_items`
- `shipment_tracking_events`

Mục đích: quản phân bổ kho, đóng gói, tạo vận đơn và theo dõi tiến trình giao.

### Reliability

- `idempotency_keys`
- `outbox_events`
- `outbox_event_deliveries`

Mục đích: chống duplicate request, đảm bảo event chỉ rời khỏi database theo luồng có kiểm soát, hỗ trợ retry.

## 4. Transactional Boundaries

### Tạo đơn

Trong một transaction:

- kiểm tra tồn và giá hiệu lực
- tạo `order`
- tạo `order_items`
- tạo `inventory_reservations`
- ghi `outbox_events`

Lợi ích: nếu transaction fail, không có trạng thái nửa chừng.

### Payment Callback

Xử lý transaction riêng, idempotent theo `provider_ref` hoặc callback key. Không cho callback lặp làm double capture hoặc double state transition.

### Release Reservation

Chạy bằng worker/job riêng:

- tìm reservation hết TTL
- release tồn
- ghi movement nếu cần
- phát event

### Shipping Dispatch

Sau khi đơn đủ điều kiện:

- tạo shipment
- enqueue tác vụ đẩy sang carrier
- retry khi provider lỗi

## 5. Rules Nhất Quán Dữ Liệu

- `available_qty = on_hand_qty - reserved_qty - quarantine_qty - safety_stock`
- `inventory_movements` là append-only.
- `inventory_balances` là bảng tổng hợp nóng.
- `order_items` phải lưu snapshot giá tại thời điểm checkout.
- Callback từ provider phải idempotent.
- Order/shipment state machine không được nhảy trạng thái bừa.
- Flash-sale phải dùng queue/ticket/claim riêng, không để request race thẳng vào tồn thường.

## 6. Redis Dùng Ở Đâu

- cache PDP/listing/collection
- cart/session ngắn hạn
- rate limit
- waiting room flash-sale
- temporary counters
- hot ranking
- cache invalidation fan-out

## 7. Redis Không Dùng Ở Đâu

- không làm source of truth cho tồn
- không làm source of truth cho đơn
- không làm source of truth cho giá
- không làm nơi duy nhất giữ reservation
- không làm audit ledger

## 8. Kafka Dùng Ở Đâu

- phát domain event từ outbox
- feed analytics
- feed personalization
- feed search/read model
- cache invalidation
- audit pipeline

Kafka không nên là nơi ra quyết định đồng bộ cho checkout. Nó là xương sống phân phối sự kiện, không phải transaction engine của giỏ hàng.

## 9. RabbitMQ Có Nên Dùng Không

Nếu team cần queue tác vụ có `ack/retry/backoff` rất rõ cho:

- gửi mail
- gửi SMS
- tạo label vận chuyển
- đẩy shipment sang carrier

thì `RabbitMQ` phù hợp.

Nếu đã có Kafka tốt, không nên dùng RabbitMQ làm event backbone chính cho toàn hệ thống. Dùng nó như task queue thì hợp lý hơn.

## 10. Thứ Tự Triển Khai Backend

1. `catalog + sku + warehouse + idempotency + outbox`
2. `inventory_balances + inventory_reservations + inventory_movements`
3. `orders + order_items + order_status_history + fulfillment_allocations`
4. `pricing + price history + snapshot giá`
5. `shipping + tracking + webhook idempotency`
6. `flash-sale fairness flow`
7. `outbox -> Kafka -> analytics/personalization/search`

## 11. Kết luận BE

Điểm cốt lõi không phải "xài Redis hay Kafka cho ngầu", mà là đặt chúng đúng chỗ:

- `Postgres` giữ sự thật
- `Redis` giữ tốc độ
- `Kafka` giữ độ tách biệt và khả năng mở rộng

Nếu đảo vai trò 3 thành phần này, hệ thống sẽ nhanh một lúc nhưng sớm muộn sẽ sai dữ liệu hoặc khó cứu khi gặp sale lớn.
