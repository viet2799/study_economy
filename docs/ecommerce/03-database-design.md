# Thiết Kế Database Cho E-commerce High-scale

Tài liệu này giả định `Postgres` là `source of truth`. `Redis` chỉ dùng cho cache và trạng thái ngắn hạn, `Kafka` dùng cho event stream, không thay thế dữ liệu chuẩn.

## 1. Nguyên tắc thiết kế DB

1. `Đúng trước, nhanh sau`. Mọi bảng giao dịch phải ưu tiên tính đúng của giá, tồn, đơn, thanh toán.
2. `Tách write path và read path`. Dữ liệu ghi vào Postgres, dữ liệu đọc có thể denormalize hoặc cache.
3. `Mọi thao tác quan trọng phải idempotent`. Checkout, payment callback, shipping callback, retry worker đều phải an toàn khi chạy lại.
4. `Snapshot hóa dữ liệu nghiệp vụ`. Đơn hàng phải lưu giá, giảm giá, phí ship, địa chỉ, kho, tồn tại thời điểm chốt.
5. `Không dùng Redis làm nguồn sự thật`. Redis chỉ là lớp tăng tốc.
6. `Không partition sớm`. Chỉ partition bảng lớn, append-only, có query theo thời gian.
7. `Index phải phục vụ query thực tế`. Không đánh index theo cảm tính.
8. `Audit trail là bắt buộc`. Các thay đổi giá, tồn, trạng thái đơn, shipment phải truy vết được.
9. `FK quan trọng phải có index`. Không để join nóng bị full scan.
10. `Tối ưu cho hot path trước`. Hot path là browse, PDP, add-to-cart, checkout, reservation, payment, shipment.

## 2. Bounded Context Và Các Bảng Chính

### 2.1 Customer

| Bảng | Chức năng | PK / FK / Unique | Quan hệ chính |
|---|---|---|---|
| `customers` | Hồ sơ khách hàng | `PK id`, `UNIQUE email_norm`, `UNIQUE phone_norm` nếu có | 1-n `customer_addresses`, 1-n `orders`, 1-n `carts` |
| `customer_addresses` | Địa chỉ giao hàng / thanh toán | `PK id`, `FK customer_id` | Nối với `customers` |
| `customer_sessions` | Session, device, login state | `PK id`, `UNIQUE session_token`, `FK customer_id` | Nối với `customers` |
| `customer_preferences` | Size, màu, brand, segment | `PK customer_id`, `FK customer_id` | Dùng cho personalization |

### 2.2 Catalog

| Bảng | Chức năng | PK / FK / Unique | Quan hệ chính |
|---|---|---|---|
| `brands` | Thương hiệu | `PK id`, `UNIQUE brand_code`, `UNIQUE slug` | 1-n `products` |
| `categories` | Danh mục cây | `PK id`, `UNIQUE category_code`, `UNIQUE slug`, `FK parent_id` | Self-reference |
| `products` | Sản phẩm cha | `PK id`, `UNIQUE product_code`, `UNIQUE slug`, `FK brand_id` | 1-n `skus`, n-n `categories`, n-n `collections` |
| `product_categories` | Bảng nối product-category | `PK (product_id, category_id)` | Nối `products` và `categories` |
| `collections` | Bộ sưu tập / campaign landing | `PK id`, `UNIQUE collection_code`, `UNIQUE slug` | 1-n `product_collections` |
| `product_collections` | Bảng nối product-collection | `PK (product_id, collection_id)` | Nối `products` và `collections` |
| `skus` | Variant size/màu, đơn vị bán thực tế | `PK id`, `UNIQUE sku_code`, `UNIQUE barcode`, `FK product_id` | 1-n `inventory_balances`, `inventory_reservations`, `order_items` |
| `product_media` | Ảnh/video | `PK id`, `FK product_id`, `FK sku_id` nullable | Gắn với `products` hoặc `skus` |

### 2.3 Pricing & Promotion

| Bảng | Chức năng | PK / FK / Unique | Quan hệ chính |
|---|---|---|---|
| `price_lists` | Bộ giá theo kênh/vùng/thời gian | `PK id`, `UNIQUE price_list_code` | 1-n `sku_prices` |
| `sku_prices` | Giá hiện hành của SKU | `PK id`, `FK price_list_id`, `FK sku_id`, `UNIQUE (price_list_id, sku_id, valid_from)` | Nối giá với SKU |
| `promo_campaigns` | Chiến dịch giảm giá / voucher / flash sale | `PK id`, `UNIQUE campaign_code` | 1-n `promo_rules`, `voucher_codes`, `promo_redemptions` |
| `promo_rules` | Luật áp dụng campaign | `PK id`, `FK campaign_id` | Nối logic khuyến mãi |
| `voucher_codes` | Mã voucher | `PK id`, `UNIQUE voucher_code`, `FK campaign_id` | Dùng khi checkout |
| `promo_redemptions` | Lịch sử sử dụng promotion | `PK id`, `FK campaign_id`, `FK customer_id`, `FK order_id` | Audit khuyến mãi |
| `price_audit_logs` | Lưu lịch sử thay đổi giá | `PK id`, `FK sku_id`, `FK price_list_id` | Audit giá |

