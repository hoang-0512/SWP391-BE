import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  it('✅ Đăng nhập đúng sẽ trả về user', async () => {
    const result = await authService.validateUser('validUser', 'validPass');
    expect(result).toBeDefined();
    expect(result.username).toBe('validUser');
  });

  it('❌ Sai mật khẩu sẽ trả về null', async () => {
    const result = await authService.validateUser('validUser', 'wrongPass');
    expect(result).toBeNull();
  });

  it('❌ Sai username sẽ trả về null', async () => {
    const result = await authService.validateUser('wrongUser', 'any');
    expect(result).toBeNull();
  });
});




