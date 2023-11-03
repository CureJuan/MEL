import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Configuration } from '../common/schema/configuration.schema';
import { CapnetUserDTO } from './dto/create-capnetUser.dto';
import { NetworkUserDTO } from './dto/create-networkUser.dto';
import { PartnerUserDTO } from './dto/create-partnerUser.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from './schema/roles.schema';
import { Status } from '../common/schema/status.schema';
import { User } from './schema/user.schema';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { NetworkService } from '../networks/network.service';
import { errorMessages } from '../utils/error-messages.utils';
import { PartnerService } from '../partners/partner.service';
import { ApprovalHierarchy } from '../approvalHierarchy/schema/approvalHierarchy.schema';
import { StatusEnum } from '../common/enum/status.enum';
import { Role } from './enum/role.enum';
import { CapnetEnum } from '../common/enum/capnet.enum';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Status.name) private statusModel: Model<Status>,
    @InjectModel(Roles.name) private rolesModel: Model<Roles>,
    @InjectModel(Configuration.name)
    private configurationModel: Model<Configuration>,
    private readonly networkService: NetworkService,
    private readonly partnerService: PartnerService,
    @InjectModel(ApprovalHierarchy.name)
    private approvalHierarchyModel: Model<ApprovalHierarchy>,
  ) {}

  async onModuleInit() {
    const userExists = await this.checkIfExistingUser(
      'yasmina.rais@cap-net.org',
    );
    if (userExists === true) {
      Logger.debug('Super Admin with this email already exists in database');
    } else {
      const approvedStatusId = await this.getStatusId(StatusEnum.APPROVED);
      const roleId = await this.getRoleId(Role.ADMIN);
      const adminPassword = await bcrypt.hash('Admin@123', 10);
      const user = await this.userModel.create({
        statusId: approvedStatusId,
        roleId: roleId,
        userId: uuidv4(),
        email: 'yasmina.rais@cap-net.org',
        fullName: 'CAPNET Admin',
        password: adminPassword,
        position: 'Admin',
        isActive: true,
        instituteAbbreviation: 'SEC',
        statusName: '',
      });
      Logger.debug(`Admin user created = ${user}`);

      return user;
    }
  }

  async getApprovedUsersId(userId: string) {
    Logger.debug('UsersService.getApprovedUsersId');
    const approvedStatusId = await this.getStatusId(StatusEnum.APPROVED);
    const user = await this.userModel
      .findOne({
        _id: userId,
        statusId: approvedStatusId,
      })
      .exec();
    if (user === null) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }
    return user._id;
  }

  //Get Status Name by StatusId
  async getStatusName(statusId) {
    Logger.debug('UsersService.getStatusName');
    const status = await this.statusModel
      .findOne({
        _id: statusId,
      })
      .exec();
    if (status === null) {
      throw new NotFoundException(errorMessages.STATUS_NOT_FOUND);
    }
    return status.statusName;
  }

  // Get StatusId by StatusName
  async getStatusId(statusName: string) {
    Logger.debug('UsersService.getStatusId');
    const status = await this.statusModel
      .findOne({
        statusName: statusName,
      })
      .exec();
    if (status === null) {
      throw new NotFoundException(errorMessages.STATUS_NOT_FOUND);
    }
    return status._id;
  }

  // Get RoleId by RoleName
  async getRoleId(roleName: string) {
    Logger.debug('UsersService.getRoleId');
    const role = await this.rolesModel
      .findOne({
        roleName: roleName,
      })
      .exec();
    if (role === null) {
      throw new NotFoundException(errorMessages.ROLE_NOT_FOUND);
    }
    return role._id;
  }

  // Get Role Name from RoleId
  async getRoleName(roleId) {
    Logger.debug('UsersService.getRoleName');
    const role = await this.rolesModel
      .findOne({
        _id: roleId,
      })
      .exec();
    if (role === null) {
      throw new NotFoundException(errorMessages.ROLE_NOT_FOUND);
    }
    return role.roleName;
  }

  //Get fullname of user
  async getFullName(email: string) {
    Logger.debug('UsersService.getFullName');
    const user = await this.userModel
      .findOne({
        email: email,
      })
      .exec();
    if (user === null) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }
    return user.fullName;
  }

  // Get Type of user
  async getUserType(networkId, partnerId) {
    Logger.debug('UsersService.getUserType');

    if (partnerId === null && networkId === null) {
      return CapnetEnum.CAPNET;
    } else if (partnerId === null && networkId !== null) {
      return 'Network';
    } else if (partnerId !== null && networkId === null) {
      return 'Partner';
    }
  }

  // Get Active CAPNET Secretariat Users List
  async getActiveSecretariatUsers() {
    try {
      Logger.debug('UsersService.getActiveSecretariatUsers');
      const secretariatUserRole = await this.getRoleId(Role.CAPNET);
      const adminUserRole = await this.getRoleId(Role.ADMIN);
      return this.userModel
        .find({
          roleId: { $in: [secretariatUserRole, adminUserRole] },
          isActive: true,
        })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //Mark user status as verified after confirming email
  async markEmailAsConfirmed(user: User) {
    Logger.debug('UsersService.markEmailAsConfirmed');
    const foundStatusId = await this.getStatusId(StatusEnum.VERIFIED);
    return this.userModel
      .findOneAndUpdate(
        {
          email: user.email,
        },
        {
          statusId: foundStatusId,
        },
        { new: true },
      )
      .exec();
  }

  //update user table with hashed password
  async updateUserPassword(email: string, hashedPassword: string) {
    Logger.debug('UsersService.updateUserPassword');
    const statusId = await this.getStatusId(StatusEnum.APPROVED);
    const user = await this.userModel
      .findOne({
        email: email,
        statusId: statusId,
        // newPwdToken: { $ne: null },
      })
      .exec();

    if (!user) throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    else if (user.isActive === false)
      throw new BadRequestException(
        errorMessages.PASSWORD_FOR_DEACTIVATED_USER,
      );
    else if (user.newPwdToken === null) {
      throw new ConflictException(errorMessages.PASSWORD_DUPLICATE);
    } else {
      return this.userModel
        .findOneAndUpdate(
          {
            email: email,
            statusId: statusId,
          },
          {
            password: hashedPassword,
            newPwdToken: null,
          },
          { new: true },
        )
        .exec();
    }
  }

  async updatePassword(email: string, hashedPassword: string) {
    Logger.debug('UsersService.updatePassword');
    const statusId = await this.getStatusId(StatusEnum.APPROVED);
    const user = await this.userModel
      .findOne({
        email: email,
        statusId: statusId,
        newPwdToken: null,
      })
      .exec();

    if (!user) throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    else if (user.isActive === false)
      throw new BadRequestException(
        errorMessages.PASSWORD_FOR_DEACTIVATED_USER,
      );
    else if (user.forgetPwdToken === null) {
      throw new ConflictException(errorMessages.PASSWORD_DUPLICATE);
    } else {
      return this.userModel
        .findOneAndUpdate(
          {
            email: email,
            statusId: statusId,
          },
          {
            password: hashedPassword,
            forgetPwdToken: null,
          },
          { new: true },
        )
        .exec();
    }
  }

  async commonFunctionForSearchSort(
    searchKeyword: string,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('UsersService.commonFunctionForSearchSort');
    const regex = new RegExp(searchKeyword, 'i');
    sortKey = sortKey.trim().length === 0 ? 'updatedAt' : sortKey;
    const sortQuery = {};
    sortQuery[sortKey] = sortDirection === 1 ? 1 : -1;

    return {
      regex,
      sortQuery,
    };
  }

  // View All Requests
  async viewAllRequests(
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    try {
      Logger.debug('UsersService.viewAllRequests');
      const verifiesStatusId = await this.getStatusId(StatusEnum.VERIFIED);
      const deniedStatusId = await this.getStatusId(StatusEnum.DENIED);
      const { regex, sortQuery } = await this.commonFunctionForSearchSort(
        searchKeyword,
        sortKey,
        sortDirection,
      );
      const userList = await this.userModel
        .find({
          $and: [
            { statusId: { $in: [verifiesStatusId, deniedStatusId] } },
            {
              $or: [{ fullName: regex }, { position: regex }, { email: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();
      const totalUsersCount = await this.userModel
        .find({
          $and: [
            { statusId: { $in: [verifiesStatusId, deniedStatusId] } },
            {
              $or: [{ fullName: regex }, { position: regex }, { email: regex }],
            },
          ],
        })
        .count()
        .exec();
      const users = [];
      const todaysDateTime = new Date().getTime();
      const todaysDate = new Date().toLocaleDateString();
      for (const user of userList) {
        const createdDateTime = new Date(user.createdAt).getTime();
        const createdDate = new Date(user.createdAt).toLocaleDateString();
        const daysCount =
          createdDate === todaysDate
            ? 0
            : Math.round(
                (todaysDateTime - createdDateTime) / (1000 * 3600 * 24),
              );
        const userType = await this.getUserType(user.networkId, user.partnerId);
        users.push({
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          position: user.position,
          status: (
            await this.statusModel.findById({ _id: user.statusId }).exec()
          ).statusName,
          userType,
          daysCount,
        });
      }
      return { usersList: users, total: Math.ceil(totalUsersCount / 10) };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // View All Approved Users
  async viewApprovedUsers(
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    try {
      Logger.debug('UsersService.viewApprovedUsers');
      const approvedStatusId = await this.getStatusId(StatusEnum.APPROVED);
      const admin = await this.getRoleId(Role.ADMIN);
      const { regex, sortQuery } = await this.commonFunctionForSearchSort(
        searchKeyword,
        sortKey,
        sortDirection,
      );
      const usersList = await this.userModel
        .find({
          $and: [
            { statusId: approvedStatusId, roleId: { $ne: admin } },
            {
              $or: [{ fullName: regex }, { position: regex }, { email: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();
      const users = [];
      for (const user of usersList) {
        const temp = {};
        let instituteName;
        if (user.networkId !== null && user.partnerId === null) {
          instituteName = await this.networkService.getNetworkNameById(
            user.networkId,
          );
        } else if (user.networkId === null && user.partnerId !== null) {
          instituteName = await this.partnerService.getPartnerInstituteNameById(
            user.partnerId,
          );
        } else {
          instituteName = CapnetEnum.CAPNET;
        }
        const userType = await this.getUserType(user.networkId, user.partnerId);
        temp['userId'] = user.userId;
        temp['fullName'] = user.fullName;
        temp['email'] = user.email;
        temp['position'] = user.position;
        temp['userType'] = userType;
        temp['isActive'] = user.isActive;
        temp['instituteName'] = instituteName;
        // users = [...users, {...temp}]
        users.push(temp);
      }
      const totalUsersCount = await this.userModel
        .find({
          $and: [
            { statusId: approvedStatusId, roleId: { $ne: admin } },
            {
              $or: [{ fullName: regex }, { position: regex }, { email: regex }],
            },
          ],
        })
        .count()
        .exec();
      return {
        users: users,
        total: Math.ceil(totalUsersCount / 10),
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Checking if the user exists
  async checkIfExistingUser(email: string): Promise<boolean> {
    try {
      Logger.debug('UsersService.checkIfExistingUser');
      const existingUser = await this.userModel
        .findOne({ email: email })
        .exec();
      if (existingUser) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Find user by email id
  async findUserByEmail(email: string) {
    Logger.debug('UsersService.findUserByEmail');
    const user = await this.userModel
      .findOne({
        email: email,
        // isActive:true,
      })
      .exec();
    if (!user) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }
    return user;
  }

  // Get user by userId
  async viewUserRequest(userId: string) {
    Logger.debug('UsersService.viewUserRequest');
    const registeredStatusId = await this.getStatusId(StatusEnum.REGISTERED);
    const userByUserId = await this.userModel
      .findOne({
        userId: userId,
        statusId: { $ne: registeredStatusId },
      })
      .exec();
    if (userByUserId === null) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }
    const role = await this.rolesModel
      .findById({
        _id: userByUserId.roleId,
      })
      .exec();
    const userType = await this.getUserType(
      userByUserId.networkId,
      userByUserId.partnerId,
    );
    return {
      user: {
        fullName: userByUserId.fullName,
        email: userByUserId.email,
        position: userByUserId.position,
        role: role.roleName,
        userType,
      },
    };
  }

  // CAPNET Secretariat Registration
  async registerCapnetSecretariatUser(
    capnetUser: CapnetUserDTO,
  ): Promise<User> {
    Logger.debug('UsersService.registerCapnetSecretariatUser');
    const existingUser = await this.checkIfExistingUser(capnetUser.email);
    if (!existingUser) {
      const registeredStatusId = await this.getStatusId(StatusEnum.REGISTERED);
      const roleId = await this.getRoleId(Role.CAPNET);
      return this.userModel.create({
        ...capnetUser,
        userId: uuidv4(),
        statusId: registeredStatusId,
        roleId: roleId,
        instituteAbbreviation: 'SEC',
      });
    } else {
      Logger.debug(
        `User with email ${capnetUser.email} is already registered.`,
      );
      throw new ConflictException(errorMessages.USER_EMAIL_ALREADY_EXISTS);
    }
  }

  // CAPNET Guest Registration
  async registerCapnetGuestUser(guestUser: CapnetUserDTO): Promise<User> {
    Logger.debug('UsersService.registerCapnetGuestUser');
    const existingUser = await this.checkIfExistingUser(guestUser.email);
    if (!existingUser) {
      const registeredStatusId = await this.getStatusId(StatusEnum.REGISTERED);
      const roleId = await this.getRoleId(Role.GUEST);
      return this.userModel.create({
        ...guestUser,
        userId: uuidv4(),
        statusId: registeredStatusId,
        roleId: roleId,
        instituteAbbreviation: 'SEC',
      });
    } else {
      Logger.debug(`User with email ${guestUser.email} is already registered.`);
      throw new ConflictException(errorMessages.USER_EMAIL_ALREADY_EXISTS);
    }
  }

  // CAPNET Partner Registration
  async registerCapnetPartnerUser(partnerUser: PartnerUserDTO) {
    Logger.debug('UsersService.registerCapnetPartnerUser');
    const existingUser = await this.checkIfExistingUser(partnerUser.email);
    if (!existingUser) {
      const registeredStatusId = await this.getStatusId(StatusEnum.REGISTERED);
      const roleId = await this.getRoleId(Role.PARTNER);
      const partnerExists = await this.partnerService.checkIfPartnerExists(
        partnerUser.partnerId,
      );
      const instituteAbbreviation =
        await this.partnerService.getPartnerAbbreviationById(
          partnerUser.partnerId,
        );
      if (partnerExists) {
        return this.userModel.create({
          ...partnerUser,
          userId: uuidv4(),
          statusId: registeredStatusId,
          roleId: roleId,
          instituteAbbreviation,
        });
      } else {
        throw new NotFoundException(errorMessages.PARTNER_NOT_FOUND);
      }
    } else {
      Logger.debug(
        `User with email ${partnerUser.email} is already registered.`,
      );
      throw new ConflictException(errorMessages.USER_EMAIL_ALREADY_EXISTS);
    }
  }

  // CAPNET Network Registration
  async registerCapnetNetworkUser(networkUser: NetworkUserDTO) {
    Logger.debug('UsersService.registerCapnetNetworkUser');
    const existingUser = await this.checkIfExistingUser(networkUser.email);
    if (!existingUser) {
      const registeredStatusId = await this.getStatusId(StatusEnum.REGISTERED);
      const roleId = await this.getRoleId(Role.NETWORK);
      const networkExists = await this.networkService.checkIfNetworkExists(
        networkUser.networkId,
      );
      const instituteAbbreviation =
        await this.networkService.getNetworkAbbreviationById(
          networkUser.networkId,
        );
      if (networkExists) {
        return this.userModel.create({
          ...networkUser,
          userId: uuidv4(),
          statusId: registeredStatusId,
          roleId: roleId,
          instituteAbbreviation,
        });
      } else {
        throw new NotFoundException(errorMessages.NETWORK_NOT_FOUND);
      }
    } else {
      Logger.debug(
        `User with email ${networkUser.email} is already registered.`,
      );
      throw new ConflictException(errorMessages.USER_EMAIL_ALREADY_EXISTS);
    }
  }

  // Update Name and Position of USer
  async updateNameAndPosition(userDto: UpdateUserDto) {
    Logger.debug('UsersService.updateNameAndPosition', userDto);
    const user = await this.findUserByEmail(userDto.email);
    if (!user) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }
    // const approvedStatusId = await this.getStatusId('StatusEnum.APPROVED');
    const verifiedStatusId = await this.getStatusId(StatusEnum.VERIFIED);
    const updatedUser = await this.userModel
      .findOneAndUpdate(
        {
          email: userDto.email,
          statusId: { $eq: verifiedStatusId },
        },
        userDto,
        { new: true },
      )
      .exec();
    if (updatedUser === null) {
      throw new NotFoundException(errorMessages.USER_ALREADY_APPROVED);
    }
    return updatedUser;
  }

  // Set Pwd token of User
  async updatePwdToken(mail: string, token: string) {
    Logger.debug('UsersService.updatePwdToken');
    const user = await this.findUserByEmail(mail);
    if (!user) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }
    const approvedStatusId = await this.getStatusId(StatusEnum.APPROVED);
    return this.userModel
      .findOneAndUpdate(
        {
          email: mail,
          statusId: approvedStatusId,
        },
        { newPwdToken: token },
        { new: true },
      )
      .exec();
  }

  // Set Pwd token of User for forget password
  async updateForgetPwdToken(mail: string, token: string) {
    Logger.debug('UsersService.updateForgetPwdToken');
    const user = await this.findUserByEmail(mail);
    if (!user) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }
    const approvedStatusId = await this.getStatusId(StatusEnum.APPROVED);
    return this.userModel
      .findOneAndUpdate(
        {
          email: mail,
          statusId: approvedStatusId,
        },
        { forgetPwdToken: token },
        { new: true },
      )
      .exec();
  }

  async getNetworkUsersCount(user: User, approvedStatusId) {
    Logger.debug('UsersService.getNetworkUsersCount');
    const networkUsersCount = await this.userModel
      .find({
        networkId: user.networkId,
        statusId: approvedStatusId,
        isActive: true,
      })
      .count()
      .exec();
    const maxNetworkUsersLimit = await this.configurationModel
      .findOne({
        configurationName: 'MaxNetworkUserLimit',
      })
      .exec();

    return {
      networkUsersCount,
      maxNetworkUsersLimit,
    };
  }

  async getPartnerUsersCount(user: User, approvedStatusId) {
    Logger.debug('UsersService.getPartnerUsersCount');
    const partnerUsersCount = await this.userModel
      .find({
        partnerId: user.partnerId,
        statusId: approvedStatusId,
        isActive: true,
      })
      .count()
      .exec();

    const maxPartnerUsersLimit = await this.configurationModel
      .findOne({
        configurationName: 'MaxPartnerUserLimit',
      })
      .exec();

    return {
      partnerUsersCount,
      maxPartnerUsersLimit,
    };
  }

  // Approve User Request
  async approveUserRequest(email) {
    Logger.debug('UsersService.approveUser');
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }
    const approvedStatusId = await this.getStatusId(StatusEnum.APPROVED);
    const verifiedStatusId = await this.getStatusId(StatusEnum.VERIFIED);

    if (user.networkId !== null && user.partnerId === null) {
      const { networkUsersCount, maxNetworkUsersLimit } =
        await this.getNetworkUsersCount(user, approvedStatusId);

      if (networkUsersCount < maxNetworkUsersLimit.configurationValue) {
        return this.userModel
          .findOneAndUpdate(
            {
              email: user.email,
              statusId: verifiedStatusId,
              isActive: false,
            },
            {
              statusId: approvedStatusId,
              isActive: true,
            },
            { new: true },
          )
          .exec();
      } else {
        throw new BadRequestException(
          errorMessages.USER_PER_NETWORK_LIMIT_EXCEEDED,
        );
      }
    } else if (user.partnerId !== null && user.networkId === null) {
      const { partnerUsersCount, maxPartnerUsersLimit } =
        await this.getPartnerUsersCount(user, approvedStatusId);

      if (partnerUsersCount < maxPartnerUsersLimit.configurationValue) {
        return this.userModel
          .findOneAndUpdate(
            {
              email: user.email,
              statusId: verifiedStatusId,
              isActive: false,
            },
            {
              statusId: approvedStatusId,
              isActive: true,
            },
            { new: true },
          )
          .exec();
      } else {
        throw new BadRequestException(
          errorMessages.USER_PER_PARTNER_LIMIT_EXCEEDED,
        );
      }
    }

    return this.userModel
      .findOneAndUpdate(
        {
          email: user.email,
          statusId: verifiedStatusId,
          isActive: false,
        },
        {
          statusId: approvedStatusId,
          isActive: true,
        },
        { new: true },
      )
      .exec();
  }

  // Deny User Request
  async denyUserRequest(email: string) {
    Logger.debug('UsersService.denyUserRequest');
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }
    const deniedStatusId = await this.getStatusId(StatusEnum.DENIED);
    const verifiedStatusId = await this.getStatusId(StatusEnum.VERIFIED);
    return this.userModel
      .findOneAndUpdate(
        {
          email: user.email,
          statusId: verifiedStatusId,
          isActive: false,
        },
        {
          statusId: deniedStatusId,
        },
        { new: true },
      )
      .exec();
  }

  // Deactivate User
  async deactivateUser(email: string) {
    Logger.debug('UsersService.deactivateUser');
    const user = await this.findUserByEmail(email);
    const approvedStatusId = await this.getStatusId(StatusEnum.APPROVED);
    if (!user) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }

    const approvalHierarchyUser = await this.approvalHierarchyModel
      .findOne({ userId: user._id })
      .exec();

    if (approvalHierarchyUser !== null) {
      throw new UnprocessableEntityException(
        errorMessages.CANNOT_DEACTIVATE_USER,
      );
    }

    const deactivateUser = await this.userModel
      .findOneAndUpdate(
        {
          email: user.email,
          statusId: approvedStatusId,
          isActive: true,
        },
        { isActive: false },
        { new: true },
      )
      .exec();
    if (deactivateUser === null) {
      return {
        message: 'User is already deactivated.',
      };
    } else {
      return deactivateUser;
    }
  }

  // Reactivate User
  async reactivateUser(email: string) {
    Logger.debug('UsersService.reactivateUser');
    const user = await this.findUserByEmail(email);
    const approvedStatusId = await this.getStatusId(StatusEnum.APPROVED);
    if (!user) {
      throw new NotFoundException(errorMessages.USER_NOT_FOUND);
    }

    if (user.networkId !== null && user.partnerId === null) {
      const { networkUsersCount, maxNetworkUsersLimit } =
        await this.getNetworkUsersCount(user, approvedStatusId);

      if (networkUsersCount < maxNetworkUsersLimit.configurationValue) {
        return this.userModel
          .findOneAndUpdate(
            {
              email: user.email,
              statusId: approvedStatusId,
              isActive: false,
            },
            { isActive: true },
            { new: true },
          )
          .exec();
      } else {
        throw new BadRequestException(
          errorMessages.USER_PER_NETWORK_LIMIT_EXCEEDED,
        );
      }
    } else if (user.partnerId !== null && user.networkId === null) {
      const { partnerUsersCount, maxPartnerUsersLimit } =
        await this.getPartnerUsersCount(user, approvedStatusId);

      if (partnerUsersCount < maxPartnerUsersLimit.configurationValue) {
        return this.userModel
          .findOneAndUpdate(
            {
              email: user.email,
              statusId: approvedStatusId,
              isActive: false,
            },
            { isActive: true },
            { new: true },
          )
          .exec();
      } else {
        throw new BadRequestException(
          errorMessages.USER_PER_PARTNER_LIMIT_EXCEEDED,
        );
      }
    }

    return this.userModel
      .findOneAndUpdate(
        {
          email: user.email,
          statusId: approvedStatusId,
          isActive: false,
        },
        { isActive: true },
        { new: true },
      )
      .exec();
  }

  async getById(id: string) {
    Logger.debug('UsersService.getById');

    const user = await this.userModel.findOne({ userId: id }).exec();
    if (user) {
      return user;
    }
    throw new NotFoundException(errorMessages.USER_NOT_FOUND);
  }

  async getUser(id) {
    Logger.debug('UsersService.getUser');
    const user = await this.userModel.findOne({ _id: id }).exec();
    if (user) {
      return user;
    }
    throw new NotFoundException(errorMessages.USER_NOT_FOUND);
  }

  async getListOfUsersByInstituteId(roleId: any) {
    Logger.debug('UsersService.getListOfUsersByInstituteId');
    Logger.verbose(roleId);
  }

  async getListOfFocalPersons(user: User) {
    Logger.debug('UsersService.getListOfFocalPersons');
    try {
      let userInstituteId;
      if (user.networkId === null && user.partnerId === null)
        return this.getActiveSecretariatUsers();
      else if (user.networkId) {
        userInstituteId = user.networkId;
        return this.userModel
          .find({
            networkId: userInstituteId,
            isActive: true,
          })
          .exec();
      } else if (user.partnerId) {
        userInstituteId = user.partnerId;

        return this.userModel
          .find({
            partnerId: userInstituteId,
            isActive: true,
          })
          .exec();
      }
    } catch (error) {
      Logger.log('error in getListOfFocalPersons');
      Logger.debug(error);
      throw new InternalServerErrorException();
    }
  }

  async getListOfFocalPersonsForCapnet(user: User) {
    Logger.debug('UsersService.getListOfFocalPersonsForCapnet');
    try {
      if (user.networkId === null && user.partnerId === null)
        return this.userModel
          .find({
            isActive: true,
          })
          .exec();
    } catch (error) {
      Logger.log('error in getListOfFocalPersons');
      Logger.debug(error);
      throw new InternalServerErrorException();
    }
  }

  async getUserProfile(user: any) {
    Logger.debug('UsersService.viewUserRequest');
    const userDetails = await this.userModel
      .findOne({
        userId: user.userId,
      })
      .exec();
    let instituteName;
    if (user.networkId !== null && user.partnerId === null) {
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
    } else if (user.networkId === null && user.partnerId !== null) {
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
    } else {
      instituteName = CapnetEnum.CAPNET;
    }
    return {
      name: userDetails.fullName,
      email: userDetails.email,
      instituteName,
      position: userDetails.position,
    };
  }
}

interface RequestWithUser extends Request {
  user: User;
}

export default RequestWithUser;