### 2.4 Inventory

| Bảng | Chức năng | PK / FK / Unique | Quan hệ chính |
|---|---|---|---|
| `warehouses` | Danh mục kho | `PK id`, `UNIQUE warehouse_code` | 1-n tồn, reservation, transfer |
| `inventory_balances` | Tồn tổng hợp theo kho + SKU | `PK id`, `FK warehouse_id`, `FK sku_id`, `UNIQUE (warehouse_id, sku_id)` | Bảng hot nhất của inventory |
| `inventory_movements` | Sổ cái nhập/xuất/điều chỉnh/chuyển kho | `PK id`, `FK warehouse_id`, `FK sku_id` | Append-only |
| `inventory_reservations` | Giữ hàng có TTL | `PK id`, `UNIQUE reservation_no`, `FK order_id`, `FK order_item_id`, `FK warehouse_id`, `FK sku_id` | Giữ tồn cho checkout/flash sale |
| `stock_transfers` | Phiếu chuyển kho | `PK id`, `UNIQUE transfer_no`, `FK from_warehouse_id`, `FK to_warehouse_id` | 1-n `stock_transfer_items` |
| `stock_transfer_items` | Dòng SKU của phiếu chuyển | `PK id`, `FK transfer_id`, `FK sku_id` | Nối với `stock_transfers` |

### 2.5 Flash Sale

| Bảng | Chức năng | PK / FK / Unique | Quan hệ chính |
|---|---|---|---|
| `flash_sale_campaigns` | Cấu hình đợt sale | `PK id`, `UNIQUE campaign_code` | 1-n SKU quota, queue ticket |
| `flash_sale_campaign_skus` | Quota theo SKU | `PK id`, `FK campaign_id`, `FK sku_id`, `UNIQUE (campaign_id, sku_id)` | Nối campaign với SKU |
| `flash_sale_queue_tickets` | Vé xếp hàng | `PK id`, `FK campaign_id`, `FK customer_id`, `UNIQUE ticket_no` | Công bằng khi mở sale |
| `flash_sale_claims` | Lịch sử claim | `PK id`, `FK campaign_id`, `FK ticket_id`, `FK order_id` | Audit fairness |

### 2.6 Cart, Order, Payment

| Bảng | Chức năng | PK / FK / Unique | Quan hệ chính |
|---|---|---|---|
| `carts` | Giỏ hàng đang hoạt động | `PK id`, `FK customer_id` | 1-n `cart_items` |
| `cart_items` | Dòng sản phẩm trong giỏ | `PK id`, `FK cart_id`, `FK sku_id`, `UNIQUE (cart_id, sku_id)` | Nối `carts` và `skus` |
| `orders` | Đơn hàng gốc | `PK id`, `UNIQUE order_no`, `FK customer_id` | 1-n `order_items`, `payment_intents`, `shipments` |
| `order_items` | Dòng hàng của đơn | `PK id`, `FK order_id`, `FK sku_id`, `UNIQUE (order_id, line_no)` | Nối order và SKU |
| `order_adjustments` | Giảm giá, phí ship, thuế, điều chỉnh | `PK id`, `FK order_id`, `FK order_item_id` nullable | Lưu snapshot tiền |
| `order_status_history` | Lịch sử trạng thái đơn | `PK id`, `FK order_id` | Audit state machine |
| `payment_intents` | Ý định thanh toán | `PK id`, `UNIQUE order_id`, `UNIQUE intent_no` | 1-1 với order |
| `payment_transactions` | Giao dịch thực tế với provider | `PK id`, `FK payment_intent_id`, `UNIQUE provider_transaction_id` | Idempotent callback |
| `refunds` | Hoàn tiền | `PK id`, `FK payment_transaction_id`, `UNIQUE provider_refund_id` | Audit hoàn tiền |
| `idempotency_keys` | Chống tạo đơn / thanh toán trùng | `PK id`, `UNIQUE (scope, idempotency_key)` | Dùng cho retry an toàn |

### 2.7 Fulfillment & Shipping

