# Next Steps

## Thứ tự đề xuất

1. Draft `Prisma schema` cho domain lõi:
   - `products`
   - `skus`
   - `warehouses`
   - `inventory_balances`
   - `inventory_reservations`
   - `orders`
   - `order_items`
   - `outbox_events`

2. Tạo migration đầu tiên cho commerce core.

3. Dựng service boundaries trong NestJS:
   - catalog
   - inventory
   - order
   - pricing

4. Chốt transaction flow:
   - reserve stock
   - create order
   - write outbox

5. Sau đó mới mở rộng:
   - payment
   - shipment
   - flash-sale
   - analytics

## Nếu mở phiên làm việc mới

Hãy yêu cầu agent:

- đọc `docs/handoff/*.md`
- đọc `docs/ecommerce/*.md`
- tóm tắt lại hiểu biết trước khi sửa code
