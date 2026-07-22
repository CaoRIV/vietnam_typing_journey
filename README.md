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

## Dữ liệu bản đồ

Đường biên được lấy từ bộ Natural Earth 1:10m Admin 0 Countries, biến thể góc nhìn Việt Nam, giấy phép public domain. Tệp GeoJSON gốc được rút gọn về đối tượng Việt Nam; sau đó bản đồ, tuyến đường và toàn bộ điểm dừng được chiếu bằng cùng một phép chiếu Mercator ở thời điểm build.

```bash
npm run map:fetch     # tải lại đường biên từ nguồn
npm run map:generate  # tạo SVG path và tọa độ màn hình
```

Tọa độ kinh độ, vĩ độ của tuyến nằm trong `src/data/centralRoute.geo.json`. Không chỉnh tay tệp `src/data/mapGeometry.generated.ts`.

## Điều khiển bản đồ

- Nút `+` và `−`: phóng to hoặc thu nhỏ từ 1× đến 5×.
- Nút hiển thị mức zoom: trở về toàn cảnh Việt Nam.
- Kéo bản đồ sau khi phóng to để xem từng vùng.
- Desktop hỗ trợ double-click, `Ctrl + con lăn`, các phím `+`, `−`, `0` và phím mũi tên.
