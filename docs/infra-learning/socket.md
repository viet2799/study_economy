# Socket Từ Gốc Đến Cách Dùng Trong Repo Này

## 1. Socket là gì

Khi junior nghe "socket" rất dễ mơ hồ.

Trong web app hiện đại, thứ em hay gặp là:

- WebSocket
- hoặc framework như `Socket.IO`

Mục tiêu là tạo một kết nối lâu dài giữa client và server để hai bên đẩy dữ liệu realtime.

Khác với HTTP truyền thống:

- HTTP: request rồi response xong là thôi
- Socket: giữ kết nối, có event qua lại liên tục

## 2. Khi nào nên dùng socket

### Nên dùng

- chat
- notification realtime
- live dashboard
- multiplayer / collaboration
- typing indicator
- online presence

### Không nên lạm dụng

- CRUD bình thường
- fetch list bình thường
- create/update/delete không cần realtime

Rất nhiều junior thấy socket "ngầu" rồi muốn dùng cho mọi thứ.
Đó là sai.

## 3. Repo này đang dùng socket ở đâu

File chính:

- `apps/api/src/modules/chat/gateways/chat.gateway.ts`
- `apps/api/src/modules/chat/services/chat.service.ts`

`ChatGateway` là nơi xử lý kết nối realtime.

`ChatService` là nơi xử lý business/persistence.

Tách như vậy là đúng.

## 4. Giải thích `ChatGateway`

### `@WebSocketGateway(...)`

Đây là cách NestJS khai báo một gateway socket.

Repo đang cấu hình:

- `cors`
- `namespace: '/chat'`

Điều đó có nghĩa:

- socket chat đi riêng dưới namespace `/chat`

### `handleConnection`

Khi client connect:

1. lấy token từ handshake
2. verify bằng `KeycloakAuthService`
3. gắn user vào `client.data.user`

Ý đúng:

- auth ngay lúc connect
- không để socket vô danh nhắn linh tinh

### `joinRoom`

Client gửi event `room:join`.

Gateway:

1. join room
2. lấy recent messages
3. emit `room:history`

### `sendMessage`

Client gửi event `room:message`.

Gateway:

1. lấy user từ socket data
2. gọi `ChatService.createMessage`
3. emit message ra cả room

Controller của socket nên mỏng y chang HTTP controller.

## 5. Giải thích `ChatService` trong bài toán socket

`ChatService` đang làm 3 việc quan trọng:

1. lưu message xuống Postgres
2. cache recent messages vào Redis
3. phát event sang Kafka

Đây là kiến trúc đúng hướng.

Socket không nên tự ôm luôn:

- DB logic
- cache logic
- event logic

Gateway chỉ là transport layer.

## 6. Flow nhắn tin hiện tại của repo

1. socket connect
2. user join room
3. user gửi event `room:message`
4. gateway gọi `ChatService.createMessage`
5. service ghi DB
6. service update Redis
7. service emit Kafka event
8. gateway emit lại message cho mọi client trong room

## 7. Khi nào socket cực kỳ đáng giá

### Chat app

Đây là use case kinh điển.

Nếu dùng HTTP polling:

- tốn request
- trễ
- UX xấu

Socket giải quyết tốt hơn nhiều.

### Live order status / warehouse dashboard

Ví dụ:

- operator thấy đơn vừa đổi trạng thái
- dashboard thấy hot SKU tăng realtime

Socket rất hợp.

## 8. Nhưng socket không phải phép màu

Socket giúp giảm chi phí request-response lặp lại, nhưng nó mang theo các bài toán khó:

- giữ connection lâu
- auth cho connection
- scale nhiều instance
- sticky session
- backpressure
- fan-out room

## 9. Nếu 10,000 người nhắn tin cùng lúc thì sao

Đây là câu hỏi rất hay.

Câu trả lời senior là:

> Không có thành phần nào "tự nhiên chịu được 10,000 người cùng lúc" nếu em không thiết kế cho nó.

### Những bottleneck sẽ xuất hiện

#### 1. Một Node process không vô hạn

Một instance NestJS + Socket.IO có giới hạn:

- CPU
- event loop
- memory
- network sockets

#### 2. Room broadcast rất nóng

Nếu nhiều người cùng vào một room lớn:

- emit tới hàng ngàn socket là cực nặng

#### 3. DB write pressure

Mỗi message đều ghi Postgres thì DB sẽ nóng nhanh.

#### 4. Redis key nóng

Một room chat cực lớn sẽ đập liên tục vào cùng key cache.

#### 5. Một instance không đủ

Khi scale ngang nhiều instance:

- một socket có thể connect vào instance A
- room join ở A
- user khác connect vào B

Nếu không có adapter chia sẻ state, broadcast room sẽ lệch.

## 10. Vậy xử lý 10,000 concurrent chat thế nào

### Bước 1: scale ngang app

Chạy nhiều instance API/socket.

### Bước 2: dùng Redis adapter cho Socket.IO

Để các instance chia sẻ event room với nhau.

Không có bước này thì multi-instance socket room sẽ không đồng bộ đúng.

### Bước 3: rate limit

Phải chặn:

- spam
- bot
- flood

### Bước 4: tách write path và fan-out path

Có thể:

- ghi message vào DB
- publish event
- worker/service khác fan-out hoặc enrich

### Bước 5: giới hạn room nóng

Nếu một room cực lớn:

- cần batching
- cần sharding
- hoặc cần policy hạn chế

### Bước 6: tối ưu persistence

Không phải room nào cũng cần lưu mọi thứ theo cùng cách.

Có thể:

- giữ recent messages ở Redis
- lưu archive theo batch
- hoặc tách storage chiến lược

### Bước 7: observability

Phải đo:

- active connections
- messages/sec
- room fan-out latency
- event loop lag
- Redis latency
- DB latency

## 11. Socket có thay Kafka không

Không.

Socket là giao tiếp realtime với client.

Kafka là event backbone giữa services.

Trong repo này:

- socket dùng để realtime cho user
- Kafka dùng để phát event cho downstream

Hai thứ này không thay nhau.

## 12. Sai lầm junior hay mắc với socket

### Sai lầm 1: nhét hết business vào gateway

Sai.

Gateway chỉ nên là lớp giao tiếp realtime.

### Sai lầm 2: bỏ qua auth ở handshake

Sai.

Socket cũng phải auth như HTTP.

### Sai lầm 3: nghĩ local chạy ổn thì production auto ổn

Sai nặng.

Socket scale khó hơn HTTP rất nhiều.

## 13. Kết luận senior muốn em nhớ

Socket rất hợp cho chat và realtime UX.

Nhưng khi scale lớn:

- bottleneck không nằm ở một chỗ
- nó đồng thời chạm app, Redis, DB, network, fan-out

Repo này đang dùng socket đúng hướng ở mức base:

- gateway lo transport
- service lo business
- auth ở handshake
- Redis hỗ trợ recent messages
- Kafka hỗ trợ downstream event

Muốn chịu tải 10,000 chatters cùng lúc thật sự thì phải thêm:

- Redis adapter cho Socket.IO
- scale ngang nhiều instance
- rate limit
- room strategy
- observability
