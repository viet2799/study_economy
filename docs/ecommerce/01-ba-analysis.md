# BA Analysis Cho E-commerce High-Scale

Tài liệu này chuyển yêu cầu cảm tính của chủ hệ thống thành tiêu chí nghiệp vụ và vận hành có thể triển khai được.

## 1. Business Goals

- Tăng conversion nhờ trải nghiệm duyệt hàng nhanh gần như tức thời.
- Bảo vệ doanh thu trong flash-sale bằng cơ chế công bằng, chống bot, không oversell.
- Tối ưu fulfillment qua nhiều kho để giao nhanh hơn, đúng hơn, rẻ hơn.
- Tăng AOV/LTV bằng personalization có kiểm soát.
- Cung cấp dashboard sống cho vận hành và chủ doanh nghiệp ra quyết định.

## 2. Non-functional Requirements

- "Zero-latency" phải được hiểu là `perceived latency` rất thấp, không phải 0ms tuyệt đối.
- Các thao tác phổ biến phải phản hồi rất nhanh ở P95.
- Flash-sale phải có fairness deterministic, không phụ thuộc race condition ngẫu nhiên.
- Inventory phải có một nguồn sự thật rõ ràng, nhưng read path phải cực nhanh.
- Hệ thống phải chịu được spike traffic lớn mà không kéo sập database giao dịch.
- Giá, tồn, đơn hàng và trạng thái thanh toán phải có audit trail.

## 3. Giả định cần chốt sớm

- Mỗi sản phẩm có nhiều variant theo size/màu, và tồn phải quản ở cấp `SKU`.
- Mỗi kho có tồn riêng, SLA giao riêng và ảnh hưởng trực tiếp tới ETA.
- Flash-sale có quota, thời gian hiệu lực và điều kiện mua rõ ràng.
- Personalization chỉ phục vụ xếp hạng và gợi ý, không được phép phá fairness hoặc làm sai giá/tồn.
- Analytics live là phục vụ quyết định vận hành, không thay thế đối soát tài chính cuối ngày.

## 4. Domain Boundaries Từ Góc Nhìn BA

- `Identity & Access`
- `Catalog`
- `Search & Browse`
- `Pricing & Promotion`
- `Cart & Checkout`
- `Inventory`
- `Order`
- `Warehouse/Fulfillment`
- `Shipping Integration`
- `Personalization`
- `Analytics/Event Platform`
- `Risk/Fraud`

Điểm trọng yếu là `read path` phải tách khỏi `write path`. Nếu không tách, browse/search/analytics sẽ bóp nghẹt checkout khi traffic tăng.

## 5. Yêu cầu chức năng theo miền

### Catalog

- Hiển thị sản phẩm, media, size, màu, badge sale, low stock, ETA.
- Mỗi SKU có trạng thái availability riêng.
- Collection/landing/campaign có thể cập nhật nhanh.

### Search/Browse

- Filter theo size, màu, giá, brand, availability, vùng giao được.
- Ranking phải cho phép business override trong campaign.
- Listing phải phản ánh thay đổi tồn đủ nhanh để tránh hứa sai.

### Pricing/Promotion

- Giá hiển thị phải nhất quán giữa listing, PDP, cart, checkout.
- Voucher và promo phải có rule rõ về thời gian, quota, segment, category, min cart.
- Flash-sale phải có giới hạn theo user/account/device/SKU.

### Cart/Checkout

- Add-to-cart phải phản hồi ngay.
- Trước khi tạo đơn phải chốt giá, phí ship, tồn, điều kiện thanh toán.
- Nếu giá hoặc tồn thay đổi, hệ thống phải thông báo rõ và buộc người dùng xác nhận lại.

### Inventory/Multi-warehouse

- Phải chọn kho theo rule: gần khách, đủ tồn, SLA, chi phí, ưu tiên campaign.
- Có thể hỗ trợ split shipment nếu business cho phép.
- Mọi thay đổi tồn phải trace được tới movement và đơn gốc.

### Shipping/Fulfillment

- Tính ETA theo địa chỉ, kho, carrier, cut-off time và ngày nghỉ.
- Nếu hãng vận chuyển lỗi, đơn không được mất.
- Trạng thái giao hàng phải cập nhật gần thời gian thực.

### Personalization

- Gợi ý theo hành vi gần đây, lịch sử mua, trend và availability.
- Có fallback khi chưa đủ dữ liệu hoặc mô hình lỗi.
- Không được can thiệp vào fairness của flash-sale.

### Live Analytics

- Theo dõi GMV, conversion, stock-out, queue size, failure rate, hot SKU.
- Cảnh báo khi latency tăng, cache miss tăng, oversell risk tăng.
- Tách operational metrics khỏi business metrics.

## 6. Edge Cases Và Failure Scenarios

- Hai người cùng mua SKU cuối cùng.
- Tồn listing còn nhưng kho phù hợp với địa chỉ khách đã hết.
- Giá promo hết hạn giữa session.
- Khách đổi địa chỉ ở checkout làm thay đổi kho cấp hàng.
- Payment thành công nhưng order update lỗi.
- User refresh/back làm request lặp.
- Bot flood tại thời điểm mở sale.
- Cache stale làm hiển thị giá hoặc tồn cũ.
- Event stream chậm, analytics lag nhưng giao dịch lõi vẫn phải ổn.
- API hãng vận chuyển timeout hoặc down.

## 7. Acceptance Criteria Và SLO Gợi Ý

- Browse/search/PDP: `P95 < 100ms` trên edge/cache path.
- Add-to-cart acknowledgement: `P95 < 150ms`.
- Checkout validation: `P95 < 500ms` không tính external provider.
- Inventory reservation: `P95 < 200ms`.
- Oversell tolerance với SKU giới hạn: mục tiêu `0`.
- Analytics freshness: trễ khoảng `5-15 giây` cho dashboard live.
- Core commerce availability: hướng tới `>= 99.9%`.

## 8. Roadmap Thuyết Phục Chủ Hệ Thống

### Phase 1. Trust Core

- Catalog
- Search/PDP cơ bản
- Cart/Checkout
- Inventory reservation
- Order tracking

Mục tiêu: không sai giá, không sai tồn, không sai ETA cơ bản.

### Phase 2. Flash-sale Fairness

- waiting room
- anti-bot
- quota
- claim window
- idempotency
- audit trail

Mục tiêu: sale chịu tải lớn nhưng vẫn công bằng và giải trình được.

### Phase 3. Multi-warehouse Fulfillment

- rule chọn kho
- split shipment
- ETA engine
- shipment status

### Phase 4. Personalization Có Kiểm Soát

- recommendation
- ranking
- campaign targeting

### Phase 5. Live Analytics Và Optimization

- dashboard live
- alerting
- cohort
- experiment framework

## 9. Kết luận BA

Điểm chủ hệ thống thực sự mua không phải là "nhiều công nghệ", mà là:

- hệ thống không hứa sai giá
- không hứa sai tồn
- không để flash-sale thành trò may rủi
- một dịch vụ phụ chết không kéo chết checkout

Nếu không khóa được 4 điều đó từ đầu thì phần còn lại chỉ là demo.
