import { isFutureDate } from './app.features';

describe('AppFeatures', () => {
  it('❌ Không cho phép tạo sự cố y tế trong quá khứ', () => {
    const past = new Date('2000-01-01');
    expect(isFutureDate(past)).toBe(false);
  });
});
