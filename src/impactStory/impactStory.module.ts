import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MelpModule } from '../melp/melp.module';
import { ReportsModule } from '../reports/reports.module';
import { ActivitiesModule } from '../activities/activities.module';
import {
  ApprovalDetails,
  ApprovalDetailsSchema,
} from '../approvalHierarchy/schema/approvalDetails.schema';
import {
  ApprovalHierarchy,
  ApprovalHierarchySchema,
} from '../approvalHierarchy/schema/approvalHierarchy.schema';
import {
  ApprovalRequests,
  ApprovalRequestsSchema,
} from '../approvalHierarchy/schema/approvalRequests.schema';
import {
  AgeGroup,
  AgeGroupSchema,
} from '../common/staticSchema/ageGroup.schema';
import {
  BoundaryLevelOfChange,
  BoundaryLevelOfChangeSchema,
} from '../common/staticSchema/boundaryLevelOfChange.schema';
import { Gender, GenderSchema } from '../common/staticSchema/gender.schema';
import {
  ThematicAreaOfChange,
  ThematicAreaOfChangeSchema,
} from '../common/staticSchema/thematicAreaOfChange.schema';
import {
  TypeOfChangeObserved,
  TypeOfChangeObservedSchema,
} from '../common/staticSchema/typeOfChangeObserved.schema';
import {
  TypeOfInstitution,
  TypeOfInstitutionSchema,
} from '../common/staticSchema/typeOfInstitution.schema';
import { MailModule } from '../mail/mail.module';
import { NetworkModule } from '../networks/network.module';
import { PartnerModule } from '../partners/partners.module';
import { StaticSurveyModule } from '../staticSurveys/staticSurvey.module';
import { UserModule } from '../users/user.module';
import { ImpactStoryController } from './impactStory.controller';
import { ImpactStoryService } from './impactStory.service';
import { ImpactStory, ImpactStorySchema } from './schema/impactStory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImpactStory.name, schema: ImpactStorySchema },
      { name: TypeOfChangeObserved.name, schema: TypeOfChangeObservedSchema },
      { name: BoundaryLevelOfChange.name, schema: BoundaryLevelOfChangeSchema },
      { name: ThematicAreaOfChange.name, schema: ThematicAreaOfChangeSchema },
      { name: Gender.name, schema: GenderSchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      { name: TypeOfInstitution.name, schema: TypeOfInstitutionSchema },
      { name: ApprovalRequests.name, schema: ApprovalRequestsSchema },
      { name: ApprovalHierarchy.name, schema: ApprovalHierarchySchema },
      { name: ApprovalDetails.name, schema: ApprovalDetailsSchema },
    ]),
    UserModule,
    MailModule,
    NetworkModule,
    PartnerModule,
    ActivitiesModule,
    StaticSurveyModule,
    MelpModule,
    ReportsModule,
  ],
  controllers: [ImpactStoryController],
  providers: [ImpactStoryService],
  exports: [ImpactStoryService],
})
export class ImpactStoryModule {}
