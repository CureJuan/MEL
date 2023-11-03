import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ActivityLog,
  ActivityLogSchema,
} from 'src/common/schema/activityLog.schema';
import { Roles } from '../common/decorators/roles.decorator';
import { NetworkModule } from '../networks/network.module';
import { PartnerModule } from '../partners/partners.module';
import { RolesSchema } from '../users/schema/roles.schema';
import { UserModule } from '../users/user.module';
import { MelpController } from './melp.controller';
import { MelpService } from './melp.service';
import {
  BoundaryPartner,
  BoundaryPartnerSchema,
} from './schema/boundaryPartners.schema';
import { Melp, MelpSchema } from './schema/melp.schema';
import {
  MelpIndicatorMonitoring,
  MelpIndicatorMonitoringSchema,
} from './schema/melpIndicatorMonitoring.schema';
import {
  MelpIndicatorRisks,
  MelpIndicatorRisksSchema,
} from './schema/melpIndicatorRisks.schema';
import {
  MelpOutcomeProgressMarkers,
  MelpOutcomeProgressMarkersSchema,
} from './schema/melpOutcomeProgressMarkers.schema';
import { MelpOutcomes, MelpOutcomesSchema } from './schema/melpOutcomes.schema';
import {
  MelpResultIndicators,
  MelpResultIndicatorsSchema,
} from './schema/melpResultIndicators.schema';
import { MelpResults, MelpResultsSchema } from './schema/melpResults.schema';
import {
  MelpTaskDetails,
  MelpTaskDetailsSchema,
} from './schema/melpTaskDetails.schema';
import { MelpTasks, MelpTasksSchema } from './schema/melpTasks.schema';
import {
  Priority,
  PrioritySchema,
} from '../common/staticSchema/priority.schema';
import {
  ProgressMonitoring,
  ProgressMonitoringSchema,
} from '../common/staticSchema/progressMonitoring.schema';
import {
  Activities,
  ActivitiesSchema,
} from '../activities/schema/activities.schema';
import {
  ActivityProposals,
  ActivityProposalsSchema,
} from '../activities/schema/activityProposals.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Melp.name, schema: MelpSchema },
      { name: MelpResults.name, schema: MelpResultsSchema },
      { name: MelpResultIndicators.name, schema: MelpResultIndicatorsSchema },
      {
        name: MelpIndicatorMonitoring.name,
        schema: MelpIndicatorMonitoringSchema,
      },
      { name: MelpIndicatorRisks.name, schema: MelpIndicatorRisksSchema },
      { name: MelpOutcomes.name, schema: MelpOutcomesSchema },
      {
        name: MelpOutcomeProgressMarkers.name,
        schema: MelpOutcomeProgressMarkersSchema,
      },
      { name: MelpTasks.name, schema: MelpTasksSchema },
      { name: MelpTaskDetails.name, schema: MelpTaskDetailsSchema },
      { name: BoundaryPartner.name, schema: BoundaryPartnerSchema },
      { name: Priority.name, schema: PrioritySchema },
      { name: ProgressMonitoring.name, schema: ProgressMonitoringSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Activities.name, schema: ActivitiesSchema },
      { name: ActivityProposals.name, schema: ActivityProposalsSchema },
    ]),
    UserModule,
    NetworkModule,
    PartnerModule,
  ],
  controllers: [MelpController],
  providers: [MelpService, JwtService],
  exports: [MelpService],
})
export class MelpModule {}
