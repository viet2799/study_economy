# RabbitMQ Từ Gốc Đến Cách Dùng Và Khi Nào Nên Chọn

## 1. RabbitMQ là gì

RabbitMQ là message broker rất mạnh cho mô hình queue / worker.

Nói dễ hiểu:

- app A gửi job
- broker giữ job
- worker nhận job và làm

RabbitMQ cực hợp cho:

- email
- SMS
- tạo shipping label
- resize ảnh
- webhook retry
- các tác vụ nền có ack/retry rõ ràng

## 2. Mental model đúng về RabbitMQ

Nếu Kafka là "dòng sự kiện", thì RabbitMQ là "hàng việc".

Một câu em nên nhớ:

> Kafka nghiêng về event stream, RabbitMQ nghiêng về task queue.

## 3. Khái niệm chính

### Producer

Thằng gửi message.

### Queue

Nơi giữ message chờ xử lý.

### Consumer / Worker

Thằng lấy message ra làm.

### Exchange

Nơi message được route trước khi vào queue.

Các loại exchange phổ biến:

- `direct`
- `topic`
- `fanout`
- `headers`

### Ack

Worker nói với broker:

- "Tôi xử lý xong rồi"

Nếu chưa ack mà worker chết, message có thể được giao lại.

Đây là lý do RabbitMQ rất hợp cho job queue.

## 4. Khi nào nên dùng RabbitMQ

### Rất nên dùng

- job queue
- background worker
- retry task
- delay/retry pipeline
- email/SMS
- shipping integration
- payment callback processing từng job rõ ràng

### Không phải lựa chọn đầu tiên nếu

- em cần event stream lớn
- em cần replay lịch sử event
- nhiều hệ thống khác nhau cùng ăn event ở quy mô rất lớn

Lúc đó Kafka thường hợp hơn.

## 5. Repo này đang dùng RabbitMQ chưa

Chưa.

Repo hiện tại đang có:

- Redis
- Kafka
- Keycloak
- Socket
- Prisma

Nhưng chưa có module RabbitMQ.

Điều này không có nghĩa là RabbitMQ không cần.

Nó chỉ có nghĩa là hiện repo chưa đi vào use case nào bắt buộc phải có worker queue riêng.

## 6. Nếu áp RabbitMQ vào repo này thì dùng ở đâu hợp

### Case 1: gửi email / SMS

Order tạo xong:

- API đẩy job `send-order-confirmation-email`
- worker mail xử lý

Không nên để request checkout chờ gửi mail xong.

### Case 2: tạo shipping label

Order đủ điều kiện giao:

- API hoặc orchestration service đẩy job `create-shipping-label`
- worker gọi GHTK/GHN/GiaoHangNhanh

Nếu provider timeout:

- worker retry
- không làm chết luồng API chính

### Case 3: retry webhook

Nếu gửi webhook ra ngoài mà đối tác fail:

- đẩy lại queue retry
- worker thử lại theo backoff

## 7. RabbitMQ khác Kafka chỗ nào theo kiểu dễ nhớ

### RabbitMQ

- giao việc cho worker
- ack rõ ràng
- retry/backoff tốt cho task
- thường hợp với job nhỏ, cụ thể

### Kafka

- phát sự kiện cho nhiều consumer
- stream volume lớn
- replay tốt
- hợp cho event backbone

Nếu em đang hỏi:

"Tạo label vận chuyển, gửi mail, retry callback thì gì hợp hơn?"

Thường là RabbitMQ.

Nếu em đang hỏi:

"Order created rồi analytics, recommendation, search indexing cùng ăn thì gì hợp hơn?"

Thường là Kafka.

## 8. Ví dụ code tư duy với RabbitMQ

Giả sử sau này repo có shipping worker.

### Bên producer

```ts
await rabbitMqService.publish('shipping.jobs', {
  type: 'shipment.create-label',
  payload: {
    orderId: 'ord_123',
    shipmentId: 'shp_1'
  }
});
```

### Bên worker

```ts
await rabbitMqService.consume('shipping.jobs', async (message) => {
  await shippingProvider.createLabel(message.payload);
});
```

Ý đúng ở đây là:

- API không chờ provider bên ngoài
- provider chết không kéo sập request chính
- worker có thể retry

## 9. Sai lầm junior hay mắc với RabbitMQ

### Sai lầm 1: dùng RabbitMQ thay Kafka cho mọi event

Không sai tuyệt đối, nhưng thường sẽ sớm đuối nếu hệ thống cần event backbone lớn.

### Sai lầm 2: không nghĩ về idempotency

Message có thể được deliver lại.

Worker phải chịu được chạy lại.

### Sai lầm 3: không có dead-letter strategy

Nếu job fail mãi thì sao.

Phải có:

- retry count
- dead-letter queue
- alerting

### Sai lầm 4: nhồi business logic nặng vào controller thay vì đẩy job

Đó là cách API tự làm chậm chính nó.

## 10. Trong bài toán e-commerce thì chọn thế nào

### Dùng Kafka cho

- order event
- analytics
- personalization
- search sync
- cache invalidation

### Dùng RabbitMQ cho

- email
- SMS
- create shipment label
- sync carrier retry
- refund reconciliation task

## 11. Kết luận senior muốn em nhớ

RabbitMQ không phải "phiên bản yếu hơn Kafka".

Nó là công cụ khác mục đích.

Nhớ công thức:

- cần event backbone cho nhiều consumer: nghĩ Kafka
- cần task queue/worker/retry/ack: nghĩ RabbitMQ

Repo này chưa có RabbitMQ module, nhưng nếu em mở rộng sang shipping/email/payment jobs thì RabbitMQ là ứng viên rất hợp.