| Bảng | Chức năng | PK / FK / Unique | Quan hệ chính |
|---|---|---|---|
| `shipping_methods` | Phương thức vận chuyển | `PK id`, `UNIQUE method_code` | 1-n `shipping_rates` |
| `shipping_rates` | Bảng giá ship | `PK id`, `FK shipping_method_id`, `FK warehouse_id` nullable | Tính phí ship |
| `fulfillment_allocations` | Phân bổ order item sang kho | `PK id`, `FK order_item_id`, `FK reservation_id`, `FK warehouse_id` | 1-n `shipment_items` |
| `shipments` | Header vận đơn | `PK id`, `UNIQUE shipment_no`, `UNIQUE tracking_no` nếu có, `FK order_id`, `FK warehouse_id` | 1-n tracking events |
| `shipment_items` | Dòng SKU trong vận đơn | `PK id`, `FK shipment_id`, `FK fulfillment_allocation_id`, `FK sku_id` | Nối shipment và order item |
| `shipment_tracking_events` | Sự kiện tracking | `PK id`, `FK shipment_id` | Append-only, audit vận chuyển |

### 2.8 Integration & Analytics

| Bảng | Chức năng | PK / FK / Unique | Quan hệ chính |
|---|---|---|---|
| `outbox_events` | Outbox pattern phát event an toàn | `PK id` | Từ transaction ra Kafka |
| `outbox_event_deliveries` | Trạng thái delivery tới sink | `PK id`, `FK outbox_event_id`, `UNIQUE (outbox_event_id, sink_code)` | Retry fan-out |
| `behavior_events` | Click/view/add-to-cart/search | `PK id` | Event stream cho personalization |
| `sales_agg_minute` | Doanh thu live theo phút | `PK (bucket_minute, channel, region)` | Dashboard live |
| `inventory_snapshot_daily` | Snapshot tồn theo ngày | `PK (snapshot_date, warehouse_id, sku_id)` | Báo cáo vận hành |
| `audit_logs` | Audit chung cho thay đổi quan trọng | `PK id` | Truy vết hành vi hệ thống |

## 3. Giải Thích Chức Năng Từng Cụm Bảng

### Customer

- `customers`: hồ sơ khách hàng chuẩn hóa, là điểm nối tới đơn hàng, cart, hành vi.
- `customer_addresses`: lưu nhiều địa chỉ để checkout và tính kho/ETA.
- `customer_sessions`: hỗ trợ session, device fingerprint, anti-fraud, personalization gần thời gian thực.
- `customer_preferences`: nơi lưu profile sở thích đã tổng hợp, không phải raw event.

### Catalog

- `brands`, `categories`, `collections`: cấu trúc kinh doanh để merchandising.
- `products`: thực thể cha hiển thị trên web.
- `skus`: đơn vị bán thực sự, nơi gắn tồn, barcode, size, màu.
- `product_media`: ảnh/video theo product hoặc riêng từng variant.

### Pricing & Promotion

- `price_lists`: quản giá theo kênh, vùng hoặc chiến dịch.
- `sku_prices`: lịch sử giá theo hiệu lực thời gian.
- `promo_campaigns`, `promo_rules`, `voucher_codes`, `promo_redemptions`: engine khuyến mãi và lịch sử sử dụng.
- `price_audit_logs`: bắt buộc nếu chủ hệ thống cần audit giá và tránh bán nhầm.

### Inventory

- `warehouses`: master data cho kho.
- `inventory_balances`: trạng thái nóng của tồn theo `warehouse + sku`.
- `inventory_movements`: ledger append-only để biết vì sao tồn thay đổi.
- `inventory_reservations`: giữ hàng tạm khi checkout hoặc flash sale.
- `stock_transfers`, `stock_transfer_items`: quản luồng chuyển kho.

### Flash Sale

- `flash_sale_campaigns`: cấu hình khung sale, thời gian, điều kiện.
- `flash_sale_campaign_skus`: quota của từng SKU trong sale.
- `flash_sale_queue_tickets`: vé hàng đợi để giữ fairness.
- `flash_sale_claims`: bằng chứng user đã claim gì, lúc nào, thành công hay không.

### Cart, Order, Payment

- `carts`, `cart_items`: trạng thái mua sắm trước khi chốt đơn.
- `orders`: header của đơn hàng.
- `order_items`: chi tiết SKU mua.
- `order_adjustments`: snapshot của discount, shipping fee, tax, surcharge.
- `order_status_history`: vết lịch sử trạng thái.
- `payment_intents`: ý định thanh toán, giúp tách bước chuẩn bị payment khỏi callback provider.
- `payment_transactions`: nơi audit kết quả gateway.
- `refunds`: quản luồng hoàn tiền.
- `idempotency_keys`: chống submit lặp hoặc callback lặp.

### Fulfillment & Shipping

