import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserService } from '../users/user.service';
import { NetworkService } from '../networks/network.service';
import { AnnualReport } from './schema/annualReport.schema';
import { ProgressReport } from './schema/progressReport.schema';
import { StatusEnum } from '../common/enum/status.enum';
import { CreateProgressReportDTO } from './dto/createProgressReport.dto';
import { CreateAnnualReportDTO } from './dto/createAnnualReport.dto';
import { errorMessages } from '../utils/error-messages.utils';
import { ActivityLog } from '../common/schema/activityLog.schema';
import { EditAnnualReportDTO } from './dto/editAnnualReport.dto';
import { EditProgressReportDTO } from './dto/editProgressReport.dto';
import { v4 as uuidv4 } from 'uuid';
import { Workbook, Worksheet } from 'exceljs';
import { Workplan } from '../workplans/schema/workplan.schema';
import { ActivityStatus } from '../common/staticSchema/activityStatus.schema';
import { Activities } from '../activities/schema/activities.schema';
import { WorkplanActivities } from '../workplans/schema/workplan_activities.schema';
import { Invoice } from './schema/invoice.schema';
import { AddInvoiceDTO } from './dto/addInvoice.dto';
import { EditInvoiceDTO } from './dto/editInvoice.dto';
import * as fs from 'fs';
import puppeteer from 'puppeteer';
import hbs from 'handlebars';
import { MelpService } from '../melp/melp.service';
import { join } from 'path';
import { chromium } from 'playwright-chromium'

@Injectable()
export class NetworkReportingService {
  constructor(
    @InjectModel(ProgressReport.name)
    private progressReportModel: Model<ProgressReport>,

    @InjectModel(AnnualReport.name)
    private annualReportModel: Model<AnnualReport>,

    @InjectModel(ActivityLog.name)
    private activityLogModel: Model<ActivityLog>,

    @InjectModel(Workplan.name) private workplanModel: Model<Workplan>,

    @InjectModel(ActivityStatus.name)
    private activityStatusModel: Model<ActivityStatus>,

    @InjectModel(Activities.name)
    private activityModel: Model<Activities>,

    @InjectModel(WorkplanActivities.name)
    private workplanActivitiesModel: Model<WorkplanActivities>,

    @InjectModel(Invoice.name)
    private invoiceModel: Model<Invoice>,

    private readonly networkService: NetworkService,

    private readonly userService: UserService,

    private readonly melpService: MelpService,
  ) {}

  async commonFunctionForSearchSort(
    searchKeyword: string,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('ActivitiesService.commonFunctionForSearchSort');
    const regex = new RegExp(searchKeyword, 'i');
    sortKey = sortKey.trim().length === 0 ? 'updatedAt' : sortKey;
    const sortQuery = {};
    sortQuery[sortKey] = sortDirection === 1 ? 1 : -1;

    return {
      regex,
      sortQuery,
    };
  }

  async checkIfProgressReportExists(
    progressReportId: string,
    networkId: Types.ObjectId,
  ) {
    Logger.debug('NetworkReportingService.checkIfProgressReportExists');
    const existingReport = await this.progressReportModel
      .findOne({
        progressReportId,
        networkId,
        isDeleted: false,
      })
      .exec();

    if (existingReport) return true;
    else throw new NotFoundException(errorMessages.PROGRESS_REPORT_NOT_FOUND);
  }

  async getProgressReportByProgressReportId(progressReportId: string) {
    Logger.debug('MelpService.getProgressReportByProgressReportId');
    const existingReport = await this.progressReportModel
      .findOne({
        progressReportId,
        isDeleted: false,
      })
      .exec();

    if (existingReport) {
      return this.progressReportModel
        .findOne({
          progressReportId,
          isDeleted: false,
        })
        .exec();
    } else throw new NotFoundException(errorMessages.PROGRESS_REPORT_NOT_FOUND);
  }

  async checkIfProgressReportExistsByYear(year: number, user: any) {
    Logger.debug('NetworkReportingService.checkIfProgressReportExistsByYear');
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const reportAlreadyExists = await this.progressReportModel
      .findOne({
        year,
        networkId: user.networkId,
        isDeleted: false,
        statusId: { $ne: deniedStatusId },
      })
      .exec();
    if (reportAlreadyExists)
      throw new ConflictException(
        errorMessages.PROGRESS_REPORT_ALREADY_SUBMITTED,
      );
  }

  async createProgressReport(
    createProgressReport: CreateProgressReportDTO,
    user: any,
  ) {
    Logger.debug('NetworkReportingService.createProgressReport');
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const instituteName = await this.networkService.getNetworkNameById(
      user.networkId,
    );
    const reportAlreadyExists = await this.progressReportModel
      .findOne({
        year: createProgressReport.year,
        networkId: user.networkId,
        isDeleted: false,
      })
      .exec();
    if (reportAlreadyExists)
      throw new ConflictException(
        errorMessages.PROGRESS_REPORT_ALREADY_SUBMITTED,
      );
    const progressReport = await new this.progressReportModel({
      ...createProgressReport,
      progressReportId: uuidv4(),
      statusId: inProgressStatusId,
      instituteName,
      networkId: user.networkId,
      isInfoTabFilled: true,
    }).save();

    await this.melpService.addActivityLog(
      user,
      `Progress Report - ${progressReport.progressReportCode} created`,
    );
    return progressReport;
  }

  async editProgressReport(
    progressReportId: string,
    user: any,
    editProgressReport: EditProgressReportDTO,
  ) {
    Logger.debug('NetworkReportingService.editProgressReport');
    const existingReport = await this.checkIfProgressReportExists(
      progressReportId,
      user.networkId,
    );

    if (existingReport) {
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      const infoRequestedStatusId = await this.userService.getStatusId(
        StatusEnum.INFORMATION_REQUESTED,
      );

      const progressReport = await this.progressReportModel
        .findOneAndUpdate(
          {
            progressReportId,
            isDeleted: false,
            statusId: { $in: [inProgressStatusId, infoRequestedStatusId] },
          },
          {
            ...editProgressReport,
            updatedBy: user._id,
          },
          { new: true },
        )
        .exec();

      await this.melpService.addActivityLog(
        user,
        `Progress Report - ${progressReport.progressReportCode} updated`,
      );
      return progressReport;
    }
  }

