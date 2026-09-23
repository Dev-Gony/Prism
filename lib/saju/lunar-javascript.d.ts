declare module "lunar-javascript" {
  class EightChar {
    setSect(value: number): void;
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
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
