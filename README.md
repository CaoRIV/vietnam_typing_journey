# Gõ Xuyên Việt

Web game luyện gõ với bản đồ Việt Nam cách điệu. Mỗi ký tự đúng sẽ đưa phương tiện tiến thêm trên hành trình.

## Nền tảng

- Vite
- React và TypeScript
- Tailwind CSS 4
- Vitest và Playwright

## Yêu cầu

- Node.js 22 trở lên
- npm 10 trở lên

## Chạy dự án

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`.

## Kiểm tra chất lượng

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Chạy toàn bộ kiểm tra không bao gồm E2E:

```bash
npm run check
```

Nếu Playwright chưa có Chromium:

```bash
npx playwright install chromium
```

## Cấu trúc hiện tại

```text
src/App.tsx       Giao diện gốc
src/main.tsx      Điểm khởi động React
src/index.css     Tailwind và design tokens
src/test/         Thiết lập unit test
tests/e2e/        Playwright tests
public/maps/      Bản đồ và đường SVG
public/sounds/    Hiệu ứng âm thanh
public/stamps/    Dấu mộc địa danh
public/vehicles/  Hình phương tiện
```

## Design tokens

Các token màu, font và radius được định nghĩa trong `src/index.css`. Theme sáng và tối theo thiết lập hệ điều hành. Be Vietnam Pro và JetBrains Mono được đóng gói cục bộ qua Fontsource.
