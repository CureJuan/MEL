import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NetworkModule } from './networks/network.module';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { ApprovalHierarchyModule } from './approvalHierarchy/approvalHierarchy.module';
import { MelpModule } from './melp/melp.module';
import { WorkplanModule } from './workplans/workplan.module';
import { ActivitiesModule } from './activities/activities.module';
import { PartnerModule } from './partners/partners.module';
import { StaticSurveyModule } from './staticSurveys/staticSurvey.module';
import { ImpactStoryModule } from './impactStory/impactStory.module';
import { ReportsModule } from './reports/reports.module';
import { NetworkReportingModule } from './networkReporting/networkReporting.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SurveyjsModule } from './surveyjs/surveyjs.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    // ConfigModule.forRoot({ envFilePath: '.env.dev' }),
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'build'), // <-- path to the static files
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
      UserModule,
      NetworkModule,
      PartnerModule,
      AuthModule,
      MailModule,
      ApprovalHierarchyModule,
      MelpModule,
      WorkplanModule,
      ActivitiesModule,
      StaticSurveyModule,
      ImpactStoryModule,
      ReportsModule,
      NetworkReportingModule,
      DashboardModule,
      SurveyjsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