  async getProgressReportList(
    user: any,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
    year: number,
  ) {
    Logger.debug('NetworkReportingService.getProgressReportList');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    let progressReportList, progressReportsCount;
    if (user.networkId === null && user.partnerId === null) {
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      progressReportList = await this.progressReportModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              statusId: { $ne: inProgressStatusId },
            },
            {
              $or: [{ progressReportCode: regex }, { instituteName: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      progressReportsCount = await this.progressReportModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              statusId: { $ne: inProgressStatusId },
            },
            {
              $or: [{ progressReportCode: regex }],
            },
          ],
        })
        .count()
        .exec();
    } else {
      progressReportList = await this.progressReportModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              networkId: user.networkId,
            },
            {
              $or: [{ progressReportCode: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      progressReportsCount = await this.progressReportModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              networkId: user.networkId,
            },
            {
              $or: [{ progressReportCode: regex }],
            },
          ],
        })
        .count()
        .exec();
    }

    let progressReportArray = [];
    for (const progressReport of progressReportList) {
      const temp = {};
      const invoice = await this.invoiceModel
        .findOne({ _id: progressReport.invoiceId })
        .exec();
      temp['progressReportId'] = progressReport.progressReportId;
      temp['progressReportCode'] = progressReport.progressReportCode;
      temp['status'] = await this.userService.getStatusName(
        progressReport.statusId,
      );
      temp['instituteName'] = progressReport.instituteName;
      temp['createdAt'] = progressReport.createdAt;
      temp['submittedAt'] = progressReport.submittedAt;
      temp['approvedAt'] = progressReport.approvedAt;
      temp['updatedAt'] = progressReport.updatedAt;
      temp['isInfoTabFilled'] = progressReport.isInfoTabFilled;
      temp['isInvoiceTabFilled'] = progressReport.isInvoiceTabFilled;
      temp['totalInvoiceAmount'] = invoice ? invoice.totalOfLineTotal : 'NA';
      temp['approvedCount'] = progressReport.approvedCount;
      temp['invoiceId'] = progressReport.invoiceId;
      progressReportArray = [...progressReportArray, { ...temp }];
    }

    return {
      progressReportArray,
      progressReportsCount,
      totalPageCount: Math.ceil(progressReportsCount / 10),
    };
  }

  async viewProgressReport(progressReportId: string) {
    Logger.debug('NetworkReportingService.viewProgressReport');
    const progressReport = await this.progressReportModel
      .findOne({
        progressReportId,
        isDeleted: false,
      })
      .exec();

    if (progressReport === null)
      throw new NotFoundException(errorMessages.PROGRESS_REPORT_NOT_FOUND);
    else return progressReport;
  }

  async removeProgressReport(progressReportId: string, user: any) {
    Logger.debug('NetworkReportingService.removeProgressReport');
    const existingReport = await this.checkIfProgressReportExists(
      progressReportId,
      user.networkId,
    );

    if (existingReport) {
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );

      const progressReport = await this.progressReportModel
        .findOneAndUpdate(
          {
            progressReportId,
            isDeleted: false,
            statusId: { $in: [inProgressStatusId] },
          },
          {
            isDeleted: true,
            updatedBy: user._id,
          },
          { new: true },
        )
        .exec();

      await this.melpService.addActivityLog(
        user,
        `Progress Report - ${progressReport.progressReportCode} deleted`,
      );
      return progressReport;
    }
  }

  async updateProgressReportApprovedCount(
    count: number,
    progressReportId: string,
  ) {
    Logger.debug('NetworkReportingService.updateProgressReportApprovedCount');
    return this.progressReportModel
      .findOneAndUpdate(
        { progressReportId, isDeleted: false },
        { approvedCount: count },
        { new: true },
      )
      .exec();
  }

  async updateProgressReportStatus(progressReportId: string, statusId) {
    Logger.debug('NetworkReportingService.updateProgressReportStatus');
    return this.progressReportModel
      .findOneAndUpdate(
        { progressReportId, isDeleted: false },
        { statusId: statusId },
        { new: true },
      )
      .exec();
  }

  async setSubmittedAtTimeOfProgressReport(
    progressReportId: string,
    submittedAt: Date,
  ) {
    Logger.debug('NetworkReportingService.setSubmittedAtTimeOfProgressReport');
    return this.progressReportModel
      .findOneAndUpdate(
        {
          progressReportId,
          isDeleted: false,
        },
        { submittedAt },
        { new: true },
      )
      .exec();
  }

  async setApprovedAtTimeOfProgressReport(
    progressReportId: string,
    approvedAt: Date,
  ) {
    Logger.debug('NetworkReportingService.setApprovedAtTimeOfProgressReport');
    return this.progressReportModel
      .findOneAndUpdate(
        {
          progressReportId,
          isDeleted: false,
        },
        { approvedAt },
        { new: true },
      )
      .exec();
  }

  /** Annual Report APIs */
  async checkIfAnnualReportExists(
    annualReportId: string,
    networkId: Types.ObjectId,
  ) {
    Logger.debug('NetworkReportingService.checkIfAnnualReportExists');
    const existingReport = await this.annualReportModel
      .findOne({
        annualReportId,
        networkId,
        isDeleted: false,
      })
      .exec();

    if (existingReport) return true;
    else throw new NotFoundException(errorMessages.ANNUAL_REPORT_NOT_FOUND);
  }

  async getAnnualReportByAnnualReportId(annualReportId: string) {
    Logger.debug('MelpService.getAnnualReportByAnnualReportId');
    const existingReport = await this.annualReportModel
      .findOne({
        annualReportId,
        isDeleted: false,
      })
      .exec();

    if (existingReport) {
      return this.annualReportModel
        .findOne({
          annualReportId,
          isDeleted: false,
        })
        .exec();
    } else throw new NotFoundException(errorMessages.ANNUAL_REPORT_NOT_FOUND);
  }

  async checkIfAnnualReportExistsByYear(year: number, user: any) {
    Logger.debug('NetworkReportingService.checkIfAnnualReportExistsByYear');
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    const reportAlreadyExists = await this.annualReportModel
      .findOne({
        year,
        networkId: user.networkId,
        isDeleted: false,
        statusId: { $ne: deniedStatusId },
      })
      .exec();
    if (reportAlreadyExists)
      throw new ConflictException(
        errorMessages.ANNUAL_REPORT_ALREADY_SUBMITTED,
      );
  }

  async createAnnualReport(
    createAnnualReport: CreateAnnualReportDTO,
    user: any,
  ) {
    Logger.debug('NetworkReportingService.createAnnualReport');
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const instituteName = await this.networkService.getNetworkNameById(
      user.networkId,
    );
    const reportAlreadyExists = await this.annualReportModel
      .findOne({
        year: createAnnualReport.year,
        networkId: user.networkId,
        isDeleted: false,
      })
      .exec();

    if (reportAlreadyExists)
      throw new ConflictException(
        errorMessages.ANNUAL_REPORT_ALREADY_SUBMITTED,
      );

    const annualReport = await new this.annualReportModel({
      ...createAnnualReport,
      annualReportId: uuidv4(),
      statusId: inProgressStatusId,
      instituteName,
      networkId: user.networkId,
      isInfoTabFilled: true,
    }).save();

    await this.melpService.addActivityLog(
      user,
      `Annual Report - ${annualReport.annualReportCode} created`,
    );
    return annualReport;
  }

  async editAnnualReport(
    annualReportId: string,
    user: any,
    editAnnualReport: EditAnnualReportDTO,
  ) {
    Logger.debug('NetworkReportingService.editAnnualReport');
    const existingReport = await this.checkIfAnnualReportExists(
      annualReportId,
      user.networkId,
    );
    if (existingReport) {
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      const infoRequestedStatusId = await this.userService.getStatusId(
        StatusEnum.INFORMATION_REQUESTED,
      );

      const annualReport = await this.annualReportModel
        .findOneAndUpdate(
          {
            annualReportId,
            isDeleted: false,
            statusId: { $in: [inProgressStatusId, infoRequestedStatusId] },
          },
          {
            ...editAnnualReport,
            updatedBy: user._id,
          },
          { new: true },
        )
        .exec();

      await this.melpService.addActivityLog(
        user,
        `Annual Report - ${annualReport.annualReportCode}  updated`,
      );
      return annualReport;
    }
  }

  async getAnnualReportList(
    user: any,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
    year: number,
  ) {
    Logger.debug('NetworkReportingService.getAnnualReportList');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    let annualReportList, annualReportsCount;
    if (user.networkId === null && user.partnerId === null) {
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      annualReportList = await this.annualReportModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              statusId: { $ne: inProgressStatusId },
            },
            {
              $or: [{ annualReportCode: regex }, { instituteName: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      annualReportsCount = await this.annualReportModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              statusId: { $ne: inProgressStatusId },
            },
            {
              $or: [{ annualReportCode: regex }],
            },
          ],
        })
        .count()
        .exec();
    } else {
      annualReportList = await this.annualReportModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              networkId: user.networkId,
            },
            {
              $or: [{ annualReportCode: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      annualReportsCount = await this.annualReportModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              networkId: user.networkId,
            },
            {
              $or: [{ annualReportCode: regex }],
            },
          ],
        })
        .count()
        .exec();
    }

    let annualReportArray = [];
    for (const annualReport of annualReportList) {
      const temp = {};
      const invoice = await this.invoiceModel
        .findOne({ _id: annualReport.invoiceId })
        .exec();
      temp['annualReportId'] = annualReport.annualReportId;
      temp['annualReportCode'] = annualReport.annualReportCode;
      temp['status'] = await this.userService.getStatusName(
        annualReport.statusId,
      );
      temp['instituteName'] = annualReport.instituteName;
      temp['createdAt'] = annualReport.createdAt;
      temp['submittedAt'] = annualReport.submittedAt;
      temp['approvedAt'] = annualReport.approvedAt;
      temp['updatedAt'] = annualReport.updatedAt;
      temp['isInfoTabFilled'] = annualReport.isInfoTabFilled;
      temp['isInvoiceTabFilled'] = annualReport.isInvoiceTabFilled;
      temp['totalInvoiceAmount'] = invoice ? invoice.totalOfLineTotal : 'NA';
      temp['approvedCount'] = annualReport.approvedCount;
      temp['invoiceId'] = annualReport.invoiceId;
      annualReportArray = [...annualReportArray, { ...temp }];
    }

    return {
      annualReportArray,
      annualReportsCount,
      totalPageCount: Math.ceil(annualReportsCount / 10),
    };
  }

  async viewAnnualReport(annualReportId: string) {
    Logger.debug('NetworkReportingService.viewAnnualReport');
    const annualReport = await this.annualReportModel
      .findOne({
        annualReportId,
        isDeleted: false,
      })
      .exec();

    if (annualReport === null)
      throw new NotFoundException(errorMessages.ANNUAL_REPORT_NOT_FOUND);
    else return annualReport;
  }

  async removeAnnualReport(annualReportId: string, user: any) {
    Logger.debug('NetworkReportingService.removeAnnualReport');
    const existingReport = await this.checkIfAnnualReportExists(
      annualReportId,
      user.networkId,
    );

    if (existingReport) {
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );

      const annualReport = await this.annualReportModel
        .findOneAndUpdate(
          {
            annualReportId,
            isDeleted: false,
            statusId: { $in: [inProgressStatusId] },
          },
          {
            isDeleted: true,
            updatedBy: user._id,
          },
          { new: true },
        )
        .exec();

      await this.melpService.addActivityLog(
        user,
        `Annual Report - ${annualReport.annualReportCode}  deleted`,
      );
      return annualReport;
    }
  }

  async updateAnnualReportApprovedCount(count: number, annualReportId: string) {
    Logger.debug('NetworkReportingService.updateAnnualReportApprovedCount');
    return this.annualReportModel
      .findOneAndUpdate(
        { annualReportId, isDeleted: false },
        { approvedCount: count },
        { new: true },
      )
      .exec();
  }

  async updateAnnualReportStatus(annualReportId: string, statusId) {
    Logger.debug('NetworkReportingService.updateAnnualReportStatus');
    return this.annualReportModel
      .findOneAndUpdate(
        { annualReportId, isDeleted: false },
        { statusId: statusId },
        { new: true },
      )
      .exec();
  }

  async setSubmittedAtTimeOfAnnualReport(
    annualReportId: string,
    submittedAt: Date,
  ) {
    Logger.debug('NetworkReportingService.setSubmittedAtTimeOfAnnualReport');
    return this.annualReportModel
      .findOneAndUpdate(
        {
          annualReportId,
          isDeleted: false,
        },
        { submittedAt },
        { new: true },
      )
      .exec();
  }

  async setApprovedAtTimeOfAnnualReport(
    annualReportId: string,
    approvedAt: Date,
  ) {
    Logger.debug('NetworkReportingService.setApprovedAtTimeOfAnnualReport');
    return this.annualReportModel
      .findOneAndUpdate(
        {
          annualReportId,
          isDeleted: false,
        },
        { approvedAt },
        { new: true },
      )
      .exec();
  }

  async exportProgressReport(
    res,
    progressReport: ProgressReport,
    worksheet: Worksheet,
    worksheetCount: number,
  ) {
    Logger.debug('NetworkReportingService.exportProgressReport');
    worksheet.columns = [
      { header: 'Year', key: 'year', width: 5 },
      { header: 'Institute Name', key: 'instituteName', width: 30 },
      { header: 'Report Code', key: 'code', width: 20 },
      { header: 'Network Manager Name', key: 'networkManagerName', width: 30 },
      {
        header: 'Network Manager Email',
        key: 'networkManagerEmail',
        width: 30,
      },
      {
        header: "Changes in network's general information",
        key: 'changesInGeneralInfo',
        width: 40,
      },
      {
        header: "Changes in network's membership",
        key: 'reportOnProgress',
        width: 40,
      },
      {
        header: "Network's improved visibility",
        key: 'networksImprovedVisibility',
        width: 40,
      },
      {
        header: 'Number of planned capacity with CAP-NET support',
        key: 'totalNumberOfPlannedCapacityWithCapnet',
        width: 40,
      },
      {
        header: 'Number of delivered capacity',
        key: 'totalNumberOfDeliveredCapacityWithCapnet',
        width: 40,
      },
      { header: 'Challenges and actions', key: 'challenges', width: 40 },
      {
        header: 'Number of planned capacity without CAP-NET support',
        key: 'totalNumberOfPlannedCapacityWithoutCapnet',
        width: 40,
      },
      {
        header: 'Number of potenital stories of change',
        key: 'numberOfPotentialStoriesOfChange',
        width: 40,
      },
      {
        header: 'Has Story of change',
        key: 'hasSubmittedInfoToDevelopStoryOfChange',
        width: 20,
      },
      //Mel progress
    ];

    worksheet.addRow({
      year: 'Year',
      instituteName: 'Institute Name',
      code: 'Report Code',
      networkManagerName: 'Network Manager Name',
      networkManagerEmail: 'Network Manager Email',
      changesInGeneralInfo: "Changes in network's general information",
      reportOnProgress: "Changes in network's membership",
      networksImprovedVisibility: "Network's improved visibility",
      totalNumberOfPlannedCapacityWithCapnet:
        'Number of planned capacity with CAP-NET support',
      totalNumberOfDeliveredCapacityWithCapnet: 'Number of delivered capacity',
      challenges: 'Challenges and actions',
      totalNumberOfPlannedCapacityWithoutCapnet:
        'Number of planned capacity without CAP-NET support',
      numberOfPotentialStoriesOfChange: 'Number of potenital stories of change',
      hasSubmittedInfoToDevelopStoryOfChange: 'Has Story of change',
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    let networksImprovedVisibility = '',
      networksImprovedVisibilityCount = 1;
    for (const imporvedVisibility of progressReport.networksImprovedVisibility) {
      if (networksImprovedVisibilityCount === 1) {
        networksImprovedVisibility += imporvedVisibility;
        networksImprovedVisibilityCount++;
      } else {
        networksImprovedVisibility += ', ' + imporvedVisibility;
      }
      if (imporvedVisibility === 'Other') {
        networksImprovedVisibility +=
          ', ' + progressReport.otherImprovedVisibility;
      }
    }
    networksImprovedVisibility += '.';

    let challengesAndActions = '',
      challengesCount = 1;
    for (const challenge of progressReport.challenges) {
      if (challengesCount === 1 && challenge === 'Other') {
        challengesAndActions += progressReport.otherChallenge;
        challengesCount++;
      } else if (challengesCount !== 1 && challenge === 'Other') {
        challengesAndActions += ', ' + progressReport.otherChallenge;
      } else if (challengesCount === 1 && challenge !== 'Other') {
        challengesAndActions += challenge;
        challengesCount++;
      } else {
        challengesAndActions += ', ' + challenge;
      }
    }
    challengesAndActions += '.';

    worksheet.getRow(worksheetCount).values = {
      year: progressReport.year,
      instituteName: progressReport.instituteName,
      code: progressReport.progressReportCode,
      networkManagerName: progressReport.networkManagerName,
      networkManagerEmail: progressReport.networkManagerEmail,
      changesInGeneralInfo: progressReport.changesInGeneralInfo,
      reportOnProgress: progressReport.reportOnProgress,
      networksImprovedVisibility: networksImprovedVisibility,
      totalNumberOfPlannedCapacityWithCapnet:
        progressReport.totalNumberOfPlannedCapacityWithCapnet,
      totalNumberOfDeliveredCapacityWithCapnet:
        progressReport.totalNumberOfDeliveredCapacityWithCapnet,
      challenges: challengesAndActions,
      totalNumberOfPlannedCapacityWithoutCapnet:
        progressReport.totalNumberOfPlannedCapacityWithoutCapnet,
      numberOfPotentialStoriesOfChange:
        progressReport.numberOfPotentialStoriesOfChange,
      hasSubmittedInfoToDevelopStoryOfChange:
        progressReport.hasSubmittedInfoToDevelopStoryOfChange ? 'Yes' : 'No',
    };
  }

  async exportIndividualProgressReport(res, progressReportId: string) {
    Logger.debug('NetworkReportingService.exportIndividualProgressReport');
    const progressReport = await this.getProgressReportByProgressReportId(
      progressReportId,
    );
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(
      `Progress Report - ${progressReport.year}`,
    );
    const worksheetCount = 2;
    await this.exportProgressReport(
      res,
      progressReport,
      worksheet,
      worksheetCount,
    );
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' +
        'Progress Report-' +
        progressReport.instituteName +
        '-' +
        progressReport.year +
        '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async commonFunctionForMutipleDownloadProgressReport(
    res,
    progressReportList: ProgressReport[],
    year: number,
  ) {
    Logger.debug(
      'NetworkReportingService.commonFunctionForMutipleDownloadProgressReport',
    );
    if (progressReportList.length === 0)
      throw new NotFoundException(errorMessages.PROGRESS_REPORT_NOT_FOUND);

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(`Progress Report - ${year}`);
    let worksheetCount = 2;
    for (const progressReport of progressReportList) {
      await this.exportProgressReport(
        res,
        progressReport,
        worksheet,
        worksheetCount,
      );
      worksheetCount++;
    }
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'Progress Report-' + year + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async exportMultipleProgressReport(res, year: number, user: any) {
    Logger.debug('NetworkReportingService.exportIndividualProgressReport');
    let progressReportList;
    if (user.networkId === null && user.partnerId === null) {
      progressReportList = await this.progressReportModel
        .find({ year, isDeleted: false })
        .exec();
    } else {
      progressReportList = await this.progressReportModel
        .find({
          year,
          isDeleted: false,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
    }
    await this.commonFunctionForMutipleDownloadProgressReport(
      res,
      progressReportList,
      year,
    );
  }

  async exportGeneralUserMultipleProgressReport(
    res,
    year: number,
    isNetwork: boolean,
  ) {
    Logger.debug(
      'NetworkReportingService.exportGeneralUserMultipleProgressReport',
    );
    let progressReportList;
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    if (isNetwork) {
      progressReportList = await this.progressReportModel
        .find({
          year,
          isDeleted: false,
          networkId: { $ne: null },
          partnerId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    } else {
      progressReportList = await this.progressReportModel
        .find({
          year,
          isDeleted: false,
          partnerId: { $ne: null },
          networkId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    }
    await this.commonFunctionForMutipleDownloadProgressReport(
      res,
      progressReportList,
      year,
    );
  }

  async exportAnnualReport(
    res,
    annualReport: AnnualReport,
    worksheet: Worksheet,
    worksheetCount: number,
  ) {
    Logger.debug('NetworkReportingService.exportAnnualReport');
    worksheet.columns = [
      { header: 'Year', key: 'year', width: 5 },
      { header: 'Institute Name', key: 'instituteName', width: 30 },
      { header: 'Report Code', key: 'code', width: 20 },
      { header: 'Network Manager Name', key: 'networkManagerName', width: 30 },
      {
        header: 'Network Manager Email',
        key: 'networkManagerEmail',
        width: 30,
      },
      { header: 'Network Website', key: 'networkWebsite', width: 30 },
      {
        header: 'Last update on website',
        key: 'lastUpdateOnWebsite',
        width: 30,
      },
      {
        header: "Changes in network's general information",
        key: 'changesInGeneralInfo',
        width: 40,
      },
      {
        header: "Changes in network's membership",
        key: 'reportOnProgress',
        width: 40,
      },
      {
        header: "Network's improved visibility",
        key: 'networksImprovedVisibility',
        width: 40,
      },
      {
        header: 'Actions taken to support members',
        key: 'actionsTakenToSupportNetworkMembers',
        width: 40,
      },
      {
        header: 'Number of planned capacity with CAP-NET support',
        key: 'totalNumberOfPlannedCapacityWithCapnet',
        width: 40,
      },
      {
        header: 'Number of delivered capacity',
        key: 'totalNumberOfDeliveredCapacityWithCapnet',
        width: 40,
      },
      { header: 'Challenges and actions', key: 'challenges', width: 40 },
      {
        header: 'Number of planned capacity without CAP-NET support',
        key: 'totalNumberOfPlannedCapacityWithoutCapnet',
        width: 40,
      },
      {
        header: 'Number of active partners',
        key: 'numberOfActivePartners',
        width: 40,
      },
      // members and partners list
      // mel progress
      {
        header: 'Has network achieved what is expected',
        key: 'hasNetworkAchievedWhatIsExpected',
        width: 40,
      },
      {
        header: 'Details of what is expected',
        key: 'whatIsExpectedDetails',
        width: 40,
      },
      {
        header: 'Any contributing factors',
        key: 'anyContributingFactors',
        width: 40,
      },
      {
        header: 'Details of contributing factors',
        key: 'contributingFactorsDetails',
        width: 40,
      },
      {
        header: 'Any unexpected outcome',
        key: 'anyUnexpectedOutcome',
        width: 40,
      },
      {
        header: 'Details of unexpected outcome',
        key: 'unexpectedOutcomeDetails',
        width: 40,
      },
      {
        header: 'Sustain Positive Results',
        key: 'sustainPositiveResults',
        width: 40,
      },
      {
        header: 'Number of potenital stories of change',
        key: 'numberOfPotentialStoriesOfChange',
        width: 40,
      },
      {
        header: 'Has Story of change',
        key: 'hasSubmittedInfoToDevelopStoryOfChange',
        width: 20,
      },
      {
        header: "Network's Performance Rating",
        key: 'networkPerformanceRating',
        width: 20,
      },
      {
        header: "Network's Performance Rating Explaination",
        key: 'networkPerformanceRatingExplaination',
        width: 20,
      },
      {
        header: "Network's Knowledge Rating",
        key: 'networkKnowledgeRating',
        width: 20,
      },
      {
        header: "Network's Knowledge Rating Explaination",
        key: 'networkKnowledgeRatingExplaination',
        width: 20,
      },
      {
        header: "Network's Partner Engagement Rating",
        key: 'networkPartnerEngagementRating',
        width: 20,
      },
      {
        header: "Network's Partner Engagement Rating Explaination",
        key: 'networkPartnerEngagementRatingExplaination',
        width: 20,
      },
      {
        header: "Network's Demand-Driven Capacity Rating",
        key: 'networkDemandDrivenCapacityRating',
        width: 20,
      },
      {
        header: "Network's Demand-Driven Capacity Rating Explaination",
        key: 'networkDemandDrivenCapacityRatingExplaination',
        width: 50,
      },
    ];

    worksheet.addRow({
      year: 'Year',
      instituteName: 'Institute Name',
      code: 'Report Code',
      networkManagerName: 'Network Manager Name',
      networkManagerEmail: 'Network Manager Email',
      networkWebsite: 'Network Website',
      lastUpdateOnWebsite: 'Last Update On Website',
      changesInGeneralInfo: "Changes in network's general information",
      reportOnProgress: "Changes in network's membership",
      networksImprovedVisibility: "Network's improved visibility",
      actionsTakenToSupportNetworkMembers:
        'Actions Taken To Support Network Members',
      totalNumberOfPlannedCapacityWithCapnet:
        'Number of planned capacity with CAP-NET support',
      totalNumberOfDeliveredCapacityWithCapnet: 'Number of delivered capacity',
      challenges: 'Challenges and actions',
      totalNumberOfPlannedCapacityWithoutCapnet:
        'Number of planned capacity without CAP-NET support',
      numberOfActivePartners: 'Number Of Active Partners',

      hasNetworkAchievedWhatIsExpected: 'Has Network Achieved What Is Expected',
      whatIsExpectedDetails: 'Details of what is expected',
      anyContributingFactors: 'Any Contributing Factors',
      contributingFactorsDetails: 'Details of contributing factors',
      anyUnexpectedOutcome: 'Any Unexpected Outcome',
      unexpectedOutcomeDetails: 'Details of unexpected outcome',
      sustainPositiveResults: 'Sustain Positive Results',
      numberOfPotentialStoriesOfChange: 'Number of potenital stories of change',
      hasSubmittedInfoToDevelopStoryOfChange: 'Has Story of change',
      networkPerformanceRating: 'Network Performance Rating',
      networkPerformanceRatingExplaination:
        'Network Performance Rating Explaination',
      networkKnowledgeRating: 'Network Knowledge Rating',
      networkKnowledgeRatingExplaination:
        'Network Knowledge Rating Explaination',
      networkPartnerEngagementRating: 'Network Partner Engagement Rating',
      networkPartnerEngagementRatingExplaination:
        'Network Partner Engagement Rating Explaination',
      networkDemandDrivenCapacityRating:
        'Network Demand-Driven Capacity Rating',
      networkDemandDrivenCapacityRatingExplaination:
        'Network Demand-Driven Capacity Rating Explaination',
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    let networksImprovedVisibility = '',
      networksImprovedVisibilityCount = 1;
    for (const imporvedVisibility of annualReport.networksImprovedVisibility) {
      if (networksImprovedVisibilityCount === 1) {
        networksImprovedVisibility += imporvedVisibility;
        networksImprovedVisibilityCount++;
      } else {
        networksImprovedVisibility += ', ' + imporvedVisibility;
      }
      if (imporvedVisibility === 'Other') {
        networksImprovedVisibility +=
          ', ' + annualReport.otherImprovedVisibility;
      }
    }
    networksImprovedVisibility += '.';

    let challengesAndActions = '',
      challengesCount = 1;
    for (const challenge of annualReport.challenges) {
      if (challengesCount === 1 && challenge === 'Other') {
        challengesAndActions += annualReport.otherChallenge;
        challengesCount++;
      } else if (challengesCount !== 1 && challenge === 'Other') {
        challengesAndActions += ', ' + annualReport.otherChallenge;
      } else if (challengesCount === 1 && challenge !== 'Other') {
        challengesAndActions += challenge;
        challengesCount++;
      } else {
        challengesAndActions += ', ' + challenge;
      }
    }
    challengesAndActions += '.';

    let actionsTaken = '',
      actionsTakenCount = 1;
    for (const action of annualReport.actionsTakenToSupportNetworkMembers) {
      if (actionsTakenCount === 1 && action === 'Other') {
        actionsTaken += annualReport.otherChallenge;
        actionsTakenCount++;
      } else if (actionsTakenCount !== 1 && action === 'Other') {
        actionsTaken += ', ' + annualReport.otherChallenge;
      } else if (actionsTakenCount === 1 && action !== 'Other') {
        actionsTaken += action;
        actionsTakenCount++;
      } else {
        actionsTaken += ', ' + action;
      }
    }
    actionsTaken += '.';

    worksheet.getRow(worksheetCount).values = {
      year: annualReport.year,
      instituteName: annualReport.instituteName,
      code: annualReport.annualReportCode,
      networkManagerName: annualReport.networkManagerName,
      networkManagerEmail: annualReport.networkManagerEmail,
      networkWebsite: annualReport.networkWebsite,
      lastUpdateOnWebsite: annualReport.lastUpdateOnWebsite,
      changesInGeneralInfo: annualReport.changesInGeneralInfo,
      reportOnProgress: annualReport.reportOnProgress,
      networksImprovedVisibility: networksImprovedVisibility,
      actionsTakenToSupportNetworkMembers: actionsTaken,
      totalNumberOfPlannedCapacityWithCapnet:
        annualReport.totalNumberOfPlannedCapacityWithCapnet,
      totalNumberOfDeliveredCapacityWithCapnet:
        annualReport.totalNumberOfDeliveredCapacityWithCapnet,
      challenges: challengesAndActions,
      totalNumberOfPlannedCapacityWithoutCapnet:
        annualReport.totalNumberOfPlannedCapacityWithoutCapnet,
      numberOfActivePartners: annualReport.numberOfActivePartners,

      hasNetworkAchievedWhatIsExpected:
        annualReport.hasNetworkAchievedWhatIsExpected ? 'Yes' : 'No',
      whatIsExpectedDetails: annualReport.whatIsExpectedDetails,
      anyContributingFactors: annualReport.anyContributingFactors
        ? 'Yes'
        : 'No',
      contributingFactorsDetails: annualReport.contributingFactorsDetails,
      anyUnexpectedOutcome: annualReport.anyUnexpectedOutcome ? 'Yes' : 'No',
      unexpectedOutcomeDetails: annualReport.unexpectedOutcomeDetails,
      sustainPositiveResults: annualReport.sustainPositiveResults,
      numberOfPotentialStoriesOfChange:
        annualReport.numberOfPotentialStoriesOfChange,
      hasSubmittedInfoToDevelopStoryOfChange:
        annualReport.hasSubmittedInfoToDevelopStoryOfChange ? 'Yes' : 'No',
      networkPerformanceRating: annualReport.networkPerformanceRating,
      networkPerformanceRatingExplaination:
        annualReport.networkPerformanceRatingExplaination,
      networkKnowledgeRating: annualReport.networkKnowledgeRating,
      networkKnowledgeRatingExplaination:
        annualReport.networkKnowledgeRatingExplaination,
      networkPartnerEngagementRating:
        annualReport.networkPartnerEngagementRating,
      networkPartnerEngagementRatingExplaination:
        annualReport.networkPartnerEngagementRatingExplaination,
      networkDemandDrivenCapacityRating:
        annualReport.networkDemandDrivenCapacityRating,
      networkDemandDrivenCapacityRatingExplaination:
        annualReport.networkDemandDrivenCapacityRatingExplaination,
    };
  }

  async exportIndividualAnnualReport(res, annualReportId: string) {
    Logger.debug('NetworkReportingService.exportIndividualAnnualReport');
    const annualReport = await this.getAnnualReportByAnnualReportId(
      annualReportId,
    );
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(
      `Annual Report - ${annualReport.year}`,
    );
    const worksheetCount = 2;
    await this.exportAnnualReport(res, annualReport, worksheet, worksheetCount);
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' +
        'Annual Report-' +
        annualReport.instituteName +
        '-' +
        annualReport.year +
        '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async commonFunctionForMutipleDownloadAnnualReport(
    res,
    annualReportList: AnnualReport[],
    year: number,
  ) {
    Logger.debug(
      'NetworkReportingService.commonFunctionForMutipleDownloadAnnualReport',
    );
    if (annualReportList.length === 0)
      throw new NotFoundException(errorMessages.ANNUAL_REPORT_NOT_FOUND);

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(`Annual Report - ${year}`);
    let worksheetCount = 2;
    for (const annualReport of annualReportList) {
      await this.exportAnnualReport(
        res,
        annualReport,
        worksheet,
        worksheetCount,
      );
      worksheetCount++;
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition':
        'attachment; filename=' + 'Annual Report-' + year + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async exportMultipleAnnualReport(res, year: number, user: any) {
    Logger.debug('NetworkReportingService.exportMultipleAnnualReport');
    let annualReportList;
    if (user.networkId === null && user.partnerId === null) {
      annualReportList = await this.annualReportModel
        .find({ year, isDeleted: false })
        .exec();
    } else {
      annualReportList = await this.annualReportModel
        .find({
          year,
          isDeleted: false,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
    }
    await this.commonFunctionForMutipleDownloadAnnualReport(
      res,
      annualReportList,
      year,
    );
  }

  async exportGeneralUserMultipleAnnualReport(
    res,
    year: number,
    isNetwork: boolean,
  ) {
    Logger.debug(
      'NetworkReportingService.exportGeneralUserMultipleAnnualReport',
    );
    let annualReportList;
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    if (isNetwork) {
      annualReportList = await this.annualReportModel
        .find({
          year,
          isDeleted: false,
          networkId: { $ne: null },
          partnerId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    } else {
      annualReportList = await this.annualReportModel
        .find({
          year,
          isDeleted: false,
          partnerId: { $ne: null },
          networkId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    }
    await this.commonFunctionForMutipleDownloadAnnualReport(
      res,
      annualReportList,
      year,
    );
  }

  async getTimeframeCounts(year: number, user: any) {
    Logger.debug('NetworkReportingService.getTimeframeCounts');
    const plannedStatusId = await this.activityStatusModel
      .findOne({
        activityStatusName: 'Planned',
      })
      .exec();
    const completedStatusId = await this.activityStatusModel
      .findOne({
        activityStatusName: 'Completed',
      })
      .exec();
    const workplans = await this.workplanModel
      .find({
        year,
        isDeleted: false,
        networkId: user.networkId,
        partnerId: user.partnerId,
      })
      .exec();

    let workplanActivitiesId = [];
    for (const workplan of workplans) {
      const workplanActivities = await this.workplanActivitiesModel
        .find({ isDeleted: false, workplanId: workplan._id })
        .exec();
      for (const workplanActivity of workplanActivities) {
        const temp = {};
        temp['activityId'] = workplanActivity.activityId;
        workplanActivitiesId = [...workplanActivitiesId, { ...temp }];
      }
    }

    let plannedActivityCount = 0,
      completedActivityCount = 0;
    for (const activity of workplanActivitiesId) {
      plannedActivityCount += await this.activityModel
        .find({
          _id: activity['activityId'],
          implementationQuarter: { $in: ['Q1', 'Q2'] },
          activityStatusId: plannedStatusId,
          isDeleted: false,
        })
        .count()
        .exec();

      completedActivityCount += await this.activityModel
        .find({
          _id: activity['activityId'],
          implementationQuarter: { $in: ['Q1', 'Q2'] },
          activityStatusId: completedStatusId,
          isDeleted: false,
        })
        .count()
        .exec();
    }

    return {
      plannedActivityCount,
      completedActivityCount,
    };
  }

  async addInvoice(addInvoice: AddInvoiceDTO, user: any) {
    Logger.debug('NetworkReportingService.getTimeframeCounts');
    return new this.invoiceModel({
      ...addInvoice,
      invoiceNumber: uuidv4(), // need to discuss the format
      networkId: user.networkId,
      partnerId: user.partnerId,
      progressReportId: addInvoice.progressReportId
        ? new Types.ObjectId(addInvoice.progressReportId)
        : null,
      annualReportId: addInvoice.annualReportId
        ? new Types.ObjectId(addInvoice.annualReportId)
        : null,
      outputReportId: addInvoice.outputReportId
        ? new Types.ObjectId(addInvoice.outputReportId)
        : null,
      outcomeReportId: addInvoice.outcomeReportId
        ? new Types.ObjectId(addInvoice.outcomeReportId)
        : null,
    }).save();
  }

  async editInvoice(
    invoiceNumber: string,
    editInvoice: EditInvoiceDTO,
    user: any,
  ) {
    Logger.debug('NetworkReportingService.editInvoice');
    const invoice = await this.invoiceModel
      .findOne({ invoiceNumber, isDeleted: false })
      .exec();
    if (invoice === null)
      throw new BadRequestException(errorMessages.INVOICE_NOT_FOUND);

    return this.invoiceModel
      .findOneAndUpdate(
        {
          invoiceNumber,
          isDeleted: false,
        },
        {
          ...editInvoice,
          updatedBy: user._id,
        },
        { new: true },
      )
      .exec();
  }

  async getInvoice(invoiceId) {
    Logger.debug('NetworkReportingService.getInvoice');
    const invoice = await this.invoiceModel
      .findOne({ _id: invoiceId, isDeleted: false })
      .exec();
    if (invoice === null)
      throw new BadRequestException(errorMessages.INVOICE_NOT_FOUND);
    return invoice;
  }

  async compile(data) {
    Logger.debug('NetworkReportingService.compile');
    console.log(`${process.cwd()}/dist/mail/templates/invoice.hbs`)
    const html = fs.readFileSync(`${process.cwd()}/dist/mail/templates/invoice.hbs`, {
      encoding: 'utf-8',
    });
    return hbs.compile(html)(data);
  }

  async downloadInvoice(res, invoiceId) {
    Logger.debug('NetworkReportingService.downloadInvoice');
    const invoice_id = new Types.ObjectId(invoiceId)
    const invoiceData = await this.invoiceModel
      .findOne({ _id: invoice_id, isDeleted: false })
      .exec();
    console.log("Invoice ", invoiceData, invoiceId, invoice_id)
    if(!invoiceData) throw new NotFoundException(errorMessages.INVOICE_NOT_FOUND)

    const stringJson = JSON.stringify(invoiceData);
    const invoice = JSON.parse(stringJson);

    // const browser = await puppeteer.launch();
    const browser = await chromium.launch({executablePath: "/home/.cache/ms-playwright/chromium-1041/chrome-linux/chrome"});

    console.log("Browser ", browser)
    const page = await browser.newPage();
    console.log("Page ", page)
    console.log(
      'Date ',
      new Date(invoice.createdAt).toLocaleDateString('en-US'),
    );
    // const content = await this.compile('src/mail/templates/invoice', {
    const content = await this.compile({
      invoice: invoice,
      name: invoice.name.toUpperCase(),
      address: invoice.address[0].toUpperCase() + invoice.address.substr(1),
      bankAccountName:
        invoice.bankAccountName[0].toUpperCase() +
        invoice.bankAccountName.substr(1),
      bankAddress:
        invoice.bankAddress[0].toUpperCase() + invoice.bankAddress.substr(1),
      createdAt: new Date(invoice.createdAt).toLocaleDateString('en-US'),
    });
    await page.setContent(content);
    const pdf = await page.pdf({ format: 'A4' });

    await browser.close();
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length,
      // 'Access-Control-Allow-Origin': '*',
      'Content-Disposition': 'attachment; filename=Invoice.pdf',
    });
    res.send(pdf);
  }

  async addInvoiceInProgressReport(
    progressReportId: string,
    user: any,
    invoiceId,
  ) {
    Logger.debug('NetworkReportingService.addInvoiceInProgressReport');
    const existingReport = await this.checkIfProgressReportExists(
      progressReportId,
      user.networkId,
    );

    if (existingReport) {
      return this.progressReportModel
        .findOneAndUpdate(
          {
            progressReportId,
            isDeleted: false,
          },
          {
            // ...invoiceId,
            invoiceId: new Types.ObjectId(invoiceId.invoiceId),
            updatedBy: user._id,
            isInvoiceTabFilled: true,
          },
          { new: true },
        )
        .exec();
    }
  }

  async addInvoiceInAnnualReport(annualReportId: string, user: any, invoiceId) {
    Logger.debug('NetworkReportingService.addInvoiceInAnnualReport');
    const existingReport = await this.checkIfAnnualReportExists(
      annualReportId,
      user.networkId,
    );

    if (existingReport) {
      return this.annualReportModel
        .findOneAndUpdate(
          {
            annualReportId,
            isDeleted: false,
          },
          {
            // ...invoiceId,
            invoiceId: new Types.ObjectId(invoiceId.invoiceId),
            updatedBy: user._id,
            isInvoiceTabFilled: true,
          },
          { new: true },
        )
        .exec();
    }
  }
}
