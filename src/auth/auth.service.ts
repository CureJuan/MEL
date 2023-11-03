import {
  BadRequestException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { errorMessages } from '../utils/error-messages.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public getCookieWithJwtToken(userId: string) {
    Logger.debug('AuthService.getCookieWithJwtToken');
    const payload: TokenPayload = { userId };
    return this.jwtService.sign(payload);
  }

  async setupPassword(email: string, password: string) {
    Logger.debug('AuthService.setupPassword');
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userService.updateUserPassword(email, hashedPassword);
  }
  async setupPasswordAfterForgot(email: string, password: string) {
    Logger.debug('AuthService.setupPassword');
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userService.updatePassword(email, hashedPassword);
  }

  async setupNewPassword(email: string, password: string) {
    Logger.debug('AuthService.setupNewPassword');
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userService.updatePassword(email, hashedPassword);
  }

  public async getAuthenticatedUser(email: string, plainTextPassword: string) {
    // try {
    Logger.debug('AuthService.getAuthenticatedUser');
    const user = await this.userService.findUserByEmail(email);
    if (user.isActive === false)
      throw new UnprocessableEntityException(errorMessages.ACCOUNT_SUSPENDED);
    await this.verifyPassword(plainTextPassword, user.password);
    user.password = undefined;
    return user;
    // } catch (error) {
    // throw new BadRequestException(errorMessages.WRONG_CREDENTIALS);
    // }
  }

  private async verifyPassword(
    plainTextPassword: string,
    hashedPassword: string,
  ) {
    Logger.debug('AuthService.verifyPassword');

    const isPasswordMatching = await bcrypt.compare(
      plainTextPassword,
      hashedPassword,
    );
    if (!isPasswordMatching) {
      throw new BadRequestException(errorMessages.WRONG_CREDENTIALS);
    }
  }

  public getCookieForLogOut() {
    Logger.debug('AuthService.getCookieForLogOut');
    return `Authentication=; HttpOnly; Path=/; Max-Age=0`;
  }
}

export interface TokenPayload {
  userId: string;
}
