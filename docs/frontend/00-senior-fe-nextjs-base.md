# Senior FE Next.js Base Strategy

Tài liệu này chốt hướng dựng base Frontend cho repo `study_economy`, dựa trên các tài liệu trong `docs/handoff/*.md` và `docs/ecommerce/*.md`.

Mục tiêu không phải cài thật nhiều thư viện. Mục tiêu là chọn đúng bộ công cụ để:

- giữ dữ liệu ổn định khi giá và tồn thay đổi liên tục
- không cho UI hứa sai những gì backend chưa xác nhận
- giữ Core Web Vitals tốt khi listing lớn
- để team có thể code flow checkout trước cả khi backend xong
- có đường test, mock, observability và accessibility ngay từ đầu

## 1. Nguyên Tắc Chọn Thư Viện

1. `Server state` phải có một nguồn quản lý riêng. Với ecommerce, dữ liệu catalog/cart/checkout không nên tự nhét vào local state đơn giản.
2. `Validation` phải chạy ở biên dữ liệu, không chờ tới lúc component render lỗi.
3. `UI primitives` phải accessible trước, đẹp sau. Nếu base component không chuẩn thì toàn bộ flow sau sẽ mang lỗi.
4. `Mocking` phải đủ mạnh để FE độc lập với BE trong giai đoạn đầu.
5. `Testing` phải có cả unit, integration, e2e, và a11y. E-commerce không thể dựa vào manual testing.
6. `Observability` phải gắn từ đầu, vì lỗi thanh toán/login/auth không thể debug theo cảm tính.

## 2. Bộ Thư Viện Nên Cài

### 2.1 Core Data & Validation

- `@tanstack/react-query`
  - Quản lý server state, cache, invalidation, retry, mutation.
  - Dùng cho product list, product detail, cart, checkout summary, profile.
  - Hợp với bài toán dữ liệu biến động và revalidate mạnh.

- `zod`
  - Chặn data lỗi từ backend trước khi vào component.
  - Tạo schema chung cho `User`, `Product`, `Cart`, `Address`, `CheckoutPayload`.
  - Dùng chung cho mock, form, query parser, và test fixtures.

- `react-hook-form`
  - Giảm re-render khi form lớn.
  - Hợp với checkout, address, login/OTP, voucher, profile update.

- `@hookform/resolvers`
  - Kết nối `react-hook-form` với `zod`.
  - Cho phép form dùng cùng schema với API contract.

### 2.2 UI System

- `clsx`
  - Gộp class có điều kiện một cách gọn.

- `tailwind-merge`
  - Chặn xung đột class khi compose variant.
  - Cực quan trọng nếu dùng nhiều variant cho Button/Input/Badge.

- `class-variance-authority`
  - Định nghĩa variant hệ thống cho component base.
  - Hợp cho `Button`, `Input`, `Tag`, `Card`, `Dialog`.

- `lucide-react`
  - Icon set nhẹ, dễ dùng, đủ chuẩn cho ecommerce UI.

- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-tabs`
- `@radix-ui/react-toast`
  - Base accessible primitives.
  - Phù hợp để dựng UI Kit thay vì tự viết modal/dropdown/toast từ đầu.

- `date-fns`
  - Xử lý ngày giờ, ETA, countdown promo, flash-sale timers.
  - Tránh tự viết logic ngày giờ hoặc dùng thư viện nặng.

### 2.3 Auth

- `keycloak-js`
  - Giữ lại như hiện tại.
  - Đây là client auth layer đủ gọn cho repo này.

- `jwt-decode`
  - Chỉ nên cài nếu FE cần đọc claims/token payload ở client.
  - Không bắt buộc nếu backend đã trả đủ thông tin user.

### 2.4 Mocking & Contracts

- `msw`
  - Mock API ở browser và node.
  - Giúp FE code flow checkout dù BE chưa xong.
  - Rất hợp để dựng contract fixtures cho team.

### 2.5 Testing

- `vitest`
  - Unit test nhanh, nhẹ, phù hợp component và utils.

- `jsdom`
  - Environment cho test component trên Vitest.

- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
  - Test theo hành vi người dùng thay vì test implementation details.

- `playwright`
  - E2E cho login, browse, cart, checkout.
  - Cần cho những luồng “ăn tiền”.

- `@axe-core/playwright`
  - Bắt lỗi accessibility trong e2e.

### 2.6 Observability

- `@sentry/nextjs`
  - Theo dõi lỗi production.
  - Nên tách fingerprint/module theo `Auth`, `Catalog`, `Cart`, `Checkout`, `Payment`.
  - Gắn source maps để debug đúng dòng lỗi.

### 2.7 Linting / DX

- `eslint`
- `eslint-config-next`
- `eslint-config-prettier`
- `prettier`
- `lint-staged`
- `husky`
  - Tạo pre-commit guard cho lint, type-check, test.
  - Chặn lỗi đơn giản trước khi lên CI.

### 2.8 Optional nhưng nên cân nhắc

- `@tanstack/react-query-devtools`
  - Dùng trong local dev để nhìn query cache và invalidation.

- `@next/bundle-analyzer`
  - Dùng khi tối ưu bundle thật sự cần đo.

- `react-error-boundary`
  - Dùng nếu muốn UI fallback theo vùng thay vì crash cả page.

## 3. Những Gì Không Nên Cài Sớm

- `redux-toolkit`
  - Chỉ cần nếu global client state phình lớn hơn dự kiến. Với flow hiện tại React Query + form state là đủ.

- `axios`
  - `fetch` + wrapper chuẩn hóa là đủ cho Next.js hiện tại.
  - Nếu sau này cần intercept sâu hoặc cần một client layer riêng, mới tính tiếp.

- `next-auth`
  - Không cần vì stack đã chốt Keycloak.
  - Thêm `next-auth` sẽ tạo thêm lớp auth không cần thiết.

- `moment`
  - Nặng và cũ. `date-fns` đủ hơn.

- `swr`
  - Nếu đã chọn React Query thì không cần thêm một server-state lib nữa.

## 4. Chiến Lược Kiến Trúc FE

### 4.1 Data Flow

- Query đọc từ backend qua React Query.
- Mọi response phải qua Zod parse trước khi đi vào UI.
- Mutation phải invalidate query keys đã chuẩn hóa.
- Checkout không tin cache cũ, chỉ dùng cache để hiển thị, không dùng cache để chốt tiền/tồn.

### 4.2 Query Keys

Nên chuẩn hóa theo domain:

- `['auth', 'session']`
- `['user', 'me']`
- `['catalog', 'products', filters]`
- `['catalog', 'product', slug]`
- `['cart', 'detail']`
- `['cart', 'count']`
- `['checkout', 'summary']`

Khi `add-to-cart` thành công:

- invalidate `cart.count`
- invalidate `cart.detail`
- invalidate `checkout.summary` nếu checkout đang mở

### 4.3 Server/Client Boundary

- Server component cho page shell, SEO, initial data hint, and metadata.
- Client component cho auth session, cart interaction, form input, websocket, toast, optimistic UI.
- Không đẩy toàn bộ app sang client chỉ vì tiện.

## 5. Folder Structure Nên Dùng

Nên chuyển sang cấu trúc `feature-based`:

```text
src/
  app/
  features/
    auth/
    catalog/
    cart/
    checkout/
    profile/
  shared/
    api/
    schemas/
    ui/
    lib/
    hooks/
    mocks/
