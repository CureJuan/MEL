import { forwardRef, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Configuration,
  ConfigurationSchema,
} from '../common/schema/configuration.schema';
import { NetworkModule } from '../networks/network.module';
import { MailModule } from '../mail/mail.module';
import { Roles, RolesSchema } from './schema/roles.schema';
import { Status, StatusSchema } from '../common/schema/status.schema';
import { User, UserSchema } from './schema/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PartnerModule } from '../partners/partners.module';
import {
  ApprovalHierarchy,
  ApprovalHierarchySchema,
} from '../approvalHierarchy/schema/approvalHierarchy.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: Status.name, schema: StatusSchema },
      { name: Configuration.name, schema: ConfigurationSchema },
      { name: ApprovalHierarchy.name, schema: ApprovalHierarchySchema },
    ]),
    forwardRef(() => MailModule),
    NetworkModule,
    PartnerModule,
  ],
  controllers: [UserController],
  providers: [UserService, JwtService],
  exports: [UserService], // making User Service available outside the User Module. It is used in Auth Service
})
export class UserModule {}
