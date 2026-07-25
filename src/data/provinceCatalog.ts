export type ProvinceRegion = "north" | "central" | "south";

export type ProvinceCatalogEntry = {
  code: string;
  slug: string;
  name: string;
  region: ProvinceRegion;
  journeySlug?: string;
};

export const provinceRegions: readonly {
  id: ProvinceRegion;
  name: string;
}[] = [
  { id: "north", name: "Miền Bắc" },
  { id: "central", name: "Miền Trung" },
  { id: "south", name: "Miền Nam" },
];

export const provinceCatalog: readonly ProvinceCatalogEntry[] = [
  { code: "01", slug: "ha-noi", name: "Hà Nội", region: "north" },
  { code: "04", slug: "cao-bang", name: "Cao Bằng", region: "north" },
  { code: "08", slug: "tuyen-quang", name: "Tuyên Quang", region: "north" },
  { code: "11", slug: "dien-bien", name: "Điện Biên", region: "north" },
  { code: "12", slug: "lai-chau", name: "Lai Châu", region: "north" },
  { code: "14", slug: "son-la", name: "Sơn La", region: "north" },
  { code: "15", slug: "lao-cai", name: "Lào Cai", region: "north" },
  { code: "19", slug: "thai-nguyen", name: "Thái Nguyên", region: "north" },
  { code: "20", slug: "lang-son", name: "Lạng Sơn", region: "north" },
  { code: "22", slug: "quang-ninh", name: "Quảng Ninh", region: "north" },
  { code: "24", slug: "bac-ninh", name: "Bắc Ninh", region: "north" },
  { code: "25", slug: "phu-tho", name: "Phú Thọ", region: "north" },
  { code: "31", slug: "hai-phong", name: "Hải Phòng", region: "north" },
  { code: "33", slug: "hung-yen", name: "Hưng Yên", region: "north" },
  { code: "37", slug: "ninh-binh", name: "Ninh Bình", region: "north" },
  { code: "38", slug: "thanh-hoa", name: "Thanh Hóa", region: "central" },
  { code: "40", slug: "nghe-an", name: "Nghệ An", region: "central" },
  { code: "42", slug: "ha-tinh", name: "Hà Tĩnh", region: "central" },
  { code: "44", slug: "quang-tri", name: "Quảng Trị", region: "central" },
  {
    code: "46",
    slug: "hue",
    name: "Huế",
    region: "central",
    journeySlug: "hue",
  },
  { code: "48", slug: "da-nang", name: "Đà Nẵng", region: "central" },
  { code: "51", slug: "quang-ngai", name: "Quảng Ngãi", region: "central" },
  { code: "52", slug: "gia-lai", name: "Gia Lai", region: "central" },
  { code: "56", slug: "khanh-hoa", name: "Khánh Hòa", region: "central" },
  { code: "66", slug: "dak-lak", name: "Đắk Lắk", region: "central" },
  { code: "68", slug: "lam-dong", name: "Lâm Đồng", region: "central" },
  { code: "75", slug: "dong-nai", name: "Đồng Nai", region: "south" },
  {
    code: "79",
    slug: "ho-chi-minh",
    name: "TP. Hồ Chí Minh",
    region: "south",
  },
  { code: "80", slug: "tay-ninh", name: "Tây Ninh", region: "south" },
  { code: "82", slug: "dong-thap", name: "Đồng Tháp", region: "south" },
  { code: "86", slug: "vinh-long", name: "Vĩnh Long", region: "south" },
  { code: "91", slug: "an-giang", name: "An Giang", region: "south" },
  { code: "92", slug: "can-tho", name: "Cần Thơ", region: "south" },
  { code: "96", slug: "ca-mau", name: "Cà Mau", region: "south" },
];
