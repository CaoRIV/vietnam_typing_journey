import type { ProvinceJourney, TourismPlace } from "../journey/types";
import { daNangRoute } from "./daNangRoute";

const daNangTourismSource = {
  label: "Cổng thông tin du lịch thành phố Đà Nẵng",
  url: "https://danangfantasticity.com/kham-pha-thien-nhien-da-nang",
} as const;

export const daNangPlaces: readonly TourismPlace[] = [
  {
    id: "marble-mountains",
    name: "Ngũ Hành Sơn",
    acceptedAnswers: ["Ngũ Hành Sơn", "Núi Ngũ Hành Sơn", "Non Nước"],
    coordinates: [108.265725, 16.005329],
    shortDescription:
      "Quần thể năm ngọn núi đá vôi phía đông nam Đà Nẵng, nổi bật với hang động, chùa cổ và các điểm nhìn ra biển Non Nước.",
    image: {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Marble%20Mountains.jpg?width=1200",
      alt: "Toàn cảnh đồng bằng và bờ biển nhìn từ Ngũ Hành Sơn",
      author: "Chrismiceli",
      license: "CC0 1.0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Marble_Mountains.jpg",
    },
    contentSources: [
      {
        label: "Đà Nẵng Fantasticity: Danh thắng Ngũ Hành Sơn",
        url: "https://danangfantasticity.com/en/kham-pha/danh-thang-ngu-hanh-son-da-nang",
      },
    ],
  },
  {
    id: "linh-ung-pagoda-son-tra",
    name: "Chùa Linh Ứng Sơn Trà",
    acceptedAnswers: [
      "Chùa Linh Ứng Sơn Trà",
      "Chùa Linh Ứng",
      "Linh Ứng Sơn Trà",
      "Linh Ứng",
    ],
    coordinates: [108.277559, 16.099683],
    shortDescription:
      "Ngôi chùa trên bán đảo Sơn Trà tựa lưng vào núi, hướng ra biển và là một trong những điểm đến tâm linh tiêu biểu của Đà Nẵng.",
    image: {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Son-Tra-Peninsula%20Da-Nang%20Vietnam%20Linh-Ung-Pagoda-03.jpg?width=1200",
      alt: "Khuôn viên và kiến trúc Chùa Linh Ứng trên bán đảo Sơn Trà",
      author: "CEphoto, Uwe Aranas",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Son-Tra-Peninsula_Da-Nang_Vietnam_Linh-Ung-Pagoda-03.jpg",
    },
    contentSources: [
      {
        label: "Đà Nẵng Fantasticity: Chùa Linh Ứng - Bãi Bụt",
        url: "https://danangfantasticity.com/en/kham-pha/chua-linh-ung-bai-but-chon-binh-yen-giua-long-da-nang",
      },
    ],
  },
  {
    id: "dragon-bridge-da-nang",
    name: "Cầu Rồng",
    acceptedAnswers: ["Cầu Rồng", "Cầu Rồng Đà Nẵng", "Dragon Bridge"],
    coordinates: [108.229958, 16.061047],
    shortDescription:
      "Cây cầu mang hình rồng bắc qua sông Hàn, kết nối trung tâm thành phố với khu vực ven biển và trở thành biểu tượng hiện đại của Đà Nẵng.",
    image: {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Da%20Nang%20Dragon%20Bridge.jpg?width=1200",
      alt: "Cầu Rồng màu vàng bắc qua sông Hàn tại Đà Nẵng",
      author: "Person-with-No Name",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Da_Nang_Dragon_Bridge.jpg",
    },
    contentSources: [
      {
        label: "Đà Nẵng Fantasticity: Cầu Rồng",
        url: "https://danangfantasticity.com/en/cay-cau-da-nang/cau-rong",
      },
    ],
  },
  {
    id: "museum-of-cham-sculpture",
    name: "Bảo tàng Điêu khắc Chăm",
    acceptedAnswers: [
      "Bảo tàng Điêu khắc Chăm",
      "Bảo tàng Chăm",
      "Bảo tàng Điêu khắc Chăm Đà Nẵng",
    ],
    coordinates: [108.223197, 16.060289],
    shortDescription:
      "Bảo tàng bên sông Hàn lưu giữ và trưng bày bộ sưu tập điêu khắc Chăm Pa, với nhiều hiện vật đến từ Mỹ Sơn, Trà Kiệu và Đồng Dương.",
    image: {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Museum%20of%20Cham%20Sculpture.jpg?width=1200",
      alt: "Tòa nhà Bảo tàng Nghệ thuật Điêu khắc Chăm tại Đà Nẵng",
      author: "Phó Nháy",
      license: "Public domain",
      licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Museum_of_Cham_Sculpture.jpg",
    },
    contentSources: [
      {
        label: "Đà Nẵng Fantasticity: Giá trị bảo tàng trong dòng chảy văn hóa, lịch sử",
        url: "https://danangfantasticity.com/kham-pha/gia-tri-bao-tang-trong-dong-chay-van-hoa-lich-su",
      },
    ],
  },
  {
    id: "son-tra-peninsula",
    name: "Bán đảo Sơn Trà",
    acceptedAnswers: ["Bán đảo Sơn Trà", "Sơn Trà", "Núi Sơn Trà"],
    coordinates: [108.269, 16.118],
    shortDescription:
      "Bán đảo xanh vươn ra biển Đông ở phía đông bắc thành phố, kết hợp rừng, biển, các cung đường ngắm cảnh và môi trường sống của voọc chà vá chân nâu.",
    image: {
      src: "https://commons.wikimedia.org/wiki/Special:FilePath/Ban%20dao%20Son%20Tra.jpg?width=1200",
      alt: "Bán đảo Sơn Trà và vịnh Đà Nẵng nhìn từ trên cao",
      author: "Phó Nháy",
      license: "Public domain",
      licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Ban_dao_Son_Tra.jpg",
    },
    contentSources: [
      {
        label: "Đà Nẵng Fantasticity: Bán đảo Sơn Trà",
        url: "https://danangfantasticity.com/en/khu-bao-ton/ban-dao-son-tra",
      },
      daNangTourismSource,
    ],
  },
];

export const daNangProvince: ProvinceJourney = {
  id: "da-nang-highlights-prototype",
  slug: "da-nang",
  name: "Hành trình Đà Nẵng",
  shortName: "Đà Nẵng",
  description:
    "Năm điểm dừng kết nối danh thắng, di sản Chăm, biểu tượng đô thị và cảnh quan bán đảo Sơn Trà.",
  center: [108.242, 16.065],
  route: daNangRoute,
  places: daNangPlaces,
};
