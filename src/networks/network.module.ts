import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Country, CountrySchema } from '../common/staticSchema/country.schema';
import { Gender, GenderSchema } from '../common/staticSchema/gender.schema';
import {
  TypeOfInstitution,
  TypeOfInstitutionSchema,
} from '../common/staticSchema/typeOfInstitution.schema';
import {
  ActivityLog,
  ActivityLogSchema,
} from '../common/schema/activityLog.schema';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';
import { Network, NetworkSchema } from './schema/network.schema';
import { Region, RegionSchema } from '../common/staticSchema/region.schema';
import {
  IndividualMember,
  IndividualMemberSchema,
} from './schema/individualMember.schema';
import {
  InstitutionalMember,
  InstitutionalMemberSchema,
} from './schema/institutionalMember.schema';
import {
  TypeOfMembership,
  TypeOfMembershipSchema,
} from '../common/staticSchema/typeOfMemberShip.schema';
import {
  ExpertiseAreaOrThematicFocus,
  ExpertiseAreaOrThematicFocusSchema,
} from '../common/staticSchema/expertiseAreaOrThematicFocus.schema';
import { User, UserSchema } from '../users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Network.name, schema: NetworkSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Gender.name, schema: GenderSchema },
      { name: TypeOfInstitution.name, schema: TypeOfInstitutionSchema },
      { name: Country.name, schema: CountrySchema },
      { name: Region.name, schema: RegionSchema },
      { name: IndividualMember.name, schema: IndividualMemberSchema },
      { name: InstitutionalMember.name, schema: InstitutionalMemberSchema },
      { name: TypeOfMembership.name, schema: TypeOfMembershipSchema },
      {
        name: ExpertiseAreaOrThematicFocus.name,
        schema: ExpertiseAreaOrThematicFocusSchema,
      },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [NetworkController],
  providers: [NetworkService],
  exports: [NetworkService],
})
export class NetworkModule {}
