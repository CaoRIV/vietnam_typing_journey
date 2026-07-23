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
- Sau phản hồi về độ chính xác, đường viền vẽ tay đã được thay bằng GeoJSON Natural Earth 1:10m và SVG path sinh tự động ở thời điểm build.
- Sáu điểm dừng, các waypoint và vị trí hai quần đảo dùng kinh độ/vĩ độ; tất cả được chiếu bằng cùng một phép chiếu Mercator nên tuyến, marker và bản đồ không còn lệch hệ tọa độ.
- Hoàng Sa và Trường Sa được ghi chú như các vị trí địa lý; nguồn dữ liệu và giấy phép được lưu kèm trong dữ liệu sinh tự động.

## TODO

- Không còn TODO trong phạm vi prototype bản đồ GeoJSON.
- Đã kiểm tra trực quan desktop, mobile portrait, mobile landscape và dark mode; nhãn cụm miền Trung được dàn thành callout để không chồng chữ.
- Web-game client xác nhận các mốc 37%, 70%, 100% khớp giữa ảnh và text state; 4 E2E test desktop/mobile đều đạt.
- Đã thêm mô hình viewport cho phép zoom 100%-500%, giới hạn pan trong biên bản đồ và trở về toàn cảnh Việt Nam bằng một nút.
- Điều khiển hỗ trợ nút +/−, kéo chuột hoặc cảm ứng sau khi zoom, double-click, Ctrl + con lăn, phím +/−/0 và phím mũi tên.
- Mức zoom hiển thị theo hệ số 1×-5× để không nhầm với phần trăm tiến độ hành trình.
- 8 unit/component test và 6 E2E test desktop/mobile đã đạt sau khi thêm zoom và pan.
- Đã xây game engine thuần TypeScript với state/action/reducer, chuẩn hóa tiếng Việt, xử lý đúng/sai, backspace, pause/resume, timer, stop split và GameResult version 1.
- Input thật đã thay điều khiển progress thử nghiệm; ký tự đúng làm xe tiến, ký tự sai giữ nguyên vị trí, hoàn thành địa danh tự chuyển sang điểm kế tiếp.
- UI hiển thị thời gian, WPM, accuracy, tiến độ, phản hồi bằng chữ và trạng thái hoàn thành; input có label, focus và cấu hình bàn phím mobile.
- 19 unit/component test và 8 E2E test desktop/mobile đều đạt cho luồng game mới.
- Đã thêm điểm xuất phát ngắn trước Huế và ánh xạ progress theo từng chặng; hoàn thành mỗi địa danh đưa xe dừng đúng marker tương ứng.
- Web-game client đã xác nhận trạng thái gõ sai không làm xe tiến và phản hồi bằng chữ; ảnh playing, completed, mobile và mobile dark mode đã được kiểm tra trực tiếp, không có lỗi console.

## Gợi ý bước tiếp theo

- Triển khai Slice 3: polish vòng chơi, trạng thái hướng dẫn, chuyển cảnh và phản hồi âm thanh/chuyển động.
- Thay dev overlay bằng tùy chọn chỉ bật trong môi trường development khi ra beta.

## 2026-07-23 — Mapbox foundation

- Đã thêm Mapbox GL JS làm lớp render bản đồ tùy chọn qua `VITE_MAPBOX_ACCESS_TOKEN`; token không được ghi vào source hoặc git.
- Đã giữ SVG hiện tại làm fallback tự động khi thiếu token, token mẫu, WebGL hoặc Mapbox không tải được; game engine không phụ thuộc Mapbox.
- Dữ liệu sinh tự động nay giữ cả tọa độ WGS84 và tọa độ SVG để hai renderer dùng cùng một progress.
- Đã thêm lớp tuyến đầy đủ, tuyến đã đi, sáu marker và marker xe cho Mapbox.
- Mapbox được lazy-load thành chunk riêng; người dùng fallback SVG không tải SDK Mapbox ở lần mở trang ban đầu.
- Đã cấu hình Vite worker dạng ES module cho Mapbox GL JS 3.26 và production build đã thành công.
- 21 unit/component test và 8 E2E desktop/mobile đạt; web-game client xác nhận `mapRenderer: svg-fallback` và không có console error khi chưa cấu hình token.
- TODO tiếp theo: thêm dữ liệu địa điểm du lịch của tỉnh thí điểm, sau đó tích hợp Matrix và Directions API.
- Đã loại `mapbox-gl` và `mapbox-gl/esm` khỏi Vite dependency optimizer để worker ESM không bị đổi thành đường dẫn cache `node_modules/.vite/deps/worker.js` không tồn tại.
- Đã sửa xung đột CSS khiến `.mapboxgl-map` ghi đè `position: absolute` và làm container cao 0; Mapbox nay phủ đúng toàn bộ `map-stage`.
- Đã xác nhận token thật tải Mapbox thành công với `mapRenderer: mapbox`; route, marker, xe, zoom/pan hiển thị trên desktop và 8 E2E desktop/mobile đều đạt.

