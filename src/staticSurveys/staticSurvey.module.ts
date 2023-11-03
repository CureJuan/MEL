import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesModule } from '../activities/activities.module';
import { Country, CountrySchema } from '../common/staticSchema/country.schema';
import { NetworkModule } from '../networks/network.module';
import { PartnerModule } from '../partners/partners.module';
import { UserModule } from '../users/user.module';
import {
  AgeGroup,
  AgeGroupSchema,
} from '../common/staticSchema/ageGroup.schema';
import { Gender, GenderSchema } from '../common/staticSchema/gender.schema';
import { Region, RegionSchema } from '../common/staticSchema/region.schema';
import {
  ScopeOfWork,
  ScopeOfWorkSchema,
} from '../common/staticSchema/scopeOfWork.schema';
import {
  TypeOfInstitution,
  TypeOfInstitutionSchema,
} from '../common/staticSchema/typeOfInstitution.schema';
import {
  EntrySurveyForm,
  EntrySurveyFormSchema,
} from './schema/entrySurveyForm.schema';
import {
  EntrySurveyResponse,
  EntrySurveyResponseSchema,
} from './schema/entrySurveyResponse.schema';
import {
  ExitSurveyForm,
  ExitSurveyFormSchema,
} from './schema/exitSurveyForm.schema';
import {
  ExitSurveyResponse,
  ExitSurveyResponseSchema,
} from './schema/exitSurveyResponse.schema';
import {
  OutcomeSurveyForm,
  OutcomeSurveyFormSchema,
} from './schema/outcomeSurveyForm.schema';
import {
  OutcomeSurveyResponse,
  OutcomeSurveyResponseSchema,
} from './schema/outcomeSurveyResponse.schema';
import { StaticSurveyController } from './staticSurvey.controller';
import { StaticSurveyService } from './staticSurvey.service';
import {
  ActivityLog,
  ActivityLogSchema,
} from '../common/schema/activityLog.schema';
import {
  CourseMainObjectives,
  CourseMainObjectivesSchema,
} from '../common/staticSchema/courseMainObjectives.schema';
import {
  Beneficiality,
  BeneficialitySchema,
} from '../common/staticSchema/beneficiality.schema';
import {
  Relevance,
  RelevanceSchema,
} from '../common/staticSchema/relevance.schema';
import {
  Expectation,
  ExpectationSchema,
} from '../common/staticSchema/expectation.schema';
import {
  KnowledgeGained,
  KnowledgeGainedSchema,
} from '../common/staticSchema/knowledgeGained.schema';
import {
  KnowledgeSharing,
  KnowledgeSharingSchema,
} from '../common/staticSchema/knowledgeSharing.schema';
import {
  KnowledgeApplication,
  KnowledgeApplicationSchema,
} from '../common/staticSchema/knowledgeApplication.schema';
import {
  DegreeOfNewKnowledge,
  DegreeOfNewKnowledgeSchema,
} from '../common/staticSchema/degreeOfNewKnowledge.schema';
import { MelpModule } from 'src/melp/melp.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Region.name, schema: RegionSchema },
      { name: Gender.name, schema: GenderSchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      { name: ScopeOfWork.name, schema: ScopeOfWorkSchema },
      { name: TypeOfInstitution.name, schema: TypeOfInstitutionSchema },
      { name: EntrySurveyForm.name, schema: EntrySurveyFormSchema },
      { name: EntrySurveyResponse.name, schema: EntrySurveyResponseSchema },
      { name: ExitSurveyForm.name, schema: ExitSurveyFormSchema },
      { name: ExitSurveyResponse.name, schema: ExitSurveyResponseSchema },
      { name: OutcomeSurveyForm.name, schema: OutcomeSurveyFormSchema },
      { name: OutcomeSurveyResponse.name, schema: OutcomeSurveyResponseSchema },
      { name: Country.name, schema: CountrySchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: CourseMainObjectives.name, schema: CourseMainObjectivesSchema },
      { name: Beneficiality.name, schema: BeneficialitySchema },
      { name: Relevance.name, schema: RelevanceSchema },
      { name: Expectation.name, schema: ExpectationSchema },
      { name: KnowledgeGained.name, schema: KnowledgeGainedSchema },
      { name: KnowledgeSharing.name, schema: KnowledgeSharingSchema },
      { name: KnowledgeApplication.name, schema: KnowledgeApplicationSchema },
      { name: DegreeOfNewKnowledge.name, schema: DegreeOfNewKnowledgeSchema },
    ]),
    UserModule,
    NetworkModule,
    PartnerModule,
    ActivitiesModule,
    MelpModule,
  ],
  controllers: [StaticSurveyController],
  providers: [StaticSurveyService],
  exports: [StaticSurveyService],
})
export class StaticSurveyModule {}
