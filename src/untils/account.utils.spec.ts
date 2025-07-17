import {
  isPasswordNotEmpty,
  isPasswordValid,
  isUsernameCaseSensitive,
  isValidDateFormat
} from './account.utils';

describe('AccountUtils', () => {
  it('❌ Không cho phép mật khẩu rỗng', () => {
    expect(isPasswordNotEmpty("")).toBe(false);
  });

  it('❌ Không cho phép mật khẩu ngắn hơn 6 ký tự', () => {
    expect(isPasswordValid("abc")).toBe(false);
  });

  it('✅ Phát hiện tên tài khoản có phân biệt chữ hoa/thường', () => {
    expect(isUsernameCaseSensitive("User123")).toBe(true);
  });

  it('❌ Nhận dạng ngày sai định dạng là không hợp lệ', () => {
    expect(isValidDateFormat("abc")).toBe(false);
  });
});
