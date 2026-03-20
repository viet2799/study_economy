# E-commerce High-Scale Overview

Tài liệu này tổng hợp ý kiến từ góc nhìn `BA` và `BE` cho bài toán e-commerce fashion quy mô lớn, nơi chủ hệ thống ưu tiên:

- trải nghiệm gần như tức thời
- không oversell
- flash-sale công bằng
- kho đa vùng theo thời gian thực
- dashboard sống
- hệ thống vẫn bán được ngay cả khi một vài dịch vụ phụ bị lỗi

## Mục tiêu cốt lõi

Hệ thống này không nên được hứa là "không thể sập" theo nghĩa tuyệt đối. Thiết kế đúng là:

- dịch vụ lõi bán hàng vẫn chạy khi dịch vụ phụ bị lỗi
- lỗi được cô lập theo domain
- dữ liệu tiền, tồn, đơn hàng luôn có nguồn sự thật rõ ràng
- trải nghiệm người dùng nhanh nhờ read model, cache và xử lý bất đồng bộ

## Nguyên tắc kiến trúc

- `Postgres` là source of truth cho giá, tồn, đơn hàng, payment, fulfillment.
- `Redis` chỉ dùng cho cache, token, queue ngắn hạn, rate limit, waiting room, session.
- `Kafka` là event backbone để tách giao dịch lõi khỏi analytics, personalization, cache invalidation, notification.
- Tích hợp ngoài như `GHTK`, `email`, `SMS` phải được xử lý bất đồng bộ để không chặn checkout.

## Bản đồ service mức cao

- `Catalog Service`
- `Pricing & Promotion Service`
- `Inventory Service`
- `Cart & Checkout Service`
- `Order Service`
- `Payment Service`
- `Fulfillment/Shipping Service`
- `Notification Service`
- `Personalization Service`
- `Analytics Service`
- `Integration/Event Relay`

## Luồng lõi cần bảo vệ

1. Web đọc dữ liệu duyệt hàng từ read model/cache.
2. Khi checkout, hệ thống chốt lại giá và tồn từ source of truth.
3. Tạo order, reserve stock và ghi outbox event trong cùng transaction.
4. Event được phát ra Kafka cho các luồng phụ.
5. Notification, analytics, recommendation là downstream consumer, không được chặn core commerce.

## Thứ tự ưu tiên triển khai

1. `Inventory reservation + order consistency`
2. `Pricing consistency + price audit`
3. `Flash-sale fairness`
4. `Multi-warehouse allocation + shipping async`
5. `Redis read model + invalidation`
6. `Kafka analytics/personalization`

## Tài liệu liên quan

- `01-ba-analysis.md`: phân tích nghiệp vụ, NFR, edge cases, acceptance criteria
- `02-be-architecture.md`: thiết kế backend mức hệ thống và data-oriented decisions
- `03-database-design.md`: sẽ bổ sung thiết kế database chi tiết từ Database Master
