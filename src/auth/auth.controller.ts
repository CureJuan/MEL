import {
  Body,
  Controller,
  Post,
  Logger,
  Put,
  UseGuards,
  Req,
  Res,
  Get,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import RequestWithUser, { UserService } from '../users/user.service';
import { MailService } from '../mail/mail.service';
import { CapnetUserDTO } from '../users/dto/create-capnetUser.dto';
import { User } from '../users/schema/user.schema';
import { PartnerUserDTO } from '../users/dto/create-partnerUser.dto';
import { NetworkUserDTO } from '../users/dto/create-networkUser.dto';
import ConfirmEmailDto from '../mail/dto/confirmEmail.dto';
import SetPasswordDto from './dto/setPassword.dto';
import { LocalAuthenticationGuard } from './guards/localAuthentication.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response as res } from 'express';
import { errorMessages } from '../utils/error-messages.utils';
import LogInDto from './dto/logIn.dto';
import { ApiTags } from '@nestjs/swagger';
import { NetworkService } from '../networks/network.service';
import { PartnerService } from '../partners/partner.service';

@Controller('auth')
@ApiTags('Auth Controller')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly emailConfirmationService: MailService,
    private readonly authService: AuthService,
    private readonly networkService: NetworkService,
    private readonly partnerService: PartnerService,
  ) {}
  @Post('registerCapnet')
  async registerCapnetSecretariatUser(@Body() capnetUser: CapnetUserDTO) {
    Logger.debug('AuthController.registerCapnetSecretariatUser');
    const user = await this.userService.registerCapnetSecretariatUser(
      capnetUser,
    );
    await this.emailConfirmationService.sendVerificationLink(capnetUser.email);
    return user;
  }

  @Post('registerGuest')
  async registerCapnetGuestUser(
    @Body() guestUser: CapnetUserDTO,
  ): Promise<User> {
    Logger.debug('AuthController.registerCapnetGuestUser');
    const user = await this.userService.registerCapnetGuestUser(guestUser);
    await this.emailConfirmationService.sendVerificationLink(guestUser.email);
    return user;
  }

  @Post('registerPartner')
  async registerCapnetPartnerUser(
    @Body() partnerUser: PartnerUserDTO,
  ): Promise<User> {
    Logger.debug('AuthController.registerCapnetPartnerUser');
    const user = await this.userService.registerCapnetPartnerUser(partnerUser);
    await this.emailConfirmationService.sendVerificationLink(partnerUser.email);
    return user;
  }

  @Post('registerNetwork')
  async registerCapnetNetworkUser(@Body() networkUser: NetworkUserDTO) {
    Logger.debug('AuthController.registerCapnetNetworkUser');
    const user = await this.userService.registerCapnetNetworkUser(networkUser);
    await this.emailConfirmationService.sendVerificationLink(networkUser.email);
    return user;
  }

  @Post('regenerateLinkOnTokenExpiration')
  async regenerateLinkOnTokenExpiration(@Body() user: any) {
    Logger.debug('AuthController.regenerateLinkOnTokenExpiration');
    await this.emailConfirmationService.sendVerificationLink(user.email);
  }

  @Post('confirmEmail')
  async confirm(@Body() confirmationData: ConfirmEmailDto) {
    Logger.debug('AuthController.confirm');
    const email = await this.emailConfirmationService.decodeConfirmationToken(
      confirmationData.token,
    );
    return this.emailConfirmationService.confirmEmail(email);
  }

  @Put('setupPassword')
  async setupPassword(@Body() setPasswordDto: SetPasswordDto) {
    Logger.debug('AuthController.setupPassword');
    const email = await this.emailConfirmationService.decodePasswordSetupToken(
      setPasswordDto.token,
    );
    return this.authService.setupPassword(email, setPasswordDto.password);
  }

  @Put('setupPasswordAfterForgot')
  async setupPasswordAfterForgot(@Body() setPasswordDto: SetPasswordDto) {
    Logger.debug('AuthController.setupPasswordAfterForgot');
    const email = await this.emailConfirmationService.decodePasswordSetupToken(
      setPasswordDto.token,
    );
    return this.authService.setupPasswordAfterForgot(
      email,
      setPasswordDto.password,
    );
  }

  @Put('forgetPassword')
  async forgetPassword(@Body() data: any) {
    Logger.debug('AuthController.forgetPassword');
    Logger.verbose(data.email);
    //check user in DB with this email and isActive = true
    const existingUser = await this.userService.findUserByEmail(data.email);
    if (!existingUser)
      throw new NotFoundException(
        `User with email ${data.email} does not exist.`,
      );
    else if (existingUser && existingUser.isActive === false)
      throw new UnprocessableEntityException(errorMessages.ACCOUNT_SUSPENDED);
    else {
      await this.emailConfirmationService.sendForgotPasswordMail(
        existingUser.email,
        existingUser.fullName,
      );
    }
  }

  @Put('setupNewPassword')
  async setupNewPassword(@Body() setPasswordDto: SetPasswordDto) {
    Logger.debug('AuthController.setupNewPassword');
    const email = await this.emailConfirmationService.decodePasswordSetupToken(
      setPasswordDto.token,
    );
    return this.authService.setupNewPassword(email, setPasswordDto.password);
  }

  async getAbbreviation(user) {
    Logger.debug('AuthController.getAbbreviation');
    if (user.networkId === null && user.partnerId === null)
      user.instituteAbbreviation = 'SEC';
    else if (user.networkId !== null && user.partnerId === null)
      user.instituteAbbreviation =
        await this.networkService.getNetworkAbbreviationById(user.networkId);
    else if (user.partnerId !== null && user.networkId === null)
      user.instituteAbbreviation =
        await this.partnerService.getPartnerAbbreviationById(user.partnerId);
    return user;
  }

  @UseGuards(LocalAuthenticationGuard)
  @Post('logIn')
  async logIn(
    @Body() userDetail: LogInDto,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: res,
  ) {
    Logger.debug('AuthController.logIn');
    const { user } = request;
    const token = this.authService.getCookieWithJwtToken(user.userId);
    response.cookie('access-token', token, {
      expires: new Date(new Date().getTime() + 30 * 60 * 1000),
      httpOnly: true,
      signed: true,
    });
   
    const roleName = await this.userService.getRoleName(user.roleId);
    user.roleName = roleName;
    user.password = undefined;
    await this.getAbbreviation(user);

    return {
      message: 'Login successfully!',
      statusCode: 200,
      userData: user,
    };
  }

  // @UseGuards(JwtAuthGuard)
  // @Post('logOut')
  // async logOut(@Req() request: RequestWithUser, @Res() response: res) {
  //   Logger.debug('AuthController.logOut');
  //   response.setHeader('Set-Cookie', this.authService.getCookieForLogOut());
  //   return response.sendStatus(200);
  // }
  @UseGuards(JwtAuthGuard)
  @Post('logOut')
  async logOut(@Req() request: RequestWithUser, @Res() response: res) {
    Logger.debug('AuthController.logOut');
    response.cookie('access-token', null, { expires: new Date() });
    return response.status(200).send({
      message: 'Logged out successfully!',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async authenticate(@Req() request: RequestWithUser) {
    Logger.debug('AuthController.authenticate');
    const user = request.user;
    const roleName = await this.userService.getRoleName(user.roleId);
    user.roleName = roleName;
    user.password = undefined;
    await this.getAbbreviation(user);
    return user;
  }
}
