# Infra Learning Docs

Bộ tài liệu này viết theo kiểu một senior dạy một junior.

Mục tiêu không phải chỉ để "biết định nghĩa", mà là:

- hiểu mental model
- biết khi nào nên dùng
- biết khi nào không nên dùng
- nhìn được ví dụ gắn với code đang có trong repo
- tránh các hiểu lầm phổ biến khi system bắt đầu scale

Thứ tự nên đọc:

1. `redis.md`
2. `socket.md`
3. `kafka.md`
4. `rabbitmq.md`
5. `keycloak.md`
6. `prisma.md`

Lý do đọc theo thứ tự này:

- `Redis` và `Socket` giúp bạn hiểu tầng realtime và cache trước
- `Kafka` và `RabbitMQ` giúp bạn phân biệt event backbone với task queue
- `Keycloak` giúp bạn hiểu auth/authorization của repo
- `Prisma` giúp bạn hiểu lớp persistence đang code trực tiếp mỗi ngày
