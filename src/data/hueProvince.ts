import type { GeoCoordinates } from "./centralRoute";

export type ContentSource = {
  label: string;
  url: string;
};

export type PlaceImage = {
  src: string;
  alt: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

export type TourismPlace = {
  id: string;
  name: string;
  acceptedAnswers: readonly string[];
  coordinates: GeoCoordinates;
  shortDescription: string;
  image: PlaceImage;
  contentSources: readonly ContentSource[];
};

export type ProvinceJourney = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  center: GeoCoordinates;
  places: readonly TourismPlace[];
};

const unescoHueSources: readonly ContentSource[] = [
  {
    label: "UNESCO: Quần thể Di tích Cố đô Huế",
    url: "https://whc.unesco.org/en/list/678/",
  },
  {
    label: "UNESCO: bản đồ và tọa độ các hợp phần",
    url: "https://whc.unesco.org/en/list/678/maps/",
  },
];

export const hueProvince: ProvinceJourney = {
  id: "hue-heritage-prototype",
  name: "Hành trình di sản Huế",
  shortName: "Huế",
  description:
    "Năm điểm dừng thử nghiệm kết nối hoàng thành, chùa cổ, lăng vua và cảnh quan sông Hương.",
  center: [107.568, 16.432],
  places: [
    {
      id: "imperial-city-hue",
      name: "Đại Nội Huế",
      acceptedAnswers: [
        "Đại Nội Huế",
        "Đại Nội",
        "Hoàng Thành Huế",
        "Hoàng Thành",
      ],
      coordinates: [107.577778, 16.469444],
      shortDescription:
        "Không gian trung tâm của Kinh thành Huế, gồm Hoàng thành và Tử Cấm thành, từng là nơi thiết triều và sinh hoạt của triều Nguyễn.",
      image: {
        src: "https://commons.wikimedia.org/wiki/Special:FilePath/%C4%90%E1%BA%A1i%20N%E1%BB%99i%2C%20Hu%E1%BA%BF.jpg?width=1200",
        alt: "Kiến trúc Đại Nội Huế nhìn từ sân phía trước",
        author: "Gurval Le Bouter",
        license: "CC BY 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
        sourceUrl:
          "https://commons.wikimedia.org/wiki/File:%C4%90%E1%BA%A1i_N%E1%BB%99i,_Hu%E1%BA%BF.jpg",
      },
      contentSources: unescoHueSources,
    },
    {
      id: "thien-mu-pagoda",
      name: "Chùa Thiên Mụ",
      acceptedAnswers: [
        "Chùa Thiên Mụ",
        "Thiên Mụ",
        "Chùa Linh Mụ",
        "Linh Mụ",
      ],
      coordinates: [107.54455, 16.454631],
      shortDescription:
        "Ngôi chùa cổ bên bờ sông Hương nổi bật với tháp Phước Duyên bảy tầng và là một hợp phần của Quần thể Di tích Cố đô Huế.",
      image: {
        src: "https://commons.wikimedia.org/wiki/Special:FilePath/Thien%20Mu%20Pagoda%2C%20Hue%20%2815250812170%29.jpg?width=1200",
        alt: "Tháp Phước Duyên tại chùa Thiên Mụ",
        author: "Gary Todd",
        license: "CC0 1.0",
        licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
        sourceUrl:
          "https://commons.wikimedia.org/wiki/File:Thien_Mu_Pagoda,_Hue_(15250812170).jpg",
      },
      contentSources: unescoHueSources,
    },
    {
      id: "khai-dinh-tomb",
      name: "Lăng Khải Định",
      acceptedAnswers: ["Lăng Khải Định", "Khải Định", "Ứng Lăng"],
      coordinates: [107.590321, 16.398969],
      shortDescription:
        "Ứng Lăng được xây trên sườn núi Châu Chữ, có quy mô gọn nhưng trang trí dày đặc và kết hợp nhiều ảnh hưởng kiến trúc Việt Nam, Á Đông và châu Âu.",
      image: {
        src: "https://commons.wikimedia.org/wiki/Special:FilePath/Khai%20Dinh%20tomb%20Hue%20%2827767136409%29.jpg?width=1200",
        alt: "Toàn cảnh các bậc thang và công trình tại lăng Khải Định",
        author: "dronepicr",
        license: "CC BY 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
        sourceUrl:
          "https://commons.wikimedia.org/wiki/File:Khai_Dinh_tomb_Hue_(27767136409).jpg",
      },
      contentSources: unescoHueSources,
    },
    {
      id: "minh-mang-tomb",
      name: "Lăng Minh Mạng",
      acceptedAnswers: ["Lăng Minh Mạng", "Minh Mạng", "Hiếu Lăng"],
      coordinates: [107.568876, 16.387733],
      shortDescription:
        "Hiếu Lăng được tổ chức theo một trục cảnh quan cân xứng, nối tiếp sân chầu, hồ nước, cầu và các lớp kiến trúc giữa khu đồi cây.",
      image: {
        src: "https://commons.wikimedia.org/wiki/Special:FilePath/Imperial%20Tomb%20of%20Emperor%20Minh%20Mang%20%2812088218405%29.jpg?width=1200",
        alt: "Hồ nước và kiến trúc tại lăng Minh Mạng",
        author: "Clay Gilliland",
        license: "CC BY-SA 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
        sourceUrl:
          "https://commons.wikimedia.org/wiki/File:Imperial_Tomb_of_Emperor_Minh_Mang_(12088218405).jpg",
      },
      contentSources: unescoHueSources,
    },
    {
      id: "vong-canh-hill",
      name: "Đồi Vọng Cảnh",
      acceptedAnswers: ["Đồi Vọng Cảnh", "Vọng Cảnh"],
      coordinates: [107.56257, 16.42707],
      shortDescription:
        "Điểm ngắm cảnh trên tuyến Huyền Trân Công Chúa, nhìn xuống khúc uốn của sông Hương và dải đồi cây ở phía tây nam trung tâm Huế.",
      image: {
        src: "https://commons.wikimedia.org/wiki/Special:FilePath/Hue%20DoiVongCanh.jpg?width=1200",
        alt: "Sông Hương nhìn từ khu vực đồi Vọng Cảnh",
        author: "Wikimedia Commons contributor",
        license: "Xem giấy phép tại nguồn",
        licenseUrl:
          "https://commons.wikimedia.org/wiki/File:Hue_DoiVongCanh.jpg",
        sourceUrl:
          "https://commons.wikimedia.org/wiki/File:Hue_DoiVongCanh.jpg",
      },
      contentSources: [
        {
          label: "Khám phá Huế: Đồi Vọng Cảnh",
          url: "https://khamphahue.com.vn/en-us/Discover-Hue/Detail/tid/Vong-Canh-Hill.html/pid/17680/cid/464",
        },
        {
          label: "Dữ liệu vị trí Đồi Vọng Cảnh",
          url: "https://mapcarta.com/35928412",
        },
      ],
    },
  ],
};

export const huePlaceById = new Map(
  hueProvince.places.map((place) => [place.id, place]),
);
