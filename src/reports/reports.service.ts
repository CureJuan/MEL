import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PartnerService } from '../partners/partner.service';
import { NetworkService } from '../networks/network.service';
import { CreateOutputReportDTO } from './dto/createOutputReport.dto';
import { ActivitiesService } from '../activities/activities.service';
import { errorMessages } from '../utils/error-messages.utils';
import { OutputReport } from './schema/outputReport.schema';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Model, Types } from 'mongoose';
import { UserService } from '../users/user.service';
import { StatusEnum } from '../common/enum/status.enum';
import { ActivityLog } from '../common/schema/activityLog.schema';
import { EditOutputReportDTO } from './dto/editOutputReport.dto';
import { Workbook, Worksheet } from 'exceljs';
import { CreateOutcomeReportDTO } from './dto/createOutcomeReport.dto';
import { OutcomeReport } from './schema/outcomeReport.schema';
import { StaticSurveyService } from '../staticSurveys/staticSurvey.service';
import { EditOutcomeReportDTO } from './dto/editOutcomeReport.dto';
import { RegionEnum } from '../staticSurveys/enum/region.enum';
import { TypeOfInstitutionEnum } from '../staticSurveys/enum/typeOfInstitution.enum';
import { BenefitsLevelEnum } from '../staticSurveys/enum/benefitsLevel.enum';
import { RelevanceLevelEnum } from '../staticSurveys/enum/relevanceLevel.enum';
import { ExpectationLevelEnum } from '../staticSurveys/enum/expectationLevel.enum';
import { DegreeOfKnowledgeGainedEnum } from '../staticSurveys/enum/degreeOfKnowledgeGained.enum';
import { KnowledgeGainedEnum } from '../staticSurveys/enum/knowledgeGained.enum';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { MelpService } from '../melp/melp.service';
import { CapnetEnum } from '../common/enum/capnet.enum';
import { BlobServiceClient } from '@azure/storage-blob';
import { mimetypes } from '../utils/file-upload.util';
import { AddParticipantInfoDTO } from './dto/addParticipantInfo.dto';
import { AddAdditionalInfoDTO } from 'src/activities/dto/addAdditionalInfo.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(OutputReport.name)
    private outputReportModel: Model<OutputReport>,
    @InjectModel(OutcomeReport.name)
    private outcomeReportModel: Model<OutcomeReport>,

    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,

    private readonly networkService: NetworkService,
    private readonly partnerService: PartnerService,
    private readonly activitiesService: ActivitiesService,
    private readonly userService: UserService,
    private readonly staticSurveyService: StaticSurveyService,
    private readonly configService: ConfigService,
    private readonly melpService: MelpService,
  ) {}

  //Common function for search & sort
  async commonFunctionForSearchSort(
    searchKeyword: string,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('WorkplanService.commonFunctionForSearchSort');
    const regex = new RegExp(searchKeyword, 'i');
    sortKey = sortKey.trim().length === 0 ? 'updatedAt' : sortKey;
    const sortQuery = {};
    sortQuery[sortKey] = sortDirection === 1 ? 1 : -1;

    return {
      regex,
      sortQuery,
    };
  }

  async checkIfOutputReportExists(reportId: string) {
    Logger.debug('ActivitiesService.checkIfOutputReportExists');
    const outputReport = await this.outputReportModel
      .findOne({
        outputReportId: reportId,
        isDeleted: false,
      })
      .exec();
    if (outputReport === null)
      throw new NotFoundException(errorMessages.OUTPUT_REPORT_NOT_FOUND);
    return outputReport;
  }

  async checkIfOutcomeReportExists(reportId: string) {
    Logger.debug('ActivitiesService.checkIfOutcomeReportExists');
    const outcomeReport = await this.outcomeReportModel
      .findOne({
        outcomeReportId: reportId,
        isDeleted: false,
      })
      .exec();
    if (!outcomeReport)
      throw new NotFoundException(errorMessages.OUTCOME_REPORT_NOT_FOUND);
    return outcomeReport;
  }
  //Total count for gender-wise activity participation
  //need controller
  async getGenderCountTotal(participantCountObj: any) {
    Logger.debug('ReportsService.getGenderCountTotal');
    const preEnrolledTotal =
      participantCountObj.preEnrolled['male'] +
      participantCountObj.preEnrolled['female'] +
      participantCountObj.preEnrolled['ratherNotSay'] +
      participantCountObj.preEnrolled['other'];
    const enrolledTotal =
      participantCountObj.enrolled['male'] +
      participantCountObj.enrolled['female'] +
      participantCountObj.enrolled['ratherNotSay'] +
      participantCountObj.enrolled['other'];
    const completedTotal =
      participantCountObj.completed['male'] +
      participantCountObj.completed['female'] +
      participantCountObj.completed['ratherNotSay'] +
      participantCountObj.completed['other'];
    return {
      preEnrolledTotal,
      enrolledTotal,
      completedTotal,
    };
  }
  //Total count for age-wise activity participation
  //need controller
  async getAgeCountTotal(participantCountObj: any) {
    Logger.debug('ReportsService.getAgeCountTotal');
    return (
      participantCountObj.below18 +
      participantCountObj.below25 +
      participantCountObj.below65 +
      participantCountObj.above65
    );
  }
  //Total count for country-wise activity participation
  async getCountTotal(
    countryCountObj: any,
    regionCountTotal: any,
    institutionalAffiliation: any,
    degreeOfKnowledgeBeforeParticipating: any,
    degreeOfKnowledgeAfterParticipating: any,
    overallLearningObjective: any,
    relevance: any,
    levelOfExpectationsMet: any,
    knowledgeApplication: any,
  ) {
    Logger.debug('ReportsService.getCountTotal');

    function addValues(total, number) {
      return total.value + number.value;
    }

    const countryTotal = countryCountObj.reduce(addValues);
    console.log('countryTotal = ', countryTotal);
    const regionTotal = regionCountTotal.reduce(addValues);
    const institutionalAffiliationTotal =
      institutionalAffiliation.reduce(addValues);
    const knowledgeBeforeParticipatingTotal =
      degreeOfKnowledgeBeforeParticipating.reduce(addValues);
    const knowledgeAfterParticipatingTotal =
      degreeOfKnowledgeAfterParticipating.reduce(addValues);
    const overallLearningObjectiveTotal =
      overallLearningObjective.reduce(addValues);
    const relevanceTotal = relevance.reduce(addValues);
    const levelOfExpectationsMetTotal =
      levelOfExpectationsMet.reduce(addValues);
    const knowledgeApplicationTotal = knowledgeApplication.reduce(addValues);
    return {
      countryTotal,
      regionTotal,
      institutionalAffiliationTotal,
      knowledgeBeforeParticipatingTotal,
      knowledgeAfterParticipatingTotal,
      overallLearningObjectiveTotal,
      relevanceTotal,
      levelOfExpectationsMetTotal,
      knowledgeApplicationTotal,
    };
  }
  // Create a Output report
  async addOutputReport(
    createOutputReportDto: CreateOutputReportDTO,
    user: any,
  ) {
    Logger.debug('ReportsService.addOutputReport');
    let instituteName;

    const statusId = await this.userService.getStatusId(StatusEnum.IN_PROGRESS);

    if (user.networkId === null && user.partnerId === null) {
      const existingReport = await this.outputReportModel
        .findOne({
          year: createOutputReportDto.year,
          activityCode: createOutputReportDto.activityCode,
          isDeleted: false,
          instituteName: CapnetEnum.CAPNET,
        })
        .exec();
      if (existingReport)
        throw new ConflictException(errorMessages.OUTPUT_REPORT_EXISTS);

      instituteName = CapnetEnum.CAPNET;
    } else if (user.networkId) {
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
      const existingReport = await this.outputReportModel
        .findOne({
          year: createOutputReportDto.year,
          activityCode: createOutputReportDto.activityCode,
          isDeleted: false,
          instituteName,
        })
        .exec();
      if (existingReport)
        throw new ConflictException(errorMessages.OUTPUT_REPORT_EXISTS);
    } else if (user.partnerId) {
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
      const existingReport = await this.outputReportModel
        .findOne({
          year: createOutputReportDto.year,
          activityCode: createOutputReportDto.activityCode,
          isDeleted: false,
          instituteName,
        })
        .exec();
      if (existingReport)
        throw new ConflictException(errorMessages.OUTPUT_REPORT_EXISTS);
    }

    const newOutputReport = await this.outputReportModel.create({
      ...createOutputReportDto,
      outputReportId: uuidv4(),
      instituteName,
      outputReportStatus: statusId,
      networkId: user.networkId,
      partnerId: user.partnerId,
      createdBy: user._id,
      updatedBy: user._id,
    });

    await this.melpService.addActivityLog(
      user,
      `Output Report - ${newOutputReport.outputReportCode} created`,
    );

    Logger.debug('Created new output report');
    Logger.verbose(newOutputReport);

    return newOutputReport;
  }

  async getAllOutputReports(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortType: string,
    sortDirection: number,
    year: number,
  ) {
    Logger.debug('ReportsService.getAllOutputReports');
    const sortObject = {};
    const stype = sortType;
    const sdir = sortDirection;
    sortObject[stype] = sdir;
    console.log('sortObject = ', sortObject);

    const regex = new RegExp(searchKeyword, 'i');
    const inprogressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );

    console.log('inprogressStatusId = ', inprogressStatusId);

    const allReportsData = await this.outputReportModel
      .aggregate([
        {
          $match: {
            $and: [
              {
                year,
                isDeleted: false,
              },
              {
                $or: [
                  {
                    $and: [
                      { instituteName: { $ne: CapnetEnum.CAPNET } },
                      { outputReportStatus: { $ne: inprogressStatusId } },
                    ],
                  },
                  { instituteName: CapnetEnum.CAPNET },
                ],
              },
              {
                $or: [
                  { instituteName: { $regex: regex } },
                  { activityCode: { $regex: regex } },
                  { activityName: { $regex: regex } },
                ],
              },
            ],
          },
        },

        {
          $lookup: {
            from: 'activityproposals',
            let: { id: '$proposalId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$id'] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'proposalData',
          },
        },
        { $unwind: '$proposalData' },
        { $sort: sortObject },
        {
          $facet: {
            records: [{ $skip: pageIndex * pageSize }, { $limit: pageSize }],
            // totalCount: [{ $count: 'count' }],
          },
        },
      ])
      .exec();

    const count = allReportsData[0].records.length;
    let statusName;
    console.log('allReportsData = ', allReportsData[0].records);
    console.log(
      'allReportsData[0].records=',
      allReportsData[0].records[0].outputReportStatus,
    );
    for (const data of allReportsData[0].records) {
      statusName = await this.userService.getStatusName(
        data.outputReportStatus,
      );
      data.statusName = statusName;
    }

    return { records: allReportsData[0].records, count: Math.ceil(count / 10) };
  }

  async getOutputReportById(reportId: string) {
    Logger.debug('ReportsService.getOutputReportById');
    let outputReport;
    try {
      outputReport = await this.outputReportModel
        .aggregate([
          {
            $match: {
              outputReportId: reportId,
              isDeleted: false,
            },
          },
          {
            $lookup: {
              from: 'activityproposals',
              let: { id: '$proposalId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', '$$id'] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'proposalData',
            },
          },
          { $unwind: '$proposalData' },
          {
            $lookup: {
              from: 'activitytypes',
              let: { activityTypeId: '$proposalData.activityTypeId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$activityTypeId'],
                    },
                  },
                },
              ],
              as: 'activityTypeObj',
            },
          },
          { $unwind: '$activityTypeObj' },
        ])
        .exec();
      let originalNameAdditionalInfo;
      if (
        outputReport[0].additionalInfoFile &&
        outputReport[0].additionalInfoFile.fileName
      )
        originalNameAdditionalInfo =
          outputReport[0].additionalInfoFile.fileName.split(' -')[0];
      let caseStudyManual;
      if (
        outputReport[0].caseStudyManual &&
        outputReport[0].caseStudyManual.fileName
      )
        caseStudyManual =
          outputReport[0].caseStudyManual.fileName.split(' -')[0];

      return {
        outputReport,
        originalNameAdditionalInfo: originalNameAdditionalInfo
          ? originalNameAdditionalInfo
          : '',
        caseStudyManual: caseStudyManual ? caseStudyManual : '',

        // file: {
        //   originalname: outputReport[0].additionalInfoFile.fileName,
        //   key: outputReport[0].additionalInfoFile.key,
        //   url,
        // },
      };
    } catch (error) {
      console.log('getOutputReportById.catch', error);
      throw new InternalServerErrorException(error);
    }
  }

  async getOutputReportByActivityProposalId(proposalId: any) {
    Logger.debug('ReportsService.getOutputReportByActivityProposalId');
    proposalId = new Types.ObjectId(proposalId);
    console.log('proposalId in service type = ', proposalId);

    let outputReport;
    try {
      outputReport = await this.outputReportModel
        .aggregate([
          {
            $match: {
              proposalId,
              isDeleted: false,
            },
          },
          {
            $lookup: {
              from: 'activityproposals',
              // let: { id: '$proposalId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', proposalId] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'proposalData',
            },
          },
          { $unwind: '$proposalData' },
          {
            $lookup: {
              from: 'activitytypes',
              let: { activityTypeId: '$proposalData.activityTypeId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$activityTypeId'],
                    },
                  },
                },
              ],
              as: 'activityTypeObj',
            },
          },
          { $unwind: '$activityTypeObj' },
        ])
        .exec();
      let originalNameAdditionalInfo;
      if (
        outputReport[0].additionalInfoFile &&
        outputReport[0].additionalInfoFile.fileName
      )
        originalNameAdditionalInfo =
          outputReport[0].additionalInfoFile.fileName.split(' -')[0];
      let caseStudyManual;
      if (
        outputReport[0].caseStudyManual &&
        outputReport[0].caseStudyManual.fileName
      )
        caseStudyManual =
          outputReport[0].caseStudyManual.fileName.split(' -')[0];

      return {
        outputReport,
        originalNameAdditionalInfo: originalNameAdditionalInfo
          ? originalNameAdditionalInfo
          : '',
        caseStudyManual: caseStudyManual ? caseStudyManual : '',
      };
    } catch (error) {
      console.log('getOutputReportById.catch', error);
      throw new InternalServerErrorException(error);
    }
  }

  async getApprovedOutputReports(year: number, user: any) {
    Logger.debug('ReportsService.getApprovedOutputReports');
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );

    return this.outputReportModel
      .find({
        year,
        isDeleted: false,
        outputReportStatus: approvedStatusId,
        networkId: user.networkId,
        partnerId: user.partnerId,
      })
      .exec();
  }

  async getApprovedOutputReportsForCapnet(year: number) {
    Logger.debug('ReportsService.getApprovedOutputReportsForCapnet');
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    return this.outputReportModel
      .find({
        year,
        isDeleted: false,
        outputReportStatus: approvedStatusId,
      })
      .exec();
  }

  async updateReport(
    reportId: string,
    editReportDTO: EditOutputReportDTO,
    user: any,
  ) {
    Logger.debug('ReportsService.updateReport');
    try {
      const foundReport = await this.outputReportModel
        .findOne({
          isDeleted: false,
          outputReportId: reportId,
        })
        .exec();
      console.log('foundReport = ', foundReport);
      if (!foundReport)
        throw new NotFoundException(errorMessages.OUTPUT_REPORT_NOT_FOUND);

      const updatedReport = await this.outputReportModel
        .findOneAndUpdate(
          { outputReportId: reportId, isDeleted: false },
          editReportDTO,
          {
            new: true,
          },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Output Report - ${updatedReport.outputReportCode} has been updated.`,
      );

      return updatedReport;
    } catch (error) {
      /**Handle errors here */
      Logger.debug('Catch: ReportsService.updateReport');
      console.log(error);
    }
  }

  async addOrEditParticipantInfo(
    reportId: string,
    addParticipantInfoDTO: AddParticipantInfoDTO,
    user: any,
  ) {
    Logger.debug('ReportsService.addOrEditParticipantInfo');
    try {
      await this.checkIfOutputReportExists(reportId);

      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      const infoRequestedStatusId = await this.userService.getStatusId(
        StatusEnum.INFORMATION_REQUESTED,
      );

      const updatedReport = await this.outputReportModel
        .findOneAndUpdate(
          {
            outputReportId: reportId,
            isDeleted: false,
            outputReportStatus: {
              $in: [inProgressStatusId, infoRequestedStatusId],
            },
          },
          { ...addParticipantInfoDTO, updatedBy: user._id },
          { new: true },
        )
        .exec();

      await this.melpService.addActivityLog(
        user,
        `Output Report - ${updatedReport.outputReportCode} has been updated.`,
      );
      const genderWiseTotal = await this.getGenderCountTotal(
        updatedReport.participantProfileActivityParticipation,
      );
      const ageWiseTotal = await this.getAgeCountTotal(
        updatedReport.participantProfileAge,
      );
      const allTotal = await this.getCountTotal(
        updatedReport.participantProfileCountry,
        updatedReport.participantProfileRegion,
        updatedReport.participantProfileInstitutionalAffiliation,
        updatedReport.degreeOfKnowledgeBeforeParticipating,
        updatedReport.degreeOfKnowledgeAfterParticipating,
        updatedReport.benefitOnOverallLearningObjective,
        updatedReport.relevanceInSustainableWaterResourceManagement,
        updatedReport.levelOfExpectationsMet,
        updatedReport.knowledgeApplication,
      );
      console.log('allTotal = ', allTotal);

      return {
        ...genderWiseTotal,
        ageWiseTotal,
        ...allTotal,
        updatedReport,
      };
    } catch (error) {
      Logger.log('addOrEditParticipantInfo.catch', error);
      return error;
    }
  }

  async addOrEditAdditionalInfo(
    reportId: string,
    addAdditionaltInfoDTO: AddAdditionalInfoDTO,
    user: any,
  ) {
    Logger.debug('ReportsService.addOrEditAdditionalInfo');
    try {
      await this.checkIfOutputReportExists(reportId);

      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      const infoRequestedStatusId = await this.userService.getStatusId(
        StatusEnum.INFORMATION_REQUESTED,
      );

      const updatedReport = await this.outputReportModel
        .findOneAndUpdate(
          {
            outputReportId: reportId,
            isDeleted: false,
            outputReportStatus: {
              $in: [inProgressStatusId, infoRequestedStatusId],
            },
          },
          { ...addAdditionaltInfoDTO, updatedBy: user._id },
          { new: true },
        )
        .exec();

      await this.melpService.addActivityLog(
        user,
        `Output Report - ${updatedReport.outputReportCode} has been updated.`,
      );

      return updatedReport;
    } catch (error) {
      Logger.log('addOrEditAdditionalInfo.catch', error);
      return error;
    }
  }

  async deleteOutputReport(reportId: string, user: any) {
    Logger.debug('ReportsService.deleteOutputReport');
    try {
      const updatedReport = await this.outputReportModel
        .findOneAndUpdate(
          {
            isDeleted: false,
            outputReportId: reportId,
          },
          { isDeleted: true },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Output Report - ${updatedReport.outputReportCode} has been deleted.`,
      );
      return updatedReport;
    } catch (error) {
      console.log('getOutputReportById.catch', error);
      throw new InternalServerErrorException(error);
    }
  }

  async updateGeneralUserReportStatus(reportId, statusId, user: any) {
    Logger.debug('ReportsService.updateGeneralUserReportStatus');

    try {
      const statusName = await this.userService.getStatusName(statusId);
      const updatedReport = await this.outputReportModel
        .findOneAndUpdate(
          {
            isDeleted: false,
            outputReportId: reportId,
          },
          { outputReportStatus: statusId, statusName },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Output Report - ${updatedReport.outputReportCode} has been updated.`,
      );
      return updatedReport;
    } catch (error) {
      console.log('updateGeneralUserReportStatus.catch', error);
    }
  }

  async updateGeneralUserOutcomeReportStatus(reportId, statusId, user: any) {
    Logger.debug('ReportsService.updateGeneralUserOutcomeReportStatus');
    try {
      return this.outcomeReportModel
        .findOneAndUpdate(
          {
            isDeleted: false,
            outcomeReportId: reportId,
          },
          { outcomeReportStatus: statusId, statusName: StatusEnum.APPROVED },
          { new: true },
        )
        .exec();
    } catch (error) {
      console.log('updateGeneralUserOutcomeReportStatus.catch', error);
    }
  }

  // async downloadCaseStudyManual(
  //   year: number,
  //   caseStudySheet: Worksheet,
  //   activityCode: string,
  //   activityName: string,
  //   reportCode: string,
  //   caseStudyManual: any,
  // ) {
  //   Logger.debug('ReportsService.downloadCaseStudyManual');
  //   caseStudySheet.columns = [
  //     { header: 'Year', key: 'year', width: 6 },
  //     { header: 'Output Report Code', key: 'reportCode', width: 20 },
  //     { header: 'Activity Code', key: 'activityCode', width: 20 },
  //     { header: 'Activity Name', key: 'activityName', width: 20 },
  //     { header: 'Case Study Manual File', key: 'link', width: 40 },
  //   ];

  //   caseStudySheet.addRow({
  //     year,
  //     reportCode,
  //     activityCode,
  //     activityName,
  //     link: caseStudyManual.fileName,
  //   });

  //   caseStudySheet.getRow(1).eachCell((cell) => {
  //     cell.font = { bold: true };
  //   });
  // }

  async downloadActivityParticipation(
    year: number,
    activityParticipationSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    activityParticipation: any,
  ) {
    Logger.debug('ReportsService.downloadActivityParticipation');
    activityParticipationSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      { header: 'Pre-Enrolled-Participants', key: 'preEnrolled', width: 20 },
      { header: 'Enrolled-Participants', key: 'enrolled', width: 20 },
      { header: 'Completed-Participants', key: 'completed', width: 20 },
    ];

    const preObj =
      'male= ' +
      activityParticipation.preEnrolled.male +
      ', ' +
      'female= ' +
      activityParticipation.preEnrolled.female +
      ', ' +
      'rather_not_say= ' +
      activityParticipation.preEnrolled.ratherNotSay +
      ', ' +
      'other= ' +
      activityParticipation.preEnrolled.other;

    const enrolledObj =
      'male= ' +
      activityParticipation.enrolled.male +
      ', ' +
      'female= ' +
      activityParticipation.enrolled.female +
      ', ' +
      'rather_not_say= ' +
      activityParticipation.enrolled.ratherNotSay +
      ', ' +
      'other= ' +
      activityParticipation.enrolled.other;

    const completedObj =
      'male= ' +
      activityParticipation.completed.male +
      ', ' +
      'female= ' +
      activityParticipation.completed.female +
      ', ' +
      'rather_not_say= ' +
      activityParticipation.completed.ratherNotSay +
      ', ' +
      'other= ' +
      activityParticipation.completed.other;

    activityParticipationSheet.addRow({
      year,
      reportCode,
      activityCode,
      activityName,
      preEnrolled: preObj,
      enrolled: enrolledObj,
      completed: completedObj,
    });

    activityParticipationSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadProfileAge(
    year: number,
    profileAgeSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    ageDetails: any,
  ) {
    Logger.debug('ReportsService.downloadProfileAge');
    profileAgeSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      { header: 'Below 18', key: 'below18', width: 20 },
      { header: 'Below 25', key: 'below25', width: 20 },
      { header: 'Below 65', key: 'below65', width: 20 },
      { header: 'Above 65', key: 'above65', width: 20 },
    ];

    profileAgeSheet.addRow({
      year,
      reportCode,
      activityCode,
      activityName,
      below18: ageDetails.below18,
      below25: ageDetails.below25,
      below65: ageDetails.below65,
      above65: ageDetails.above65,
    });

    profileAgeSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadProfileCountry(
    year: number,
    countrySheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    countryData: any,
  ) {
    Logger.debug('ReportsService.downloadProfileCountry');
    countrySheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      { header: 'Country Name', key: 'countryName', width: 40 },
      { header: 'No.of Participants', key: 'participantCount', width: 20 },
    ];
    for (const obj of countryData) {
      countrySheet.addRow({
        year,
        reportCode,
        activityCode,
        activityName,
        countryName: !obj.key ? 'NA' : obj.key,
        participantCount: !obj.value ? 0 : obj.value,
      });
    }
    countrySheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadProfileRegion(
    year: number,
    regionSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    regionData: any,
  ) {
    Logger.debug('ReportsService.downloadProfileRegion');
    regionSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      { header: 'Region Name', key: 'regionName', width: 40 },
      { header: 'No.of Participants', key: 'participantCount', width: 20 },
    ];
    for (const obj of regionData) {
      regionSheet.addRow({
        year,
        reportCode,
        activityCode,
        activityName,
        regionName: obj.key,
        participantCount: obj.value,
      });
    }
    regionSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadProfileInstitutionalAffiliation(
    year: number,
    institutionalAffiliationSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    institutionalAffiliationData: any,
  ) {
    Logger.debug('ReportsService.InstitutionalAffiliation');
    institutionalAffiliationSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      {
        header: "Participant's Institution",
        key: 'institutionName',
        width: 40,
      },
      { header: 'No.of Participants', key: 'participantCount', width: 20 },
    ];
    for (const obj of institutionalAffiliationData) {
      institutionalAffiliationSheet.addRow({
        year,
        reportCode,
        activityCode,
        activityName,
        institutionName: obj.key,
        participantCount: obj.value,
      });
    }
    institutionalAffiliationSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadKnowledgeParticipating(
    year: number,
    knowledgeParticipatingSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    knowledgeParticipatingData: any,
  ) {
    Logger.debug('ReportsService.downloadKnowledgeParticipating');
    knowledgeParticipatingSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      { header: 'Degree of Knowledge', key: 'degree', width: 40 },
      { header: 'No.of Participants', key: 'participantCount', width: 20 },
    ];
    for (const obj of knowledgeParticipatingData) {
      knowledgeParticipatingSheet.addRow({
        year,
        reportCode,
        activityCode,
        activityName,
        degree: obj.key,
        participantCount: obj.value,
      });
    }
    knowledgeParticipatingSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadOverallLearningObjective(
    year: number,
    overallLearningObjectiveSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    learingObjectiveData: any,
  ) {
    Logger.debug('ReportsService.downloadOverallLearningObjective');
    overallLearningObjectiveSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      {
        header: 'Benefit on Overall Learning Objective',
        key: 'benefit',
        width: 40,
      },
      { header: 'No.of Participants', key: 'participantCount', width: 20 },
    ];
    for (const obj of learingObjectiveData) {
      overallLearningObjectiveSheet.addRow({
        year,
        reportCode,
        activityCode,
        activityName,
        benefit: obj.key,
        participantCount: obj.value,
      });
    }
    overallLearningObjectiveSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadWaterResourceManagement(
    year: number,
    waterResourceManagementSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    waterResourceManagementData: any,
  ) {
    Logger.debug('ReportsService.downloadWaterResourceManagement');
    waterResourceManagementSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      {
        header: 'Relevance in Sustainable Water Resource Management',
        key: 'relevance',
        width: 40,
      },
      { header: 'No.of Participants', key: 'participantCount', width: 20 },
    ];
    for (const obj of waterResourceManagementData) {
      waterResourceManagementSheet.addRow({
        year,
        reportCode,
        activityCode,
        activityName,
        relevance: obj.key,
        participantCount: obj.value,
      });
    }
    waterResourceManagementSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadExpectationsMet(
    year: number,
    levelOfExpectationsMetSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    data: any,
  ) {
    Logger.debug('ReportsService.downloadExpectationsMet');
    levelOfExpectationsMetSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      { header: 'Level of Expectations', key: 'level', width: 40 },
      { header: 'No.of Participants', key: 'participantCount', width: 20 },
    ];
    for (const obj of data) {
      levelOfExpectationsMetSheet.addRow({
        year,
        reportCode,
        activityCode,
        activityName,
        level: obj.key,
        participantCount: obj.value,
      });
    }
    levelOfExpectationsMetSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadKnowledgeApplication(
    year: number,
    knowledgeApplicationSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    data: any,
  ) {
    Logger.debug('ReportsService.downloadKnowledgeApplication');
    knowledgeApplicationSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'No.of Participants', key: 'participantCount', width: 20 },
    ];
    for (const obj of data) {
      knowledgeApplicationSheet.addRow({
        year,
        reportCode,
        activityCode,
        activityName,
        description: obj.key,
        participantCount: obj.value,
      });
    }
    knowledgeApplicationSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadOutputReport(res, report, workbook: Workbook) {
    Logger.debug('ReportsService.downloadOutputReport');

    /** Get selected thematic-area or other-thematic-area if other is selected */
    const thematicArea =
      await this.activitiesService.getActivityThematicAreaById(
        report.thematicAreaId,
      );
    let thematicAreaValue;
    if (thematicArea.thematicAreaName === 'Other') {
      thematicAreaValue = report.otherThematicArea;
    } else {
      thematicAreaValue = thematicArea.thematicAreaName;
    }

    const activityType = await this.activitiesService.getTypeOfActivityById(
      report.activityTypeId,
    );
    const activityScope = await this.activitiesService.getActivityScopeById(
      report.activityScopeId,
    );
    console.log('activityScope = ', activityScope);
    let countryName;

    if (report.countryId) {
      countryName = await this.activitiesService.getCountryNameById(
        report.countryId,
      );
      console.log('countryName = ', countryName);
    }

    const statusName = await this.userService.getStatusName(
      report.outputReportStatus,
    );

    let outputReportSheet,
      activityParticipationSheet,
      profileAgeSheet,
      countrySheet,
      regionSheet,
      institutionalAffiliationSheet,
      knowledgeBeforeParticipatingSheet,
      knowledgeAfterParticipatingSheet,
      overallLearningObjectiveSheet,
      sustainableWaterResourceManagementSheet,
      levelOfExpectationsMetSheet,
      knowledgeApplicationSheet;

    if (!workbook.getWorksheet('Output_Report_Details'))
      outputReportSheet = workbook.addWorksheet('Output_Report_Details');
    else outputReportSheet = workbook.getWorksheet('Output_Report_Details');

    outputReportSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 40 },
      { header: 'Institute Name', key: 'instituteName', width: 20 },
      { header: 'Thematic Area', key: 'thematicArea', width: 40 },
      { header: 'Activity Start Date', key: 'activityStartDate', width: 20 },
      { header: 'Activity End Date', key: 'activityEndDate', width: 20 },
      { header: 'Activity Type', key: 'typeOfActivity', width: 40 },
      { header: 'Language', key: 'language', width: 20 },
      { header: 'Activity Scope', key: 'activityScope', width: 20 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'City/Town', key: 'cityTown', width: 20 },
      { header: 'Main Partners', key: 'mainPartners', width: 20 },
      { header: 'Expected Outputs', key: 'expectedOutputs', width: 20 },
      { header: 'Completed Outputs', key: 'completedOutputs', width: 20 },
      {
        header: 'Practice New Technologies',
        key: 'inclusionOrPracticeOfNewTechnologies',
        width: 20,
      },
      {
        header: 'More Inclusion Details',
        key: ' moreInclusionDetails',
        width: 20,
      },
      {
        header: 'Address Social Inclusion Issue',
        key: 'addressSocialInclusionIssue',
        width: 20,
      },
      {
        header: 'More Details Address Social Inclusion Issue',
        key: 'moreDetailsOnAddressSocialInclusionIssue',
        width: 20,
      },
      {
        header: 'Gender Specific Methodology',
        key: 'includeGenderSpecificMethodology',
        width: 20,
      },
      {
        header: 'More Details Gender Specific Methodology',
        key: 'moreDetailsOnGenderSpecificMethodology',
        width: 20,
      },
      { header: 'Facilitators', key: 'facilitators', width: 20 },
      {
        header: 'Enrollment Method',
        key: 'methodOfEnrollmentInActivity',
        width: 20,
      },
      {
        header: 'Exit Survey Method',
        key: 'methodOfFillingExitSurvey',
        width: 20,
      },
      {
        header: 'Capnet Affiliation',
        key: 'participantProfileCapnetAffiliation',
        width: 20,
      },
      { header: 'Report Status', key: 'outputReportStatus', width: 20 },
      { header: 'Submitted Date', key: 'submittedAt', width: 20 },
      { header: 'Approval Date', key: 'approvedAt', width: 20 },
      {
        header: 'Exit Survey Response Rate',
        key: 'exitSurveyResponseRate',
        width: 20,
      },
    ];

    outputReportSheet.addRow({
      year: report.year,
      reportCode: report.outputReportCode,
      activityCode: report.activityCode,
      activityName: report.activityName,
      instituteName: report.instituteName,
      thematicArea: thematicAreaValue,
      activityStartDate: report.activityStartDate,
      activityEndDate: report.activityEndDate,
      typeOfActivity: activityType.activityTypeName,
      language: report.language,
      activityScope: activityScope.activityScopeName,
      country: !countryName ? 'NA' : countryName,
      cityTown: !report.cityTown ? 'NA' : report.cityTown,
      mainPartners: report.mainPartners,
      expectedOutputs: report.expectedOutputs,
      completedOutputs: report.completedOutputs,
      inclusionOrPracticeOfNewTechnologies:
        report.inclusionOrPracticeOfNewTechnologies ? 'Yes' : 'No',
      moreInclusionDetails: report.moreInclusionDetails,
      addressSocialInclusionIssue: report.addressSocialInclusionIssue
        ? 'Yes'
        : 'No',
      moreDetailsOnAddressSocialInclusionIssue:
        report.moreDetailsOnAddressSocialInclusionIssue,
      includeGenderSpecificMethodology: report.includeGenderSpecificMethodology
        ? 'Yes'
        : 'No',
      moreDetailsOnGenderSpecificMethodology:
        report.moreDetailsOnGenderSpecificMethodology,
      facilitators: report.facilitators,
      methodOfEnrollmentInActivity: report.methodOfEnrollmentInActivity,
      methodOfFillingExitSurvey: report.methodOfFillingExitSurvey,
      participantProfileCapnetAffiliation:
        report.participantProfileCapnetAffiliation,
      outputReportStatus: statusName,
      submittedAt: report.submittedAt,
      approvedAt: report.approvedAt,
      exitSurveyResponseRate: report.exitSurveyResponseRate,
    });

    outputReportSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // if (!workbook.getWorksheet('Case_Study'))
    //   caseStudySheet = workbook.addWorksheet('Case_Study');
    // else caseStudySheet = workbook.getWorksheet('Case_Study');

    // await this.downloadCaseStudyManual(
    //   report.year,
    //   caseStudySheet,
    //   report.activityCode,
    //   report.activityName,
    //   report.outputReportCode,
    //   report.caseStudyManual,
    // );
    if (!workbook.getWorksheet('Activity_Participation'))
      activityParticipationSheet = workbook.addWorksheet(
        'Activity_Participation',
      );
    else
      activityParticipationSheet = workbook.getWorksheet(
        'Activity_Participation',
      );

    await this.downloadActivityParticipation(
      report.year,
      activityParticipationSheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.participantProfileActivityParticipation,
    );
    if (!workbook.getWorksheet('Age_Profile'))
      profileAgeSheet = workbook.addWorksheet('Age_Profile');
    else profileAgeSheet = workbook.getWorksheet('Age_Profile');

    await this.downloadProfileAge(
      report.year,
      profileAgeSheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.participantProfileAge,
    );
    if (!workbook.getWorksheet('Country'))
      countrySheet = workbook.addWorksheet('Country');
    else countrySheet = workbook.getWorksheet('Country');
    await this.downloadProfileCountry(
      report.year,
      countrySheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.participantProfileCountry,
    );
    if (!workbook.getWorksheet('Region'))
      regionSheet = workbook.addWorksheet('Region');
    else regionSheet = workbook.getWorksheet('Region');

    await this.downloadProfileRegion(
      report.year,
      regionSheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.participantProfileRegion,
    );

    if (!workbook.getWorksheet('Institutional_Affiliation'))
      institutionalAffiliationSheet = workbook.addWorksheet(
        'Institutional_Affiliation',
      );
    else
      institutionalAffiliationSheet = workbook.getWorksheet(
        'Institutional_Affiliation',
      );
    await this.downloadProfileInstitutionalAffiliation(
      report.year,
      institutionalAffiliationSheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.participantProfileInstitutionalAffiliation,
    );

    if (!workbook.getWorksheet('Knowledge_Before_Participating'))
      knowledgeBeforeParticipatingSheet = workbook.addWorksheet(
        'Knowledge_Before_Participating',
      );
    else
      knowledgeBeforeParticipatingSheet = workbook.getWorksheet(
        'Knowledge_Before_Participating',
      );
    await this.downloadKnowledgeParticipating(
      report.year,
      knowledgeBeforeParticipatingSheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.degreeOfKnowledgeBeforeParticipating,
    );

    if (!workbook.getWorksheet('Knowledge_After_Participating'))
      knowledgeAfterParticipatingSheet = workbook.addWorksheet(
        'Knowledge_After_Participating',
      );
    else
      knowledgeAfterParticipatingSheet = workbook.getWorksheet(
        'Knowledge_After_Participating',
      );

    await this.downloadKnowledgeParticipating(
      report.year,
      knowledgeAfterParticipatingSheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.degreeOfKnowledgeAfterParticipating,
    );

    if (!workbook.getWorksheet('Overall_Learning_Objective'))
      overallLearningObjectiveSheet = workbook.addWorksheet(
        'Overall_Learning_Objective',
      );
    else
      overallLearningObjectiveSheet = workbook.getWorksheet(
        'Overall_Learning_Objective',
      );

    await this.downloadOverallLearningObjective(
      report.year,
      overallLearningObjectiveSheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.benefitOnOverallLearningObjective,
    );

    if (!workbook.getWorksheet('Water_Resource_Management'))
      sustainableWaterResourceManagementSheet = workbook.addWorksheet(
        'Water_Resource_Management',
      );
    else
      sustainableWaterResourceManagementSheet = workbook.getWorksheet(
        'Water_Resource_Management',
      );
    await this.downloadWaterResourceManagement(
      report.year,
      sustainableWaterResourceManagementSheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.relevanceInSustainableWaterResourceManagement,
    );

    if (!workbook.getWorksheet('Level_Of_Expectations_Met'))
      levelOfExpectationsMetSheet = workbook.addWorksheet(
        'Level_Of_Expectations_Met',
      );
    else
      levelOfExpectationsMetSheet = workbook.getWorksheet(
        'Level_Of_Expectations_Met',
      );
    await this.downloadExpectationsMet(
      report.year,
      levelOfExpectationsMetSheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.levelOfExpectationsMet,
    );

    if (!workbook.getWorksheet('Knowledge_Application'))
      knowledgeApplicationSheet = workbook.addWorksheet(
        'Knowledge_Application',
      );
    else
      knowledgeApplicationSheet = workbook.getWorksheet(
        'Knowledge_Application',
      );
    await this.downloadKnowledgeApplication(
      report.year,
      knowledgeApplicationSheet,
      report.activityCode,
      report.activityName,
      report.outputReportCode,
      report.knowledgeApplication,
    );
  }

  async downloadIndividualOutputReport(res, reportId: string) {
    Logger.debug('ReportsService.downloadIndividualOutputReport');
    const workbook = new Workbook();
    // const outputReport = await this.getOutputReportById(reportId);
    const outputReport = await this.outputReportModel
      .findOne({ outputReportId: reportId, isDeleted: false })
      .exec();
    console.log('outputReport in individual = ', outputReport);
    await this.downloadOutputReport(res, outputReport, workbook);
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' +
        'OutputReport-' +
        outputReport.outputReportCode +
        '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async downloadMultipleOutputReports(res, year: number) {
    Logger.debug('ReportsService.downloadMultipleOutputReports');
    const workbook = new Workbook();
    const outputReports = await this.outputReportModel
      .find({
        year,
        isDeleted: false,
      })
      .exec();
    console.log('outputReport in multiple = ', outputReports);
    for (const report of outputReports) {
      await this.downloadOutputReport(res, report, workbook);
    }
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'All Output Reports-' + year + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  /**Outcome Report APIs Service */

  async getEnrolledCount(activityCode: string, year: number) {
    Logger.debug('ReportsService.getEnrolledCount');
    const existingOutputReport = await this.outputReportModel
      .findOne({
        year,
        activityCode,
        isDeleted: false,
      })
      .exec();

    return {
      enrolledParticipants:
        existingOutputReport.participantProfileActivityParticipation.enrolled,
    };
  }

  //Gender-wise knowledge shared
  async getCountKnowledgeShared(outcomeReportId: string, user: any) {
    Logger.debug('StaticSurveyService.getCountKnowledgeShared');
    const outcomeReport = await this.outcomeReportModel
      .findOne({
        outcomeReportId,
        isDeleted: false,
      })
      .exec();

    return this.staticSurveyService.getParticipantCountByKnowledgeShared(
      outcomeReport.proposalId,
      user,
    );
  }

  async addOutcomeReport(
    createOutcomeReportDto: CreateOutcomeReportDTO,
    user: any,
  ) {
    Logger.debug('ReportsService.addOutcomeReport');

    let instituteName, existingOutcomeReport, existingOutputReport;

    const statusId = await this.userService.getStatusId(StatusEnum.IN_PROGRESS);
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    if (user.networkId === null && user.partnerId === null) {
      existingOutcomeReport = await this.outcomeReportModel
        .findOne({
          year: createOutcomeReportDto.year,
          activityCode: createOutcomeReportDto.activityCode,
          isDeleted: false,
          instituteName: CapnetEnum.CAPNET,
        })
        .exec();

      if (existingOutcomeReport)
        throw new ConflictException(errorMessages.OUTCOME_REPORT_EXISTS);

      existingOutputReport = await this.outputReportModel
        .findOne({
          year: createOutcomeReportDto.year,
          activityCode: createOutcomeReportDto.activityCode,
          outputReportStatus: approvedStatusId,
          isDeleted: false,
          instituteName: CapnetEnum.CAPNET,
        })
        .exec();
      if (!existingOutputReport)
        throw new NotFoundException(errorMessages.Report_NOT_FOUND);
      instituteName = CapnetEnum.CAPNET;
    } else if (user.networkId) {
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
      existingOutcomeReport = await this.outcomeReportModel
        .findOne({
          year: createOutcomeReportDto.year,
          activityCode: createOutcomeReportDto.activityCode,
          isDeleted: false,
          instituteName,
        })
        .exec();

      if (existingOutcomeReport)
        throw new ConflictException(errorMessages.OUTCOME_REPORT_EXISTS);

      existingOutputReport = await this.outputReportModel
        .findOne({
          year: createOutcomeReportDto.year,
          activityCode: createOutcomeReportDto.activityCode,
          outputReportStatus: approvedStatusId,
          isDeleted: false,
          instituteName,
        })
        .exec();
      if (!existingOutputReport)
        throw new NotFoundException(errorMessages.Report_NOT_FOUND);
    } else if (user.partnerId) {
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
      existingOutcomeReport = await this.outcomeReportModel
        .findOne({
          year: createOutcomeReportDto.year,
          activityCode: createOutcomeReportDto.activityCode,
          isDeleted: false,
          instituteName,
        })
        .exec();

      if (existingOutcomeReport)
        throw new ConflictException(errorMessages.OUTCOME_REPORT_EXISTS);

      existingOutputReport = await this.outputReportModel
        .findOne({
          year: createOutcomeReportDto.year,
          activityCode: createOutcomeReportDto.activityCode,
          outputReportStatus: approvedStatusId,
          isDeleted: false,
          instituteName,
        })
        .exec();
      if (!existingOutputReport)
        throw new NotFoundException(errorMessages.Report_NOT_FOUND);
    }

    const genderWiseTotal = await this.getGenderCountTotal(
      existingOutputReport.participantProfileActivityParticipation,
    );
    console.log('genderWiseTotal.enrolled = ', genderWiseTotal.enrolledTotal);

    const newOutcomeReport = await this.outcomeReportModel.create({
      ...createOutcomeReportDto,
      outcomeReportId: uuidv4(),
      instituteName,
      outcomeReportStatus: statusId,
      statusName: 'In Progress',
      networkId: user.networkId,
      partnerId: user.partnerId,
      createdBy: user._id,
      updatedBy: user._id,
    });

    await this.melpService.addActivityLog(
      user,
      `Outcome Report - ${newOutcomeReport.outcomeReportCode} created.`,
    );

    Logger.debug('Created new outcome report');
    Logger.verbose(newOutcomeReport);

    return {
      newOutcomeReport,
    };
  }

  async getOutcomeReportById(reportId: string) {
    Logger.debug('ReportsService.getOutcomeReportById');
    let outcomeReport;
    try {
      outcomeReport = await this.outcomeReportModel
        .aggregate([
          {
            $match: {
              outcomeReportId: reportId,
              isDeleted: false,
            },
          },
          {
            $lookup: {
              from: 'activityproposals',
              let: { id: '$proposalId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', '$$id'] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'proposalData',
            },
          },
          { $unwind: '$proposalData' },
        ])
        .exec();
      
      let originalName;
      if (
        outcomeReport[0].additionalInfoFile &&
        outcomeReport[0].additionalInfoFile.fileName
      )
        originalName =
          outcomeReport[0].additionalInfoFile.fileName.split(' -')[0];

      return {
        outcomeReport,
        originalName: originalName ? originalName : '',
      };
    } catch (error) {
      console.log('getOutcomeReportById.catch', error);
      throw new InternalServerErrorException();
      /**Throw appropriate error */
    }
  }

  async getOutcomeReportByActivityProposalId(proposalId: any) {
    Logger.debug('ReportsService.getOutcomeReportByActivityProposalId');
    proposalId = new Types.ObjectId(proposalId);
    console.log('proposalId in service type = ', proposalId);
    let outcomeReport;

    try {
      outcomeReport = 
      await this.outcomeReportModel
        .aggregate([
          {
            $match: {
              proposalId,
              isDeleted: false,
            },
          },
          {
            $lookup: {
              from: 'activityproposals',
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', proposalId] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'proposalData',
            },
          },
          { $unwind: '$proposalData' },
        ])
        .exec();
        let originalName;
        if (
          outcomeReport[0].additionalInfoFile &&
          outcomeReport[0].additionalInfoFile.fileName
        )
          originalName =
            outcomeReport[0].additionalInfoFile.fileName.split(' -')[0];
  
        return {
          outcomeReport,
          originalName: originalName ? originalName : '',
        };
  
    } catch (error) {
      console.log('getOutcomeReportByActivityProposalId.catch', error);
      throw new InternalServerErrorException(error);
    }
  }

  async getAllOutcomeReports(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    sortType: string,
    sortDirection: number,
    year: number,
  ) {
    Logger.debug('ReportsService.getAllOutcomeReports');
    const sortObject = {};
    const stype = sortType;
    const sdir = sortDirection;
    sortObject[stype] = sdir;
    const inprogressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );

    const regex = new RegExp(searchKeyword, 'i');
    const allReportsData = await this.outcomeReportModel
      .aggregate([
        {
          $match: {
            $and: [
              {
                year,
                isDeleted: false,
              },
              {
                $or: [
                  {
                    $and: [
                      { instituteName: { $ne: CapnetEnum.CAPNET } },
                      { outcomeReportStatus: { $ne: inprogressStatusId } },
                    ],
                  },
                  { instituteName: CapnetEnum.CAPNET },
                ],
              },
              {
                $or: [
                  { instituteName: { $regex: regex } },
                  { activityCode: { $regex: regex } },
                  { activityName: { $regex: regex } },
                ],
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'activityproposals',
            let: { id: '$proposalId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$id'] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'proposalData',
          },
        },
        { $unwind: '$proposalData' },
        { $sort: sortObject },
        {
          $facet: {
            records: [{ $skip: pageIndex * pageSize }, { $limit: pageSize }],
            // totalCount: [{ $count: 'count' }],
          },
        },
      ])
      .exec();
    const count = allReportsData[0].records.length;

    let statusName;
    for (const data of allReportsData[0].records) {
      statusName = await this.userService.getStatusName(
        data.outcomeReportStatus,
      );
      data.statusName = statusName;
    }
    console.log('allReportsData = ', allReportsData);

    return { records: allReportsData[0].records, count: Math.ceil(count / 10) };
  }

  async updateOutcomeReport(
    reportId: string,
    editReportDTO: EditOutcomeReportDTO,
    user: any,
  ) {
    Logger.debug('ReportsService.updateOutcomeReport');
    try {
      const foundRecord = await this.outcomeReportModel
        .findOne({
          outcomeReportId: reportId,
          isDeleted: false,
        })
        .exec();
      console.log('foundRecord = ', foundRecord);
      let result;

      console.log(
        'editReportDTO.additionalInfoFile = ',
        editReportDTO.additionalInfoFile,
      );
      if (editReportDTO.additionalInfoFile) {
        result =
          editReportDTO.additionalInfoFile['fileName'].toUpperCase() ===
          foundRecord.additionalInfoFile['fileName'].toUpperCase();
        if (!result) {
          await this.deletePublicFile(
            foundRecord.additionalInfoFile['fileName'],
          );
        }
      }

      const updatedReport = await this.outcomeReportModel
        .findOneAndUpdate(
          { outcomeReportId: reportId, isDeleted: false },
          editReportDTO,
          {
            new: true,
          },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Outcome Report - ${updatedReport.outcomeReportCode} has been updated.`,
      );

      return updatedReport;
    } catch (error) {
      /**Handle errors here */
      Logger.debug('Catch: ReportsService.updateReport');
      console.log(error);
      return error;
    }
  }

  async getOutcomeAndOutputReportStatusWiseCount(
    year: number,
    networkId: any,
    partnerId: any,
  ) {
    Logger.debug('ReportsService.getOutcomeAndOutputReportStatusWiseCount');
    if (networkId === 'null') networkId = null;
    else networkId = new Types.ObjectId(networkId);

    if (partnerId === 'null') partnerId = null;
    else partnerId = new Types.ObjectId(partnerId);

    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const submittedStatusId = await this.userService.getStatusId(
      StatusEnum.SUBMITTED,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );

    let outputSubmittedCount = 0,
      outputApprovedCount = 0,
      outputDeniedCount = 0,
      outputInfoRequestedCount = 0,
      outcomeSubmittedCount = 0,
      outcomeApprovedCount = 0,
      outcomeDeniedCount = 0,
      outcomeInfoRequestedCount = 0;

    if (networkId === null && partnerId === null) {
      outputSubmittedCount += await this.outputReportModel
        .find({ year, isDeleted: false, outputReportStatus: submittedStatusId })
        .count()
        .exec();

      outputApprovedCount += await this.outputReportModel
        .find({ year, isDeleted: false, outputReportStatus: approvedStatusId })
        .count()
        .exec();

      outputDeniedCount += await this.outputReportModel
        .find({ year, isDeleted: false, outputReportStatus: deniedStatusId })
        .count()
        .exec();

      outputInfoRequestedCount += await this.outputReportModel
        .find({
          year,
          isDeleted: false,
          outputReportStatus: infoRequestedStatusId,
        })
        .count()
        .exec();

      outcomeSubmittedCount += await this.outcomeReportModel
        .find({
          year,
          isDeleted: false,
          outcomeReportStatus: submittedStatusId,
        })
        .count()
        .exec();

      outcomeApprovedCount += await this.outcomeReportModel
        .find({ year, isDeleted: false, outcomeReportStatus: approvedStatusId })
        .count()
        .exec();

      outcomeDeniedCount += await this.outcomeReportModel
        .find({ year, isDeleted: false, outcomeReportStatus: deniedStatusId })
        .count()
        .exec();

      outcomeInfoRequestedCount += await this.outcomeReportModel
        .find({
          year,
          isDeleted: false,
          outcomeReportStatus: infoRequestedStatusId,
        })
        .count()
        .exec();
    } else {
      outputSubmittedCount += await this.outputReportModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          outputReportStatus: submittedStatusId,
        })
        .count()
        .exec();

      outputApprovedCount += await this.outputReportModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          outputReportStatus: approvedStatusId,
        })
        .count()
        .exec();

      outputDeniedCount += await this.outputReportModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          outputReportStatus: deniedStatusId,
        })
        .count()
        .exec();

      outputInfoRequestedCount += await this.outputReportModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          outputReportStatus: infoRequestedStatusId,
        })
        .count()
        .exec();

      outcomeSubmittedCount += await this.outcomeReportModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          outcomeReportStatus: submittedStatusId,
        })
        .count()
        .exec();

      outcomeApprovedCount += await this.outcomeReportModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          outcomeReportStatus: approvedStatusId,
        })
        .count()
        .exec();

      outcomeDeniedCount += await this.outcomeReportModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          outcomeReportStatus: deniedStatusId,
        })
        .count()
        .exec();

      outcomeInfoRequestedCount += await this.outcomeReportModel
        .find({
          year,
          isDeleted: false,
          networkId: networkId,
          partnerId: partnerId,
          outcomeReportStatus: infoRequestedStatusId,
        })
        .count()
        .exec();
    }

    return {
      outputSubmittedCount,
      outputApprovedCount,
      outputDeniedCount,
      outputInfoRequestedCount,
      outcomeSubmittedCount,
      outcomeApprovedCount,
      outcomeDeniedCount,
      outcomeInfoRequestedCount,
    };
  }

  async commonFunctionForParticipantionCounts(
    outputReportList: OutputReport[],
  ) {
    Logger.debug('ReportsService.commonFunctionForParticipantionCounts');
    let manCount = 0,
      womanCount = 0,
      otherCount = 0,
      notSayCount = 0,
      below18Count = 0,
      below25Count = 0,
      below65Count = 0,
      above65Count = 0,
      americaRegionCount = 0,
      africaRegionCount = 0,
      arabRegionCount = 0,
      asiaRegionCount = 0,
      europeRegionCount = 0,
      govtCount = 0,
      unCount = 0,
      ngoCount = 0,
      riverCount = 0,
      academiaCount = 0,
      privateCount = 0,
      waterUtilityCount = 0,
      independentCount = 0;

    for (const outputReport of outputReportList) {
      // gender wise counts
      manCount +=
        outputReport.participantProfileActivityParticipation.enrolled['male'];
      womanCount +=
        outputReport.participantProfileActivityParticipation.enrolled['female'];
      otherCount +=
        outputReport.participantProfileActivityParticipation.enrolled['other'];
      notSayCount +=
        outputReport.participantProfileActivityParticipation.enrolled[
          'ratherNotSay'
        ];

      // age wise counts
      below18Count += outputReport.participantProfileAge['below18'];
      below25Count += outputReport.participantProfileAge['below25'];
      below65Count += outputReport.participantProfileAge['below65'];
      above65Count += outputReport.participantProfileAge['above65'];

      //region wise counts
      for (const region of outputReport.participantProfileRegion) {
        if (region.key === RegionEnum.ASIA) asiaRegionCount += region.value;
        if (region.key === RegionEnum.AMERICA)
          americaRegionCount += region.value;
        if (region.key === RegionEnum.AFRICA) africaRegionCount += region.value;
        if (region.key === RegionEnum.ARAB) arabRegionCount += region.value;
        if (region.key === RegionEnum.EUROPE) europeRegionCount += region.value;
      }

      // type of institution wise counts
      for (const institutionalAffiliation of outputReport.participantProfileInstitutionalAffiliation) {
        if (institutionalAffiliation.key === TypeOfInstitutionEnum.GOVT)
          govtCount += institutionalAffiliation.value;
        else if (institutionalAffiliation.key === TypeOfInstitutionEnum.UN)
          unCount += institutionalAffiliation.value;
        else if (institutionalAffiliation.key === TypeOfInstitutionEnum.NGO)
          ngoCount += institutionalAffiliation.value;
        else if (
          institutionalAffiliation.key === TypeOfInstitutionEnum.ACADEMIA
        )
          academiaCount += institutionalAffiliation.value;
        else if (institutionalAffiliation.key === TypeOfInstitutionEnum.RIVER)
          riverCount += institutionalAffiliation.value;
        else if (institutionalAffiliation.key === TypeOfInstitutionEnum.UTILITY)
          waterUtilityCount += institutionalAffiliation.value;
        else if (institutionalAffiliation.key === TypeOfInstitutionEnum.PRIVATE)
          privateCount += institutionalAffiliation.value;
        else if (
          institutionalAffiliation.key === TypeOfInstitutionEnum.INDEPENDENT
        )
          independentCount += institutionalAffiliation.value;
      }
    }

    const genderCount = manCount + womanCount + otherCount + notSayCount;
    const ageCount = below18Count + below25Count + below65Count + above65Count;
    const regionCount =
      asiaRegionCount +
      americaRegionCount +
      africaRegionCount +
      arabRegionCount +
      europeRegionCount;
    const typeOfInstitutionCount =
      govtCount +
      unCount +
      ngoCount +
      academiaCount +
      riverCount +
      waterUtilityCount +
      privateCount +
      independentCount;

    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      genderCount,
      below18Count,
      below25Count,
      below65Count,
      above65Count,
      ageCount,
      americaRegionCount,
      asiaRegionCount,
      africaRegionCount,
      arabRegionCount,
      europeRegionCount,
      regionCount,
      govtCount,
      unCount,
      ngoCount,
      academiaCount,
      riverCount,
      waterUtilityCount,
      privateCount,
      independentCount,
      typeOfInstitutionCount,
    };
  }

  async getParticipationInfo(year: number, user: any) {
    Logger.debug('ReportsService.getParticipationInfo');
    if (user.networkId === null && user.partnerId === null) {
      const outputReportList = await this.outputReportModel
        .find({ isDeleted: false, year })
        .exec();
      return this.commonFunctionForParticipantionCounts(outputReportList);
    } else {
      const outputReportList = await this.outputReportModel
        .find({
          year,
          isDeleted: false,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
      return this.commonFunctionForParticipantionCounts(outputReportList);
    }
  }

  async commonFunctionForOutputReportSummaryInfo(
    outputReportList: OutputReport[],
  ) {
    Logger.debug('ReportsService.commonFunctionForOutputReportSummaryInfo');
    let veryHighKnowledgeCount = 0,
      highKnowledgeCount = 0,
      mediumKnowledgeCount = 0,
      lowKnowledgeCount = 0,
      noKnowledgeCount = 0,
      veryBeneficialCount = 0,
      somewhatBeneficialCount = 0,
      notBeneficialCount = 0,
      extremelyRelevantCount = 0,
      relevantCount = 0,
      slightlyRelevantCount = 0,
      notRelevantCount = 0,
      exceededExpectationCount = 0,
      partialExpectationCount = 0,
      fullExpectationCount = 0,
      noExpectationCount = 0,
      instituteKnowledgeCount = 0,
      outsideKnowledgeCount = 0,
      waterSectorKnowledgeCount = 0,
      educationPurposeKnowledgeCount = 0,
      communityChangesKnowledgeCount = 0,
      policyChangesKnowledgeCount = 0,
      waterPloicyKnowledgeCount = 0,
      notApplyKnowledgeCount = 0;
    for (const outputReport of outputReportList) {
      for (const degreeOfKnowledge of outputReport.degreeOfKnowledgeAfterParticipating) {
        if (degreeOfKnowledge.key === DegreeOfKnowledgeGainedEnum.VERYHIGH)
          veryHighKnowledgeCount += degreeOfKnowledge.value;
        else if (degreeOfKnowledge.key === DegreeOfKnowledgeGainedEnum.HIGH)
          highKnowledgeCount += degreeOfKnowledge.value;
        else if (degreeOfKnowledge.key === DegreeOfKnowledgeGainedEnum.MEDIUM)
          mediumKnowledgeCount += degreeOfKnowledge.value;
        else if (degreeOfKnowledge.key === DegreeOfKnowledgeGainedEnum.LOW)
          lowKnowledgeCount += degreeOfKnowledge.value;
        else if (degreeOfKnowledge.key === DegreeOfKnowledgeGainedEnum.NONE)
          noKnowledgeCount += degreeOfKnowledge.value;
      }

      for (const benefitLevel of outputReport.benefitOnOverallLearningObjective) {
        if (benefitLevel.key === BenefitsLevelEnum.BENEFICIAL)
          veryBeneficialCount += benefitLevel.value;
        else if (benefitLevel.key === BenefitsLevelEnum.SOMEWHATBENEFICIAL)
          somewhatBeneficialCount += benefitLevel.value;
        else if (benefitLevel.key === BenefitsLevelEnum.NOTBENEFICIAL)
          notBeneficialCount += benefitLevel.value;
      }

      for (const relevanceLevel of outputReport.relevanceInSustainableWaterResourceManagement) {
        if (relevanceLevel.key === RelevanceLevelEnum.EXTREME)
          extremelyRelevantCount += relevanceLevel.value;
        else if (relevanceLevel.key === RelevanceLevelEnum.RELEVANT)
          relevantCount += relevanceLevel.value;
        else if (relevanceLevel.key === RelevanceLevelEnum.SLIGHTLY)
          slightlyRelevantCount += relevanceLevel.value;
        else if (relevanceLevel.key === RelevanceLevelEnum.NOTRELEVANT)
          notRelevantCount += relevanceLevel.value;
      }

      for (const expectationLevel of outputReport.levelOfExpectationsMet) {
        if (expectationLevel.key === ExpectationLevelEnum.EXCEEDED)
          exceededExpectationCount += expectationLevel.value;
        else if (expectationLevel.key === ExpectationLevelEnum.FULL)
          fullExpectationCount += expectationLevel.value;
        else if (expectationLevel.key === ExpectationLevelEnum.PARTIAL)
          partialExpectationCount += expectationLevel.value;
        else if (expectationLevel.key === ExpectationLevelEnum.NOTMET)
          noExpectationCount += expectationLevel.value;
      }

      for (const knowledgeApplication of outputReport.knowledgeApplication) {
        if (knowledgeApplication.key === KnowledgeGainedEnum.INSIDE_INSTITUTION)
          instituteKnowledgeCount += knowledgeApplication.value;
        else if (
          knowledgeApplication.key === KnowledgeGainedEnum.OUTSIDE_INSTITUTION
        )
          outsideKnowledgeCount += knowledgeApplication.value;
        else if (knowledgeApplication.key === KnowledgeGainedEnum.ROUTINE)
          waterSectorKnowledgeCount += knowledgeApplication.value;
        else if (knowledgeApplication.key === KnowledgeGainedEnum.EDUCATIONAL)
          educationPurposeKnowledgeCount += knowledgeApplication.value;
        else if (knowledgeApplication.key === KnowledgeGainedEnum.IMPROVEMENTS)
          communityChangesKnowledgeCount += knowledgeApplication.value;
        else if (knowledgeApplication.key === KnowledgeGainedEnum.POLICY_LEVEL)
          policyChangesKnowledgeCount += knowledgeApplication.value;
        else if (knowledgeApplication.key === KnowledgeGainedEnum.LAW)
          waterPloicyKnowledgeCount += knowledgeApplication.value;
        else if (knowledgeApplication.key === KnowledgeGainedEnum.NOT_APPLIED)
          notApplyKnowledgeCount += knowledgeApplication.value;
      }
    }

    return {
      degreeOfKnowledge: {
        veryHighKnowledgeCount,
        highKnowledgeCount,
        mediumKnowledgeCount,
        lowKnowledgeCount,
        noKnowledgeCount,
      },
      levelOfBenefits: {
        veryBeneficialCount,
        somewhatBeneficialCount,
        notBeneficialCount,
      },
      levelOfRelevance: {
        extremelyRelevantCount,
        relevantCount,
        slightlyRelevantCount,
        notRelevantCount,
      },
      levelOfExpectation: {
        exceededExpectationCount,
        partialExpectationCount,
        fullExpectationCount,
        noExpectationCount,
      },
      knowledgeApplication: {
        instituteKnowledgeCount,
        outsideKnowledgeCount,
        waterSectorKnowledgeCount,
        educationPurposeKnowledgeCount,
        communityChangesKnowledgeCount,
        policyChangesKnowledgeCount,
        waterPloicyKnowledgeCount,
        notApplyKnowledgeCount,
      },
    };
  }

  async getOutputReportSummary(year: number, user: any) {
    Logger.debug('ReportsService.getOutputReportSummary');
    if (user.networkId === null && user.partnerId === null) {
      const outputReportList = await this.outputReportModel
        .find({ isDeleted: false, year })
        .exec();
      return this.commonFunctionForOutputReportSummaryInfo(outputReportList);
    } else {
      const outputReportList = await this.outputReportModel
        .find({
          year,
          isDeleted: false,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
      return this.commonFunctionForOutputReportSummaryInfo(outputReportList);
    }
  }

  async commonFunctionForOutcomeReportSummaryInfo(
    outcomeReportList: OutcomeReport[],
  ) {
    Logger.debug('ReportsService.commonFunctionForOutcomeReportSummaryInfo');
    let govtCount = 0,
      unCount = 0,
      ngoCount = 0,
      riverCount = 0,
      academiaCount = 0,
      privateCount = 0,
      waterUtilityCount = 0,
      independentCount = 0,
      countriesCount = 0,
      raisingAwarenessCount = 0,
      routineWorkKnowledgeCount = 0,
      educationPurposeKnowledgeCount = 0,
      waterProjectCount = 0,
      technologyInnovationCount = 0,
      sdgCount = 0,
      waterPolicyCount = 0;
    for (const outcomeReport of outcomeReportList) {
      raisingAwarenessCount +=
        outcomeReport.knowledgeAppliedByGender.raisingAwareness['male'] +
        outcomeReport.knowledgeAppliedByGender.raisingAwareness['female'] +
        outcomeReport.knowledgeAppliedByGender.raisingAwareness['other'] +
        outcomeReport.knowledgeAppliedByGender.raisingAwareness['ratherNotSay'];

      routineWorkKnowledgeCount +=
        outcomeReport.knowledgeAppliedByGender.knowledgeInRoutineWork['male'] +
        outcomeReport.knowledgeAppliedByGender.knowledgeInRoutineWork[
          'female'
        ] +
        outcomeReport.knowledgeAppliedByGender.knowledgeInRoutineWork['other'] +
        outcomeReport.knowledgeAppliedByGender.knowledgeInRoutineWork[
          'ratherNotSay'
        ];

      educationPurposeKnowledgeCount +=
        outcomeReport.knowledgeAppliedByGender.knowledgeInEducation['male'] +
        outcomeReport.knowledgeAppliedByGender.knowledgeInEducation['female'] +
        outcomeReport.knowledgeAppliedByGender.knowledgeInEducation['other'] +
        outcomeReport.knowledgeAppliedByGender.knowledgeInEducation[
          'ratherNotSay'
        ];

      waterProjectCount +=
        outcomeReport.knowledgeAppliedByGender.waterProjectImplementation[
          'male'
        ] +
        outcomeReport.knowledgeAppliedByGender.waterProjectImplementation[
          'female'
        ] +
        outcomeReport.knowledgeAppliedByGender.waterProjectImplementation[
          'other'
        ] +
        outcomeReport.knowledgeAppliedByGender.waterProjectImplementation[
          'ratherNotSay'
        ];

      technologyInnovationCount +=
        outcomeReport.knowledgeAppliedByGender.techInnovation['male'] +
        outcomeReport.knowledgeAppliedByGender.techInnovation['female'] +
        outcomeReport.knowledgeAppliedByGender.techInnovation['other'] +
        outcomeReport.knowledgeAppliedByGender.techInnovation['ratherNotSay'];

      sdgCount +=
        outcomeReport.knowledgeAppliedByGender.achieveSGD['male'] +
        outcomeReport.knowledgeAppliedByGender.achieveSGD['female'] +
        outcomeReport.knowledgeAppliedByGender.achieveSGD['other'] +
        outcomeReport.knowledgeAppliedByGender.achieveSGD['ratherNotSay'];

      waterPolicyCount +=
        outcomeReport.knowledgeAppliedByGender.formulatingWaterPolicy['male'] +
        outcomeReport.knowledgeAppliedByGender.formulatingWaterPolicy[
          'female'
        ] +
        outcomeReport.knowledgeAppliedByGender.formulatingWaterPolicy['other'] +
        outcomeReport.knowledgeAppliedByGender.formulatingWaterPolicy[
          'ratherNotSay'
        ];

      for (const institutionalChange of outcomeReport.policyChangesByInstitution) {
        if (institutionalChange.key === TypeOfInstitutionEnum.GOVT)
          govtCount += institutionalChange.value;
        else if (institutionalChange.key === TypeOfInstitutionEnum.UN)
          unCount += institutionalChange.value;
        else if (institutionalChange.key === TypeOfInstitutionEnum.NGO)
          ngoCount += institutionalChange.value;
        else if (institutionalChange.key === TypeOfInstitutionEnum.ACADEMIA)
          academiaCount += institutionalChange.value;
        else if (institutionalChange.key === TypeOfInstitutionEnum.RIVER)
          riverCount += institutionalChange.value;
        else if (institutionalChange.key === TypeOfInstitutionEnum.UTILITY)
          waterUtilityCount += institutionalChange.value;
        else if (institutionalChange.key === TypeOfInstitutionEnum.PRIVATE)
          privateCount += institutionalChange.value;
        else if (institutionalChange.key === TypeOfInstitutionEnum.INDEPENDENT)
          independentCount += institutionalChange.value;
      }

      countriesCount += outcomeReport.policyChangesByCountry;
    }
    const totalRelevantInstitutionalChangeCount =
      govtCount +
      unCount +
      ngoCount +
      academiaCount +
      riverCount +
      waterUtilityCount +
      privateCount +
      independentCount;

    return {
      knowledgeApplied: {
        raisingAwarenessCount,
        routineWorkKnowledgeCount,
        educationPurposeKnowledgeCount,
        waterProjectCount,
        technologyInnovationCount,
        sdgCount,
        waterPolicyCount,
      },
      relevantInstitutionalChange: {
        govtCount,
        unCount,
        ngoCount,
        academiaCount,
        riverCount,
        waterUtilityCount,
        privateCount,
        independentCount,
        totalRelevantInstitutionalChangeCount,
      },
      countriesRelevantInstitutionalChange: { countriesCount },
    };
  }

  async getOutcomeReportSummary(year: number, user: any) {
    Logger.debug('ReportsService.getOutcomeReportSummary');
    if (user.networkId === null && user.partnerId === null) {
      const outcomeReportList = await this.outcomeReportModel
        .find({ isDeleted: false, year })
        .exec();

      return this.commonFunctionForOutcomeReportSummaryInfo(outcomeReportList);
    } else {
      const outcomeReportList = await this.outcomeReportModel
        .find({
          year,
          isDeleted: false,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
      return this.commonFunctionForOutcomeReportSummaryInfo(outcomeReportList);
    }
  }

  async deleteOutcomeReport(reportId: string, user: any) {
    Logger.debug('ReportsService.deleteOutcomeReport');
    try {
      const updatedReport = await this.outcomeReportModel
        .findOneAndUpdate(
          {
            isDeleted: false,
            outcomeReportId: reportId,
          },
          { isDeleted: true },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Outcome Report - ${updatedReport.outcomeReportCode} has been deleted.`,
      );
      return updatedReport;
    } catch (error) {
      console.log('deleteOutcomeReport.catch', error);
    }
  }

  /**Download functions for Outcome Report Download */
  async downloadOutreachDetails(
    year: number,
    outreachSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    outreachData: any,
  ) {
    Logger.debug('ReportsService.downloadOutreachDetails');
    outreachSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Outcome Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      { header: 'Participants Enrolled', key: 'enrolled', width: 20 },
      { header: 'Participants Contacted', key: 'contacted', width: 20 },
      { header: 'Participants Responded', key: 'responded', width: 20 },
    ];
    const enrolledTotal =
      outreachData.enrolledParticipants['male'] +
      outreachData.enrolledParticipants['female'] +
      outreachData.enrolledParticipants['ratherNotSay'] +
      outreachData.enrolledParticipants['other'];

    const enrolledObj =
      'male= ' +
      outreachData.enrolledParticipants['male'] +
      ', ' +
      'female= ' +
      outreachData.enrolledParticipants['female'] +
      ', ' +
      'rather_not_say= ' +
      outreachData.enrolledParticipants['ratherNotSay'] +
      ', ' +
      'other= ' +
      outreachData.enrolledParticipants['other'] +
      ', ' +
      'total= ' +
      enrolledTotal;

    const contactedTotal =
      outreachData.participantReached['male'] +
      outreachData.participantReached['female'] +
      outreachData.participantReached['ratherNotSay'] +
      outreachData.participantReached['other'];
    const contactedObj =
      'male= ' +
      outreachData.participantReached['male'] +
      ', ' +
      'female= ' +
      outreachData.participantReached['female'] +
      ', ' +
      'rather_not_say= ' +
      outreachData.participantReached['ratherNotSay'] +
      ', ' +
      'other= ' +
      outreachData.participantReached['other'] +
      ', ' +
      'total= ' +
      contactedTotal;

    const respondedTotal =
      outreachData.participantRespondedToOutcomeSurvey['male'] +
      outreachData.participantRespondedToOutcomeSurvey['female'] +
      outreachData.participantRespondedToOutcomeSurvey['ratherNotSay'] +
      outreachData.participantRespondedToOutcomeSurvey['other'];
    const respondedObj =
      'male= ' +
      outreachData.participantRespondedToOutcomeSurvey['male'] +
      ', ' +
      'female= ' +
      outreachData.participantRespondedToOutcomeSurvey['female'] +
      ', ' +
      'rather_not_say= ' +
      outreachData.participantRespondedToOutcomeSurvey['ratherNotSay'] +
      ', ' +
      'other= ' +
      outreachData.participantRespondedToOutcomeSurvey['other'] +
      ', ' +
      'total= ' +
      respondedTotal;

    outreachSheet.addRow({
      year,
      reportCode,
      activityCode,
      activityName,
      enrolled: enrolledObj,
      contacted: contactedObj,
      responded: respondedObj,
    });

    outreachSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadPositiveResponseDetails(
    year: number,
    positiveResponsesSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    positiveResponseData: any,
  ) {
    Logger.debug('ReportsService.downloadPositiveResponseDetails');
    positiveResponsesSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Outcome Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      {
        header: 'Participants Responded Knowledge Shared',
        key: 'knowledgeSharedParticipants',
        width: 30,
      },
      {
        header: 'Participants Responded Knowledge Applied',
        key: 'knowledgeAppliedParticipants',
        width: 30,
      },
      {
        header: 'Participants Responded Institutional Change',
        key: 'institutionalChangeParticipants',
        width: 30,
      },
    ];
    const sharedTotal =
      positiveResponseData.knowledgeSharedParticipants['male'] +
      positiveResponseData.knowledgeSharedParticipants['female'] +
      positiveResponseData.knowledgeSharedParticipants['ratherNotSay'] +
      positiveResponseData.knowledgeSharedParticipants['other'];

    const sharedObj =
      'male= ' +
      positiveResponseData.knowledgeSharedParticipants['male'] +
      ', ' +
      'female= ' +
      positiveResponseData.knowledgeSharedParticipants['female'] +
      ', ' +
      'rather_not_say= ' +
      positiveResponseData.knowledgeSharedParticipants['ratherNotSay'] +
      ', ' +
      'other= ' +
      positiveResponseData.knowledgeSharedParticipants['other'] +
      ', ' +
      'total= ' +
      sharedTotal;

    const appliedTotal =
      positiveResponseData.knowledgeAppliedParticipants['male'] +
      positiveResponseData.knowledgeAppliedParticipants['female'] +
      positiveResponseData.knowledgeAppliedParticipants['ratherNotSay'] +
      positiveResponseData.knowledgeAppliedParticipants['other'];

    const appliedObj =
      'male= ' +
      positiveResponseData.knowledgeAppliedParticipants['male'] +
      ', ' +
      'female= ' +
      positiveResponseData.knowledgeAppliedParticipants['female'] +
      ', ' +
      'rather_not_say= ' +
      positiveResponseData.knowledgeAppliedParticipants['ratherNotSay'] +
      ', ' +
      'other= ' +
      positiveResponseData.knowledgeAppliedParticipants['other'] +
      ', ' +
      'total= ' +
      appliedTotal;

    const changeTotal =
      positiveResponseData.institutionalChangeParticipants['male'] +
      positiveResponseData.institutionalChangeParticipants['female'] +
      positiveResponseData.institutionalChangeParticipants['ratherNotSay'] +
      positiveResponseData.institutionalChangeParticipants['other'];

    const changeObj =
      'male= ' +
      positiveResponseData.institutionalChangeParticipants['male'] +
      ', ' +
      'female= ' +
      positiveResponseData.institutionalChangeParticipants['female'] +
      ', ' +
      'rather_not_say= ' +
      positiveResponseData.institutionalChangeParticipants['ratherNotSay'] +
      ', ' +
      'other= ' +
      positiveResponseData.institutionalChangeParticipants['other'] +
      ', ' +
      'total= ' +
      changeTotal;

    positiveResponsesSheet.addRow({
      year,
      reportCode,
      activityCode,
      activityName,
      knowledgeSharedParticipants: sharedObj,
      knowledgeAppliedParticipants: appliedObj,
      institutionalChangeParticipants: changeObj,
    });

    positiveResponsesSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }
  async downloadKnowledgeAppliedGenderDetails(
    year: number,
    knowledgeAppliedGenderSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    knowledgeData: any,
  ) {
    Logger.debug('ReportsService.downloadKnowledgeAppliedGenderDetails');
    knowledgeAppliedGenderSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Outcome Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      { header: 'Raising Awareness', key: 'raisingAwareness', width: 20 },
      {
        header: 'Knowledge In Routine Work',
        key: 'knowledgeInRoutineWork',
        width: 20,
      },
      {
        header: 'Knowledge In Education',
        key: 'knowledgeInEducation',
        width: 20,
      },
      {
        header: 'Water Project Implementation',
        key: 'waterProjectImplementation',
        width: 20,
      },
      { header: 'Tech Innovation', key: 'techInnovation', width: 20 },
      { header: 'Achieve SGD', key: 'achieveSGD', width: 20 },
      {
        header: 'Formulating Water Policy',
        key: 'formulatingWaterPolicy',
        width: 20,
      },
    ];
    const awarenessTotal =
      knowledgeData.raisingAwareness['male'] +
      knowledgeData.raisingAwareness['female'] +
      knowledgeData.raisingAwareness['ratherNotSay'] +
      knowledgeData.raisingAwareness['other'];

    const awarenessObj =
      'male= ' +
      knowledgeData.raisingAwareness['male'] +
      ', ' +
      'female= ' +
      knowledgeData.raisingAwareness['female'] +
      ', ' +
      'rather_not_say= ' +
      knowledgeData.raisingAwareness['ratherNotSay'] +
      ', ' +
      'other= ' +
      knowledgeData.raisingAwareness['other'] +
      ', ' +
      'total= ' +
      awarenessTotal;

    const routineWorkTotal =
      knowledgeData.knowledgeInRoutineWork['male'] +
      knowledgeData.knowledgeInRoutineWork['female'] +
      knowledgeData.knowledgeInRoutineWork['ratherNotSay'] +
      knowledgeData.knowledgeInRoutineWork['other'];
    const routineWorkObj =
      'male= ' +
      knowledgeData.knowledgeInRoutineWork['male'] +
      ', ' +
      'female= ' +
      knowledgeData.knowledgeInRoutineWork['female'] +
      ', ' +
      'rather_not_say= ' +
      knowledgeData.knowledgeInRoutineWork['ratherNotSay'] +
      ', ' +
      'other= ' +
      knowledgeData.knowledgeInRoutineWork['other'] +
      ', ' +
      'total= ' +
      routineWorkTotal;

    const educationTotal =
      knowledgeData.knowledgeInEducation['male'] +
      knowledgeData.knowledgeInEducation['female'] +
      knowledgeData.knowledgeInEducation['ratherNotSay'] +
      knowledgeData.knowledgeInEducation['other'];

    const educationObj =
      'male= ' +
      knowledgeData.knowledgeInEducation['male'] +
      ', ' +
      'female= ' +
      knowledgeData.knowledgeInEducation['female'] +
      ', ' +
      'rather_not_say= ' +
      knowledgeData.knowledgeInEducation['ratherNotSay'] +
      ', ' +
      'other= ' +
      knowledgeData.knowledgeInEducation['other'] +
      ', ' +
      'total= ' +
      educationTotal;

    const implementTotal =
      knowledgeData.waterProjectImplementation['male'] +
      knowledgeData.waterProjectImplementation['female'] +
      knowledgeData.waterProjectImplementation['ratherNotSay'] +
      knowledgeData.waterProjectImplementation['other'];

    const impObj =
      'male= ' +
      knowledgeData.waterProjectImplementation['male'] +
      ', ' +
      'female= ' +
      knowledgeData.waterProjectImplementation['female'] +
      ', ' +
      'rather_not_say= ' +
      knowledgeData.waterProjectImplementation['ratherNotSay'] +
      ', ' +
      'other= ' +
      knowledgeData.waterProjectImplementation['other'] +
      ', ' +
      'total= ' +
      implementTotal;

    const innovationTotal =
      knowledgeData.techInnovation['male'] +
      knowledgeData.techInnovation['female'] +
      knowledgeData.techInnovation['ratherNotSay'] +
      knowledgeData.techInnovation['other'];

    const innovationObj =
      'male= ' +
      knowledgeData.techInnovation['male'] +
      ', ' +
      'female= ' +
      knowledgeData.techInnovation['female'] +
      ', ' +
      'rather_not_say= ' +
      knowledgeData.techInnovation['ratherNotSay'] +
      ', ' +
      'other= ' +
      knowledgeData.techInnovation['other'] +
      ', ' +
      'total= ' +
      innovationTotal;

    const sdgTotal =
      knowledgeData.achieveSGD['male'] +
      knowledgeData.achieveSGD['female'] +
      knowledgeData.achieveSGD['ratherNotSay'] +
      knowledgeData.achieveSGD['other'];

    const sdgObj =
      'male= ' +
      knowledgeData.achieveSGD['male'] +
      ', ' +
      'female= ' +
      knowledgeData.achieveSGD['female'] +
      ', ' +
      'rather_not_say= ' +
      knowledgeData.achieveSGD['ratherNotSay'] +
      ', ' +
      'other= ' +
      knowledgeData.achieveSGD['other'] +
      ', ' +
      'total= ' +
      sdgTotal;

    const policyTotal =
      knowledgeData.formulatingWaterPolicy['male'] +
      knowledgeData.formulatingWaterPolicy['female'] +
      knowledgeData.formulatingWaterPolicy['ratherNotSay'] +
      knowledgeData.formulatingWaterPolicy['other'];

    const policyObj =
      'male= ' +
      knowledgeData.formulatingWaterPolicy['male'] +
      ', ' +
      'female= ' +
      knowledgeData.formulatingWaterPolicy['female'] +
      ', ' +
      'rather_not_say= ' +
      knowledgeData.formulatingWaterPolicy['ratherNotSay'] +
      ', ' +
      'other= ' +
      knowledgeData.formulatingWaterPolicy['other'] +
      ', ' +
      'total= ' +
      policyTotal;

    knowledgeAppliedGenderSheet.addRow({
      year,
      reportCode,
      activityCode,
      activityName,
      raisingAwareness: awarenessObj,
      knowledgeInRoutineWork: routineWorkObj,
      knowledgeInEducation: educationObj,
      waterProjectImplementation: impObj,
      techInnovation: innovationObj,
      achieveSGD: sdgObj,
      formulatingWaterPolicy: policyObj,
    });

    knowledgeAppliedGenderSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadKnowledgeAppliedInstituteDetails(
    year: number,
    knowledgeAppliedInstitutionSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    knowledgeData: any,
  ) {
    Logger.debug('ReportsService.downloadKnowledgeAppliedInstituteDetails');
    knowledgeAppliedInstitutionSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      {
        header: 'Institutional Affiliation',
        key: 'institutionalAffiliation',
        width: 40,
      },
      { header: 'No.of Participants', key: 'participantCount', width: 20 },
    ];
    for (const obj of knowledgeData) {
      knowledgeAppliedInstitutionSheet.addRow({
        year,
        reportCode,
        activityCode,
        activityName,
        institutionalAffiliation: obj.key,
        participantCount: obj.value,
      });
    }
    knowledgeAppliedInstitutionSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadPolicyChangesByInstitution(
    year: number,
    policyChangesInstitutionSheet: Worksheet,
    activityCode: string,
    activityName: string,
    reportCode: string,
    policyData: any,
  ) {
    Logger.debug('ReportsService.downloadPolicyChangesByInstitution');
    policyChangesInstitutionSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Output Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 20 },
      {
        header: 'Institutional Affiliation',
        key: 'institutionalAffiliation',
        width: 40,
      },
      { header: 'No.of Participants', key: 'participantCount', width: 20 },
    ];
    for (const obj of policyData) {
      policyChangesInstitutionSheet.addRow({
        year,
        reportCode,
        activityCode,
        activityName,
        institutionalAffiliation: obj.key,
        participantCount: obj.value,
      });
    }
    policyChangesInstitutionSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadOutcomeReport(res, report, workbook: Workbook) {
    Logger.debug('ReportsService.downloadOutcomeReport');

    let outcomeReportSheet,
      outreachSheet,
      positiveResponsesSheet,
      knowledgeAppliedGenderSheet,
      knowledgeAppliedInstitutionSheet,
      policyChangesInstitutionSheet;

    if (!workbook.getWorksheet('Outcome_Report_Details'))
      outcomeReportSheet = workbook.addWorksheet('Outcome_Report_Details');
    else outcomeReportSheet = workbook.getWorksheet('Outcome_Report_Details');

    outcomeReportSheet.columns = [
      { header: 'Year', key: 'year', width: 6 },
      { header: 'Outcome Report Code', key: 'reportCode', width: 6 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 40 },
      { header: 'Institute Name', key: 'instituteName', width: 20 },
      {
        header: 'OutcomeSurvey Submission Method',
        key: 'outcomeSurveySubmissionMethod',
        width: 20,
      },
      {
        header: 'No. of Countries reporting RELEVANT INSTITUTIONAL CHANGE',
        key: 'policyChangesByCountry',
        width: 20,
      },
      {
        header: 'No. of responses for Story of Change',
        key: 'numberOfResponsesStoryOfChange',
        width: 20,
      },
      { header: 'Additional Comment', key: 'additionalComment', width: 20 },
      { header: 'Report Status', key: 'statusName', width: 20 },
    ];

    outcomeReportSheet.addRow({
      year: report.year,
      reportCode: report.outcomeReportCode,
      activityCode: report.activityCode,
      activityName: report.activityName,
      instituteName: report.instituteName,
      outcomeSurveySubmissionMethod: report.outcomeSurveySubmissionMethod,
      policyChangesByCountry: report.policyChangesByCountry,
      numberOfResponsesStoryOfChange: report.numberOfResponsesStoryOfChange,
      additionalComment: report.additionalComment,
      statusName: report.statusName,
    });

    outcomeReportSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    if (!workbook.getWorksheet('Outreach_Details'))
      outreachSheet = workbook.addWorksheet('Outreach_Details');
    else outreachSheet = workbook.getWorksheet('Outreach_Details');

    await this.downloadOutreachDetails(
      report.year,
      outreachSheet,
      report.activityCode,
      report.activityName,
      report.outcomeReportCode,
      report.outreach,
    );

    if (!workbook.getWorksheet('Positive_Responses_Details'))
      positiveResponsesSheet = workbook.addWorksheet(
        'Positive_Responses_Details',
      );
    else
      positiveResponsesSheet = workbook.getWorksheet(
        'Positive_Responses_Details',
      );

    await this.downloadPositiveResponseDetails(
      report.year,
      positiveResponsesSheet,
      report.activityCode,
      report.activityName,
      report.outcomeReportCode,
      report.positiveResponses,
    );

    if (!workbook.getWorksheet('GenderWise_KnowledgeApplied'))
      knowledgeAppliedGenderSheet = workbook.addWorksheet(
        'GenderWise_KnowledgeApplied',
      );
    else
      knowledgeAppliedGenderSheet = workbook.getWorksheet(
        'GenderWise_KnowledgeApplied',
      );

    await this.downloadKnowledgeAppliedGenderDetails(
      report.year,
      knowledgeAppliedGenderSheet,
      report.activityCode,
      report.activityName,
      report.outcomeReportCode,
      report.knowledgeAppliedByGender,
    );

    if (!workbook.getWorksheet('Institution_KnowledgeApplied'))
      knowledgeAppliedInstitutionSheet = workbook.addWorksheet(
        'Institution_KnowledgeApplied',
      );
    else
      knowledgeAppliedInstitutionSheet = workbook.getWorksheet(
        'Institution_KnowledgeApplied',
      );

    await this.downloadKnowledgeAppliedInstituteDetails(
      report.year,
      knowledgeAppliedInstitutionSheet,
      report.activityCode,
      report.activityName,
      report.outcomeReportCode,
      report.knowledgeAppliedByInstitution,
    );

    if (!workbook.getWorksheet('Policy_Changes_By_Institution'))
      policyChangesInstitutionSheet = workbook.addWorksheet(
        'Policy_Changes_By_Institution',
      );
    else
      policyChangesInstitutionSheet = workbook.getWorksheet(
        'Policy_Changes_By_Institution',
      );

    await this.downloadPolicyChangesByInstitution(
      report.year,
      policyChangesInstitutionSheet,
      report.activityCode,
      report.activityName,
      report.outcomeReportCode,
      report.policyChangesByInstitution,
    );
  }

  async downloadIndividualOutcomeReport(res, reportId: string) {
    Logger.debug('ReportsService.downloadIndividualOutcomeReport');
    const workbook = new Workbook();
    // const outcomeReport = await this.getOutcomeReportById(reportId);
    const outcomeReport = await this.outcomeReportModel
      .findOne({ outcomeReportId: reportId, isDeleted: false })
      .exec();
    console.log('outcomeReport in individual = ', outcomeReport);
    await this.downloadOutcomeReport(res, outcomeReport, workbook);
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' +
        'Outcome Report-' +
        outcomeReport.outcomeReportCode +
        '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async downloadMultipleOutcomeReports(res, year: number) {
    Logger.debug('ReportsService.downloadMultipleOutputReports');
    const workbook = new Workbook();
    const outcomeReports = await this.outcomeReportModel
      .find({
        year,
        isDeleted: false,
      })
      .exec();
    console.log('outcomeReports in multiple = ', outcomeReports);
    for (const report of outcomeReports) {
      await this.downloadOutcomeReport(res, report, workbook);
    }
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'All Outcome Reports-' + year + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async addInvoiceInOutputReport(outputReportId: string, user: any, invoiceId) {
    Logger.debug('ReportsService.addInvoiceInOutputReport');
    await this.checkIfOutputReportExists(outputReportId);

    return this.outputReportModel
      .findOneAndUpdate(
        {
          outputReportId,
          isDeleted: false,
        },
        {
          // ...invoiceId,
          invoiceId: new Types.ObjectId(invoiceId.invoiceId),
          updatedBy: user._id,
        },
        { new: true },
      )
      .exec();
  }

  async addInvoiceInOutcomeReport(
    outcomeReportId: string,
    user: any,
    invoiceId,
  ) {
    Logger.debug('ReportsService.addInvoiceInOutcomeReport');
    await this.checkIfOutcomeReportExists(outcomeReportId);

    return this.outcomeReportModel
      .findOneAndUpdate(
        {
          outcomeReportId,
          isDeleted: false,
        },
        {
          // ...invoiceId,
          invoiceId: new Types.ObjectId(invoiceId.invoiceId),
          updatedBy: user._id,
        },
        { new: true },
      )
      .exec();
  }

  /**Upload additional information file into S3 bucket */
  async uploadFile(file) {
    Logger.debug('ReportsService.uploadFile');

    if (!file)
      throw new UnprocessableEntityException(errorMessages.FILE_SELECT);

    const { originalname } = file;
    const bucketS3Name = this.configService.get('AWS_S3_BUCKET');
    return await this.uploadS3(
      file.buffer,
      bucketS3Name,
      originalname,
      file.mimetype,
    );
  }

  async uploadS3(file, bucket, fileName, mimetype) {
    Logger.debug('ReportsService.uploadS3');

    const s3 = this.getS3();

    const params = {
      Bucket: bucket,
      // Key: String(name),
      Key: `${uuidv4()}-${fileName}`,
      Body: file,
      // ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: this.configService.get('AWS_S3_REGION'),
      },
    };
    console.log('params = ', params);
    try {
      const s3Response = await s3.upload(params).promise();

      console.log('s3Response = ', s3Response);
      return {
        url: s3Response.Location,
        key: s3Response.Key,
        fileName,
      };
    } catch (e) {
      console.log(e);
    }
  }
  getS3() {
    Logger.debug('ReportsService.getS3');

    return new S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
    });
  }

  /**Getting all files uploaded to S3 Bucket */
  async getAllFilesFromS3() {
    Logger.debug('ReportsService.getAllFilesFromS3');
    const s3 = this.getS3();
    const params = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
    };
    try {
      const s3FilesData = await s3.listObjects(params).promise();
      console.log('s3FilesData = ', s3FilesData);
      return s3FilesData.Contents;
    } catch (e) {
      console.log(e);
    }
  }

  /**Getting each file by key uploaded to S3 Bucket */
  async getEachFileByKeyFromS3(fileKey: string) {
    Logger.debug('ReportsService.getEachFileByKeyFromS3');
    console.log('fileKey in service = ', fileKey);
    const s3 = this.getS3();
    const params = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: fileKey,
    };
    try {
      const fileFetchedFromS3 = await s3.getObject(params).promise();
      console.log('fileFetchedFromS3 = ', fileFetchedFromS3);
      return fileFetchedFromS3;
    } catch (e) {
      console.log(e);
    }
  }

  /**Deleting existing files from S3 */
  async deletePublicFile(fileKey: string) {
    // const file = await this.outputReportModel.findOne({ additionalInfoFile: fileId });
    const s3 = new S3();
    await s3
      .deleteObject({
        Bucket: this.configService.get('AWS_S3_BUCKET'),
        Key: fileKey,
      })
      .promise();
    // await this.publicFilesRepository.delete(fileId);
  }
  /**Download file from S3 */
  async getSignedUrl(fileKey: string) {
    console.log('inside getSignedUrl');
    const s3 = new S3({
      signatureVersion: 'v4',
      region: this.configService.get('AWS_S3_REGION'),
    });
    const params = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: fileKey,
      Expires: 3600, //1hr expiration
    };

    return s3.getSignedUrl('getObject', params);
  }

  /**Upload additional info files to Azure Blob Storage */
  containerName = 'upload-files';

  async getBlobClient(imageName: string) {
    Logger.debug('ReportsService.getBlobClient');
    console.log('imageName = ', imageName);
    const blobClientService = BlobServiceClient.fromConnectionString(
      this.configService.get('AZURE_STORAGE_CONNECTION_STRING'),
    );
    // Get a reference to a container
    const containerClient = blobClientService.getContainerClient(
      this.containerName,
    );
    console.log('containerClient = ', containerClient);

    const list = await blobClientService.listContainers();
    const containerItem = await list.next();
    console.log('containerItem = ', containerItem);

    if (containerItem.done) {
      console.log('\nCreating container...');
      console.log('\t', this.containerName);
      const createContainerResponse = await containerClient.create();
      console.log(
        `Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${containerClient.url}`,
      );
    }
    const blobClient = containerClient.getBlockBlobClient(imageName);
    console.log('blobClient = ', blobClient);
    return blobClient;
  }

  async uploadSingleFileToAzureBlob(file: Express.Multer.File) {
    Logger.debug('ReportsService.uploadSingleFileToAzureBlob');
    //allowed doc and pdf with 5MB size
    if (!mimetypes.includes(file.mimetype)) {
      throw new UnprocessableEntityException(
        errorMessages.UPLOAD_VALID_FILE_TYPE,
      );
    } else if (
      (file.mimetype ==
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype == 'application/pdf') &&
      file.size > 5000000
    ) {
      throw new UnprocessableEntityException(errorMessages.MAX_5MB_FILE);
    }
    let tempName = file.originalname;

    file.originalname = `${file.originalname} - ${uuidv4()}`;
    console.log('file.originalname>>>>>', file.originalname);
    const blobClient = await this.getBlobClient(file.originalname);

    // console.log('blobClient in uploadToAzureBlob = ', blobClient);
    console.log('file in upload = ', file);

    const listOfPreviousBlobs = await this.getAllAzureBlobs();
    let isExist = false;

    for (const data of listOfPreviousBlobs) {
      if (file.originalname === data.name) {
        isExist = true;
      }
    }
    if (isExist) {
      throw new ConflictException(
        file.originalname + errorMessages.BLOB_NAME_ALREADY_EXISTS,
      );
    } else {
      const responseAfterUpload = await blobClient.uploadData(file.buffer);
      return {
        requestId: responseAfterUpload.requestId,
        fileName: file.originalname,
        originalName: tempName,
      };
    }
  }

  async getAllAzureBlobs() {
    Logger.debug('ReportsService.getAllAzureBlobs');
    const blobClientService = BlobServiceClient.fromConnectionString(
      this.configService.get('AZURE_STORAGE_CONNECTION_STRING'),
    );
    // Get a reference to a container
    const containerClient = blobClientService.getContainerClient(
      this.containerName,
    );
    const blobs = containerClient.listBlobsFlat();
    const blobsArray = [];
    for await (const blob of blobs) {
      const tempBlockBlobClient = containerClient.getBlockBlobClient(blob.name);

      // Display blob name and URL
      // console.log(
      //   `\n\tname: ${blob.name}\n\tURL: ${tempBlockBlobClient.url}\n`,
      // );

      blobsArray.push({
        name: blob.name,
        url: tempBlockBlobClient.url,
      });
    }
    return blobsArray;
  }

  //Get the steam of file from the Azure Blob Storage
  async readSingleFileFromAzureBlob(fileName: string) {
    Logger.debug('ReportsService.readSingleFileFromAzureBlob');
    console.log('fileName in read file = ', fileName);
    const blobClientService = BlobServiceClient.fromConnectionString(
      this.configService.get('AZURE_STORAGE_CONNECTION_STRING'),
    );
    // Get a reference to a container
    const containerClient = blobClientService.getContainerClient(
      this.containerName,
    );
    console.log('containerClient = ', containerClient);
    const blobClient = containerClient.getBlockBlobClient(fileName);
    const blobDownloaded = await blobClient.download(0);
    return blobDownloaded.readableStreamBody;
  }

  //Get all created containers
  async getAllAzureContainers() {
    Logger.debug('ReportsService.getAllAzureContainers');

    const blobClientService = BlobServiceClient.fromConnectionString(
      this.configService.get('AZURE_STORAGE_CONNECTION_STRING'),
    );
    const list = await blobClientService.listContainers();
    let containerItem = await list.next();
    console.log('containerItem = ', containerItem);
    let i = 1;
    while (!containerItem.done) {
      console.log(`Container ${i++}: ${containerItem.value.name}`);
      containerItem = await list.next();
    }
  }
  // Delete container
  async deleteContainer(containerName: string) {
    Logger.debug('ReportsService.deleteContainer');

    console.log('\nDeleting container...');

    const blobClientService = BlobServiceClient.fromConnectionString(
      this.configService.get('AZURE_STORAGE_CONNECTION_STRING'),
    );

    // Get a reference to a container
    console.log('this.containerName = ', this.containerName);
    const containerClient = blobClientService.getContainerClient(containerName);
    console.log('found containerClient = ', containerClient);
    const deleteContainerResponse = await containerClient.deleteIfExists();

    console.log(
      'Container was deleted successfully. requestId: ',
      deleteContainerResponse.requestId,
    );
  }

  async deleteOutputFileFromAzure(
    filename: string,
    requestId: string,
    reportId: string,
    user: any,
    infoFile: boolean,
  ) {
    Logger.debug('ReportsService.deleteOutputFileFromAzure');

    const outputReport = await this.outputReportModel
      .findOne({
        isDeleted: false,
        outputReportId: reportId,
      })
      .exec();
    if (!outputReport)
      throw new NotFoundException(errorMessages.OUTPUT_REPORT_NOT_FOUND);
    console.log('infoFile type==', typeof infoFile);

    if (infoFile) {
      await this.outputReportModel
        .findOneAndUpdate(
          {
            isDeleted: false,
            outputReportId: reportId,
          },
          { additionalInfoFile: null },
          { new: true },
        )
        .exec();
    } else {
      console.log('after false = >>>>');
      await this.outputReportModel
        .findOneAndUpdate(
          {
            isDeleted: false,
            outputReportId: reportId,
          },
          { caseStudyManual: null },
          { new: true },
        )
        .exec();
    }

    const blobClient = await this.getBlobClient(filename);
    await blobClient.deleteIfExists();

    await this.melpService.addActivityLog(
      user,
      `Output report ${outputReport.outputReportCode} updated successfully.`,
    );
  }

  async deleteOutcomeFileFromAzure(
    filename: string,
    requestId: string,
    reportId: string,
    user: any,
  ) {
    Logger.debug('ReportsService.deleteOutcomeFileFromAzure');
    const outcomeReport = await this.outcomeReportModel
      .findOne({
        isDeleted: false,
        outcomeReportId: reportId,
      })
      .exec();
    if (!outcomeReport)
      throw new NotFoundException(errorMessages.OUTCOME_REPORT_NOT_FOUND);

    await this.outcomeReportModel
      .findOneAndUpdate(
        {
          isDeleted: false,
          outcomeReportId: reportId,
        },
        { additionalInfoFile: null },
        { new: true },
      )
      .exec();

    const blobClient = await this.getBlobClient(filename);
    await blobClient.deleteIfExists();

    await this.melpService.addActivityLog(
      user,
      `Outcome report ${outcomeReport.outcomeReportCode} updated successfully.`,
    );
  }

  //General user institute wise all output reports
  async allOutputReportsForGeneralUser(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortKey: string,
    sortDirection: number,
    year: number,
    user,
  ) {
    Logger.debug('ReportsService.allOutputReportsForGeneralUser');
    const tempWorkplanList = [];
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    let total, reportList, statusName;
    if (user.networkId) {
      total = (
        await this.outputReportModel
          .find({
            year,
            $and: [
              { networkId: user.networkId },
              {
                $or: [{ outputReportCode: regex }],
              },
            ],
            isDeleted: false,
          })
          .exec()
      ).length;

      reportList = await this.outputReportModel
        .find({
          year,

          $and: [
            { networkId: user.networkId },
            {
              $or: [{ outputReportCode: regex }],
            },
          ],
          isDeleted: false,
        })
        .skip(pageIndex * pageSize)
        .limit(pageSize)
        .sort(sortQuery)
        .exec();

      const networkName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
      for (const wp of reportList) {
        statusName = await this.userService.getStatusName(
          wp.outputReportStatus,
        );
        wp.networkName = networkName;
        wp.statusName = statusName;
        tempWorkplanList.push(wp);
      }
    } else if (user.partnerId) {
      total = (
        await this.outputReportModel
          .find({
            year,
            $and: [
              { partnerId: user.partnerId },
              {
                $or: [{ outputReportCode: regex }],
              },
            ],
            isDeleted: false,
          })
          .exec()
      ).length;

      reportList = await this.outputReportModel
        .find({
          year,

          $and: [
            { partnerId: user.partnerId },
            {
              $or: [{ outputReportCode: regex }],
            },
          ],
          isDeleted: false,
        })
        .skip(pageIndex * pageSize)
        .limit(pageSize)
        .sort(sortQuery)
        .exec();

      const partnerName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
      for (const wp of reportList) {
        wp.partnerName = partnerName;
        statusName = await this.userService.getStatusName(
          wp.outputReportStatus,
        );
        wp.statusName = statusName;
        tempWorkplanList.push(wp);
      }
    }

    return { reportsList: tempWorkplanList, total: Math.ceil(total / 10) };
  }

  async allOutcomeReportsForGeneralUser(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortKey: string,
    sortDirection: number,
    year: number,
    user,
  ) {
    Logger.debug('ReportsService.allOutcomeReportsForGeneralUser');
    const sortObject = {};

    const stype = sortKey;
    const sdir = sortDirection;
    sortObject[stype] = sdir;
    const regex = new RegExp(searchKeyword, 'i');

    let reportList, statusName, count;

    if (user.networkId) {
      reportList = await this.outcomeReportModel
        .aggregate([
          {
            $match: {
              $and: [
                {
                  year,
                  isDeleted: false,
                  networkId: user.networkId,
                },
                {
                  $or: [{ outcomeReportCode: regex }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'activityproposals',
              let: { id: '$proposalId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', '$$id'] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'proposalData',
            },
          },
          { $unwind: '$proposalData' },
          { $sort: sortObject },
          {
            $facet: {
              records: [{ $skip: pageIndex * pageSize }, { $limit: pageSize }],
            },
          },
        ])
        .exec();

      count = reportList[0].records.length;

      const networkName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
      for (const data of reportList[0].records) {
        statusName = await this.userService.getStatusName(
          data.outcomeReportStatus,
        );
        data.networkName = networkName;
        data.statusName = statusName;
      }
    } else if (user.partnerId) {
      reportList = await this.outcomeReportModel
        .aggregate([
          {
            $match: {
              $and: [
                {
                  year,
                  isDeleted: false,
                  partnerId: user.partnerId,
                },
                {
                  $or: [{ outcomeReportCode: regex }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'activityproposals',
              let: { id: '$proposalId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', '$$id'] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'proposalData',
            },
          },
          { $unwind: '$proposalData' },
          { $sort: sortObject },
          {
            $facet: {
              records: [{ $skip: pageIndex * pageSize }, { $limit: pageSize }],
            },
          },
        ])
        .exec();

      count = reportList[0].records.length;

      const partnerName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
      for (const data of reportList[0].records) {
        data.partnerName = partnerName;
        statusName = await this.userService.getStatusName(
          data.outcomeReportStatus,
        );
        data.statusName = statusName;
      }
    }

    return { reportsList: reportList[0].records, total: Math.ceil(count / 10) };
  }

  async manageNetworkOutputReports(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortKey: string,
    sortDirection: number,
    year: number,
    // user,
  ) {
    Logger.debug('ReportsService.manageNetworkOutputReports');
    try {
      const sortObject = {};

      const stype = sortKey;
      const sdir = sortDirection;
      sortObject[stype] = sdir;
      const regex = new RegExp(searchKeyword, 'i');

      const inprogressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      let networkName, statusName, count;

      const reportList = await this.outputReportModel
        .aggregate([
          {
            $match: {
              $and: [
                {
                  year,
                  isDeleted: false,
                  networkId: { $ne: null },
                  outputReportStatus: { $ne: inprogressStatusId },
                },
                {
                  $or: [{ outputReportCode: regex }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'activityproposals',
              let: { id: '$proposalId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', '$$id'] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'proposalData',
            },
          },
          { $unwind: '$proposalData' },
          { $sort: sortObject },
          {
            $facet: {
              records: [{ $skip: pageIndex * pageSize }, { $limit: pageSize }],
            },
          },
        ])
        .exec();
      count = reportList[0].records.length;

      for (const report of reportList[0].records) {
        networkName = await this.networkService.getNetworkNameById(
          report.networkId,
        );

        statusName = await this.userService.getStatusName(
          report.outputReportStatus,
        );
        console.log('statusName = ', statusName);

        report.networkName = networkName;
        report.statusName = statusName;
      }

      return {
        reportsList: reportList[0].records,
        total: Math.ceil(count / 10),
      };
    } catch (error) {
      console.log('error in catch = ', error);
      return error;
    }
  }

  async managePartnerOutputReports(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortKey: string,
    sortDirection: number,
    year: number,
    // user,
  ) {
    Logger.debug('ReportsService.managePartnerOutputReports');
    try {
      const sortObject = {};

      const stype = sortKey;
      const sdir = sortDirection;
      sortObject[stype] = sdir;
      const regex = new RegExp(searchKeyword, 'i');

      const inprogressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      let partnerName, statusName, count;

      const reportList = await this.outputReportModel
        .aggregate([
          {
            $match: {
              $and: [
                {
                  year,
                  isDeleted: false,
                  partnerId: { $ne: null },
                  outputReportStatus: { $ne: inprogressStatusId },
                },
                {
                  $or: [{ outputReportCode: regex }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'activityproposals',
              let: { id: '$proposalId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', '$$id'] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'proposalData',
            },
          },
          { $unwind: '$proposalData' },
          { $sort: sortObject },
          {
            $facet: {
              records: [{ $skip: pageIndex * pageSize }, { $limit: pageSize }],
            },
          },
        ])
        .exec();

      count = reportList[0].records.length;

      for (const report of reportList[0].records) {
        partnerName = await this.partnerService.getPartnerInstituteNameById(
          report.partnerId,
        );

        statusName = await this.userService.getStatusName(
          report.outputReportStatus,
        );
        console.log('statusName = ', statusName);

        report.partnerName = partnerName;
        report.statusName = statusName;
      }

      return {
        reportsList: reportList[0].records,
        total: Math.ceil(count / 10),
      };
    } catch (error) {
      return error;
    }
  }

  async manageNetworkOutcomeReports(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortKey: string,
    sortDirection: number,
    year: number,
    // user,
  ) {
    Logger.debug('ReportsService.manageNetworkOutcomeReports');
    try {
      const sortObject = {};

      const stype = sortKey;
      const sdir = sortDirection;
      sortObject[stype] = sdir;
      const regex = new RegExp(searchKeyword, 'i');

      const inprogressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      let networkName, statusName;

      const reportList = await this.outcomeReportModel
        .aggregate([
          {
            $match: {
              $and: [
                {
                  year,
                  isDeleted: false,
                  networkId: { $ne: null },
                  outcomeReportStatus: { $ne: inprogressStatusId },
                },
                {
                  $or: [{ outcomeReportCode: regex }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'activityproposals',
              let: { id: '$proposalId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', '$$id'] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'proposalData',
            },
          },
          { $unwind: '$proposalData' },
          { $sort: sortObject },
          {
            $facet: {
              records: [{ $skip: pageIndex * pageSize }, { $limit: pageSize }],
            },
          },
        ])
        .exec();
      const count = reportList[0].records.length;

      for (const report of reportList[0].records) {
        networkName = await this.networkService.getNetworkNameById(
          report.networkId,
        );

        statusName = await this.userService.getStatusName(
          report.outcomeReportStatus,
        );
        console.log('statusName = ', statusName);

        report.networkName = networkName;
        report.statusName = statusName;
      }

      return {
        reportsList: reportList[0].records,
        total: Math.ceil(count / 10),
      };
    } catch (error) {
      return error;
    }
  }

  async managePartnerOutcomeReports(
    pageSize: number,
    pageIndex: number,
    searchKeyword: string,
    // status
    sortKey: string,
    sortDirection: number,
    year: number,
    // user,
  ) {
    Logger.debug('ReportsService.managePartnerOutcomeReports');
    try {
      const sortObject = {};

      const stype = sortKey;
      const sdir = sortDirection;
      sortObject[stype] = sdir;
      const regex = new RegExp(searchKeyword, 'i');

      const inprogressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      let partnerName, statusName;

      const reportList = await this.outcomeReportModel
        .aggregate([
          {
            $match: {
              $and: [
                {
                  year,
                  isDeleted: false,
                  partnerId: { $ne: null },
                  outcomeReportStatus: { $ne: inprogressStatusId },
                },
                {
                  $or: [{ outcomeReportCode: regex }],
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'activityproposals',
              let: { id: '$proposalId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$_id', '$$id'] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'proposalData',
            },
          },
          { $unwind: '$proposalData' },
          { $sort: sortObject },
          {
            $facet: {
              records: [{ $skip: pageIndex * pageSize }, { $limit: pageSize }],
            },
          },
        ])
        .exec();

      const count = reportList[0].records.length;

      for (const report of reportList[0].records) {
        partnerName = await this.partnerService.getPartnerInstituteNameById(
          report.partnerId,
        );

        statusName = await this.userService.getStatusName(
          report.outcomeReportStatus,
        );
        console.log('statusName = ', statusName);

        report.partnerName = partnerName;
        report.statusName = statusName;
      }

      return {
        reportsList: reportList[0].records,
        total: Math.ceil(count / 10),
      };
    } catch (error) {
      return error;
    }
  }

  async updateOutputReportApprovedCount(
    approvedCount: number,
    outputReportId: string,
  ) {
    Logger.debug('ReportsService.updateOutputReportApprovedCount');
    return this.outputReportModel
      .findOneAndUpdate(
        { outputReportId, isDeleted: false },
        { approvedCount },
        { new: true },
      )
      .exec();
  }

  async updateOutcomeReportApprovedCount(
    approvedCount: number,
    outcomeReportId: string,
  ) {
    Logger.debug('ReportsService.updateOutcomeReportApprovedCount');
    return this.outcomeReportModel
      .findOneAndUpdate(
        { outcomeReportId, isDeleted: false },
        { approvedCount },
        { new: true },
      )
      .exec();
  }

  async setApprovedAtTimeOfOutputReport(
    outputReportId: string,
    approvedAt: Date,
  ) {
    Logger.debug('ReportsService.setApprovedAtTimeOfOutputReport');
    return this.outputReportModel
      .findOneAndUpdate(
        {
          outputReportId,
          isDeleted: false,
        },
        { approvedAt },
        { new: true },
      )
      .exec();
  }

  async setApprovedAtTimeOfOutcomeReport(
    outcomeReportId: string,
    approvedAt: Date,
  ) {
    Logger.debug('ReportsService.setApprovedAtTimeOfOutcomeReport');
    return this.outcomeReportModel
      .findOneAndUpdate(
        {
          outcomeReportId,
          isDeleted: false,
        },
        { approvedAt },
        { new: true },
      )
      .exec();
  }

  async setSubmittedAtTimeOfOutputReport(
    outputReportId: string,
    submittedAt: Date,
  ) {
    Logger.debug('ReportsService.setSubmittedAtTimeOfOutputReport');
    return this.outputReportModel
      .findOneAndUpdate(
        {
          outputReportId,
          isDeleted: false,
        },
        { submittedAt },
        { new: true },
      )
      .exec();
  }

  async setSubmittedAtTimeOfOutcomeReport(
    outcomeReportId: string,
    submittedAt: Date,
  ) {
    Logger.debug('ReportsService.setSubmittedAtTimeOfOutcomeReport');
    return this.outcomeReportModel
      .findOneAndUpdate(
        {
          outcomeReportId,
          isDeleted: false,
        },
        { submittedAt },
        { new: true },
      )
      .exec();
  }

  async finalSaveOutputReport(reportId: string) {
    Logger.debug('ReportsService.finalSaveOutputReport');
    const report = await this.checkIfOutputReportExists(reportId);
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    if (!report)
      throw new NotFoundException(errorMessages.OUTPUT_REPORT_NOT_FOUND);
    else {
      return this.outputReportModel
        .findOneAndUpdate(
          {
            outputReportId: reportId,
            isDeleted: false,
          },
          {
            outputReportStatus: approvedStatusId,
            statusName: StatusEnum.APPROVED,
          },
          { new: true },
        )
        .exec();
    }
  }

  async finalSaveOutcomeReport(reportId: string) {
    Logger.debug('ReportsService.finalSaveOutcomeReport');
    const report = await this.checkIfOutcomeReportExists(reportId);
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    if (!report)
      throw new NotFoundException(errorMessages.OUTCOME_REPORT_NOT_FOUND);
    else {
      return this.outcomeReportModel
        .findOneAndUpdate(
          {
            outcomeReportId: reportId,
            isDeleted: false,
          },
          {
            outcomeReportStatus: approvedStatusId,
            statusName: StatusEnum.APPROVED,
          },
          { new: true },
        )
        .exec();
    }
  }

  /**Network management API for all output report download */
  async downloadGeneralUserMultipleOutputReport(
    res,
    year: number,
    isNetwork: boolean,
  ) {
    Logger.debug('ReportsService.downloadGeneralUserMultipleOutputReport');
    const workbook = new Workbook();

    let reportsList;

    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );

    if (isNetwork) {
      reportsList = await this.outputReportModel
        .find({
          year,
          isDeleted: false,
          networkId: { $ne: null },
          partnerId: { $eq: null },
          outputReportStatus: { $ne: inProgressStatusId },
        })
        .exec();
    } else {
      reportsList = await this.outputReportModel
        .find({
          year,
          isDeleted: false,
          partnerId: { $ne: null },
          networkId: { $eq: null },
          outputReportStatus: { $ne: inProgressStatusId },
        })
        .exec();
    }

    console.log('outputReport in multiple general user = ', reportsList);

    for (const report of reportsList) {
      await this.downloadOutputReport(res, report, workbook);
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'All Output Reports-' + year + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  /**Network management API for all outcome report download */
  async downloadGeneralUserMultipleOutcomeReport(
    res,
    year: number,
    isNetwork: boolean,
  ) {
    Logger.debug('ReportsService.downloadGeneralUserMultipleOutcomeReport');
    const workbook = new Workbook();

    let reportsList;

    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );

    if (isNetwork) {
      reportsList = await this.outcomeReportModel
        .find({
          year,
          isDeleted: false,
          networkId: { $ne: null },
          partnerId: { $eq: null },
          outcomeReportStatus: { $ne: inProgressStatusId },
        })
        .exec();
    } else {
      reportsList = await this.outcomeReportModel
        .find({
          year,
          isDeleted: false,
          partnerId: { $ne: null },
          networkId: { $eq: null },
          outcomeReportStatus: { $ne: inProgressStatusId },
        })
        .exec();
    }

    console.log('outcome reports in multiple general user = ', reportsList);

    for (const report of reportsList) {
      await this.downloadOutcomeReport(res, report, workbook);
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'All Outcome Reports-' + year + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async outputReportByActivityCode(activityCode: string) {
    Logger.debug('ReportsService.outputReportByActivityCode');
    const foundReport = await this.outputReportModel
      .findOne({ activityCode, isDeleted: false })
      .exec();
    if (foundReport)
      throw new ConflictException(errorMessages.OUTPUT_REPORT_EXISTS);
    else return foundReport;
  }

  async outcomeReportByActivityCode(activityCode: string) {
    Logger.debug('ReportsService.outcomeReportByActivityCode');
    const foundReport = await this.outcomeReportModel
      .findOne({ activityCode, isDeleted: false })
      .exec();
    if (foundReport)
      throw new ConflictException(errorMessages.OUTCOME_REPORT_EXISTS);
    else return foundReport;
  }

  /**To check if output report is approved for that particular year */
  async validateOnYearForOutcomeReport(year: number, user: any) {
    Logger.debug('ReportsService.validateOnYearForOutcomeReport');
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const foundOutputReport = await this.outputReportModel
      .findOne({
        year,
        isDeleted: false,
        networkId: user.networkId,
        partnerId: user.partnerId,
      })
      .exec();

    if (!foundOutputReport)
      throw new NotFoundException(errorMessages.OUTPUT_REPORT_NOT_FOUND);
    else if (
      foundOutputReport.outputReportStatus.toString() !==
      approvedStatusId.toString()
    ) {
      throw new UnprocessableEntityException(
        errorMessages.OUTPUT_REPORT_NOT_APPROVED,
      );
    } else return foundOutputReport;
  }
}
