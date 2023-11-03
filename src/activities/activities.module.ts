import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MelpModule } from '../melp/melp.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activities, ActivitiesSchema } from './schema/activities.schema';
import {
  ActivityCategories,
  ActivityCategoriesSchema,
} from '../common/staticSchema/activityCategories.schema';
import {
  ActivityStatus,
  ActivityStatusSchema,
} from '../common/staticSchema/activityStatus.schema';
import {
  ActivityThematicAreas,
  ActivityThematicAreasSchema,
} from '../common/staticSchema/activityThematicAreas.schema';
import {
  ActivityTimeframe,
  ActivityTimeframeSchema,
} from '../common/staticSchema/activityTimeframe.schema';
import {
  ActivityTypes,
  ActivityTypesSchema,
} from '../common/staticSchema/activityTypes.schema';
import {
  Modality,
  ModalitySchema,
} from '../common/staticSchema/modality.schema';
import { UserModule } from '../users/user.module';
import { NetworkModule } from '../networks/network.module';
import { PartnerModule } from '../partners/partners.module';
import {
  ActivityProposals,
  ActivityProposalsSchema,
} from './schema/activityProposals.schema';
import {
  CoordinationCost,
  CoordinationCostSchema,
} from './schema/coordinationCost.schema';
import { TravelCost, TravelCostSchema } from './schema/travelCost.schema';
import { LocationCost, LocationCostSchema } from './schema/locationCost.schema';
import { OtherCost, OtherCostSchema } from './schema/otherCost.schema';
import {
  ActivityScope,
  ActivityScopeSchema,
} from '../common/staticSchema/activityScope.schema';
import { Workplan, WorkplanSchema } from '../workplans/schema/workplan.schema';
import {
  WorkplanActivities,
  WorkplanActivitiesSchema,
} from '../workplans/schema/workplan_activities.schema';
import { Country, CountrySchema } from '../common/staticSchema/country.schema';
import {
  OutputReport,
  OutputReportSchema,
} from '../reports/schema/outputReport.schema';
import {
  ImpactStory,
  ImpactStorySchema,
} from '../impactStory/schema/impactStory.schema';
import {
  ActivityTargetGroup,
  ActivityTargetGroupSchema,
} from '../common/staticSchema/activityTargetGroup.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activities.name, schema: ActivitiesSchema },
      { name: ActivityCategories.name, schema: ActivityCategoriesSchema },
      { name: ActivityThematicAreas.name, schema: ActivityThematicAreasSchema },
      { name: ActivityTypes.name, schema: ActivityTypesSchema },
      { name: Modality.name, schema: ModalitySchema },
      { name: ActivityStatus.name, schema: ActivityStatusSchema },
      { name: ActivityTimeframe.name, schema: ActivityTimeframeSchema },
      { name: ActivityProposals.name, schema: ActivityProposalsSchema },
      { name: CoordinationCost.name, schema: CoordinationCostSchema },
      { name: TravelCost.name, schema: TravelCostSchema },
      { name: LocationCost.name, schema: LocationCostSchema },
      { name: OtherCost.name, schema: OtherCostSchema },
      { name: ActivityScope.name, schema: ActivityScopeSchema },
      { name: Workplan.name, schema: WorkplanSchema },
      { name: WorkplanActivities.name, schema: WorkplanActivitiesSchema },
      { name: Country.name, schema: CountrySchema },
      { name: OutputReport.name, schema: OutputReportSchema },
      { name: ImpactStory.name, schema: ImpactStorySchema },
      { name: ActivityTargetGroup.name, schema: ActivityTargetGroupSchema },
    ]),
    MelpModule,
    UserModule,
    NetworkModule,
    PartnerModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
