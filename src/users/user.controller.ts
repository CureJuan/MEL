import {
  Body,
  ConflictException,
  Controller,
  Get,
  Logger,
  Param,
  Put,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MailService } from '../mail/mail.service';
import { errorMessages } from '../utils/error-messages.utils';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from './enum/role.enum';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createReadStream } from 'fs';
import { join } from 'path';

@UseGuards(JwtAuthGuard)
@Controller('user')
@ApiTags('User Controller')
export class UserController {
  constructor(
    private userService: UserService,
    private readonly mailService: MailService,
  ) {}

  @UseGuards(RolesGuard) //to actually having protected route for user with matching role
  @Roles(Role.ADMIN) //to provide meta data
  @Get('allActiveSecretariatUsers')
  async getActiveSecretariatUsers() {
    Logger.debug('UsersController.getActiveSecretariatUsers');
    return this.userService.getActiveSecretariatUsers();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @Get('allRequests')
  async viewAllRequests(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('UsersController.viewAllRequests');
    return this.userService.viewAllRequests(
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @Get('approvedUsers')
  async viewApprovedUsers(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('UsersController.viewApprovedUsers');
    return this.userService.viewApprovedUsers(
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiParam({ name: 'userId' })
  @Get('viewUserRequest/:userId')
  async viewUserRequest(@Param('userId') userId: string) {
    Logger.debug('UsersController.viewUSerRequest');
    return this.userService.viewUserRequest(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put('updateNameAndPosition')
  async updateNameAndPosition(@Body() userDto: UpdateUserDto) {
    Logger.debug('UsersController.updateNameAndPosition');
    return this.userService.updateNameAndPosition(userDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put('approveUserRequest')
  async approveUserRequest(@Body() user: any) {
    Logger.debug('UsersController.approveUserRequest', user.email);
    const approvedUser = await this.userService.approveUserRequest(user.email);
    if (approvedUser === null) {
      throw new ConflictException(errorMessages.USER_ALREADY_APPROVED);
    } else {
      const fullName = await this.userService.getFullName(user.email);
      await this.mailService.sendApprovalMail(user.email, fullName);
      return approvedUser;
    }
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put('denyUserRequest')
  async denyUserRequest(@Body() user: any) {
    Logger.debug('UsersController.denyUserRequest');
    const deniedUser = await this.userService.denyUserRequest(user.email);
    if (deniedUser === null) {
      throw new ConflictException(errorMessages.USER_ALREADY_DENIED);
    } else {
      const fullName = await this.userService.getFullName(user.email);
      await this.mailService.sendDenialMail(user.email, fullName, user.reason);
      return deniedUser;
    }
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put('deactivateUser')
  async deactivateUser(@Body() user: any) {
    Logger.debug('UsersController.deactivateUser');
    return this.userService.deactivateUser(user.email);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put('reactivateUser')
  async reactivateUser(@Body() user: any) {
    Logger.debug('UsersController.reactivateUser');
    return this.userService.reactivateUser(user.email);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET, Role.PARTNER, Role.NETWORK)
  @Get('allFocalPersons')
  async allFocalPersons(@Req() request) {
    Logger.debug('UsersController.allFocalPersonsForCapnet');
    return this.userService.getListOfFocalPersons(request.user);
  }

  @Get('getUserProfile')
  async getUserProfile(@Req() request) {
    Logger.debug('UsersController.getUserProfile');
    return this.userService.getUserProfile(request.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CAPNET)
  @Get('allFocalPersonsForCapnet')
  async allFocalPersonsForCapnet(@Req() request) {
    Logger.debug('UsersController.allFocalPersonsForCapnet');
    return this.userService.getListOfFocalPersonsForCapnet(request.user);
  }

  @Get('help')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="Sample Document.pdf"')
  getHelpDocument(): StreamableFile {
    Logger.debug('UsersController.getHelpDocument');
    const file = createReadStream(join(process.cwd(), 'Sample Document.pdf'));
    return new StreamableFile(file);
  }
}