```

Lý do:

- cùng một domain nằm cùng một chỗ
- junior tìm file nhanh hơn
- code review dễ theo luồng business
- scale lên hàng trăm file vẫn còn kiểm soát được

## 6. Milestones FE Base Cần Đạt

### 6.1 Unified Data & State Strategy

- có `api client` duy nhất cho app
- có `queryClient` và provider chuẩn
- có Zod schema dùng chung giữa query, mock và form
- có invalidation rule cho cart và checkout

### 6.2 Scalable UI System

- có `Button`, `Input`, `Dialog`, `Dropdown`, `Toast` base component
- có variant rõ ràng bằng CVA
- có `form engine` dùng RHF + Zod
- có design tokens thay vì hardcode màu trong từng file

### 6.3 No-Wait Development

- có MSW mock browser và node
- có mock contract cho catalog/cart/checkout
- có sample fixtures để FE làm việc trước BE

### 6.4 Zero-Defect Pipeline

- có Vitest cho unit
- có Playwright cho login và checkout
- có Axe để bắt lỗi accessibility
- có pre-commit hook cho lint/type-check/test

### 6.5 Production Readiness

- có Sentry với source map
- có cách phân module lỗi theo funnel mua hàng
- có bundle/perf monitoring tối thiểu

## 7. Hiện Trạng Code Của `apps/web`

### 7.1 `apps/web/src/app/layout.tsx`

- đang import global CSS
- `metadata` đang là placeholder
- `html lang="en"` cần đổi theo ngôn ngữ sản phẩm nếu web chính thức dùng tiếng Việt
- `body` chỉ bọc children, chưa có provider cho query/auth/toast/theme

### 7.2 `apps/web/src/app/page.tsx`

- file này đang là client component vì cần Keycloak init trong browser
- `useState` giữ `token` và `isReady`
- `useEffect` chạy một lần để khởi tạo Keycloak
- `onLoad: 'login-required'` ép người dùng login trước khi vào app
- `pkceMethod: 'S256'` là cấu hình bảo mật tốt hơn cho auth flow
- `checkLoginIframe: false` giảm overhead cho app mỏng
- sau khi auth thành công, token được lưu vào state và mới render `ChatRoom`

Ý nghĩa:

- đây là pattern đúng cho auth client-side cơ bản
- nhưng về sau nên tách thành `AuthProvider` để page không tự quản session logic

### 7.3 `apps/web/src/components/chat-room.tsx`

- `useState` quản lý `roomId`, `message`, `messages`
- `useRef` giữ socket instance để dùng lại giữa các render
- `useEffect` đầu tiên mở socket.io connection với token auth
- socket lắng nghe `room:history` và `room:message`
- cleanup disconnect socket để tránh leak khi unmount
- `useEffect` thứ hai emit `room:join` khi room đổi
- `handleSubmit` ngăn form submit rỗng, emit message rồi reset input

Ý nghĩa:

- đây là demo tốt cho realtime baseline
- nhưng nếu áp dụng cho ecommerce, nên tách socket layer thành `shared/lib/realtime`
- mọi payload vẫn nên đi qua schema validation, không render thẳng data từ socket

### 7.4 `apps/web/src/lib/keycloak.ts`

- file này giữ một singleton `Keycloak`
- nếu đã tạo instance rồi thì reuse lại
- config đọc từ `NEXT_PUBLIC_*`
- cách này tránh init nhiều lần và giữ auth state nhất quán

Ý nghĩa:

- singleton là đúng cho client auth cơ bản
- sau này nếu cần refresh token mượt hơn, nên thêm wrapper `authSession` thay vì gọi thẳng `Keycloak` khắp nơi

### 7.5 `apps/web/src/app/styles.css`

- dùng CSS variables làm design tokens sơ khai
- `background`, `card`, `text`, `primary` đã được định nghĩa rõ
- layout có responsive breakpoint cho mobile
- `panel`, `chat-card`, `button` đã có style cơ bản

Ý nghĩa:

- đây là nền tốt để chuyển sang Tailwind tokens hoặc design system component sau này
- hiện tại style vẫn còn là demo, chưa đủ cho commerce UI scale lớn

## 8. Tại Sao Làm Như Vậy Là Tốt

- dữ liệu được chốt qua schema và query key, nên UI ít bị stale
- validation ở biên giảm lỗi runtime
- UI primitives accessible giúp sau này làm SEO/a11y dễ hơn
- MSW + Zod giúp FE chạy độc lập với BE
- Playwright + Axe giúp chặn bug ở luồng kiếm tiền
- Sentry giúp thấy lỗi production theo module thay vì đoán mò
- feature-based structure giúp đội ngũ lớn vẫn maintain được

## 9. Sau Này Sẽ Mở Rộng Ra Sao

Khi base đã ổn, thứ tự mở rộng hợp lý là:

1. `Auth shell`
2. `Catalog listing + PDP`
3. `Cart + drawer`
4. `Checkout flow`
5. `Profile + order history`
6. `Promo / flash-sale states`
7. `Performance tuning + monitoring`

Không nên nhảy ngay vào animation hoặc UI đẹp nếu contract dữ liệu, invalidation và test base chưa xong.

## 10. Gợi Ý Kế Hoạch Triển Khai

1. Cài `React Query`, `Zod`, `RHF`, `MSW`, `Vitest`, `Playwright`, `Sentry`.
2. Tạo `shared/api`, `shared/schemas`, `shared/ui`, `shared/mocks`.
3. Viết một API client duy nhất và query key factory.
4. Dựng một form mẫu có schema `Zod` và `RHF`.
5. Dựng một flow mẫu `login -> fetch profile -> add to cart`.
6. Viết một Playwright test cho happy path checkout.
7. Gắn `Sentry` và `Axe` vào pipeline.

## 11. Kết Luận

Nếu mục tiêu là một frontend ecommerce có thể scale, lựa chọn đúng không phải là cài thật nhiều package. Lựa chọn đúng là:

- một nguồn state cho server data
- một lớp validation cho contract
- một hệ UI accessible và tái sử dụng được
- một bộ test và mock đủ mạnh để dev không phụ thuộc BE
- một đường observability đủ rõ để xử lý lỗi production nhanh

Đó là bộ xương sống tốt cho `apps/web` trước khi bắt đầu mở rộng sang catalog, cart, checkout, personalization, và flash-sale.

## 12. Trạng Thái Hiện Thực

- Bộ base này đã được hiện thực trong `apps/web`.
- Chi tiết folder, file, lý do tách module và cách chạy mock/test/build được mô tả tiếp trong `docs/frontend/01-implemented-nextjs-base.md`.
