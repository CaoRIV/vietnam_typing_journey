Original prompt: làm phần 2: Làm prototype bản đồ. Vẽ bản đồ Việt Nam bằng SVG. Tạo tuyến miền Trung thử nghiệm gồm 6 điểm: Huế → Hải Vân → Đà Nẵng → Hội An → Mỹ Sơn → Nha Trang. Đặt các điểm dừng và đường đi. Cho xe di chuyển từ progress 0 đến 1. Kiểm tra trên desktop và mobile.

## 2026-07-22

- Đã đọc yêu cầu Slice 1 trong `plan.md` và audit nền tảng Vite + React + TypeScript + Tailwind hiện tại.
- Quyết định dùng SVG nội tuyến cho bản đồ, dữ liệu tuyến tách riêng và phép nội suy theo chiều dài polyline để xe bám chính xác progress 0 đến 1.
- Sẽ cung cấp `window.render_game_to_text`, `window.advanceTime(ms)` và `window.setJourneyProgress(value)` cho vòng kiểm thử deterministic.
- Đã thêm dữ liệu tuyến tách riêng, nội suy hình học có unit test và màn prototype SVG responsive.
- Xe cập nhật trực tiếp bằng SVG transform; trạng thái React chỉ đổi khi qua mốc hoặc hoàn tất.
- Web-game client đã xác nhận ba mốc chuyển động 37%, 70%, 100%; ảnh và text state đồng bộ, không có console error.
- E2E đã đạt trên desktop và mobile; ảnh portrait, landscape, dark mode và reduced motion đã được xem trực tiếp.
- Vòng bàn giao cuối đạt: lint, typecheck, 4 unit/component test, build và 4 E2E test đều thành công.

## TODO

- Không còn TODO trong phạm vi prototype bản đồ.

## Gợi ý bước tiếp theo

- Kết nối progress với số ký tự gõ đúng trong game engine ở Slice 2.
- Thay dev overlay bằng tùy chọn chỉ bật trong môi trường development khi ra beta.
