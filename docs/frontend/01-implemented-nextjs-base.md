# Implemented Next.js Base

Tài liệu này mô tả base Frontend đã được dựng thực tế trong `apps/web`, để team có thể đọc đúng cấu trúc code, hiểu vì sao nó được chia như vậy, và mở rộng theo cùng một quy chuẩn.

## 1. Tổng Quan

Base hiện tại tập trung vào 5 lớp:

- `auth` với `keycloak-js`
- `data` với `React Query` + `Zod`
- `ui` với `Radix UI` + `CVA` + `tailwind-merge`
- `mock` với `MSW`
- `quality` với `Vitest`, `Playwright`, `Axe`, `Sentry`

Điểm quan trọng nhất là mock-mode có thể chạy ngay bằng dữ liệu local để storefront không phụ thuộc backend, nhưng vẫn giữ MSW handlers cho browser/node contract và test layer.

## 2. Folder Quy Chuẩn

```text
apps/web/src/
  app/
  features/
    auth/
    catalog/
    cart/
    checkout/
    storefront/
  shared/
    api/
    config/
    lib/
    mocks/
    schemas/
    test/
    ui/
```

### Vì sao chia như vậy

- `app/` chỉ giữ route, layout, provider và error/loading boundary.
- `features/` giữ business flow theo domain, không nhét logic theo kiểu kỹ thuật chung chung.
- `shared/` giữ thứ dùng lại toàn app: API client, schema, UI primitive, mock data, helper.

## 3. App Router

### `apps/web/src/app/layout.tsx`

- import global styles
- set metadata cho ecommerce base
- bọc toàn bộ app bằng `AppProviders`
- đặt `lang="vi"` để chuẩn cho nội dung tiếng Việt

### `apps/web/src/app/providers.tsx`

- tạo `QueryClient`
- khởi động MSW browser worker trong `useEffect`
- bọc `AuthProvider`, `ToastProvider`, `ApiClientProvider`, `QueryClientProvider`
- không chặn render bằng boot screen, để app lên ngay và query/mutation tự chạy theo mock mode

### Routes

- `page.tsx`: storefront shell
- `cart/page.tsx`: cart view
- `checkout/page.tsx`: checkout flow có mutation thật
- `account/page.tsx`: auth/session status
- `error.tsx`, `loading.tsx`, `not-found.tsx`: boundary cho App Router

## 4. Data Layer

### `shared/schemas/*`

- `product.ts`: product và SKU contract
- `cart.ts`: cart summary contract
- `checkout.ts`: checkout form và quote
- `user.ts`: user profile contract
- `address.ts`: address contract
- `api.ts`: envelope contract của backend

Tất cả schema đều là nguồn kiểm soát dữ liệu trước khi vào UI.

### `shared/api/client.ts`

- wrapper `fetch` duy nhất cho app
- tự parse envelope response
- tự validate payload bằng Zod
- retry một lần nếu 401 và auth session refresh được token

### `shared/api/query-client.ts`

- default cache policy cho React Query
- global error toast cho query và mutation fail
- giữ retry policy ngắn gọn, phù hợp ecommerce

### `shared/api/query-keys.ts`

- chuẩn hóa key theo domain
- cart mutation invalidate `cart.detail`, `cart.count`, `checkout.quote`

## 5. Auth

### `features/auth/hooks/use-auth.tsx`

- hỗ trợ `mock` và `keycloak`
- trong `mock`, user luôn có session demo để dev không bị nghẽn
- trong `keycloak`, provider init bằng PKCE, lưu snapshot token vào localStorage và refresh định kỳ

### `features/auth/lib/keycloak-client.ts`

- singleton Keycloak instance
- đọc env public một lần
- tránh init nhiều lần trong cùng tab

### `features/auth/lib/keycloak-storage.ts`

- persist snapshot token/refreshToken/idToken/timeSkew
- giúp refresh token không mất khi reload trang

## 6. UI System

### `shared/ui/*`

- `button.tsx`: variant bằng CVA, có loading state
- `input.tsx`: input chuẩn accessibility
- `card.tsx`, `badge.tsx`, `label.tsx`
- `dialog.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `tabs.tsx`
- `toast.tsx` + `toast-store.ts`: toast system toàn app

UI primitive này là nền cho design system sau này. Junior chỉ ghép component, không tự chế class rời rạc.

## 7. Feature Modules

### `features/catalog`

- `useProducts()` đọc catalog
- `useAddToCart()` xử lý mutation và invalidation
- `ProductCard` và `ProductGrid` render sản phẩm theo SKU thật

### `features/cart`

- `useCartSummary()` đọc cart
- `CartSummaryCard` render line item, subtotal, shipping, discount, total

### `features/checkout`

- `CheckoutForm` dùng `react-hook-form` + `zodResolver`
- `CheckoutSummaryCard` hiển thị quote và warning
- `useCheckoutQuote()` và `useSubmitCheckout()` tách read/mutation

### `features/storefront`

- `StorefrontPage` compose toàn bộ landing, tabs, product grid, cart, checkout
- đây là page demo commerce base để team bám theo khi làm flow thật

## 8. Mocking

### `shared/mocks/*`

- `data.ts`: mock products, cart, checkout quote, user
- `state.ts`: in-memory state cho mock mode
- `handlers.ts`: MSW handlers cho browser/node
- `browser.ts`: browser worker bootstrap
- `server.ts`: node server bootstrap

### Quy tắc mock hiện tại

- khi `NEXT_PUBLIC_USE_MSW=true`, hooks đọc local mock state để storefront chạy ngay
- MSW browser worker vẫn được bootstrap trong nền
- Vitest dùng MSW node server

Lý do dùng local mock fallback:

- tránh race khi app mount trước worker
- giữ e2e ổn định
- không chờ backend

## 9. Testing

### Vitest

- `src/shared/lib/format.test.ts`
- `src/shared/schemas/product.test.ts`

### Playwright

- `e2e/login.spec.ts`
- `e2e/checkout.spec.ts`

Playwright smoke chạy với mock mode nên không phụ thuộc backend.

## 10. Production Readiness

### Sentry

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `instrumentation.ts`

### Build / DX

- `next.config.mjs` có bundle analyzer
- `postcss.config.mjs` và `tailwind.config.ts`
- `eslint`, `prettier`, `lint-staged`, `husky`

## 11. Lý Do Thiết Kế Như Vậy

- `React Query` giữ server state và invalidation rõ ràng
- `Zod` chặn payload xấu trước khi UI render
- `Radix` giúp accessibility không phụ thuộc custom widget tự chế
- `MSW` và local mock state giúp FE code độc lập
- `Playwright` chặn hỏng flow kiếm tiền
- `Sentry` giúp biết lỗi nằm ở module nào

## 12. Cách Mở Rộng Tiếp

Khi backend commerce bắt đầu sẵn sàng, thứ tự mở rộng nên là:

1. thật hóa `catalog`
2. thật hóa `cart`
3. thật hóa `checkout`
4. thêm profile/order history
5. thêm promo/flash-sale
6. thêm perf monitoring sâu hơn

Nguyên tắc giữ nguyên:

- UI chỉ hiển thị dữ liệu đã qua validation
- checkout không chốt bằng cache cũ
- invalidation theo domain, không invalidate bừa
- feature-based folder vẫn là chuẩn

