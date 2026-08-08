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

## 2026-07-26 — Hoàn thiện phần 2 cho 34 tỉnh, thành phố

- Đã thay hình bao Việt Nam trên màn chọn hành trình bằng 34 ranh giới tỉnh/thành WGS84 hiện hành, mỗi tỉnh là một SVG path riêng có thể click và điều khiển bằng bàn phím.
- Nguồn GIS là Vietnamese Provinces Database (MIT), dẫn xuất từ Bản đồ tham chiếu các đơn vị hành chính Việt Nam; script `scripts/generate-province-geometry.mjs` tải, chiếu Mercator, làm gọn và sinh tệp TypeScript khoảng 64 KB.
- Bản đồ tô màu ba trạng thái `coming-soon`, `available`, `completed`; tìm kiếm/lọc vùng làm mờ các tỉnh không khớp và vùng chạm tại tâm tỉnh giúp thao tác các tỉnh nhỏ trên mobile.
- Danh mục và bản đồ dùng chung tỉnh đang chọn. Huế có nút bắt đầu/đi lại; 33 tỉnh còn lại hiển thị rõ trạng thái sắp mở thay vì nút vô hiệu không có phản hồi.
- Tiến độ được lưu tại `go-xuyen-viet.progress.v1` trong localStorage, gồm địa điểm đã ghé, thời điểm hoàn thành và kết quả tốt nhất. Reset/chơi lại không xóa thành tích đã lưu.
- `render_game_to_text` của màn chọn nay có đủ 34 trạng thái polygon, tỉnh đang chọn, bộ lọc, số điểm đã ghé và hành trình đã hoàn thành.
- Kiểm tra cuối: lint, typecheck, 32 unit/component test và production build đạt. Web-game client chính thức xác nhận chọn Đà Nẵng; harness Playwright xác nhận desktop/mobile, hoàn thành Huế rồi reload vẫn còn trạng thái, không có console error.

## TODO tiếp theo

- Biên tập dữ liệu địa điểm/tuyến cho các tỉnh tiếp theo và thêm `journeySlug` vào catalog khi đủ nội dung kiểm duyệt.
- Khi Directions API được nối vào từng hành trình, giữ cơ chế progress hiện tại và thay phần hình học tuyến tĩnh bằng tuyến xe chạy thực tế.

## 2026-08-03 - Routing provider foundation

- Added `src/routing` with the async `RoutingProvider` interface, route LineString types, nearest-stop results, and route-geometry results.
- `staticRoutingProvider` uses Haversine distance to choose the nearest unvisited stop, estimates fallback duration at 30 km/h, and returns a LineString from existing `geoPoints` when route data is available.
- The provider falls back to a direct line when no static route is supplied; this is the future fallback layer for Matrix/Directions.
- Added 4 tests covering nearest stop selection, empty candidates, static route slicing between stops, and direct-line fallback.

## TODO next

- Wire the provider into the game loop after a correct place answer: read current coordinates, filter unvisited stops, select nearest, then animate using the returned route geometry.
- After the static flow is stable, add `MapboxRoutingProvider` for Matrix API and Directions API with cache and fallback to `staticRoutingProvider`.

## 2026-08-04 - Small static routing integration slice

- Added `src/routing/routeStep.ts` as the narrow integration layer between journey route data and `staticRoutingProvider`.
- `resolveNextRouteStep` accepts the current stop, visited stop ids, and a route; it filters unvisited stops, asks the provider for the nearest candidate, then returns the selected stop plus route geometry.
- Kept the game reducer and UI unchanged in this slice so the async routing boundary stays outside pure game state.
- Added 3 tests for route-start selection, nearest unvisited selection after the first Hue stop, and the all-stops-visited null case.
- Verified with local Vitest routing tests and TypeScript build mode. `npm` is currently broken on this machine because the global npm CLI path is missing, so commands were run through `node_modules\\.bin`.

## 2026-08-07 - Play layer route step integration

- Connected `resolveNextRouteStep` into the play screen (`VietnamJourneyMap.tsx`) after a stop is completed.
- Passed `currentStop` (and `currentStopId`), `visitedStopIds`, and current `route` to `resolveNextRouteStep`.
- Stored the resolved route step containing `selectedStop` (`to`), `routeGeometry` (`geometry.geometry`), and `provider` into React state.
- Updated `render_game_to_text` to output `nextStopId`, `routingProvider`, and `currentRouteSegment` at top-level and inside `routing`.
- Added unit and integration tests in `src/routing/routeStep.test.ts` and `src/App.test.tsx` proving route step selection after completing a stop.
- All 41 Vitest tests and TypeScript typechecks passed cleanly.

## 2026-08-08 - MapboxRoutingProvider with Matrix API, Directions API, Caching, and Fallback

- Created `src/routing/mapboxRoutingProvider.ts` implementing `RoutingProvider` for Mapbox Directions & Matrix APIs.
- `getNearestUnvisitedStop` queries Mapbox Matrix API (`/directions-matrix/v5/mapbox/driving/...`) to select the closest unvisited stop based on driving distance/duration.
- `getRouteGeometry` queries Mapbox Directions API (`/directions/v5/mapbox/driving/...`) to fetch full GeoJSON driving polyline geometry, distance, and duration.
- Implemented in-memory response caching (`matrixCache` and `directionsCache`) to prevent redundant API calls and optimize quota usage.
- Added graceful automatic fallback: if Mapbox access token is missing, placeholder/invalid, or network/API calls fail, requests fall back seamlessly to `staticRoutingProvider`.
- Integrated `mapboxRoutingProvider` into `VietnamJourneyMap.tsx` and updated `resolveNextRouteStep` to support custom/default providers.
- Added comprehensive unit tests in `src/routing/mapboxRoutingProvider.test.ts` (9 tests) and updated `src/routing/routeStep.test.ts` & `src/App.test.tsx`.
- All 51 Vitest tests, TypeScript typechecks (`tsc --noEmit`), and ESLint passed cleanly without errors.


