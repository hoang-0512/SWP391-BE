import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async validateUser(username: string, password: string): Promise<any> {
    if (username === 'validUser' && password === 'validPass') {
      return { username, role: 'parent' };
    }
    return null;
  }
}
