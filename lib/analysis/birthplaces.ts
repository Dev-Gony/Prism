export type Birthplace = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  timezone: "Asia/Seoul";
};

export const BIRTHPLACES: Birthplace[] = [
  { id: "seoul", label: "서울", latitude: 37.5665, longitude: 126.978, timezone: "Asia/Seoul" },
  { id: "busan", label: "부산", latitude: 35.1796, longitude: 129.0756, timezone: "Asia/Seoul" },
  { id: "daegu", label: "대구", latitude: 35.8714, longitude: 128.6014, timezone: "Asia/Seoul" },
  { id: "incheon", label: "인천", latitude: 37.4563, longitude: 126.7052, timezone: "Asia/Seoul" },
  { id: "gwangju", label: "광주", latitude: 35.1595, longitude: 126.8526, timezone: "Asia/Seoul" },
  { id: "daejeon", label: "대전", latitude: 36.3504, longitude: 127.3845, timezone: "Asia/Seoul" },
  { id: "ulsan", label: "울산", latitude: 35.5384, longitude: 129.3114, timezone: "Asia/Seoul" },
  { id: "sejong", label: "세종", latitude: 36.48, longitude: 127.289, timezone: "Asia/Seoul" },
  { id: "suwon", label: "수원", latitude: 37.2636, longitude: 127.0286, timezone: "Asia/Seoul" },
  { id: "jeju", label: "제주", latitude: 33.4996, longitude: 126.5312, timezone: "Asia/Seoul" },
];

export function getBirthplace(id: string) {
  return BIRTHPLACES.find((place) => place.id === id) ?? null;
}
