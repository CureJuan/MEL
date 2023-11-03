import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { errorMessages } from 'src/utils/error-messages.utils';
import { UserService } from '../users/user.service';

@Injectable()
export class MailService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly userService: UserService,
  ) {}

  public async sendVerificationLink(email: string) {
    Logger.debug('MailService.sendVerificationLink');
    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_VERIFICATION_TOKEN_EXPIRATION_TIME',
      )}s`,
    });
    const name = await this.userService.getFullName(email);
    const url = `${this.configService.get(
      'EMAIL_CONFIRMATION_URL',
    )}/emailVerification?token=${token}`;
    try {
      Logger.debug('MailService.sendVerificationLink.try');
      return await this.mailerService.sendMail({
        to: email,
        subject: 'Email confirmation',
        template: './emailVerification',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          link: url,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  public async sendApprovalMail(email: string, name: string) {
    Logger.debug('MailService.sendApprovalMail');
    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_PASSWORD_SETUP_TOKEN_SECRET'),
    });
    await this.userService.updatePwdToken(email, token);
    const url = `${this.configService.get(
      'PASSWORD_SETUP_URL',
    )}/setPassword?token=${token}`;
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome Aboard!',
        template: './requestApproval',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          link: url,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  public async sendDenialMail(email: string, name: string, reason: string) {
    Logger.debug('MailService.sendDenialMail');
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: 'Your request is not approved',
        template: './requestDenial',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          reason: reason.trim().length === 0 ? 'Not Mentioned' : reason.trim(),
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  public async confirmEmail(email: string) {
    Logger.debug('MailService.confirmEmail');
    const user = await this.userService.findUserByEmail(email);
    if (user) {
      const statusName = await this.userService.getStatusName(user.statusId);
      if (statusName === 'Registered')
        return this.userService.markEmailAsConfirmed(user);
      else throw new BadRequestException(errorMessages.EMAIL_ALREADY_VERIFIED);
    } else {
      throw new InternalServerErrorException('Something went wrong.');
    }
  }

  public async decodeConfirmationToken(token: string) {
    Logger.debug('MailService.decodeConfirmationToken');

    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
      });

      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }
      throw new BadRequestException();
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException(
          errorMessages.EMAIL_CONFIRMATION_TOKEN_EXPIRED,
        );
      }
      throw new BadRequestException(errorMessages.BAD_CONFIRMATION_TOKEN);
    }
  }

  public async decodePasswordSetupToken(token: string) {
    Logger.debug('MailService.decodePasswordSetupToken');

    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_PASSWORD_SETUP_TOKEN_SECRET'),
      });

      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }
      throw new BadRequestException();
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException(
          errorMessages.EMAIL_CONFIRMATION_TOKEN_EXPIRED,
        );
      }
      throw new BadRequestException(errorMessages.BAD_CONFIRMATION_TOKEN);
    }
  }

  public async sendForgotPasswordMail(email: string, name: string) {
    Logger.debug('MailService.sendForgotPasswordMail');

    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_PASSWORD_SETUP_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_PASSWORD_SETUP_TOKEN_EXPIRATION_TIME',
      )}s`,
    });
    await this.userService.updateForgetPwdToken(email, token);
    const url = `${this.configService.get(
      'PASSWORD_SETUP_URL',
    )}/setupPasswordAfterForgot?token=${token}`;
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: 'Set up your password!',
        template: './setupPassword',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          link: url,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  public async sendMelpApprovalHierarchyMail(
    email: string,
    name: string,
    level: number,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: 'You are added to the MELP approvers group!',
        template: './approvalHierarchyMelp',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          level,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  public async sendProposalApprovalHierarchyMail(
    email: string,
    name: string,
    level: number,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: 'You are added to the Proposal approvers group!',
        template: './approvalHierarchyProposal',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          level,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  public async sendActivityReportsApprovalHierarchyMail(
    email: string,
    name: string,
    level: number,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: 'You are added to the Activity Reports approvers group!',
        template: './approvalHierarchyActivityReports',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          level,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  public async sendWorkplanApprovalHierarchyMail(
    email: string,
    name: string,
    level: number,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: 'You are added to the Work Plan approvers group!',
        template: './approvalHierarchyWorkplan',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          level,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  public async sendImpactStoriesApprovalHierarchyMail(
    email: string,
    name: string,
    level: number,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: 'You are added to the Impact Stories approvers group!',
        template: './approvalHierarchyImpactStories',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          level,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Common mail service for send for approval
  public async sendForApprovalForApprovalTypes(
    email: string,
    name: string,
    entityCode: any,
    approvalType: string,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: `${approvalType} - ${entityCode} received for approval!`,
        template: './sendForApproval',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          entityCode,
          approvalType,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Common mail service for approval
  public async approvalMailForApprovalTypes(
    email: string,
    name: string,
    entityCode: string,
    approvalType: string,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: `${approvalType} - ${entityCode} Approved`,
        template: './approveApprovalTypes',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          entityCode,
          approvalType,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Common mail service for denial
  public async denialMailForApprovalTypes(
    email: string,
    name: string,
    entityCode: string,
    approvalType: string,
    denialReason: string,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: `${approvalType} - ${entityCode} Denied`,
        template: './denyApprovalTypes',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          entityCode,
          approvalType,
          denialReason:
            denialReason.trim().length === 0 ? 'Not Mentioned' : denialReason,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // public async infoRequestedMail(
  //   email: string,
  //   name: string,
  //   entityDetail: any,
  //   information: string,
  // ) {
  //   try {
  //     return await this.mailerService.sendMail({
  //       to: email,
  //       subject: entityDetail.melpId
  //         ? 'Information Requested for Melp!'
  //         : 'Information Requested for Workplan Denied!',
  //       template: entityDetail.melpId
  //         ? './infoRequestMelp'
  //         : './infoRequestWorkplan',
  //       attachments: [
  //         {
  //           filename: 'Logo.png',
  //           path: __dirname + '/templates/images/Logo.png',
  //           cid: 'logo',
  //         },
  //       ],
  //       context: {
  //         name,
  //         entityId: entityDetail.melpId
  //           ? entityDetail.melpId
  //           : entityDetail.workplanId,
  //         entityName: entityDetail.melpCode
  //           ? entityDetail.melpCode
  //           : entityDetail.workplanCode,
  //         information,
  //       },
  //     });
  //   } catch (error) {
  //     throw new InternalServerErrorException();
  //   }
  // }

  // Common mail service for request for information
  public async infoRequestedMailForApprovalTypes(
    email: string,
    name: string,
    entityCode: string,
    approvalType: string,
    informationRequired: string,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: `${approvalType} - ${entityCode} Information Requested`,
        template: './infoRequestedApprovalTypes',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          entityCode,
          approvalType,
          informationRequired,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  public async resubmittedMailForApprovalTypes(
    email: string,
    name: string,
    entityCode: string,
    approvalType: string,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: `${approvalType} - ${entityCode} Resubmitted`,
        template: './resubmittedApprovalTypes',
        attachments: [
          {
            filename: 'Logo.png',
            path: __dirname + '/templates/images/Logo.png',
            cid: 'logo',
          },
        ],
        context: {
          name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
          entityCode,
          approvalType,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

interface VerificationTokenPayload {
  email: string;
}

export default VerificationTokenPayload;
