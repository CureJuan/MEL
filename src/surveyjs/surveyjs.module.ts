import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MelpModule } from 'src/melp/melp.module';
import { NetworkModule } from '../networks/network.module';
import { PartnerModule } from '../partners/partners.module';

import { SurveyjsFormSchema, SurveyjsForm } from './schema/surveyjsForm.schema';
import {
  SurveyjsResponse,
  SurveyjsResponseSchema,
} from './schema/surveyjsResponse.schema';
import { SurveyjsController } from './surveyjs.controller';
import { SurveyjsService } from './surveyjs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SurveyjsForm.name, schema: SurveyjsFormSchema },
      { name: SurveyjsResponse.name, schema: SurveyjsResponseSchema },
    ]),
    NetworkModule,
    PartnerModule,
    MelpModule,
  ],
  controllers: [SurveyjsController],
  providers: [SurveyjsService],
})
export class SurveyjsModule {}