- `shipping_methods`, `shipping_rates`: rule và chi phí ship.
- `fulfillment_allocations`: map `order_item` sang kho cụ thể.
- `shipments`, `shipment_items`: tạo vận đơn và dòng vận đơn.
- `shipment_tracking_events`: lưu timeline giao hàng.

### Integration & Analytics

- `outbox_events`: đảm bảo domain event được phát ra ngoài mà không mất đồng bộ với transaction.
- `outbox_event_deliveries`: theo dõi retry tới các sink khác nhau.
- `behavior_events`: raw behavior cho personalization/analytics.
- `sales_agg_minute`: bảng tổng hợp thời gian thực để dashboard không đè lên `orders`.
- `inventory_snapshot_daily`: phục vụ báo cáo vận hành và đối chiếu.
- `audit_logs`: sổ audit chung ngoài các bảng audit riêng domain.

## 4. Quan Hệ Giữa Các Bảng

### Quan hệ chính theo domain

- `customers 1-n customer_addresses`
- `customers 1-n customer_sessions`
- `customers 1-n carts`
- `customers 1-n orders`
- `brands 1-n products`
- `products 1-n skus`
- `products n-n categories` qua `product_categories`
- `products n-n collections` qua `product_collections`
- `price_lists 1-n sku_prices`
- `warehouses 1-n inventory_balances`
- `skus 1-n inventory_balances`
- `warehouses 1-n inventory_reservations`
- `skus 1-n inventory_reservations`
- `orders 1-n order_items`
- `orders 1-n order_status_history`
- `orders 1-n shipments`
- `order_items 1-n fulfillment_allocations`
- `inventory_reservations 1-n fulfillment_allocations` hoặc `1-1` tùy flow thực tế
- `shipments 1-n shipment_items`
- `shipments 1-n shipment_tracking_events`
- `flash_sale_campaigns 1-n flash_sale_campaign_skus`
- `flash_sale_campaigns 1-n flash_sale_queue_tickets`
- `flash_sale_campaigns 1-n flash_sale_claims`
- `payment_intents 1-n payment_transactions`
- `outbox_events 1-n outbox_event_deliveries`

### Nguyên tắc FK / delete rule

- Dữ liệu giao dịch quan trọng nên dùng `ON DELETE RESTRICT`.
- Chỉ dùng `ON DELETE CASCADE` cho bảng phụ kỹ thuật như `cart_items` nếu thật sự muốn dọn dữ liệu.
- Với ledger và audit, gần như không xóa cứng.

## 5. PK, FK, Unique Constraints Quan Trọng

### Unique business keys

- `customers.email_norm`
- `customers.phone_norm`
- `brands.brand_code`
- `categories.category_code`
- `products.product_code`
- `products.slug`
- `collections.collection_code`
- `skus.sku_code`
- `skus.barcode`
- `price_lists.price_list_code`
- `warehouses.warehouse_code`
- `inventory_reservations.reservation_no`
- `stock_transfers.transfer_no`
- `flash_sale_campaigns.campaign_code`
- `voucher_codes.voucher_code`
- `orders.order_no`
- `payment_intents.intent_no`
- `shipments.shipment_no`
- `shipments.tracking_no` nếu provider đảm bảo unique
- `idempotency_keys(scope, idempotency_key)`

### Composite unique quan trọng

- `product_categories(product_id, category_id)`
- `product_collections(product_id, collection_id)`
- `sku_prices(price_list_id, sku_id, valid_from)`
- `inventory_balances(warehouse_id, sku_id)`
- `flash_sale_campaign_skus(campaign_id, sku_id)`
- `cart_items(cart_id, sku_id)`
- `order_items(order_id, line_no)`
- `outbox_event_deliveries(outbox_event_id, sink_code)`

## 6. Chiến Lược Index

## 6.1 Khái niệm index là gì

Index là cấu trúc dữ liệu phụ mà database dùng để tìm bản ghi nhanh hơn, tương tự mục lục của sách. Nếu không có index, Postgres thường phải quét nhiều dòng hơn hoặc toàn bảng để tìm dữ liệu phù hợp.

Ví dụ:

- Nếu bạn tra cứu `orders` theo `order_no` liên tục mà không có index, Postgres phải xem rất nhiều dòng.
- Nếu có index trên `order_no`, Postgres tìm trực tiếp đến vùng dữ liệu cần thiết.

## 6.2 Khi nào nên đánh index

Nên đánh index khi:

- cột thường xuyên xuất hiện trong `WHERE`
- cột thường xuyên dùng trong `JOIN`
- cột dùng cho `ORDER BY`
- cột là `UNIQUE`
- cột có tính chọn lọc cao, ví dụ `order_no`, `sku_code`, `tracking_no`
- bảng lớn và query chỉ cần một phần nhỏ dữ liệu