## 2026-07-23 — Prototype tỉnh Huế

- Đã thêm mô hình dữ liệu tỉnh và địa điểm du lịch có kiểu TypeScript riêng, gồm tên, đáp án chấp nhận, tọa độ, mô tả, ảnh, giấy phép ảnh và nguồn nội dung.
- Prototype Huế gồm Đại Nội Huế, Chùa Thiên Mụ, Lăng Khải Định, Lăng Minh Mạng và Đồi Vọng Cảnh.
- Bốn tọa độ trong Quần thể Di tích Cố đô Huế dùng dữ liệu UNESCO; Đồi Vọng Cảnh dùng dữ liệu vị trí công khai và nguồn Khám phá Huế.
- Đã nối năm điểm Huế vào typing engine và Mapbox; Mapbox tự fit camera ở cấp tỉnh.
- Đã sửa cách tính tiến độ cho đáp án thay thế để tên ngắn như `Đại Nội`, `Ứng Lăng` hoặc `Vọng Cảnh` vẫn đưa xe đến đúng marker và kết quả luôn đạt 100%.
- Sau khi gõ đúng, giao diện đánh dấu điểm đã ghé và hiển thị ảnh, mô tả cùng liên kết nguồn.
- Chưa triển khai Matrix API, Directions API hoặc chọn điểm chưa đi gần nhất; đây là phạm vi của bước tiếp theo.
- Kiểm tra cuối đạt: lint, typecheck, 23 unit/component test, production build và 8 E2E test trên desktop/mobile.
- Đã xem trực tiếp ảnh chụp desktop, mobile light/dark và trạng thái hoàn thành; camera, marker, ảnh địa điểm và state hiển thị đồng bộ, không có console error mới.

## 2026-07-23 — Chuyển động xe và camera bám theo

- Marker Mapbox đã đổi từ chấm/mũi tên sang biểu tượng xe máy nhìn từ trên xuống, giữ đúng hướng theo bearing của tuyến.
- Tiến độ gõ và tiến độ hiển thị được tách riêng: mỗi ký tự đúng tạo đích mới, xe nội suy `smoothStep` trong 760 ms và tiếp tục từ vị trí hiện tại nếu người chơi gõ nhanh.
- Tuyến đã đi, tọa độ xe và `render_game_to_text` được cập nhật ở từng frame; state có thêm `targetMapProgress` để kiểm tra trạng thái giữa animation.
- Camera Mapbox `easeTo` đồng bộ với xe và nhìn trước 3,5% tuyến để luôn cho thấy hướng di chuyển tiếp theo; chế độ reduced motion vẫn cập nhật tức thời.
- Đã thêm E2E kiểm tra xe thực sự có trạng thái giữa điểm đầu/đích và camera thay đổi kinh/vĩ độ trên desktop lẫn mobile.
- Kiểm tra cuối đạt: lint, typecheck, 23 unit/component test, production build và 10 E2E desktop/mobile.
- Web-game client chính thức và ảnh desktop/mobile đã được xem trực tiếp; biểu tượng xe rõ, camera theo đúng khu vực xe đang chạy, không có console error mới.

## TODO tiếp theo

- Khi tích hợp Directions API, thay polyline tĩnh bằng GeoJSON đường xe chạy thực tế; animation và camera hiện tại có thể tái sử dụng trực tiếp.
