declare module "lunar-javascript" {
  class DaYun {
    getIndex(): number;
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getEndAge(): number;
    getGanZhi(): string;
    getXun(): string;
    getXunKong(): string;
  }

  class Yun {
    getGender(): number;
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getStartHour(): number;
    isForward(): boolean;
    getStartSolar(): Solar;
    getDaYun(n?: number): DaYun[];
  }

  class EightChar {
    setSect(value: number): void;
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYun(gender: number, sect?: number): Yun;
  }

  class Solar {
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar;
    getLunar(): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    toYmd(): string;
    toYmdHms(): string;
    nextYear(years: number): Solar;
  }

  class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    getEightChar(): EightChar;
    getSolar(): Solar;
  }

  const lunar: {
    Solar: typeof Solar;
    Lunar: typeof Lunar;
  };

  export default lunar;
}