## 6.3 Khi nào không nên đánh index

Không nên đánh index khi:

- bảng quá nhỏ
- cột ít giá trị khác nhau và không phải điều kiện query chính
- cột thay đổi liên tục nhưng hiếm khi đọc
- index không phục vụ query thực tế nào
- có quá nhiều index chồng chéo, gây chậm ghi và lãng phí dung lượng

## 6.4 Tradeoff của index

- `Ưu điểm`: tăng tốc đọc, join, sort, lookup
- `Nhược điểm`: insert/update/delete chậm hơn vì phải cập nhật index
- `Nhược điểm`: tốn thêm storage
- `Nhược điểm`: cần bảo trì để tránh bloat

## 6.5 Các loại index nên dùng

- `B-tree`: mặc định cho hầu hết lookup theo mã, FK, thời gian, trạng thái
- `GIN`: dùng cho `jsonb`, array hoặc full-text khi thật sự cần
- `BRIN`: tốt cho bảng cực lớn append-only theo thời gian
- `Partial index`: chỉ index một tập con hot, ví dụ reservation active
- `Covering index` với `INCLUDE`: giúp tránh quay lại heap trong một số query chỉ đọc ít cột

## 7. Index Đề Xuất Theo Bảng Và Giải Thích

### Customer

#### `customers`

- `UNIQUE (email_norm)`
  - Dùng để login, merge customer, kiểm tra trùng.
- `UNIQUE (phone_norm)`
  - Dùng cho OTP, lookup khách theo số điện thoại.
- `INDEX (status)`
  - Hữu ích khi lọc khách active/blocked trong admin hoặc anti-fraud.
- `INDEX (last_seen_at DESC)`
  - Hữu ích cho phân tích hoạt động gần đây.

#### `customer_addresses`

- `INDEX (customer_id)`
  - Query phổ biến là lấy toàn bộ địa chỉ của một khách.

#### `customer_sessions`

- `UNIQUE (session_token)`
  - Lookup session chính xác.
- `INDEX (customer_id, updated_at DESC)`
  - Lấy session mới nhất của khách hoặc dọn session cũ.

### Catalog

#### `brands`

- `UNIQUE (brand_code)`
- `UNIQUE (slug)`
  - Lookup nhanh theo mã hoặc đường dẫn SEO.

#### `categories`

- `UNIQUE (category_code)`
- `UNIQUE (slug)`
- `INDEX (parent_id)`
  - Phục vụ build tree danh mục.

#### `products`

- `UNIQUE (product_code)`
- `UNIQUE (slug)`
- `INDEX (brand_id)`
  - Lấy sản phẩm theo brand.
- `INDEX (status, published_at DESC)`
  - Hỗ trợ listing sản phẩm đang bán hoặc mới ra mắt.

#### `product_categories`

- `PK (product_id, category_id)`
- `INDEX (category_id, product_id)`
  - Cần khi browse theo category; PK chỉ tối ưu theo chiều `product_id -> category_id`, còn chiều ngược cần index riêng.

#### `product_collections`

- `PK (product_id, collection_id)`
- `INDEX (collection_id, product_id)`
  - Tối ưu load collection page.

#### `skus`

- `UNIQUE (sku_code)`
- `UNIQUE (barcode)`
- `INDEX (product_id)`
  - Load variants của một product.
- `INDEX (status)`
  - Lọc SKU active/inactive.
- `GIN (attrs_jsonb)`
  - Chỉ dùng khi thực sự filter size/màu/fit/material trực tiếp từ `jsonb`.
  - Nếu filter cố định và nhiều, nên chuẩn hóa cột thay vì lạm dụng `jsonb`.

#### `product_media`

- `INDEX (product_id, sort_order)`
- `INDEX (sku_id, sort_order)`
  - Đảm bảo load media đúng thứ tự cho product hoặc variant.

### Pricing & Promotion

#### `price_lists`

- `UNIQUE (price_list_code)`
- `INDEX (channel, region, active_from, active_to)`
  - Dùng để tìm price list đúng context.

#### `sku_prices`

- `UNIQUE (price_list_id, sku_id, valid_from)`
- `INDEX (sku_id, price_list_id, valid_from DESC)`
  - Query điển hình là tìm giá hiện hành mới nhất của một SKU trong một price list.
- `INDEX (price_list_id, valid_from, valid_to)`
  - Hữu ích cho job publish/expire giá.

#### `promo_campaigns`

- `UNIQUE (campaign_code)`
- `INDEX (campaign_type, start_at, end_at, status)`
  - Dùng để tìm campaign đang hiệu lực.

