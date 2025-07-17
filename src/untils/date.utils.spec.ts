import { isLeapYear, isValidDate } from './date.utils';

describe('DateUtils', () => {
  it('❌ 1900 không phải là năm nhuận', () => {
    expect(isLeapYear(1900)).toBe(false);
  });

  it('❌ Ngày 31/4 là không hợp lệ', () => {
    expect(isValidDate(31, 4, 2024)).toBe(false);
  });

  it('❌ Không cho phép năm âm (negative)', () => {
    expect(isValidDate(1, 1, -2022)).toBe(false);
  });
});
