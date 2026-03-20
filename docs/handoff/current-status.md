# Current Status

## Những gì đã có

- Base repo đã dựng backend, frontend, Redis, Kafka, Keycloak, Docker.
- Có tài liệu phân tích nghiệp vụ và thiết kế hệ thống e-commerce high-scale.
- Có tài liệu database chi tiết mức thiết kế.

## Những gì chưa có

- Chưa chuyển thiết kế e-commerce thành `Prisma schema` thực tế.
- Chưa có migration database cho các bảng commerce.
- Chưa có service modules cho catalog, inventory, order, payment, fulfillment.
- Chưa có test strategy thực thi trong code.

## Điểm kỹ thuật cần nhớ

- File schema hiện tại: `apps/api/prisma/schema.prisma`
- Hiện schema mới có model `ChatMessage`
- Tài liệu thiết kế cần được dùng làm nguồn để triển khai schema mới

## Rủi ro hiện tại

- Nếu bắt đầu code ngay mà không khóa phạm vi domain lõi, sẽ dễ lệch thiết kế
- Nếu dựng schema quá rộng ngay từ đầu, migration sẽ nặng và khó kiểm soát
- Nên bắt đầu từ domain lõi:
  - catalog
  - sku
  - warehouse
  - inventory
  - order
  - outbox