#### `voucher_codes`

- `UNIQUE (voucher_code)`
- `INDEX (campaign_id, status)`
  - Admin tra voucher theo campaign.

#### `promo_redemptions`

- `INDEX (customer_id, campaign_id)`
  - Kiểm tra một khách đã dùng campaign chưa.
- `INDEX (order_id)`
  - Truy vết khuyến mãi theo đơn.

#### `price_audit_logs`

- `INDEX (sku_id, changed_at DESC)`
  - Xem lịch sử thay đổi giá theo SKU.
- `INDEX (changed_by, changed_at DESC)`
  - Audit thao tác admin.

### Inventory

#### `warehouses`

- `UNIQUE (warehouse_code)`
- `INDEX (region_code, status)`
  - Chọn kho theo vùng và trạng thái.

#### `inventory_balances`

- `UNIQUE (warehouse_id, sku_id)`
  - Đây là index quan trọng nhất cho lookup tồn theo kho + SKU.
- `INDEX (sku_id)`
  - Dùng khi cần xem SKU này đang nằm ở các kho nào.
- `INDEX (warehouse_id, available_qty)`
  - Tìm tồn thấp hoặc tìm kho còn hàng.

Giải thích:

- Query nóng nhất của inventory là `sku X tại warehouse Y còn bao nhiêu`.
- Vì vậy composite unique `(warehouse_id, sku_id)` là bắt buộc.
- Index `sku_id` hỗ trợ chiều query ngược lại: một SKU tồn ở bao nhiêu kho.

#### `inventory_movements`

- `INDEX (warehouse_id, sku_id, occurred_at DESC)`
  - Truy lịch sử movement theo kho và SKU.
- `INDEX (ref_type, ref_id)`
  - Từ order/shipment/adjustment truy ngược movement.
- Có thể dùng `BRIN (occurred_at)` nếu bảng cực lớn và append-only.

#### `inventory_reservations`

- `UNIQUE (reservation_no)`
- `INDEX (order_id)`
  - Tìm reservation của một order.
- `INDEX (order_item_id)`
  - Tìm reservation theo line item.
- `INDEX (warehouse_id, sku_id, status)`
  - Kiểm tra reservation active cho SKU tại kho.
- `PARTIAL INDEX (expires_at) WHERE status = 'ACTIVE'`
  - Rất quan trọng cho worker release reservation hết hạn.
- `PARTIAL INDEX (sku_id, warehouse_id, expires_at) WHERE status = 'ACTIVE'`
  - Hữu ích cho flash sale hoặc cleanup quy mô lớn.

Giải thích:

- Reservation là bảng nóng, có nhiều insert/update.
- Không nên nhồi quá nhiều index, nhưng các index phục vụ TTL cleanup và lookup theo order là bắt buộc.

#### `stock_transfers`

- `UNIQUE (transfer_no)`
- `INDEX (from_warehouse_id, status, requested_at DESC)`
- `INDEX (to_warehouse_id, status, requested_at DESC)`
  - Hỗ trợ quản trị luồng chuyển kho.

#### `stock_transfer_items`

- `INDEX (transfer_id)`
- `INDEX (sku_id)`

### Flash Sale

#### `flash_sale_campaigns`

- `UNIQUE (campaign_code)`
- `INDEX (status, start_at, end_at)`
  - Lấy campaign active.

#### `flash_sale_campaign_skus`

- `UNIQUE (campaign_id, sku_id)`
- `INDEX (sku_id, campaign_id)`
  - Kiểm tra SKU thuộc campaign nào.

#### `flash_sale_queue_tickets`

- `UNIQUE (ticket_no)`
- `INDEX (campaign_id, status, issued_at)`
  - Quản hàng đợi theo campaign.
- `INDEX (customer_id, campaign_id)`
  - Kiểm tra khách đã có vé chưa.

Nếu tải cực nóng:

- cân nhắc partition/hash theo `campaign_id`

#### `flash_sale_claims`

- `INDEX (campaign_id, claimed_at DESC)`
- `INDEX (ticket_id)`
- `INDEX (order_id)`
  - Truy claim theo campaign, ticket hoặc order.

### Cart, Order, Payment

#### `carts`

- `INDEX (customer_id, status, updated_at DESC)`
  - Lấy cart active của khách.

#### `cart_items`

- `UNIQUE (cart_id, sku_id)`
- `INDEX (sku_id)`
  - Tính nhanh số cart đang giữ một SKU nếu cần phân tích.

#### `orders`

- `UNIQUE (order_no)`
- `INDEX (customer_id, placed_at DESC)`
  - Lịch sử đơn của khách.
