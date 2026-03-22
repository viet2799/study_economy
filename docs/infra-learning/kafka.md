# Kafka Từ Gốc Đến Cách Dùng Trong Repo Này

## 1. Kafka là gì

Kafka là một distributed event streaming platform.

Nói dễ hiểu:

- producer bắn event vào topic
- consumer đọc event từ topic
- nhiều consumer khác nhau có thể cùng ăn một event theo mục đích riêng

Kafka rất hợp khi hệ thống muốn tách:

- giao dịch lõi
- analytics
- recommendation
- notification
- downstream sync

## 2. Mental model đúng về Kafka

Kafka không phải "queue thần thánh cho mọi việc".

Hãy nghĩ thế này:

- `RabbitMQ`: giao việc cho worker làm
- `Kafka`: ghi lại luồng sự kiện để nhiều hệ thống khác nhau cùng tiêu thụ

Nếu em nhớ một câu:

> Kafka mạnh ở event backbone và fan-out, không mạnh ở xử lý job đơn chiếc kiểu worker queue.

## 3. Các khái niệm phải nắm

### Topic

Giống như một luồng sự kiện.

Ví dụ:

- `chat.messages`
- `order.created`
- `inventory.changed`

### Partition

Một topic có thể chia thành nhiều partition để scale.

Quan trọng:

- ordering chỉ được đảm bảo trong cùng một partition
- không phải toàn topic

### Producer

Thằng ghi event vào Kafka.

### Consumer

Thằng đọc event ra.

### Consumer group

Nhiều consumer cùng một group sẽ chia việc nhau.

Nếu là group khác nhau thì mỗi group vẫn nhận event riêng để phục vụ use case khác.

## 4. Khi nào nên dùng Kafka

### Nên dùng

- event-driven architecture
- fan-out nhiều downstream
- analytics stream
- audit/event log
- search indexing async
- cache invalidation async

### Không nên lạm dụng

- request/response đồng bộ
- transaction engine của checkout
- xử lý job đơn giản cần retry/ack cực rõ từng task nhỏ

## 5. Repo này đang dùng Kafka ở đâu

File chính:

- `apps/api/src/modules/kafka/kafka.service.ts`
- `apps/api/src/modules/chat/services/chat.service.ts`

### `KafkaService` đang làm gì

Nó đang:

- tạo producer
- tạo consumer
- connect khi app init
- có `emit(topic, message)`
- có `subscribe(topic, handler)`

Đây là abstraction tầng hạ tầng cho Kafka.

## 6. Giải thích code Kafka đang có

Trong constructor:

```ts
this.kafka = new Kafka({
  clientId: this.configService.getOrThrow<string>('kafkaClientId'),
  brokers: this.configService.getOrThrow<string[]>('kafkaBrokers')
});
```

Ý nghĩa:

- `clientId`: định danh app
- `brokers`: địa chỉ Kafka broker

Trong `emit`:

```ts
await this.producer.send({
  topic,
  messages: [{ value: JSON.stringify(message) }]
});
```

Ý nghĩa:

- serialize object thành string
- bắn vào topic

Trong `subscribe`:

```ts
await this.consumer.subscribe({ topic, fromBeginning: false });
await this.consumer.run({
  eachMessage: async ({ message }) => { ... }
});
```

Ý nghĩa:

- lắng nghe topic
- mỗi message tới thì parse JSON rồi xử lý

## 7. Chat service đang dùng Kafka thế nào

Trong `createMessage`:

1. ghi DB
2. cache Redis
3. emit Kafka event

```ts
await this.kafkaService.emit(
  this.configService.getOrThrow<string>('kafkaChatTopic'),
  {
    type: 'chat.message.created',
    payload: chatMessage
  }
);
```

Đây là cách nghĩ đúng:

- business chính của chat message là lưu message
- Kafka dùng để đẩy event cho downstream

Ví dụ downstream sau này có thể là:

- analytics service
- moderation service
- notification service
- data lake pipeline

Không service nào trong số đó nên chặn bước lưu chat message chính.

## 8. Ví dụ e-commerce thực tế với Kafka

### Order created

Khi order tạo xong, em có thể phát event:

```json
{
  "type": "order.created",
  "payload": {
    "orderId": "ord_123",
    "customerId": "cus_1",
    "total": 1200000
  }
}
```

Rồi các hệ thống khác nhau tự ăn:

- analytics cập nhật GMV
- notification gửi email
- warehouse sync read model
- recommendation cập nhật behavior

## 9. Điều rất quan trọng: outbox

Junior rất hay mắc lỗi này:

1. save DB
2. gọi Kafka trực tiếp

Nếu save DB thành công mà Kafka fail, em rơi vào trạng thái lệch.

Cho nên trong hệ thống commerce nghiêm túc, pattern chuẩn là:

1. transaction DB ghi business data
2. cùng transaction ghi `outbox_events`
3. worker riêng đọc outbox rồi publish Kafka

Repo hiện tại mới có `KafkaService`, chưa dựng outbox flow đầy đủ.

Đó là chỗ sẽ phải nâng cấp khi đi vào commerce core.

## 10. Sai lầm junior hay mắc với Kafka

### Sai lầm 1: nghĩ Kafka sẽ giải quyết transaction consistency

Không.

Kafka không thay thế transaction database.

### Sai lầm 2: nghĩ event luôn ordered toàn cục

Không.

Ordering chỉ mạnh trong partition.

### Sai lầm 3: không nghĩ về idempotency

Consumer có thể xử lý lại message.

Nên consumer phải idempotent.

### Sai lầm 4: đẩy event quá to

Message quá to:

- tốn network
- tốn disk
- tốn lag xử lý

Event nên gọn, đủ ngữ nghĩa.

## 11. Khi nào Kafka hợp hơn RabbitMQ

Kafka hợp hơn khi:

- nhiều hệ thống cùng cần một event
- cần stream data lớn
- cần replay event
- analytics là use case lớn

RabbitMQ hợp hơn khi:

- giao việc cho worker làm
- retry/backoff/ack rất rõ theo task

## 12. Kết luận senior muốn em nhớ

Kafka là xương sống phát sự kiện, không phải transaction engine.

Trong repo này, dùng Kafka để phát `chat.message.created` là hợp lý vì:

- nó tách chat write path khỏi downstream logic
- sau này có thể thêm analytics/moderation mà không đụng vào luồng lưu message chính
