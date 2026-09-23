export type Birthplace = {
  id: string;
  label: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: "Asia/Seoul";
  aliases?: string[];
};

export const BIRTHPLACES: Birthplace[] = [
  { id: "seoul", label: "서울", region: "서울특별시", latitude: 37.5665, longitude: 126.978, timezone: "Asia/Seoul", aliases: ["서울시"] },
  { id: "busan", label: "부산", region: "부산광역시", latitude: 35.1796, longitude: 129.0756, timezone: "Asia/Seoul", aliases: ["부산시"] },
  { id: "daegu", label: "대구", region: "대구광역시", latitude: 35.8714, longitude: 128.6014, timezone: "Asia/Seoul", aliases: ["대구시"] },
  { id: "incheon", label: "인천", region: "인천광역시", latitude: 37.4563, longitude: 126.7052, timezone: "Asia/Seoul", aliases: ["인천시"] },
  { id: "gwangju", label: "광주", region: "광주광역시", latitude: 35.1595, longitude: 126.8526, timezone: "Asia/Seoul", aliases: ["광주시"] },
  { id: "daejeon", label: "대전", region: "대전광역시", latitude: 36.3504, longitude: 127.3845, timezone: "Asia/Seoul", aliases: ["대전시"] },
  { id: "ulsan", label: "울산", region: "울산광역시", latitude: 35.5384, longitude: 129.3114, timezone: "Asia/Seoul", aliases: ["울산시"] },
  { id: "sejong", label: "세종", region: "세종특별자치시", latitude: 36.48, longitude: 127.289, timezone: "Asia/Seoul", aliases: ["세종시"] },

  { id: "suwon", label: "수원", region: "경기도", latitude: 37.2636, longitude: 127.0286, timezone: "Asia/Seoul" },
  { id: "seongnam", label: "성남", region: "경기도", latitude: 37.4200, longitude: 127.1265, timezone: "Asia/Seoul" },
  { id: "goyang", label: "고양", region: "경기도", latitude: 37.6584, longitude: 126.8320, timezone: "Asia/Seoul" },
  { id: "yongin", label: "용인", region: "경기도", latitude: 37.2411, longitude: 127.1776, timezone: "Asia/Seoul" },
  { id: "bucheon", label: "부천", region: "경기도", latitude: 37.5034, longitude: 126.7660, timezone: "Asia/Seoul" },
  { id: "ansan", label: "안산", region: "경기도", latitude: 37.3219, longitude: 126.8309, timezone: "Asia/Seoul" },
  { id: "anyang", label: "안양", region: "경기도", latitude: 37.3943, longitude: 126.9568, timezone: "Asia/Seoul" },
  { id: "namyangju", label: "남양주", region: "경기도", latitude: 37.6360, longitude: 127.2165, timezone: "Asia/Seoul" },
  { id: "hwaseong", label: "화성", region: "경기도", latitude: 37.1995, longitude: 126.8312, timezone: "Asia/Seoul" },
  { id: "pyeongtaek", label: "평택", region: "경기도", latitude: 36.9921, longitude: 127.1127, timezone: "Asia/Seoul" },
  { id: "uijeongbu", label: "의정부", region: "경기도", latitude: 37.7381, longitude: 127.0337, timezone: "Asia/Seoul" },

  { id: "chuncheon", label: "춘천", region: "강원특별자치도", latitude: 37.8813, longitude: 127.7298, timezone: "Asia/Seoul" },
  { id: "wonju", label: "원주", region: "강원특별자치도", latitude: 37.3422, longitude: 127.9202, timezone: "Asia/Seoul" },
  { id: "gangneung", label: "강릉", region: "강원특별자치도", latitude: 37.7519, longitude: 128.8761, timezone: "Asia/Seoul" },

  { id: "cheongju", label: "청주", region: "충청북도", latitude: 36.6424, longitude: 127.4890, timezone: "Asia/Seoul" },
  { id: "chungju", label: "충주", region: "충청북도", latitude: 36.9910, longitude: 127.9259, timezone: "Asia/Seoul" },
  { id: "cheonan", label: "천안", region: "충청남도", latitude: 36.8151, longitude: 127.1139, timezone: "Asia/Seoul" },
  { id: "asan", label: "아산", region: "충청남도", latitude: 36.7898, longitude: 127.0018, timezone: "Asia/Seoul" },

  { id: "jeonju", label: "전주", region: "전북특별자치도", latitude: 35.8242, longitude: 127.1480, timezone: "Asia/Seoul" },
  { id: "iksan", label: "익산", region: "전북특별자치도", latitude: 35.9483, longitude: 126.9576, timezone: "Asia/Seoul" },
  { id: "gunsan", label: "군산", region: "전북특별자치도", latitude: 35.9677, longitude: 126.7366, timezone: "Asia/Seoul" },

  { id: "mokpo", label: "목포", region: "전라남도", latitude: 34.8118, longitude: 126.3922, timezone: "Asia/Seoul" },
  { id: "yeosu", label: "여수", region: "전라남도", latitude: 34.7604, longitude: 127.6622, timezone: "Asia/Seoul" },
  { id: "suncheon", label: "순천", region: "전라남도", latitude: 34.9507, longitude: 127.4872, timezone: "Asia/Seoul" },

  { id: "pohang", label: "포항", region: "경상북도", latitude: 36.0190, longitude: 129.3435, timezone: "Asia/Seoul" },
  { id: "gyeongju", label: "경주", region: "경상북도", latitude: 35.8562, longitude: 129.2247, timezone: "Asia/Seoul" },
  { id: "gumi", label: "구미", region: "경상북도", latitude: 36.1195, longitude: 128.3446, timezone: "Asia/Seoul" },
  { id: "andong", label: "안동", region: "경상북도", latitude: 36.5684, longitude: 128.7294, timezone: "Asia/Seoul" },

  { id: "changwon", label: "창원", region: "경상남도", latitude: 35.2281, longitude: 128.6811, timezone: "Asia/Seoul" },
  { id: "gimhae", label: "김해", region: "경상남도", latitude: 35.2285, longitude: 128.8894, timezone: "Asia/Seoul" },
  { id: "jinju", label: "진주", region: "경상남도", latitude: 35.1803, longitude: 128.1076, timezone: "Asia/Seoul" },
  { id: "geoje", label: "거제", region: "경상남도", latitude: 34.8806, longitude: 128.6211, timezone: "Asia/Seoul" },

  { id: "jeju", label: "제주", region: "제주특별자치도", latitude: 33.4996, longitude: 126.5312, timezone: "Asia/Seoul", aliases: ["제주시"] },
  { id: "seogwipo", label: "서귀포", region: "제주특별자치도", latitude: 33.2541, longitude: 126.5601, timezone: "Asia/Seoul" },
];

export function getBirthplace(id: string) {
  return BIRTHPLACES.find((place) => place.id === id) ?? null;
}

export function searchBirthplaces(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return BIRTHPLACES.slice(0, 10);

  return BIRTHPLACES.filter((place) => {
    const haystack = [
      place.label,
      place.region,
      ...(place.aliases ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  }).slice(0, 12);
}