- `INDEX (status, placed_at DESC)`
  - Dashboard vận hành, danh sách đơn theo trạng thái.
- `INDEX (payment_status, placed_at DESC)`
  - Tìm các đơn pending payment hoặc paid gần đây.
- `INDEX (fulfillment_status, placed_at DESC)`
  - Theo dõi fulfillment.

Nếu hệ thống dùng idempotency key trực tiếp trên `orders`:

- `UNIQUE (idempotency_key)` hoặc `INDEX (idempotency_key)` theo thiết kế

#### `order_items`

- `UNIQUE (order_id, line_no)`
- `INDEX (order_id)`
  - Load item của đơn.
- `INDEX (sku_id)`
  - Báo cáo và truy vết theo SKU.

#### `order_adjustments`

- `INDEX (order_id)`
- `INDEX (order_item_id)`
  - Phục vụ render đầy đủ breakdown tiền.

#### `order_status_history`

- `INDEX (order_id, created_at DESC)`
  - Load timeline trạng thái của đơn.

#### `payment_intents`

- `UNIQUE (order_id)`
- `UNIQUE (intent_no)`
- `INDEX (status, created_at DESC)`
  - Quản payment pending/failed/retry.

#### `payment_transactions`

- `UNIQUE (provider_transaction_id)`
- `INDEX (payment_intent_id, created_at DESC)`
  - Load giao dịch theo intent.
- `INDEX (provider_code, provider_transaction_id)`
  - Idempotent callback và reconcile.
- `INDEX (status, created_at DESC)`
  - Tìm giao dịch lỗi hoặc pending.

#### `refunds`

- `UNIQUE (provider_refund_id)`
- `INDEX (payment_transaction_id)`
- `INDEX (status, created_at DESC)`

#### `idempotency_keys`

- `UNIQUE (scope, idempotency_key)`
- `INDEX (expires_at)`
  - Dọn key cũ theo TTL.

### Fulfillment & Shipping

#### `shipping_methods`

- `UNIQUE (method_code)`

#### `shipping_rates`

- `INDEX (shipping_method_id, warehouse_id)`
- `INDEX (region_code, district_code)`
  - Hỗ trợ tính cước nhanh theo vùng.

#### `fulfillment_allocations`

- `INDEX (order_item_id)`
- `INDEX (reservation_id)`
- `INDEX (warehouse_id, status)`
  - Dùng khi pick/pack và kiểm tra allocation theo kho.

#### `shipments`

- `UNIQUE (shipment_no)`
- `UNIQUE (tracking_no)` nếu đảm bảo unique
- `INDEX (order_id)`
  - Từ order xem shipment.
- `INDEX (warehouse_id, status, created_at DESC)`
  - Dashboard vận hành theo kho.
- `INDEX (status, shipped_at DESC)`
  - Theo dõi shipment đang chờ dispatch hoặc đã giao.

#### `shipment_items`

- `INDEX (shipment_id)`
- `INDEX (fulfillment_allocation_id)`
- `INDEX (sku_id)`

#### `shipment_tracking_events`

- `INDEX (shipment_id, occurred_at DESC)`
  - Render timeline nhanh.
- `BRIN (occurred_at)` nếu bảng rất lớn

### Integration & Analytics

#### `outbox_events`

- `INDEX (status, available_at)` với partial `WHERE status = 'PENDING'`
  - Worker lấy event chờ publish nhanh.
- `INDEX (aggregate_type, aggregate_id, created_at DESC)`
  - Truy event theo aggregate.
- `INDEX (topic, created_at DESC)`
  - Hỗ trợ điều tra theo topic.

Đây là bảng cực kỳ quan trọng. Nếu không có partial index cho trạng thái `PENDING`, worker relay sẽ scan rất nặng khi bảng lớn lên.

#### `outbox_event_deliveries`

- `UNIQUE (outbox_event_id, sink_code)`
- `INDEX (status, last_attempt_at)`
  - Retry theo trạng thái.

#### `behavior_events`

- `INDEX (customer_id, event_time DESC)`
  - Cá nhân hóa theo lịch sử khách.
- `INDEX (session_id, event_time DESC)`
  - Gộp hành vi khách chưa login.
- `INDEX (event_type, event_time DESC)`
  - Phân tích theo loại sự kiện.
- `BRIN (event_time)` nếu volume rất lớn

#### `sales_agg_minute`

- `PK (bucket_minute, channel, region)`
- `INDEX (channel, region, bucket_minute DESC)`
  - Dashboard live theo kênh/vùng.

#### `inventory_snapshot_daily`

- `PK (snapshot_date, warehouse_id, sku_id)`
- `INDEX (warehouse_id, snapshot_date DESC)`
- `INDEX (sku_id, snapshot_date DESC)`

#### `audit_logs`

- `INDEX (actor_id, created_at DESC)`
- `INDEX (entity_type, entity_id, created_at DESC)`
- `BRIN (created_at)` nếu append-only rất lớn

## 8. Partitioning Strategy

### Nên partition

- `orders`
- `order_items`
- `inventory_movements`
- `outbox_events`
- `shipment_tracking_events`
- `behavior_events`
- `audit_logs`
- `sales_agg_minute`
- `inventory_snapshot_daily`

### Cách partition

- Dùng `RANGE(created_at)` theo tháng cho phần lớn bảng giao dịch lớn.
- Dùng theo ngày nếu event volume cực cao.
- Với một số bảng nóng theo campaign, có thể cân nhắc `HASH(campaign_id)`.

### Không nên partition sớm

- `inventory_balances`
- `sku_prices`
- `products`
- `skus`
- `customers`

Lý do: đây là bảng point lookup hoặc hot row. Partition sớm làm phức tạp migration và query plan nhưng lợi ích thấp.

## 9. Data Retention Và Audit

### Retention

- `orders`, `payments`, `shipments`, `inventory_movements`, `audit_logs`: giữ dài hạn.
- `behavior_events`: giữ nóng 30-180 ngày, sau đó archive.
- `outbox_events`: giữ ngắn hơn sau khi đã đối soát và phát xong.
- `carts`, `customer_sessions`, `inventory_reservations`: TTL ngắn.

### Audit

- Audit phải append-only.
- Nên lưu:
  - `actor_id`
  - `request_id`
  - `correlation_id`
  - `before_jsonb`
  - `after_jsonb`
  - `changed_at`
- Không update đè audit log.

## 10. Các Query Nóng Dự Kiến Và Index Phục Vụ

| Query nóng | Bảng chính | Index phục vụ |
|---|---|---|
| Load danh mục theo category/collection, lọc size/màu/giá/tồn | `products`, `skus`, `product_categories`, `product_collections`, `inventory_balances`, `sku_prices` | `products.status`, `product_categories(category_id, product_id)`, `product_collections(collection_id, product_id)`, `skus.product_id`, `skus.attrs_jsonb GIN`, `inventory_balances(warehouse_id, sku_id)`, `sku_prices(sku_id, price_list_id, valid_from DESC)` |
| Load PDP theo `slug` hoặc `sku_code` | `products`, `skus`, `product_media` | `UNIQUE products.slug`, `UNIQUE skus.sku_code`, `product_media(product_id, sort_order)` |
| Admin sửa giá và xem lịch sử | `sku_prices`, `price_audit_logs` | `sku_prices(sku_id, price_list_id, valid_from DESC)`, `price_audit_logs(sku_id, changed_at DESC)` |
| Checkout giữ tồn | `inventory_balances`, `inventory_reservations`, `orders`, `order_items` | `inventory_balances(warehouse_id, sku_id)`, partial index active reservations, `orders.customer_id`, `orders.order_no` |
| Flash sale claim | `flash_sale_campaign_skus`, `flash_sale_queue_tickets`, `flash_sale_claims` | `flash_sale_campaign_skus(campaign_id, sku_id)`, `flash_sale_queue_tickets(campaign_id, status, issued_at)`, `flash_sale_claims(campaign_id, claimed_at DESC)` |
| Tra cứu đơn theo `order_no`, payment ref, tracking no | `orders`, `payment_transactions`, `shipments` | `UNIQUE order_no`, `provider_transaction_id`, `tracking_no` |
| Dashboard doanh thu live | `sales_agg_minute` | `PK(bucket_minute, channel, region)`, `(channel, region, bucket_minute DESC)` |
| Tìm SKU tồn thấp theo kho | `inventory_balances` | `(warehouse_id, available_qty)` |
| Đồng bộ tracking vận chuyển | `shipments`, `shipment_tracking_events` | `tracking_no`, `(shipment_id, occurred_at DESC)` |
| Relay event ra Kafka | `outbox_events`, `outbox_event_deliveries` | partial `(status, available_at)` và `(status, last_attempt_at)` |

## 11. Kết Luận

Thiết kế này ưu tiên 4 thứ:

- `đúng dữ liệu`
- `tối ưu hot path`
- `audit được`
- `mở rộng được`

Nếu cần triển khai thật, nên bắt đầu từ:

1. `customers`
2. `catalog`
3. `skus`
4. `warehouses`
5. `inventory_balances`
6. `inventory_reservations`
7. `orders`
8. `order_items`
9. `payment_intents`
10. `shipments`
11. `outbox_events`

Sau đó mới mở rộng sang `flash sale`, `analytics`, và `personalization`.
