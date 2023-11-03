import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddIndicatorDTO } from './dto/addIndicator.dto';
import { CreateMelpSRFDTO } from './dto/createMelpSRF.dto';
import { Melp } from './schema/melp.schema';
import { MelpIndicatorMonitoring } from './schema/melpIndicatorMonitoring.schema';
import { MelpIndicatorRisks } from './schema/melpIndicatorRisks.schema';
import { MelpOutcomeProgressMarkers } from './schema/melpOutcomeProgressMarkers.schema';
import { MelpOutcomes } from './schema/melpOutcomes.schema';
import { MelpResultIndicators } from './schema/melpResultIndicators.schema';
import { MelpResults } from './schema/melpResults.schema';
import { AddResultDTO } from './dto/addResult.dto';
import { ObjectiveLevel } from './enum/objectiveLevel.enum';
import { CreateMelpOMDTO } from './dto/createMelpOM.dto';
import { UserService } from '../users/user.service';
import { Priority } from '../common/staticSchema/priority.schema';
import { ProgressMonitoring } from '../common/staticSchema/progressMonitoring.schema';
import { errorMessages } from '../utils/error-messages.utils';
import { NetworkService } from '../networks/network.service';
import { EditResultDTO } from './dto/editResult.dto';
import { EditOmDTO } from './dto/editOM.dto';
import { EditIndicatorDTO } from './dto/editIndicator.dto';
import { CreateNetworkMelpSRFDTO } from './dto/createNetworkMelpSRF.dto';
import { MelpTasks } from './schema/melpTasks.schema';
import { MelpTaskDetails } from './schema/melpTaskDetails.schema';
import { EditNetworkMelpSRFDTO } from './dto/editNetworkMelpSRF.dto';
import * as exceljs from 'exceljs';
import { PartnerService } from '../partners/partner.service';
import { ActivityLog } from '../common/schema/activityLog.schema';
import { AddMelProgressSRFDTO } from './dto/addMelProgressSRF.dto';
import { AddMelProgressPMDTO } from './dto/addMelProgressPM.dto';
import { StatusEnum } from '../common/enum/status.enum';
import { CapnetEnum } from '../common/enum/capnet.enum';
import { Activities } from '../activities/schema/activities.schema';
import { ActivityProposals } from '../activities/schema/activityProposals.schema';

@Injectable()
export class MelpService {
  constructor(
    @InjectModel(Melp.name) private melpModel: Model<Melp>,

    @InjectModel(MelpResults.name) private melpResultsModel: Model<MelpResults>,

    @InjectModel(MelpResultIndicators.name)
    private melpResultIndicatorsModel: Model<MelpResultIndicators>,

    @InjectModel(MelpIndicatorMonitoring.name)
    private melpIndicatorMonitoringModel: Model<MelpIndicatorMonitoring>,

    @InjectModel(MelpIndicatorRisks.name)
    private melpIndicatorRisksModel: Model<MelpIndicatorRisks>,

    @InjectModel(MelpOutcomes.name)
    private melpOutcomesModel: Model<MelpOutcomes>,

    @InjectModel(MelpOutcomeProgressMarkers.name)
    private melpOutcomeProgressMarkersModel: Model<MelpOutcomeProgressMarkers>,

    @InjectModel(Priority.name)
    private readonly priorityModel: Model<Priority>,

    @InjectModel(ProgressMonitoring.name)
    private readonly progressMonitoringModel: Model<ProgressMonitoring>,

    @InjectModel(MelpTasks.name)
    private readonly melpTaskModel: Model<MelpTasks>,

    @InjectModel(MelpTaskDetails.name)
    private melpTaskDetailsModel: Model<MelpTaskDetails>,

    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,

    private userService: UserService,

    private networkService: NetworkService,

    private partnerService: PartnerService,

    @InjectModel(Activities.name)
    private activityModel: Model<Activities>,

    @InjectModel(ActivityProposals.name)
    private activityProposalModel: Model<ActivityProposals>,
  ) {}

  // Check If MELP Year for a particulat institute name exists
  async checkIfMelpYearExists(year: number, instituteName: string) {
    try {
      Logger.debug('MelpService.checkIfMelpYearExists');
      const deniedStatusId = await this.userService.getStatusId(
        StatusEnum.DENIED,
      );
      const existingMelpYear = await this.melpModel
        .findOne({
          year: year,
          isDeleted: false,
          instituteName: instituteName,
          statusId: { $ne: deniedStatusId },
        })
        .exec();
      if (existingMelpYear) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async checkMelpYearExists(year: number, user: any) {
    Logger.debug('MelpService.checkMelpYearExists');
    let instituteName;
    if (user.networkId === null && user.partnerId === null) {
      instituteName = CapnetEnum.CAPNET;
    } else if (user.networkId !== null && user.partnerId === null) {
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
    } else if (user.networkId === null && user.partnerId !== null) {
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
    }
    const exists = await this.checkIfMelpYearExists(year, instituteName);
    if (exists) throw new ConflictException(errorMessages.MELP_YEAR_EXISTS);
  }

  // Check If MELP exists
  async checkIfMelpExists(melpId: string) {
    try {
      Logger.debug('MelpService.checkIfMelpExists');
      const melpExists = await this.melpModel
        .findOne({
          melpId: melpId,
          isDeleted: false,
        })
        .exec();
      if (melpExists) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  // API's to get counts
  // Get Objective Level Counts For A MELP
  async getObjectiveLevelCounts(melpId: string) {
    Logger.debug('MelpService.getObjectiveLevelCounts');
    const melp = await this.getMelpByMelpId(melpId);
    if (melp === null)
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    const results = await this.melpResultsModel
      .find({
        melpId: melp._id,
      })
      .exec();

    let impactCount = 0,
      outcomeCount = 0,
      outputCount = 0;

    for (const result of results) {
      // Checking Objective level of each result and increasing the count accordingly
      if (result.objectiveLevel === ObjectiveLevel.IMPACT) {
        impactCount++;
      } else if (result.objectiveLevel === ObjectiveLevel.OUTCOME) {
        outcomeCount++;
      } else if (result.objectiveLevel === ObjectiveLevel.OUTPUT) {
        outputCount++;
      }
    }

    return {
      impactCount,
      outcomeCount,
      outputCount,
    };
  }

  // Get Outcomes Count for a MELP
  async getOutcomesCount(melpId: string) {
    Logger.debug('MelpService.getOutcomesCount');
    const melp = await this.getMelpByMelpId(melpId);
    if (melp === null)
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);

    const outcomesCount = await this.melpOutcomesModel
      .find({ melpId: melp._id })
      .count()
      .exec();

    return {
      outcomesCount,
    };
  }

  // Get Indicators Count For A Result
  async getIndicatorsCount(resultId: string) {
    Logger.debug('MelpService.getIndicatorsCount');
    const result = await this.melpResultsModel
      .findOne({
        resultId: resultId,
        isDeleted: false,
      })
      .exec();
    if (result === null)
      throw new NotFoundException(errorMessages.RESULT_NOT_FOUND);

    const indicatorsCount = await this.melpResultIndicatorsModel
      .find({
        resultId: result._id,
      })
      .count()
      .exec();

    return { indicatorsCount };
  }

  // Get Progress Markers Count For A Outcome Challenge
  async getProgressMarkersCount(outcomeId: string) {
    Logger.debug('MelpService.getProgressMarkersCount');
    const outcomeChallenge = await this.melpOutcomesModel
      .findOne({
        outcomeId: outcomeId,
        isDeleted: false,
      })
      .exec();

    if (outcomeChallenge === null) {
      throw new NotFoundException(errorMessages.OUTCOME_CHALLENGE_NOT_FOUND);
    }

    const progressMarkerCount = await this.melpOutcomeProgressMarkersModel
      .find({
        melpOutcomeId: outcomeChallenge._id,
      })
      .count()
      .exec();
    return { progressMarkerCount };
  }

  // Static Data Tables Queries
  // Get Priority
  async getPriority(priorityId) {
    Logger.debug('MelpService.getPriority');
    const priority = await this.priorityModel
      .findById({ _id: priorityId })
      .exec();
    return priority.priority;
  }

  // Get MELP Task
  async getMelpTask() {
    try {
      Logger.debug('MelpService.getMelpTask');
      return this.melpTaskModel.find().exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Get Priority
  async getPriorityList() {
    try {
      Logger.debug('MelpService.getPriorityList');
      return this.priorityModel.find().exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Get Progress Monitorings
  async getProgressMonitoring(id: any) {
    try {
      Logger.debug('MelpService.getProgressMonitoring');
      return await this.progressMonitoringModel.findOne({ _id: id }).exec();
      // if (progressMonitoring === null)
      // throw new NotFoundException('Monitoring Not Found');
      // return ' ';
      // else return progressMonitoring.progressMonitoring;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Get Boundary Partners
  async boundaryPartners() {
    Logger.debug('MelpService.boundaryPartners');

    const outcomes = await this.melpOutcomesModel
      .find({ isDeleted: false })
      .exec();
    const boundaryPartnersArray = [];

    for (const outcome of outcomes) {
      for (const boundaryPartner of outcome.boundaryPartners) {
        boundaryPartnersArray.push(boundaryPartner);
      }
    }
    return [...new Set(boundaryPartnersArray)];
  }

  // Get API's from UUID
  // Get melp by melpId
  async getMelpByMelpId(melpId: string) {
    try {
      Logger.debug('MelpService.getMelpByMelpId');
      const melpExists = await this.checkIfMelpExists(melpId);
      if (melpExists) {
        return await this.melpModel
          .findOne({
            melpId: melpId,
            isDeleted: false,
          })
          .exec();
      } else {
        return null;
      }
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  // Get Result by resultId
  async getResultByResultId(resultId: string) {
    Logger.debug('MelpService.getResultByResultId');
    const result = await this.melpResultsModel
      .findOne({
        resultId: resultId,
        isDeleted: false,
      })
      .exec();

    if (result === null)
      throw new NotFoundException(errorMessages.RESULT_NOT_FOUND);
    else return result;
  }

  // Get Indicator by indicatorId
  async getIndicatorByIndicatorId(indicatorId: string) {
    Logger.debug('MelpService.getIndicatorByIndicatorId');
    const indicator = await this.melpResultIndicatorsModel
      .findOne({
        indicatorId: indicatorId,
        isDeleted: false,
      })
      .exec();

    if (indicator === null)
      throw new NotFoundException(errorMessages.INDICATOR_NOT_FOUND);
    else return indicator;
  }

  // Get Outcome Challenge by outcomeId
  async getOutcomeByOutcomeId(outcomeId: string) {
    Logger.debug('MelpService.getOutcomeByOutcomeId');
    const outcome = await this.melpOutcomesModel
      .findOne({
        outcomeId: outcomeId,
        isDeleted: false,
      })
      .exec();

    if (outcome === null)
      throw new NotFoundException(errorMessages.OUTCOME_CHALLENGE_NOT_FOUND);
    else return outcome;
  }

  // Get API's from mongo-id
  // Get Result by mongoId
  async getResultById(id: any) {
    Logger.debug('MelpService.getResultById');
    const result = await this.melpResultsModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .exec();

    if (result === null)
      throw new NotFoundException(errorMessages.RESULT_NOT_FOUND);
    else return result;
  }

  // Get Indicator by mongoId
  async getIndicatorById(indicatorId: any) {
    Logger.debug('MelpService.getIndicatorById');
    const indicator = await this.melpResultIndicatorsModel
      .findOne({
        _id: indicatorId,
        isDeleted: false,
      })
      .exec();

    if (indicator) return indicator;
    else return null;
  }

  //Get MELP Results by year
  async getMelpResultsByYear(year: number, user: any) {
    Logger.debug('MelpService.getMelpByYear');
    let melp;
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    if (user.networkId) {
      melp = await this.melpModel
        .findOne({
          year: year,
          isDeleted: false,
          networkId: user.networkId,
          statusId: { $ne: deniedStatusId },
        })
        .exec();
    } else if (user.partnerId) {
      melp = await this.melpModel
        .findOne({
          year: year,
          isDeleted: false,
          partnerId: user.partnerId,
          statusId: { $ne: deniedStatusId },
        })
        .exec();
    } else {
      melp = await this.melpModel
        .findOne({
          year: year,
          isDeleted: false,
          statusId: { $ne: deniedStatusId },
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
    }

    if (!melp) throw new NotFoundException(errorMessages.MELP_NOT_FOUND);

    return this.melpResultsModel
      .find({
        melpId: melp._id,
        isDeleted: false,
      })
      .exec();
  }

  async getMelpResultsByYearForCapnet(year: number, user: any) {
    Logger.debug('MelpService.getMelpResultsByYearForCapnet');
    let melp;
    const deniedStatusId = await this.userService.getStatusId(
      StatusEnum.DENIED,
    );
    if (user.networkId === null && user.partnerId === null) {
      melp = await this.melpModel
        .find({
          year: year,
          isDeleted: false,
          statusId: { $ne: deniedStatusId },
        })
        .exec();
    }

    if (!melp) throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    let results = [];
    for (const eachMelp of melp) {
      const result = await this.melpResultsModel
        .find({
          melpId: eachMelp._id,
          isDeleted: false,
        })
        .exec();

      results = [...results, ...result];
      // results.push(result)
    }
    console.log('Results ', results);
    return results;
  }

  // Get indicators by resultId
  async getIndicatorsByResultId(id: string) {
    Logger.debug('MelpService.getIndicatorsByResultId');
    return this.melpResultIndicatorsModel
      .find({
        isDeleted: false,
        resultId: id,
      })
      .exec();
  }

  // Common function to return array of melp objects
  async getArrayOfMelpObjects(melpsList) {
    Logger.debug('MelpService.getArrayOfMelpObjects');
    const melpSummary = [];
    for (const melp of melpsList) {
      const temp = {};
      temp['melpId'] = melp.melpId;
      temp['melpCode'] = melp.melpCode;
      temp['instituteName'] = melp.instituteName;
      temp['status'] = await this.userService.getStatusName(melp.statusId);
      temp['year'] = melp.year;
      temp['createdAt'] = new Date(melp.createdAt);
      temp['updateAt'] = melp.updatedAt;
      temp['isDeleted'] = melp.isDeleted;
      temp['resultCount'] = await this.melpResultsModel
        .find({ isDeleted: false, melpId: melp._id })
        .count()
        .exec();
      temp['approvedCount'] = melp.approvedCount;
      melpSummary.push(temp);
    }
    return melpSummary;
  }

  // Common function for Activity Log
  async addActivityLog(user: any, description: string) {
    Logger.debug('MelpService.addActivityLog');
    let instituteName;
    if (user.networkId === null && user.partnerId === null) {
      instituteName = CapnetEnum.CAPNET;
    } else if (user.networkId !== null && user.partnerId === null) {
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
    } else if (user.networkId === null && user.partnerId !== null) {
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
    }

    await new this.activityLogModel({
      userId: user._id,
      name: user.fullName,
      instituteName: instituteName,
      description: description,
      networkId: user.networkId,
      partnerId: user.partnerId,
    }).save();
  }

  async commonFunctionForSearchSort(
    searchKeyword: string,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('MelpService.commonFunctionForSearchSort');
    const regex = new RegExp(searchKeyword, 'i');
    sortKey = sortKey.trim().length === 0 ? 'updatedAt' : sortKey;
    const sortQuery = {};
    sortQuery[sortKey] = sortDirection === 1 ? 1 : -1;

    return {
      regex,
      sortQuery,
    };
  }

  // MELP Summary By Year Table
  async viewMelpSummary(
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    try {
      Logger.debug('MelpService.viewMelpSummary');
      const { regex, sortQuery } = await this.commonFunctionForSearchSort(
        searchKeyword,
        sortKey,
        sortDirection,
      );
      const approvedStatusId = await this.userService.getStatusId(
        StatusEnum.APPROVED,
      );
      const melpsList = await this.melpModel
        .find({
          $and: [
            { isDeleted: false, year: year, statusId: approvedStatusId },
            {
              $or: [{ melpCode: regex }, { instituteName: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      const melpsCount = await this.melpModel
        .find({
          isDeleted: false,
          year: year,
          statusId: approvedStatusId,
        })
        .count()
        .exec();

      const melpSummary = await this.getArrayOfMelpObjects(melpsList);
      return {
        melpSummary: melpSummary,
        melpsCount,
        pagesCount: Math.ceil(melpsCount / 10),
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // View MELP submitted by all the networks
  async viewAllNetworksMelp(
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
    year: number,
  ) {
    try {
      Logger.debug('MelpService.viewAllNetworksMelp');
      const { regex, sortQuery } = await this.commonFunctionForSearchSort(
        searchKeyword,
        sortKey,
        sortDirection,
      );
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      const melpsList = await this.melpModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              networkId: { $ne: null },
              partnerId: { $eq: null },
              statusId: { $ne: inProgressStatusId },
            },
            {
              $or: [{ melpCode: regex }, { instituteName: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageLimit * pageIndex)
        .limit(pageLimit)
        .exec();

      const melpsCount = await this.melpModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              networkId: { $ne: null },
              partnerId: { $eq: null },
              statusId: { $ne: inProgressStatusId },
            },
            {
              $or: [{ melpCode: regex }, { instituteName: regex }],
            },
          ],
        })
        .count()
        .exec();

      const melpSummary = await this.getArrayOfMelpObjects(melpsList);
      return {
        melpsList: melpSummary,
        melpsCount,
        pageCount: Math.ceil(melpsCount / 10),
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // View MELP submitted by all the networks
  async viewAllPartnersMelp(
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
    year: number,
  ) {
    try {
      Logger.debug('MelpService.viewAllPartnersMelp');
      const { regex, sortQuery } = await this.commonFunctionForSearchSort(
        searchKeyword,
        sortKey,
        sortDirection,
      );
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      const melpsList = await this.melpModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              partnerId: { $ne: null },
              networkId: { $eq: null },
              statusId: { $ne: inProgressStatusId },
            },
            {
              $or: [{ melpCode: regex }, { instituteName: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageLimit * pageIndex)
        .limit(pageLimit)
        .exec();

      const melpsCount = await this.melpModel
        .find({
          $and: [
            {
              year,
              isDeleted: false,
              partnerId: { $ne: null },
              networkId: { $eq: null },
              statusId: { $ne: inProgressStatusId },
            },
            {
              $or: [{ melpCode: regex }, { instituteName: regex }],
            },
          ],
        })
        .count()
        .exec();

      const melpSummary = await this.getArrayOfMelpObjects(melpsList);
      return {
        melpsList: melpSummary,
        melpsCount,
        pageCount: Math.ceil(melpsCount / 10),
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Network or Partner MELP Summary By Year - Table
  async viewNetworkOrPartnerMelpSummary(
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
    user: any,
  ) {
    try {
      Logger.debug('MelpService.viewNetworkOrPartnerMelpSummary');
      const { regex, sortQuery } = await this.commonFunctionForSearchSort(
        searchKeyword,
        sortKey,
        sortDirection,
      );
      let melpsList, melpsCount;
      if (user.networkId) {
        melpsList = await this.melpModel
          .find({
            $and: [
              {
                isDeleted: false,
                year: year,
                networkId: { $ne: null, $eq: user.networkId },
              },
              {
                $or: [{ melpCode: regex }, { instituteName: regex }],
              },
            ],
          })
          .sort(sortQuery)
          .skip(pageIndex * pageLimit)
          .limit(pageLimit)
          .exec();

        melpsCount = await this.melpModel
          .find({ isDeleted: false, year: year, networkId: user.networkId })
          .count()
          .exec();
      } else if (user.partnerId) {
        melpsList = await this.melpModel
          .find({
            $and: [
              {
                isDeleted: false,
                year: year,
                partnerId: { $ne: null, $eq: user.partnerId },
                networkId: null,
              },
              {
                $or: [{ melpCode: regex }, { instituteName: regex }],
              },
            ],
          })
          .sort(sortQuery)
          .skip(pageIndex * pageLimit)
          .limit(pageLimit)
          .exec();

        melpsCount = await this.melpModel
          .find({
            isDeleted: false,
            year: year,
            npartnerId: user.partnerId,
            networkId: null,
          })
          .count()
          .exec();
      }

      const melpSummary = await this.getArrayOfMelpObjects(melpsList);

      return {
        melpsList: melpSummary,
        melpsCount,
        pageCount: Math.ceil(melpsCount / 10),
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // SRF Summary Table
  async viewMelpSrfSummary(
    melpId: string,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    try {
      Logger.debug('MelpService.viewMelpSrfSummary');
      const { regex, sortQuery } = await this.commonFunctionForSearchSort(
        searchKeyword,
        sortKey,
        sortDirection,
      );
      const melp = await this.getMelpByMelpId(melpId);
      if (melp === null) {
        throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
      }
      const results = await this.melpResultsModel
        .find({
          $and: [
            {
              melpId: melp._id,
              isDeleted: false,
            },
            {
              $or: [{ resultCode: regex }, { resultName: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      const resultsCount = await this.melpResultsModel
        .find({
          melpId: melp._id,
          isDeleted: false,
        })
        .count()
        .exec();

      let resultList = [];
      for (const result of results) {
        const temp = {};
        const indicatorsCount = await this.melpResultIndicatorsModel
          .find({
            resultId: result._id,
            isDeleted: false,
          })
          .count()
          .exec();
        temp['resultId'] = result.resultId;
        temp['resultCode'] = result.resultCode;
        temp['resultName'] = result.resultName;
        temp['indicatorsCount'] = indicatorsCount;
        resultList = [...resultList, { ...temp }];
      }

      return {
        results: resultList,
        resultsCount,
        pageCount: Math.ceil(resultsCount / 10),
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // View MELP SRF - Detailed
  async viewMelpSrf(resultId: string, pageLimit: number, pageIndex: number) {
    try {
      Logger.debug('MelpService.viewMelpSrf');
      const result = await this.melpResultsModel
        .findOne({
          resultId: resultId,
          isDeleted: false,
        })
        .exec();

      const melp = await this.melpModel.findOne({ _id: result.melpId }).exec();

      const indicators = await this.melpResultIndicatorsModel
        .find({
          resultId: result._id,
          isDeleted: false,
        })
        .skip(pageLimit * pageIndex)
        .limit(pageLimit)
        .exec();

      const indicatorsCount = await this.melpResultIndicatorsModel
        .find({ resultId: result._id })
        .count()
        .exec();

      const pageCount = await this.melpResultIndicatorsModel
        .find({ resultId: result._id, isDeleted: false })
        .count()
        .exec();

      let indicatorList = [];
      for (const indicator of indicators) {
        const temp = {};
        const monitorings = await this.melpIndicatorMonitoringModel
          .find({
            resultIndicatorId: indicator._id,
            isDeleted: false,
          })
          .exec();

        const risks = await this.melpIndicatorRisksModel
          .find({
            resultIndicatorId: indicator._id,
            isDeleted: false,
          })
          .exec();
        temp['indicator'] = indicator;
        temp['monitorings'] = monitorings;
        temp['risks'] = risks;
        indicatorList = [...indicatorList, { ...temp }];
      }

      return {
        melpId: melp.melpId,
        melpYear: melp.year,
        melpCode: melp.melpCode,
        resultId: result.resultId,
        resultCode: result.resultCode,
        resultName: result.resultName,
        objectiveLevel: result.objectiveLevel,
        indicatorList,
        indicatorsCount,
        pageCount,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // OM Summary - Table
  async viewMelpOMSummary(
    melpId: string,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    try {
      Logger.debug('MelpService.viewMelpOMSummary');
      const { regex, sortQuery } = await this.commonFunctionForSearchSort(
        searchKeyword,
        sortKey,
        sortDirection,
      );
      const melp = await this.getMelpByMelpId(melpId);
      if (melp === null) {
        throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
      }

      const outcomes = await this.melpOutcomesModel
        .find({
          $and: [
            {
              melpId: melp._id,
              isDeleted: false,
            },
            {
              $or: [{ outcomeCode: regex }, { outcomeChallenge: regex }],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      const outcomesCount = await this.melpOutcomesModel
        .find({
          melpId: melp._id,
          isDeleted: false,
        })
        .count()
        .exec();

      let omList = [];
      for (const outcome of outcomes) {
        const temp = {};
        const progressMarkerTotalCount =
          await this.melpOutcomeProgressMarkersModel
            .find({
              outcomeId: outcome._id,
              isDeleted: false,
            })
            .count()
            .exec();
        temp['outcomeId'] = outcome.outcomeId;
        temp['outcomeCode'] = outcome.outcomeCode;
        temp['outcomeChallenge'] = outcome.outcomeChallenge;
        temp['progressMarkerTotalCount'] = progressMarkerTotalCount;
        omList = [...omList, { ...temp }];
      }

      return {
        results: omList,
        outcomesCount,
        pageCount: Math.ceil(outcomesCount / 10),
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // View MELP OM - Detailed
  async viewMelpOm(outcomeId: string) {
    Logger.debug('MelpService.viewMelpOm');
    const outcome = await this.getOutcomeByOutcomeId(outcomeId);
    const progressMarkers = await this.melpOutcomeProgressMarkersModel
      .find({
        outcomeId: outcome._id,
        isDeleted: false,
      })
      .exec();

    let progressMarkerList = [];
    for (const marker of progressMarkers) {
      const temp = {};
      temp['progressMarkersId'] = marker.progressMarkersId;
      temp['progressMarkerCode'] = marker.progressMarkerCode;
      temp['progressMarker'] = marker.progressMarker;
      temp['priority'] = marker.priorityId;
      progressMarkerList = [...progressMarkerList, { ...temp }];
    }

    const progressMarkerTotalCount = await this.melpOutcomeProgressMarkersModel
      .find({ outcomeId: outcome._id })
      .count()
      .exec();

    return {
      outcome,
      progressMarkers: progressMarkerList,
      // boundaryPartners: boundaryPartners,
      progressMarkerTotalCount,
    };
  }

  // SRF Monitorings - For View MEL Progress and Global SRF Monitorings
  async getMelpSRFMonitoringsGlobal(
    melpId: string,
    searchKeyword: string,
    sortKey: string,
    sortDirection: number | any,
  ) {
    Logger.debug('MelpService.getMelpSRFMonitoringsGlobal');

    const melp = await this.getMelpByMelpId(melpId);
    if (melp === null) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }
    const regex = new RegExp(searchKeyword, 'i');
    sortKey = sortKey.trim().length === 0 ? 'updatedAt' : sortKey;
    const sortFilters: any = {
      instituteName: 'instituteName',
      resultCode: 'resultsList.resultCode',
      indicatorCode: 'indicatorsList.indicatorCode',
      indicatorName: 'indicatorsList.indicatorName',
      measurementUnit: 'indicatorsList.measurementUnit',
      cumulativeTarget: 'indicatorsList.cumulativeTarget',
      targetAchieved: 'monitoringsList.targetAchieved',
      explaination: 'monitoringsList.explaination',
      progress: 'monitoringsList.progress',
      baseline: 'monitoringsList.baseline',
      updatedAt: 'updatedAt',
    };

    return this.melpModel
      .aggregate([
        {
          $match: {
            _id: melp._id,
            $or: [{ instituteName: { $regex: regex } }],
          },
        },
        {
          $lookup: {
            from: 'melpresults',
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$melpId', melp._id] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'resultsList',
          },
        },
        { $unwind: '$resultsList' },
        {
          $lookup: {
            from: 'melpresultindicators',
            let: { resultId: '$resultsList._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$resultId', '$$resultId'] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'indicatorsList',
          },
        },
        { $unwind: '$indicatorsList' },
        {
          $lookup: {
            from: 'melpindicatormonitorings',
            let: { resultIndicatorId: '$indicatorsList._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$resultIndicatorId', '$$resultIndicatorId'] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'monitoringsList',
          },
        },
        { $unwind: '$monitoringsList' },
        {
          $sort: {
            [`${sortFilters[sortKey]}`]: sortDirection,
          },
        },
        // {
        //   $facet: {
        //     records: [],
        //     totalCount: [{ $count: 'count' }],
        //   },
        // },
      ])
      .exec();
  }

  async getMelpProgressMarkerMonitoringsGlobal(
    melpId: string,
    searchKeyword: string,
    sortKey: string,
    sortDirection: number | any,
  ) {
    Logger.debug('MelpService.getMelpProgressMarkerMonitoringsGlobal');
    const melp = await this.getMelpByMelpId(melpId);
    if (melp === null) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }

    sortKey = sortKey.trim().length === 0 ? 'updatedAt' : sortKey;
    const regex = new RegExp(searchKeyword, 'i');
    const sortFilters: any = {
      instituteName: 'instituteName',
      outcomeCode: 'outcomesList.outcomeCode',
      progressMarkerCode: 'progressMarkersList.progressMarkerCode',
      progressMarker: 'progressMarkersList.progressMarker',
      descriptionOfChange: 'progressMarkersList.descriptionOfChange',
      contributingFactors: 'progressMarkersList.contributingFactors',
      sourceOfEvidence: 'progressMarkersList.sourceOfEvidence',
      unintendedChanges: 'progressMarkersList.unintendedChanges',
      updatedAt: 'updatedAt',
    };

    return this.melpModel
      .aggregate([
        {
          $match: {
            _id: melp._id,
            $or: [{ instituteName: { $regex: regex } }],
          },
        },
        {
          $lookup: {
            from: 'melpoutcomes',
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$melpId', melp._id] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'outcomesList',
          },
        },
        { $unwind: '$outcomesList' },
        {
          $lookup: {
            from: 'melpoutcomeprogressmarkers',
            let: { outcomeId: '$outcomesList._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$outcomeId', '$$outcomeId'] },
                      { $eq: ['$isDeleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'progressMarkersList',
          },
        },
        { $unwind: '$progressMarkersList' },
        {
          $sort: {
            [`${sortFilters[sortKey]}`]: sortDirection,
          },
        },
      ])
      .exec();
  }

  async getArrayOfObjectsForMelpProgressSRF(results) {
    Logger.debug('MelpService.getArrayOfObjectsForMelpProgress');
    let indicatorsMonitoringList = [],
      indicatorsTotalCount;
    for (const result of results) {
      for (let i = 0; i < result.records.length; i++) {
        const temp = {};
        temp['instituteName'] = result.records[i].instituteName;
        temp['resultCode'] = result.records[i].resultsList.resultCode;
        temp['indicatorCode'] = result.records[i].indicatorsList.indicatorCode;
        temp['indicator'] = result.records[i].indicatorsList.indicatorName;
        temp['indicatorMonitoringId'] =
          result.records[i].monitoringsList.indicatorMonitoringId;
        temp['measurementUnit'] =
          result.records[i].indicatorsList.measurementUnit;
        temp['cumulativeTarget'] =
          result.records[i].indicatorsList.cumulativeTarget;
        temp['baseline'] = result.records[i].monitoringsList.baseline;
        temp['target'] = result.records[i].monitoringsList.targetAchieved;
        temp['progress'] = result.records[i].monitoringsList.progress;
        temp['explaination'] = result.records[i].monitoringsList.explaination;
        indicatorsMonitoringList = [...indicatorsMonitoringList, { ...temp }];
      }
      indicatorsTotalCount =
        result.records.length === 0 ? 0 : result.totalCount[0].count;
    }

    return {
      indicatorsMonitoringList,
      indicatorsTotalCount,
    };
  }

  async getArrayOfObjectsForMelpProgressSRFGlobal(results) {
    Logger.debug('MelpService.getArrayOfObjectsForMelpProgressSRFGlobal');
    let indicatorsMonitoringList = [],
      count = 0;
    for (const result of results) {
      console.log('Length ', result);
      for (let i = 0; i < result.length; i++) {
        const temp = {};
        temp['instituteName'] = result[i].instituteName;
        temp['resultCode'] = result[i].resultsList.resultCode;
        temp['indicatorCode'] = result[i].indicatorsList.indicatorCode;
        temp['indicator'] = result[i].indicatorsList.indicatorName;
        temp['indicatorMonitoringId'] =
          result[i].monitoringsList.indicatorMonitoringId;
        temp['measurementUnit'] = result[i].indicatorsList.measurementUnit;
        temp['cumulativeTarget'] = result[i].indicatorsList.cumulativeTarget;
        temp['baseline'] = result[i].monitoringsList.baseline;
        temp['target'] = result[i].monitoringsList.targetAchieved;
        temp['progress'] = result[i].monitoringsList.progress;
        temp['explaination'] = result[i].monitoringsList.explaination;
        indicatorsMonitoringList = [...indicatorsMonitoringList, { ...temp }];
      }
      count += result.length;
    }
    const indicatorsTotalCount = count;
    return {
      indicatorsMonitoringList,
      indicatorsTotalCount,
    };
  }

  async getArrayOfObjectsForMelpProgressPM(outcomeMappings) {
    Logger.debug('MelpService.getArrayOfObjectsForMelpProgressPM');
    let progressMonitoringList = [],
      progressMonitoringsTotalCount;
    for (const mapping of outcomeMappings) {
      for (let i = 0; i < mapping.records.length; i++) {
        const temp = {};
        temp['instituteName'] = mapping.records[i].instituteName;
        temp['outcomeCode'] = mapping.records[i].outcomesList.outcomeCode;
        temp['progressMarkerCode'] =
          mapping.records[i].progressMarkersList.progressMarkerCode;
        temp['marker'] = mapping.records[i].progressMarkersList.progressMarker;
        temp['progressMarkerId'] =
          mapping.records[i].progressMarkersList.progressMarkersId;
        temp['progressMonitoringQ2'] = await this.getProgressMonitoring(
          mapping.records[i].progressMarkersList.progressMonitoringQ2,
        );
        temp['progressMonitoringQ4'] = await this.getProgressMonitoring(
          mapping.records[i].progressMarkersList.progressMonitoringQ4,
        );
        temp['descriptionOfChange'] =
          mapping.records[i].progressMarkersList.descriptionOfChange;
        temp['contributingFactors'] =
          mapping.records[i].progressMarkersList.contributingFactors;
        temp['sourceOfEvidence'] =
          mapping.records[i].progressMarkersList.sourceOfEvidence;
        temp['unintendedChanges'] =
          mapping.records[i].progressMarkersList.unintendedChanges;
        progressMonitoringList = [...progressMonitoringList, { ...temp }];
      }
      progressMonitoringsTotalCount =
        mapping.records.length === 0 ? 0 : mapping.totalCount[0].count;
    }

    return {
      progressMonitoringList,
      progressMonitoringsTotalCount,
    };
  }

  async getArrayOfObjectsForMelpProgressPMGlobal(outcomeMappings) {
    Logger.debug('MelpService.getArrayOfObjectsForMelpProgressPMGlobal');
    let progressMonitoringList = [],
      count = 0;
    for (const mapping of outcomeMappings) {
      for (let i = 0; i < mapping.length; i++) {
        const temp = {};
        temp['instituteName'] = mapping[i].instituteName;
        temp['outcomeCode'] = mapping[i].outcomesList.outcomeCode;
        temp['progressMarkerCode'] =
          mapping[i].progressMarkersList.progressMarkerCode;
        temp['marker'] = mapping[i].progressMarkersList.progressMarker;
        temp['progressMarkerId'] =
          mapping[i].progressMarkersList.progressMarkersId;
        temp['progressMonitoringQ2'] = await this.getProgressMonitoring(
          mapping[i].progressMarkersList.progressMonitoringQ2,
        );
        temp['progressMonitoringQ4'] = await this.getProgressMonitoring(
          mapping[i].progressMarkersList.progressMonitoringQ4,
        );
        temp['descriptionOfChange'] =
          mapping[i].progressMarkersList.descriptionOfChange;
        temp['contributingFactors'] =
          mapping[i].progressMarkersList.contributingFactors;
        temp['sourceOfEvidence'] =
          mapping[i].progressMarkersList.sourceOfEvidence;
        temp['unintendedChanges'] =
          mapping[i].progressMarkersList.unintendedChanges;
        progressMonitoringList = [...progressMonitoringList, { ...temp }];
      }
      count += mapping.length;
    }
    const progressMonitoringsTotalCount = count;
    return {
      progressMonitoringList,
      progressMonitoringsTotalCount,
    };
  }

  // MEL Progress - SRF
  async viewMelProgressSRF(
    melpId: string,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('MelpService.viewMelProgressSRF');
    const melp = await this.getMelpByMelpId(melpId);
    if (melp === null) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }

    // const results = await this.getMelpSRFMonitorings(
    //   melpId,
    //   searchKeyword,
    //   pageLimit,
    //   pageIndex,
    //   sortKey,
    //   sortDirection,
    // );

    const results = await this.getMelpSRFMonitoringsGlobal(
      melpId,
      searchKeyword,
      sortKey,
      sortDirection,
    );

    // const { indicatorsMonitoringList, indicatorsTotalCount } =
    //   await this.getArrayOfObjectsForMelpProgressSRF(results);

    const { indicatorsMonitoringList, indicatorsTotalCount } =
      await this.getArrayOfObjectsForMelpProgressSRFGlobal([results]);

    return {
      IndicatorsMonitoring: indicatorsMonitoringList.slice(
        (pageIndex - 1) * pageLimit,
        pageIndex * pageLimit,
      ),
      indicatorsTotalCount,
      pageCount: Math.ceil(indicatorsTotalCount / 10),
    };
  }

  // MEL Progress - PM
  async viewMelProgressPM(
    melpId: string,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('MelpService.viewMelProgressPM');
    const melp = await this.getMelpByMelpId(melpId);

    if (melp === null) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }

    // const outcomeMappings = await this.getMelpProgressMarkerMonitorings(
    //   melpId,
    //   searchKeyword,
    //   pageLimit,
    //   pageIndex,
    //   sortKey,
    //   sortDirection,
    // );

    const outcomeMappings = await this.getMelpProgressMarkerMonitoringsGlobal(
      melpId,
      searchKeyword,
      sortKey,
      sortDirection,
    );

    // const { progressMonitoringList, progressMonitoringsTotalCount } =
    //   await this.getArrayOfObjectsForMelpProgressPM(outcomeMappings);

    const { progressMonitoringList, progressMonitoringsTotalCount } =
      await this.getArrayOfObjectsForMelpProgressPMGlobal([outcomeMappings]);

    return {
      ProgressMonitoring: progressMonitoringList.slice(
        (pageIndex - 1) * pageLimit,
        pageIndex * pageLimit,
      ),
      progressMonitoringsTotalCount,
      progressMonitoringPageCount: Math.ceil(
        progressMonitoringsTotalCount / 10,
      ),
    };
  }

  // Create MEL Progress- SRF
  async createMelProgressSRF(
    melpId: string,
    addMelProgressSRF: AddMelProgressSRFDTO,
    user: any,
  ) {
    Logger.debug('MelpService.createMelProgressSRF');
    const melp = await this.getMelpByMelpId(melpId);
    if (melp === null) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }

    const indicatorMonitoringsList = addMelProgressSRF.indicatorMonitorings.map(
      (data) => ({ ...data, updatedBy: user._id }),
    );

    for (const indicatorMonitoring of indicatorMonitoringsList) {
      await this.melpIndicatorMonitoringModel
        .findOneAndUpdate(
          {
            indicatorMonitoringId: indicatorMonitoring.indicatorMonitoringId,
            isDeleted: false,
          },
          indicatorMonitoring,
        )
        .exec();
    }

    return {
      message: 'MEL Progress SRF created',
    };
  }

  // Create MEL Progress - PM
  async createMelProgressPM(
    melpId: string,
    addMelProgressPM: AddMelProgressPMDTO,
    user: any,
  ) {
    Logger.debug('MelpService.createMelProgressPM');
    const melp = await this.getMelpByMelpId(melpId);
    if (melp === null) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }

    const progressMarkersList = addMelProgressPM.progressMarkerMonitorings.map(
      (data) => ({ ...data, updatedBy: user._id }),
    );

    for (const progressMarker of progressMarkersList) {
      await this.melpOutcomeProgressMarkersModel
        .findOneAndUpdate(
          {
            progressMarkersId: progressMarker.progressMarkersId,
            isDeleted: false,
          },
          progressMarker,
        )
        .exec();
    }

    return {
      message: 'MEL Progress PM created',
    };
  }

  // Create New MELP - SRF
  async createCapnetMelpSRF(
    createMelpSRF: CreateMelpSRFDTO,
    addResult: AddResultDTO,
    addIndicator: AddIndicatorDTO,
    user: any,
  ) {
    Logger.debug('MelpService.createCapnetMelpSRF');
    const existingMelpYear = await this.checkIfMelpYearExists(
      createMelpSRF.year,
      CapnetEnum.CAPNET,
    );
    if (existingMelpYear) {
      throw new ConflictException(errorMessages.MELP_YEAR_EXISTS);
    } else {
      const approvedStatusId = await this.userService.getStatusId(
        StatusEnum.APPROVED,
      );
      const melp = await this.melpModel.create({
        year: createMelpSRF.year,
        melpId: uuidv4(),
        melpCode: createMelpSRF.melpCode,
        instituteName: CapnetEnum.CAPNET,
        statusId: approvedStatusId,
        createdBy: user._id,
        updatedBy: user._id,
      });

      await this.activityLogModel.create({
        userId: user._id,
        name: user.fullName,
        description: `MELP - ${melp.melpCode} created`,
      });

      const {
        melpResult,
        indicatorsCount,
        impactCount,
        outcomeCount,
        outputCount,
        pageCount,
      } = await this.addResult(melp.melpId, addResult, addIndicator, user);
      return {
        melp,
        melpResult,
        indicatorsCount,
        impactCount,
        outcomeCount,
        outputCount,
        pageCount,
      };
    }
  }

  // Create New Network or Partner MELP - SRF
  async createNetworkOrPartnerMelpSRF(
    createNetworkOrPartnerMelpSRF: CreateNetworkMelpSRFDTO,
    user: any,
  ) {
    Logger.debug('MelpService.createNetworkOrPartnerMelpSRF');
    let instituteName;
    if (user.networkId !== null && user.partnerId === null) {
      instituteName = await this.networkService.getNetworkNameById(
        user.networkId,
      );
    } else if (user.partnerId !== null && user.networkId === null) {
      instituteName = await this.partnerService.getPartnerInstituteNameById(
        user.partnerId,
      );
    }

    const existingMelpYear = await this.checkIfMelpYearExists(
      createNetworkOrPartnerMelpSRF.year,
      instituteName,
    );

    if (existingMelpYear) {
      throw new ConflictException(errorMessages.MELP_YEAR_EXISTS);
    } else {
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      const melp = await this.melpModel.create({
        year: createNetworkOrPartnerMelpSRF.year,
        melpId: uuidv4(),
        melpCode: createNetworkOrPartnerMelpSRF.melpCode,
        instituteName: instituteName,
        statusId: inProgressStatusId,
        networkId: user.networkId,
        partnerId: user.partnerId,
        scopeAndPurpose: createNetworkOrPartnerMelpSRF.scopeAndPurpose,
        createdBy: user._id,
        updatedBy: user._id,
      });

      const taskDetailsList = createNetworkOrPartnerMelpSRF.taskDetails.map(
        (data) => ({
          ...data,
          melpId: melp._id,
          taskDetailsId: uuidv4(),
          createdBy: user._id,
          updatedBy: user._id,
        }),
      );
      const melpTasks = await this.melpTaskDetailsModel.insertMany(
        taskDetailsList,
      );

      await this.activityLogModel.create({
        userId: user._id,
        instituteName,
        name: user.fullName,
        description: `MELP - ${melp.melpCode} created`,
        networkId: user.networkId,
        partnerId: user.partnerId,
      });

      return { melp, melpTasks };
    }
  }

  // Add New Result to MELP
  async addResult(
    melpId: string,
    addResult: AddResultDTO,
    addIndicator: AddIndicatorDTO,
    user: any,
  ) {
    Logger.debug('MelpService.addResult');
    const melp = await this.melpModel
      .findOne({ melpId: melpId, isDeleted: false })
      .exec();
    if (melp === null) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }

    const melpResult = await this.melpResultsModel.create({
      melpId: melp._id,
      resultId: uuidv4(),
      resultName: addResult.resultName,
      objectiveLevel: addResult.objectiveLevel,
      resultCode: addResult.resultCode,
      createdBy: user._id,
      updatedBy: user._id,
    });

    await this.addActivityLog(user, `Result - ${melpResult.resultCode} added`);
    const { indicatorsCount, pageCount } = await this.addIndicator(
      melpResult.resultId,
      addIndicator,
      user,
    );
    const { impactCount, outcomeCount, outputCount } =
      await this.getObjectiveLevelCounts(melp.melpId);

    return {
      melp,
      melpResult,
      indicatorsCount,
      impactCount,
      outcomeCount,
      outputCount,
      pageCount,
    };
  }

  // Add New Indicator to Result
  async addIndicator(
    resultId: string,
    addIndicator: AddIndicatorDTO,
    user: any,
  ) {
    Logger.debug('MelpService.addIndicator');
    const result = await this.melpResultsModel
      .findOne({ resultId: resultId, isDeleted: false })
      .exec();
    if (result === null) {
      throw new NotFoundException(errorMessages.RESULT_NOT_FOUND);
    }
    const melp = await this.melpModel
      .findOne({ _id: result.melpId, isDeleted: false })
      .exec();
    if (melp === null) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }

    const resultIndicator = await this.melpResultIndicatorsModel.create({
      indicatorId: uuidv4(),
      resultId: result._id,
      indicatorName: addIndicator.indicatorName,
      indicatorCode: addIndicator.indicatorCode,
      definition: addIndicator.definition,
      completionYear: addIndicator.completionYear,
      measurementUnit: addIndicator.measurementUnit,
      cumulativeTarget: addIndicator.cumulativeTarget,
      sourceOfData: addIndicator.sourceOfData,
      collectionMethodType: addIndicator.collectionMethodType,
      collectionMethodName: addIndicator.collectionMethodName,
      collectionFrequencyType: addIndicator.collectionFrequencyType,
      collectionFrequencyName: addIndicator.collectionFrequencyName,
      createdBy: user._id,
      updatedBy: user._id,
    });

    const indicatorsMonitoringList = addIndicator.indicatorsMonitoring.map(
      (data) => ({
        ...data,
        indicatorMonitoringId: uuidv4(),
        resultIndicatorId: resultIndicator._id,
        createdBy: user._id,
        updatedBy: user._id,
      }),
    );
    await this.melpIndicatorMonitoringModel.insertMany(
      indicatorsMonitoringList,
    );
    const monitoringRisksList = addIndicator.monitoringRisks.map((data) => ({
      ...data,
      indicatorRisksId: uuidv4(),
      resultIndicatorId: resultIndicator._id,
      createdBy: user._id,
      updatedBy: user._id,
    }));
    await this.melpIndicatorRisksModel.insertMany(monitoringRisksList);
    await this.addActivityLog(
      user,
      `Indicator - ${resultIndicator.indicatorCode} added`,
    );

    const indicatorsCount = await this.melpResultIndicatorsModel
      .find({
        resultId: result._id,
      })
      .count()
      .exec();
    const pageCount = await this.melpResultIndicatorsModel
      .find({
        resultId: result._id,
        isDeleted: false,
      })
      .count()
      .exec();
    const { impactCount, outcomeCount, outputCount } =
      await this.getObjectiveLevelCounts(melp.melpId);
    return {
      melpResult: result,
      melp,
      indicatorsCount,
      impactCount,
      outcomeCount,
      outputCount,
      pageCount,
    };
  }

  // Create New Melp - OM
  async createMelpOM(melpId: string, createMelpOM: CreateMelpOMDTO, user: any) {
    Logger.debug('MelpService.createMelpOM');
    const melp = await this.getMelpByMelpId(melpId);
    if (melp === null) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }
    const melpOM = await this.melpOutcomesModel.create({
      melpId: melp._id,
      outcomeId: uuidv4(),
      outcomeChallenge: createMelpOM.outcomeChallenge,
      outcomeCode: createMelpOM.outcomeCode,
      boundaryPartners: createMelpOM.boundaryPartners,
      progressMarkerCount: createMelpOM.progressMarkerCount,
      createdBy: user._id,
      updatedBy: user._id,
    });
    const progressMarkersList = createMelpOM.progressMarkers.map((data) => ({
      ...data,
      progressMarkersId: uuidv4(),
      outcomeId: melpOM._id,
      createdBy: user._id,
      updatedBy: user._id,
    }));
    const progresSMarkers =
      await this.melpOutcomeProgressMarkersModel.insertMany(
        progressMarkersList,
      );

    await this.addActivityLog(
      user,
      `Outcome challenge - ${melpOM.outcomeCode} added`,
    );
    return progresSMarkers;
  }

  // Get Global MELP - SRF Indicator Monitoring
  async getGlobalMelpSRFMonitorings(
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('MelpService.getGlobalMelpSRFMonitorings');
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const melps = await this.melpModel
      .find({
        year: year,
        isDeleted: false,
        statusId: approvedStatusId,
      })
      .exec();
    if (melps.length === 0) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }

    let results = [];
    for (const melp of melps) {
      const x = await this.getMelpSRFMonitoringsGlobal(
        melp.melpId,
        searchKeyword,
        sortKey,
        sortDirection,
      );
      results = [...results, x];
    }
    console.log('REsults ', results.length);
    const { indicatorsMonitoringList, indicatorsTotalCount } =
      await this.getArrayOfObjectsForMelpProgressSRFGlobal(results);

    return {
      IndicatorsMonitoring: indicatorsMonitoringList.slice(
        (pageIndex - 1) * pageLimit,
        pageIndex * pageLimit,
      ),
      indicatorsTotalCount,
      pageCount: Math.ceil(indicatorsTotalCount / 10),
    };
  }

  // Get Global MELP - Progress Marker Monitoring
  async getGlobalMelpProgressMarkerMonitorings(
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('MelpService.getGlobalMelpProgressMarkerMonitorings');
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );
    const melpsList = await this.melpModel
      .find({
        year: year,
        isDeleted: false,
        statusId: approvedStatusId,
      })
      .exec();

    if (melpsList.length === 0) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }
    let outcomeMappings = [];
    for (const melp of melpsList) {
      const x = await this.getMelpProgressMarkerMonitoringsGlobal(
        melp.melpId,
        searchKeyword,
        sortKey,
        sortDirection,
      );
      outcomeMappings = [...outcomeMappings, x];
    }
    const { progressMonitoringList, progressMonitoringsTotalCount } =
      await this.getArrayOfObjectsForMelpProgressPMGlobal(outcomeMappings);

    return {
      ProgressMonitoring: progressMonitoringList.slice(
        (pageIndex - 1) * pageLimit,
        pageIndex * pageLimit,
      ),
      progressMonitoringsTotalCount,
      progressMonitoringPageCount: Math.ceil(
        progressMonitoringsTotalCount / 10,
      ),
    };
  }

  // Get current melp - indicators
  // async getCurrentMelpIndicators(year: number, user: any, searchKeyword: string,
  //   pageLimit: number,
  //   pageIndex: number,
  //   sortKey: string,
  //   sortDirection: number
  //   ){
  //   Logger.debug('MelpService.getCurrentMelpIndicators')
  //   const approvedStatusId = await this.userService.getStatusId('Approved');
  //   let melp;
  //   if(user.networkId !== null && user.partnerId === null){
  //     melp = await this.melpModel
  //     .findOne({
  //       year: year,
  //       isDeleted: false,
  //       statusId: approvedStatusId,
  //       networkId: user.networkId
  //     })
  //     .exec();
  //   } else if(user.partnerId !== null && user.networkId === null){
  //     melp = await this.melpModel
  //     .findOne({
  //       year: year,
  //       isDeleted: false,
  //       statusId: approvedStatusId,
  //       networkId: user.networkId
  //     })
  //     .exec();
  //   }
  //   const sortQuery = {};
  //   sortKey = sortKey.length === 0 ? 'updatedAt' : sortKey;
  //   // sortQuery[sortKey] = sortDirection;
  //   sortQuery[sortKey] = sortDirection == 1 ? '1' : '-1';
  //   const results = await this.getMelpSRFMonitorings(
  //     melp.melpId,
  //       searchKeyword,
  //       pageLimit,
  //       pageIndex,
  //       sortQuery
  //   )
  //   let output = [];
  //   for (const result of results) {
  //     const temp = {};
  //     temp['resultCode'] = result.resultsList.resultCode;
  //     temp['indicatorCode'] = result.indicatorsList.indicatorCode;
  //     temp['indicator'] = result.indicatorsList.indicatorName;
  //     temp['measurementUnit'] = result.indicatorsList.measurementUnit;
  //     temp['cumulativeTarget'] = result.indicatorsList.cumulativeTarget;
  //     temp['baseline'] = result.monitoringsList.baseline;
  //     temp['target'] = result.monitoringsList.targetAchieved;
  //     temp['progress'] = result.monitoringsList.progress;
  //     temp['explaination'] = result.monitoringsList.explaination;
  //     output = [...output, { ...temp }];
  //   }
  //   return {
  //     IndicatorsMonitoring: output,
  //   };
  // }

  // View Network or Partner MELP SRF
  async viewNetworkOrPartnerMelpSRF(melpId: string) {
    Logger.debug('MelpService.viewNetworkOrPartnerMelpSRF');
    const melp = await this.getMelpByMelpId(melpId);
    if (melp === null) {
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    }

    const melpTaskDetails = await this.melpTaskDetailsModel
      .find({
        melpId: melp._id,
      })
      .exec();
    return {
      melp,
      melpTaskDetails,
    };
  }

  // Edit SRF Scope and MEL Tasks
  async editNetworkSRFScope(
    melpId: string,
    editNetworkSRF: EditNetworkMelpSRFDTO,
    user: any,
  ) {
    Logger.debug('MelpService.editNetworkSRFScope');
    await this.getMelpByMelpId(melpId);
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );
    const infoRequestedStatusId = await this.userService.getStatusId(
      StatusEnum.INFORMATION_REQUESTED,
    );
    const updatedMelp = await this.melpModel
      .findOneAndUpdate(
        {
          melpId: melpId,
          isDeleted: false,
          statusId: {
            $in: [inProgressStatusId, infoRequestedStatusId],
          },
        },
        { ...editNetworkSRF, updatedBy: user._id },
        { new: true },
      )
      .exec();

    const taskDetailsList = editNetworkSRF.taskDetails.map((data) => ({
      ...data,
    }));
    for (const taskDetail of taskDetailsList) {
      await this.melpTaskDetailsModel
        .updateOne(
          {
            melpId: updatedMelp._id,
            melpTaskId: taskDetail.melpTaskId,
          },
          taskDetail,
        )
        .exec();
    }

    await this.addActivityLog(user, `MELP ${updatedMelp.melpCode} updated`);
    return updatedMelp;
  }

  async checkIfMelpResultIndicatorCanBeEdited(melpId: string, user: any) {
    Logger.debug('MelpService.checkIfMelpResultIndicatorCanBeEdited');
    if (user.partnerId === null && user.networkId === null) {
      return this.getMelpByMelpId(melpId);
    } else {
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      const infoRequestedStatusId = await this.userService.getStatusId(
        StatusEnum.INFORMATION_REQUESTED,
      );

      return this.melpModel
        .findOne({
          melpId,
          isDeleted: false,
          statusId: {
            $in: [inProgressStatusId, infoRequestedStatusId],
          },
        })
        .exec();
    }
  }

  async checkIfResultIsUsedInWorkplanActivity(resultId, user: any) {
    Logger.debug('MelpService.checkIfResultIsUsedInWorkplanActivity');
    return this.activityModel
      .findOne({
        resultId,
        networkId: user.networkId,
        partnerId: user.partnerId,
        isDeleted: false,
      })
      .exec();
  }

  async checkIfResultIsUsedInProposal(resultId, user: any) {
    Logger.debug('MelpService.checkIfResultIsUsedInProposal');
    return this.activityProposalModel
      .findOne({
        resultId,
        networkId: user.networkId,
        partnerId: user.partnerId,
        isDeleted: false,
      })
      .exec();
  }

  async checkIfIndicatorIsUsedInWorkplanActivity(indicatorId, user: any) {
    Logger.debug('MelpService.checkIfIndicatorIsUsedInWorkplanActivity');
    return this.activityModel
      .findOne({
        indicatorId: { $in: indicatorId },
        networkId: user.networkId,
        partnerId: user.partnerId,
        isDeleted: false,
      })
      .exec();
  }

  async checkIfIndicatorIsUsedInProposal(indicatorId, user: any) {
    Logger.debug('MelpService.checkIfIndicatorIsUsedInProposal');
    return this.activityProposalModel
      .findOne({
        indicatorId: { $in: indicatorId },
        networkId: user.networkId,
        partnerId: user.partnerId,
        isDeleted: false,
      })
      .exec();
  }

  // Edit Result
  async editResult(
    resultId: string,
    melpId: string,
    editResult: EditResultDTO,
    user: any,
  ) {
    Logger.debug('MelpService.editResult');
    const result = await this.getResultByResultId(resultId);
    const melp = await this.checkIfMelpResultIndicatorCanBeEdited(melpId, user);
    if (melp === null)
      throw new UnprocessableEntityException('Cannot edit this result');
    const activity = await this.checkIfResultIsUsedInWorkplanActivity(
      result._id,
      user,
    );
    if (activity !== null)
      throw new UnprocessableEntityException('This result cannot be edited');
    const proposal = await this.checkIfResultIsUsedInProposal(result._id, user);
    if (proposal !== null)
      throw new UnprocessableEntityException('This result cannot be edited');
    const updatedResult = await this.melpResultsModel
      .findOneAndUpdate(
        {
          resultId,
          isDeleted: false,
        },
        { ...editResult, updatedBy: user._id },
        { new: true },
      )
      .exec();
    await this.addActivityLog(
      user,
      `Result - ${updatedResult.resultCode} updated`,
    );
    return updatedResult;
  }

  // Edit Indicators
  async editIndicator(
    indicatorId: string,
    melpId: string,
    editIndicator: EditIndicatorDTO,
    user: any,
  ) {
    Logger.debug('MelpService.editIndicator');
    const indicator = await this.getIndicatorByIndicatorId(indicatorId);
    const melp = await this.checkIfMelpResultIndicatorCanBeEdited(melpId, user);
    if (melp === null)
      throw new UnprocessableEntityException('Cannot edit this indicator');
    const activity = await this.checkIfIndicatorIsUsedInWorkplanActivity(
      indicator._id,
      user,
    );
    if (activity !== null)
      throw new UnprocessableEntityException('This indicator cannot be edited');
    const proposal = await this.checkIfIndicatorIsUsedInProposal(
      indicator._id,
      user,
    );
    if (proposal !== null)
      throw new UnprocessableEntityException('This indicator cannot be edited');
    const updatedIndicator = await this.melpResultIndicatorsModel
      .findOneAndUpdate(
        {
          indicatorId,
          isDeleted: false,
        },
        { ...editIndicator, updatedBy: user._id },
        { new: true },
      )
      .exec();

    // Updating indicator monitoring one by one & frontend should send indicatorMonitoringId(uuid) to update indicators monitoring
    const indicatorsMonitoringList = editIndicator.indicatorsMonitoring.map(
      (data) => ({ ...data, updatedBy: user._id }),
    );
    for (const indicatorMonitoring of indicatorsMonitoringList) {
      if (indicatorMonitoring.indicatorMonitoringId !== undefined) {
        await this.melpIndicatorMonitoringModel
          .updateOne(
            {
              resultIndicatorId: updatedIndicator._id,
              indicatorMonitoringId: indicatorMonitoring.indicatorMonitoringId,
              isDeleted: false,
            },
            indicatorMonitoring,
          )
          .exec();
      } else {
        await this.melpIndicatorMonitoringModel.create({
          ...indicatorMonitoring,
          indicatorMonitoringId: uuidv4(),
          resultIndicatorId: updatedIndicator._id,
          createdBy: user._id,
        });
      }
    }

    // Updating monitoring risks one by one & frontend should send indicatorRisksId(uuid) to update monitoring risks
    const monitoringRisksList = editIndicator.monitoringRisks.map((data) => ({
      ...data,
      updatedBy: user._id,
    }));
    for (const monitoringRisk of monitoringRisksList) {
      if (monitoringRisk.indicatorRisksId !== undefined) {
        await this.melpIndicatorRisksModel
          .updateOne(
            {
              resultIndicatorId: updatedIndicator._id,
              indicatorRisksId: monitoringRisk.indicatorRisksId,
              isDeleted: false,
            },
            monitoringRisk,
          )
          .exec();
      } else {
        await this.melpIndicatorRisksModel.create({
          ...monitoringRisk,
          indicatorRisksId: uuidv4(),
          resultIndicatorId: updatedIndicator._id,
          createdBy: user._id,
        });
      }
    }

    await this.addActivityLog(
      user,
      `Indicator - ${updatedIndicator.indicatorCode} updated`,
    );
    return updatedIndicator;
  }

  // Edit Outcome Mapping
  async editOM(
    outcomeId: string,
    melpId: string,
    editOM: EditOmDTO,
    user: any,
  ) {
    Logger.debug('MelpService.editOM');
    await this.getOutcomeByOutcomeId(outcomeId);
    const melp = await this.checkIfMelpResultIndicatorCanBeEdited(melpId, user);
    if (melp === null)
      throw new UnprocessableEntityException(
        'Cannot edit this outcome challenge',
      );
    const updatedOM = await this.melpOutcomesModel
      .findOneAndUpdate(
        {
          outcomeId,
          isDeleted: false,
        },
        { ...editOM, updatedBy: user._id },
        { new: true },
      )
      .exec();

    // Updating progress markers one by one & frontend should send progressMarkersId(uuid) to update progress markers
    const progressMarkersList = editOM.progressMarkers.map((data) => ({
      ...data,
      updatedBy: user._id,
    }));
    for (const marker of progressMarkersList) {
      if (marker.progressMarkersId !== undefined) {
        await this.melpOutcomeProgressMarkersModel
          .updateOne(
            {
              outcomeId: updatedOM._id,
              progressMarkersId: marker.progressMarkersId,
              isDeleted: false,
            },
            marker,
          )
          .exec();
      } else {
        await this.melpOutcomeProgressMarkersModel.create({
          ...marker,
          progressMarkersId: uuidv4(),
          outcomeId: updatedOM._id,
          createdBy: user._id,
        });
      }
    }

    await this.addActivityLog(
      user,
      `Outcome Challenge - ${updatedOM.outcomeCode} updated`,
    );
    return updatedOM;
  }

  async checkIfMelpResultIndicatorCanBeDeleted(melpId: string, user: any) {
    Logger.debug('MelpService.checkIfMelpResultIndicatorCanBeDeleted');
    if (user.partnerId === null && user.networkId === null) {
      return this.getMelpByMelpId(melpId);
    } else {
      const inProgressStatusId = await this.userService.getStatusId(
        StatusEnum.IN_PROGRESS,
      );
      const infoRequestedStatusId = await this.userService.getStatusId(
        StatusEnum.INFORMATION_REQUESTED,
      );
      const deniedStatusId = await this.userService.getStatusId(
        StatusEnum.DENIED,
      );
      return this.melpModel
        .findOne({
          melpId,
          isDeleted: false,
          statusId: {
            $in: [inProgressStatusId, infoRequestedStatusId, deniedStatusId],
          },
        })
        .exec();
    }
  }

  // Delete MELP
  async deleteMelp(melpId: string, user: any) {
    Logger.debug('MelpService.deleteMelp');
    const melp = await this.checkIfMelpResultIndicatorCanBeEdited(melpId, user);
    if (melp === null)
      throw new UnprocessableEntityException(errorMessages.CANNOT_DELETE_MELP);

    const resultsCount = await this.melpResultsModel
      .find({
        melpId: melp._id,
        isDeleted: false,
      })
      .count()
      .exec();

    const outcomesCount = await this.melpOutcomesModel
      .find({
        melpId: melp._id,
        isDeleted: false,
      })
      .count()
      .exec();
    let deletedMelp;
    if (resultsCount > 1 || outcomesCount > 0) {
      throw new BadRequestException(errorMessages.DELETE_RESULTS_AND_OUTCOMES);
    } else if (resultsCount === 1) {
      const result = await this.melpResultsModel
        .findOne({
          melpId: melp._id,
          isDeleted: false,
        })
        .exec();

      // const indicator = await this.melpResultIndicatorsModel
      //   .findOne({
      //     resultId:result._id,
      //     isDeleted: false
      //   })
      //   .exec();

      const activityForResult =
        await this.checkIfResultIsUsedInWorkplanActivity(result._id, user);
      if (activityForResult !== null)
        throw new UnprocessableEntityException(
          errorMessages.CANNOT_DELETE_RESULT,
        );

      const proposalForResult = await this.checkIfResultIsUsedInProposal(
        result._id,
        user,
      );
      if (proposalForResult !== null)
        throw new UnprocessableEntityException(
          errorMessages.CANNOT_DELETE_RESULT,
        );

      deletedMelp = await this.melpModel
        .findOneAndUpdate(
          {
            melpId: melpId,
            isDeleted: false,
          },
          { isDeleted: true, updatedBy: user._id },
          { new: true },
        )
        .exec();

      const deletedResult = await this.melpResultsModel
        .findOneAndUpdate(
          {
            melpId: deletedMelp._id,
            isDeleted: false,
          },
          { isDeleted: true, updatedBy: user._id },
          { new: true },
        )
        .exec();

      const deletedIndicator = await this.melpResultIndicatorsModel
        .findOneAndUpdate(
          {
            resultId: deletedResult._id,
            isDeleted: false,
          },
          { isDeleted: true, updatedBy: user._id },
          { new: true },
        )
        .exec();

      await this.melpIndicatorMonitoringModel
        .updateMany(
          {
            resultIndicatorId: deletedIndicator._id,
            isDeleted: false,
          },
          { $set: { isDeleted: true, updatedBy: user._id } },
        )
        .exec();

      await this.melpIndicatorRisksModel
        .updateMany(
          {
            resultIndicatorId: deletedIndicator._id,
            isDeleted: false,
          },
          { $set: { isDeleted: true, updatedBy: user._id } },
        )
        .exec();
    }
    await this.addActivityLog(user, `MELP - ${melp.melpCode} deleted`);
    return deletedMelp;
  }

  async deleteResult(resultId: string, melpId: string, user: any) {
    Logger.debug('MelpService.deleteResult');
    const melp = await this.checkIfMelpResultIndicatorCanBeEdited(melpId, user);
    if (melp === null)
      throw new UnprocessableEntityException('Result cannot be deleted');
    const result = await this.getResultByResultId(resultId);
    const activityForResult = await this.checkIfResultIsUsedInWorkplanActivity(
      result._id,
      user,
    );
    if (activityForResult !== null)
      throw new UnprocessableEntityException(
        errorMessages.CANNOT_DELETE_RESULT,
      );

    const proposalForResult = await this.checkIfResultIsUsedInProposal(
      result._id,
      user,
    );
    if (proposalForResult !== null)
      throw new UnprocessableEntityException(
        errorMessages.CANNOT_DELETE_RESULT,
      );

    const resultsCount = await this.melpResultsModel
      .find({
        melpId: melp._id,
        isDeleted: false,
      })
      .count()
      .exec();
    const indicatorsCount = await this.melpResultIndicatorsModel
      .find({
        resultId: result._id,
        isDeleted: false,
      })
      .count()
      .exec();

    let deletedResult;
    if (indicatorsCount > 1) {
      throw new BadRequestException(errorMessages.DELETE_INDICATORS);
    } else if (resultsCount === 1) {
      throw new UnprocessableEntityException(
        errorMessages.CANNOT_DELETE_RESULT,
      );
    } else if (indicatorsCount === 1 && resultsCount > 1) {
      const indicator = await this.melpResultIndicatorsModel
        .findOneAndUpdate(
          {
            resultId: result._id,
            isDeleted: false,
          },
          { isDeleted: true, updatedBy: user._id },
          { new: true },
        )
        .exec();

      await this.melpIndicatorMonitoringModel
        .updateMany(
          {
            resultIndicatorId: indicator._id,
            isDeleted: false,
          },
          { $set: { isDeleted: true, updatedBy: user._id } },
        )
        .exec();

      await this.melpIndicatorRisksModel
        .updateMany(
          {
            resultIndicatorId: indicator._id,
            isDeleted: false,
          },
          { $set: { isDeleted: true, updatedBy: user._id } },
        )
        .exec();

      deletedResult = await this.melpResultsModel
        .findOneAndUpdate(
          {
            resultId: resultId,
            isDeleted: false,
          },
          { isDeleted: true, updatedBy: user._id },
          { new: true },
        )
        .exec();
    }
    await this.addActivityLog(user, `Result - ${result.resultCode} deleted`);
    return deletedResult;
  }

  async deleteIndicator(
    indicatorId: string,
    resultId: string,
    melpId: string,
    user: any,
  ) {
    Logger.debug('MelpService.deleteIndicator');
    const melp = await this.checkIfMelpResultIndicatorCanBeEdited(melpId, user);
    if (melp === null)
      throw new UnprocessableEntityException('Indicator cannot be deleted');
    const indicator = await this.getIndicatorByIndicatorId(indicatorId);
    const result = await this.getResultByResultId(resultId);
    const activityForIndicator =
      await this.checkIfIndicatorIsUsedInWorkplanActivity(indicator._id, user);
    if (activityForIndicator !== null)
      throw new UnprocessableEntityException(
        'This indicator cannot be deleted',
      );

    const proposalForIndicator = await this.checkIfIndicatorIsUsedInProposal(
      indicator._id,
      user,
    );
    if (proposalForIndicator !== null)
      throw new UnprocessableEntityException(
        'This indicator cannot be deleted',
      );

    const indicatorsCount = await this.melpResultIndicatorsModel
      .find({
        resultId: result._id,
        isDeleted: false,
      })
      .count()
      .exec();

    if (indicatorsCount === 1)
      throw new UnprocessableEntityException("Indicator can't be deleted");

    await this.melpIndicatorMonitoringModel
      .updateMany(
        {
          resultIndicatorId: indicator._id,
          isDeleted: false,
        },
        { $set: { isDeleted: true, updatedBy: user._id } },
      )
      .exec();

    await this.melpIndicatorRisksModel
      .updateMany(
        {
          resultIndicatorId: indicator._id,
          isDeleted: false,
        },
        { $set: { isDeleted: true, updatedBy: user._id } },
      )
      .exec();

    const deletedIndicator = await this.melpResultIndicatorsModel
      .findOneAndUpdate(
        {
          indicatorId,
          isDeleted: false,
        },
        { isDeleted: true, updatedBy: user._id },
        { new: true },
      )
      .exec();

    await this.addActivityLog(
      user,
      `Indicator - ${indicator.indicatorCode} deleted`,
    );
    return deletedIndicator;
  }

  // Delete Outcome Mapping
  async deleteOM(outcomeId: string, melpId: string, user: any) {
    Logger.debug('MelpService.deleteOM');
    const outcome = await this.getOutcomeByOutcomeId(outcomeId);
    const melp = await this.checkIfMelpResultIndicatorCanBeEdited(melpId, user);
    if (melp === null)
      throw new UnprocessableEntityException(
        'Outcome Challenge cannot be deleted',
      );
    await this.melpOutcomeProgressMarkersModel
      .updateMany(
        {
          outcomeId: outcome._id,
          isDeleted: false,
        },
        { $set: { isDeleted: true, updatedBy: user._id } },
      )
      .exec();

    const deletedOM = await this.melpOutcomesModel
      .findOneAndUpdate(
        { outcomeId: outcomeId, isDeleted: false },
        { isDeleted: true, updatedBy: user._id },
        { new: true },
      )
      .exec();

    await this.addActivityLog(
      user,
      `Outcome Challenge - ${outcome.outcomeCode} deleted`,
    );

    return deletedOM;
  }

  // Delete Indicators Monitoring
  async deleteIndicatorsMonitoring(
    indicatorMonitoringId: string,
    melpId: string,
    user: any,
  ) {
    Logger.debug('MelpService.deleteIndicatorsMonitoring');
    const indicatorMonitoring = await this.melpIndicatorMonitoringModel
      .findOne({
        indicatorMonitoringId: indicatorMonitoringId,
        isDeleted: false,
      })
      .exec();

    if (indicatorMonitoring === null) {
      throw new NotFoundException(errorMessages.INDICATOR_MONITORING_NOT_FOUND);
    }

    const melp = await this.checkIfMelpResultIndicatorCanBeEdited(melpId, user);
    if (melp === null)
      throw new UnprocessableEntityException(
        'Indicator Monitoring cannot be deleted',
      );

    const deletedIndicatorsMonitoring = await this.melpIndicatorMonitoringModel
      .findOneAndUpdate(
        { indicatorMonitoringId: indicatorMonitoringId, isDeleted: false },
        { isDeleted: true, updatedBy: user._id },
        { new: true },
      )
      .exec();

    await this.addActivityLog(user, `Indicators Monitoring deleted`);
    return deletedIndicatorsMonitoring;
  }

  // Delete Monitoring Risk
  async deleteMonitoringRisk(
    monitoringRiskId: string,
    melpId: string,
    user: any,
  ) {
    Logger.debug('MelpService.deleteMonitoringRisk');
    const monitoringRisk = await this.melpIndicatorRisksModel
      .findOne({ indicatorRisksId: monitoringRiskId, isDeleted: false })
      .exec();

    if (monitoringRisk === null) {
      throw new NotFoundException(errorMessages.INDICATOR_RISK_NOT_FOUND);
    }
    const melp = await this.checkIfMelpResultIndicatorCanBeEdited(melpId, user);
    if (melp === null)
      throw new UnprocessableEntityException(
        'Monitoring Risk cannot be deleted',
      );

    const deletedMonitoringRisk = await this.melpIndicatorRisksModel
      .findOneAndUpdate(
        { indicatorRisksId: monitoringRiskId, isDeleted: false },
        { isDeleted: true, updatedBy: user._id },
        { new: true },
      )
      .exec();

    await this.addActivityLog(user, `Monitoring risk  deleted`);
    return deletedMonitoringRisk;
  }

  // Delete Progress Marker
  async deleteProgressMarker(
    progressMarkerId: string,
    melpId: string,
    user: any,
  ) {
    Logger.debug('MelpService.deleteProgressMarker');
    const progressMarker = await this.melpOutcomeProgressMarkersModel
      .findOne({ progressMarkersId: progressMarkerId, isDeleted: false })
      .exec();

    if (progressMarker === null) {
      throw new NotFoundException(errorMessages.PROGRESS_MARKER_NOT_FOUND);
    }

    const melp = await this.checkIfMelpResultIndicatorCanBeEdited(melpId, user);
    if (melp === null)
      throw new UnprocessableEntityException(
        'Progress Marker cannot be deleted',
      );

    const deletedProgressMarker = await this.melpOutcomeProgressMarkersModel
      .findOneAndUpdate(
        { progressMarkersId: progressMarkerId, isDeleted: false },
        { isDeleted: true, updatedBy: user._id },
        { new: true },
      )
      .exec();

    await this.addActivityLog(
      user,
      `Progress Marker - ${progressMarker.progressMarkerCode} deleted`,
    );
    return deletedProgressMarker;
  }

  async updateGeneralUserMelpStatus(melpId, statusId) {
    Logger.debug('MelpService.updateGeneralUserMelpStatus');
    return this.melpModel
      .findOneAndUpdate(
        { melpId, isDeleted: false },
        { statusId },
        { new: true },
      )
      .exec();
  }

  async updateApprovedCount(count: number, melpId: string) {
    Logger.debug('MelpService.updateApprovedCount');
    return this.melpModel
      .findOneAndUpdate(
        { melpId, isDeleted: false },
        { approvedCount: count },
        { new: true },
      )
      .exec();
  }

  async setSubmittedAtTime(melpId: string, submittedAt: Date) {
    Logger.debug('MelpService.setSubmittedAtTime');
    return this.melpModel
      .findOneAndUpdate(
        {
          melpId,
          isDeleted: false,
        },
        { submittedAt },
        { new: true },
      )
      .exec();
  }

  async setApprovedAtTime(melpId: string, approvedAt: Date) {
    Logger.debug('MelpService.setApprovedAtTime');
    return this.melpModel
      .findOneAndUpdate(
        {
          melpId,
          isDeleted: false,
        },
        { approvedAt },
        { new: true },
      )
      .exec();
  }

  async worksheetCreation(
    resultsSheet: exceljs.Worksheet,
    risksSheet: exceljs.Worksheet,
    outcomesSheet: exceljs.Worksheet,
  ) {
    Logger.debug('MelpService.worksheetCreation');
    resultsSheet.columns = [
      { header: 'MelpCode', key: 'melpCode', width: 20 },
      { header: 'Year', key: 'year', width: 6 },
      { header: 'InstituteName', key: 'instituteName', width: 20 },
      { header: 'ResultCode', key: 'resultCode', width: 10 },
      { header: 'ObjectiveLevel', key: 'objectiveLevel', width: 15 },
      { header: 'ResultDescription', key: 'resultDescription', width: 30 },
      { header: 'IndicatorCode', key: 'indicatorCode', width: 15 },
      { header: 'IndicatorName', key: 'indicatorName', width: 15 },
      { header: 'IndicatorDefinition', key: 'indicatorDefinition', width: 30 },
      { header: 'MeasurementUnit', key: 'measurementUnit', width: 10 },
      { header: 'CumulativeTarget', key: 'cumulativeTarget', width: 20 },
      {
        header: 'YearOfTargetCompletion',
        key: 'yearOfTargetCompletion',
        width: 20,
      },
      {
        header: 'DataCollectionSource',
        key: 'dataCollectionSource',
        width: 20,
      },
      {
        header: 'DataCollectionMethodType',
        key: 'dataCollectionMethodType',
        width: 20,
      },
      {
        header: 'DataCollectionMethodName',
        key: 'dataCollectionMethodName',
        width: 20,
      },
      {
        header: 'DataCollectionFrequencyType',
        key: 'dataCollectionFrequencyType',
        width: 20,
      },
      {
        header: 'DataCollectionFrequencyName',
        key: 'dataCollectionFrequencyName',
        width: 20,
      },
      {
        header: 'IndicatorsMonitoringYear',
        key: 'indicatorsMonitoringYear',
        width: 20,
      },
      { header: 'TargetAchieved', key: 'targetAchieved', width: 20 },
      { header: 'Progress', key: 'progress', width: 20 },
      { header: 'Baseline', key: 'baseline', width: 20 },
      {
        header: 'ExplainationOfResultsAchieved',
        key: 'xxplainationOfResultsAchieved',
        width: 20,
      },
    ];

    risksSheet.columns = [
      { header: 'MelpCode', key: 'melpCode', width: 20 },
      { header: 'Year', key: 'year', width: 6 },
      { header: 'InstituteName', key: 'instituteName', width: 20 },
      { header: 'ResultCode', key: 'resultCode', width: 10 },
      { header: 'ObjectiveLevel', key: 'objectiveLevel', width: 15 },
      { header: 'ResultDescription', key: 'resultDescription', width: 30 },
      { header: 'IndicatorCode', key: 'indicatorCode', width: 15 },
      { header: 'IndicatorName', key: 'indicatorName', width: 15 },
      { header: 'IndicatorDefinition', key: 'indicatorDefinition', width: 30 },
      { header: 'MeasurementUnit', key: 'measurementUnit', width: 10 },
      { header: 'CumulativeTarget', key: 'cumulativeTarget', width: 20 },
      {
        header: 'YearOfTargetCompletion',
        key: 'yearOfTargetCompletion',
        width: 20,
      },
      {
        header: 'DataCollectionSource',
        key: 'dataCollectionSource',
        width: 20,
      },
      {
        header: 'DataCollectionMethodType',
        key: 'dataCollectionMethodType',
        width: 20,
      },
      {
        header: 'DataCollectionMethodName',
        key: 'dataCollectionMethodName',
        width: 20,
      },
      {
        header: 'DataCollectionFrequencyType',
        key: 'dataCollectionFrequencyType',
        width: 20,
      },
      {
        header: 'DataCollectionFrequencyName',
        key: 'dataCollectionFrequencyName',
        width: 20,
      },
      {
        header: 'Issues',
        key: 'issues',
        width: 20,
      },
      { header: 'MitigatingActions', key: 'mitigatingActions', width: 20 },
    ];

    outcomesSheet.columns = [
      { header: 'MelpCode', key: 'melpCode', width: 20 },
      { header: 'Year', key: 'year', width: 6 },
      { header: 'InstituteName', key: 'instituteName', width: 20 },
      { header: 'OC-Code', key: 'ocCode', width: 10 },
      { header: 'OutcomeChallenge', key: 'outcomeChallenge', width: 20 },
      { header: 'BoundaryPartners', key: 'boundaryPartners', width: 20 },
      { header: 'PM-Code', key: 'pmCode', width: 10 },
      { header: 'ProgressMarker', key: 'progressMarker', width: 20 },
      { header: 'Priority', key: 'priority', width: 20 },
      {
        header: 'ProgressMonitoringQ2',
        key: 'progressMonitoringQ2',
        width: 20,
      },
      {
        header: 'ProgressMonitoringQ4',
        key: 'progressMonitoringQ4',
        width: 20,
      },
      { header: 'DescriptionOfChange', key: 'descriptionOfChange', width: 20 },
      { header: 'ContributingFactors', key: 'contributingFactors', width: 20 },
      { header: 'SourceOfEvidence', key: 'sourceOfEvidence', width: 20 },
      { header: 'UnintendedChanges', key: 'unintendedChanges', width: 20 },
    ];

    resultsSheet.addRow({
      melpCode: 'MelpCode',
      year: 'Year',
      instituteName: 'Institute Name',
      resultCode: 'ResultCode',
      objectiveLevel: 'Objective Level',
      resultDescription: 'Description',
      indicatorCode: 'Indicator Code',
      indicatorName: 'Indicator Name',
      indicatorDefinition: ' Indicator Definition',
      measurementUnit: 'Measurement Unit',
      cumulativeTarget: 'Cumulative Target',
      yearOfTargetCompletion: 'Target Completion Year',
      dataCollectionSource: 'Data Collection Source',
      dataCollectionMethodType: 'Data Collection Method Type',
      dataCollectionMethodName: 'Data Collection Method Name',
      dataCollectionFrequencyType: 'DataCollectionFrequencyType',
      dataCollectionFrequencyName: 'DataCollectionFrequencyName',
      indicatorsMonitoringYear: 'IndicatorsMonitoringYear',
      targetAchieved: 'TargetAchieved',
      progress: 'Progress',
      baseline: 'Baseline',
      explainationOfResultsAchieved: 'Explaination',
    });

    risksSheet.addRow({
      melpCode: 'MelpCode',
      year: 'Year',
      instituteName: 'Institute Name',
      resultCode: 'ResultCode',
      objectiveLevel: 'Objective Level',
      resultDescription: 'Description',
      indicatorCode: 'Indicator Code',
      indicatorName: 'Indicator Name',
      indicatorDefinition: ' Indicator Definition',
      measurementUnit: 'Measurement Unit',
      cumulativeTarget: 'Cumulative Target',
      yearOfTargetCompletion: 'Target Completion Year',
      dataCollectionSource: 'Data Collection Source',
      dataCollectionMethodType: 'Data Collection Method Type',
      dataCollectionMethodName: 'Data Collection Method Name',
      dataCollectionFrequencyType: 'DataCollectionFrequencyType',
      dataCollectionFrequencyName: 'DataCollectionFrequencyName',
      issues: 'Issues',
      mitigatingActions: 'Mitigating Actions',
    });

    outcomesSheet.addRow({
      melpCode: 'MelpCode',
      year: 'Year',
      instituteName: 'Institute Name',
      ocCode: 'OC Code',
      outcomeChallenge: 'Outcome Challenge',
      boundaryPartners: 'Boundary Partners',
      pmCode: 'PM Code',
      progressMarker: 'Progress Marker',
      priority: 'Priority',
      progressMonitoringQ2: 'ProgressMonitoringQ2',
      progressMonitoringQ4: 'ProgressMonitoringQ4',
      descriptionOfChange: 'DescriptionOfChange',
      contributingFactors: 'ContributingFactors',
      sourceOfEvidence: 'SourceOfEvidence',
      unintendedChanges: 'UnintendedChanges',
    });
    resultsSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    risksSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    outcomesSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  // Download MELP Common Logic
  async downloadMelp(
    // res,
    melpId: string,
    resultsSheet: exceljs.Worksheet,
    risksSheet: exceljs.Worksheet,
    outcomesSheet: exceljs.Worksheet,
    resultCount: number,
    riskCount: number,
    outcomeCount: number,
  ) {
    Logger.debug('MelpService.downloadMelp');
    const melp = await this.melpModel.findOne({ melpId }).exec();
    const results = await this.melpResultsModel
      .find({ melpId: melp._id, isDeleted: false })
      .exec();
    for (const result of results) {
      const indicators = await this.melpResultIndicatorsModel
        .find({
          resultId: result._id,
          isDeleted: false,
        })
        .exec();

      for (const indicator of indicators) {
        const indicatorMonitorings = await this.melpIndicatorMonitoringModel
          .find({
            resultIndicatorId: indicator._id,
            isDeleted: false,
          })
          .exec();

        for (const monitoring of indicatorMonitorings) {
          resultsSheet.getRow(resultCount).values = {
            melpCode: melp.melpCode,
            year: melp.year,
            instituteName: melp.instituteName,
            resultCode: result.resultCode,
            objectiveLevel: result.objectiveLevel,
            resultDescription: result.resultName,
            indicatorCode: indicator.indicatorCode,
            indicatorName: indicator.indicatorName,
            indicatorDefinition: indicator.definition,
            measurementUnit: indicator.measurementUnit,
            cumulativeTarget: indicator.cumulativeTarget,
            yearOfTargetCompletion: indicator.completionYear,
            dataCollectionSource: indicator.sourceOfData,
            dataCollectionMethodType: indicator.collectionMethodType,
            dataCollectionMethodName: indicator.collectionMethodName,
            dataCollectionFrequencyType: indicator.collectionFrequencyType,
            dataCollectionFrequencyName:
              indicator.collectionFrequencyName.length > 0
                ? indicator.collectionFrequencyName
                : 'NA',
            indicatorsMonitoringYear: monitoring.year,
            targetAchieved: monitoring.targetAchieved,
            progress: monitoring.progress,
            baseline: monitoring.baseline,
            explainationOfResultsAchieved: monitoring.explaination,
          };
          resultCount++;
        }

        const monitoringRisks = await this.melpIndicatorRisksModel
          .find({
            resultIndicatorId: indicator._id,
            isDeleted: false,
          })
          .exec();

        for (const risk of monitoringRisks) {
          risksSheet.getRow(riskCount).values = {
            melpCode: melp.melpCode,
            year: melp.year,
            instituteName: melp.instituteName,
            resultCode: result.resultCode,
            objectiveLevel: result.objectiveLevel,
            resultDescription: result.resultName,
            indicatorCode: indicator.indicatorCode,
            indicatorName: indicator.indicatorName,
            indicatorDefinition: indicator.definition,
            measurementUnit: indicator.measurementUnit,
            cumulativeTarget: indicator.cumulativeTarget,
            yearOfTargetCompletion: indicator.completionYear,
            dataCollectionSource: indicator.sourceOfData,
            dataCollectionMethodType: indicator.collectionMethodType,
            dataCollectionMethodName: indicator.collectionMethodName,
            dataCollectionFrequencyType: indicator.collectionFrequencyType,
            dataCollectionFrequencyName:
              indicator.collectionFrequencyName.length > 0
                ? indicator.collectionFrequencyName
                : 'NA',
            issues: risk.issue,
            mitigatingActions: risk.mitigatingAction,
          };
          riskCount++;
        }
      }
    }

    const outcomes = await this.melpOutcomesModel
      .find({ melpId: melp._id, isDeleted: false })
      .exec();

    for (const outcome of outcomes) {
      const markers = await this.melpOutcomeProgressMarkersModel
        .find({ outcomeId: outcome._id, isDeleted: false })
        .exec();
      console.log('Markers ', markers);
      for (const marker of markers) {
        let partners = '';
        for (let i = 0; i < outcome.boundaryPartners.length; i++) {
          if (i === outcome.boundaryPartners.length - 1) {
            partners = partners + outcome.boundaryPartners[i] + '.';
          } else {
            partners = partners + outcome.boundaryPartners[i] + ', ';
          }
        }

        const progressMonitoringQ2 = await this.getProgressMonitoring(
          marker.progressMonitoringQ2,
        );
        const progressMonitoringQ4 = await this.getProgressMonitoring(
          marker.progressMonitoringQ4,
        );

        const progressQ2 =
          progressMonitoringQ2 === null
            ? ' '
            : progressMonitoringQ2.progressMonitoring;

        const progressQ4 =
          progressMonitoringQ4 === null
            ? ' '
            : progressMonitoringQ4.progressMonitoring;
        console.log('Evidence ', marker.sourceOfEvidence);
        outcomesSheet.getRow(outcomeCount).values = {
          melpCode: melp.melpCode,
          year: melp.year,
          instituteName: melp.instituteName,
          ocCode: outcome.outcomeCode,
          outcomeChallenge: outcome.outcomeChallenge,
          boundaryPartners: partners,
          pmCode: marker.progressMarkerCode,
          progressMarker: marker.progressMarker,
          priority: await this.getPriority(marker.priorityId),
          progressMonitoringQ2: progressQ2,
          progressMonitoringQ4: progressQ4,
          descriptionOfChange: marker.descriptionOfChange,
          contributingFactors: marker.contributingFactors,
          sourceOfEvidence: marker.sourceOfEvidence,
          unintendedChanges: marker.unintendedChanges,
        };
        outcomeCount++;
      }
    }

    return {
      resultsCount: resultCount,
      risksCount: riskCount,
      outcomesCount: outcomeCount,
    };
  }

  // Download Individual MELP
  async downloadIndividualMelp(res, melpId: string) {
    Logger.debug('MelpService.downloadIndividualMelp');
    const workbook = new exceljs.Workbook();
    const melp = await this.melpModel
      .findOne({ melpId, isDeleted: false })
      .exec();
    const resultsSheet = workbook.addWorksheet(
      melp.melpCode + '-Results - Indicators Monitoring',
    );
    const risksSheet = workbook.addWorksheet(
      melp.melpCode + '-Results - Risks Monitoring',
    );
    const outcomesSheet = workbook.addWorksheet(melp.melpCode + '-Outcomes');
    const resultCount = 2,
      riskCount = 2,
      outcomeCount = 2;
    await this.worksheetCreation(resultsSheet, risksSheet, outcomesSheet);
    await this.downloadMelp(
      // res,
      melpId,
      resultsSheet,
      risksSheet,
      outcomesSheet,
      resultCount,
      riskCount,
      outcomeCount,
    );
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition': 'attachment; filename=' + melp.melpCode + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async commonFunctionForMultipleDownload(
    res,
    year,
    melpList: Melp[],
    resultsSheet: exceljs.Worksheet,
    risksSheet: exceljs.Worksheet,
    outcomesSheet: exceljs.Worksheet,
    workbook: exceljs.Workbook,
  ) {
    Logger.debug('MelpService.commonFunctionForMultipleDownload');
    let resultCount = 2,
      riskCount = 2,
      outcomeCount = 2;
    for (const melp of melpList) {
      let { resultsCount, risksCount, outcomesCount } = await this.downloadMelp(
        // res,
        melp.melpId,
        resultsSheet,
        risksSheet,
        outcomesSheet,
        resultCount,
        riskCount,
        outcomeCount,
      );
      resultCount = resultsCount;
      riskCount = risksCount;
      outcomeCount = outcomesCount;
    }
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition': 'attachment; filename=' + 'Melp-' + year + '.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  // Download Multiple MELP
  async downloadMultipleMelp(res, year: number, user: any) {
    Logger.debug('MelpService.downloadMultipleMelp');
    const workbook = new exceljs.Workbook();
    const resultsSheet = workbook.addWorksheet(
      'MELP' + year + '-Results - Indicators Monitoring',
    );
    const risksSheet = workbook.addWorksheet(
      'MELP' + year + '-Results - Risks Monitoring',
    );
    const outcomesSheet = workbook.addWorksheet('MELP' + year + '-Outcomes');
    await this.worksheetCreation(resultsSheet, risksSheet, outcomesSheet);
    let melpList;
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );

    if (user.networkId === null && user.partnerId === null) {
      melpList = await this.melpModel
        .find({ year, isDeleted: false, statusId: approvedStatusId })
        .exec();
    } else {
      melpList = await this.melpModel
        .find({
          year,
          isDeleted: false,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
    }
    await this.commonFunctionForMultipleDownload(
      res,
      year,
      melpList,
      resultsSheet,
      risksSheet,
      outcomesSheet,
      workbook,
    );
  }

  async downloadGeneralUserMultipleMelp(
    res,
    year: number,
    isNetworkMelp: boolean,
  ) {
    Logger.debug('MelpService.downloadGeneralUserMultipleMelp');
    const workbook = new exceljs.Workbook();
    const resultsSheet = workbook.addWorksheet(
      'MELP' + year + '-Results - Indicators Monitoring',
    );
    const risksSheet = workbook.addWorksheet(
      'MELP' + year + '-Results - Risks Monitoring',
    );
    const outcomesSheet = workbook.addWorksheet('MELP' + year + '-Outcomes');
    await this.worksheetCreation(resultsSheet, risksSheet, outcomesSheet);
    let melpList;
    const inProgressStatusId = await this.userService.getStatusId(
      StatusEnum.IN_PROGRESS,
    );

    if (isNetworkMelp) {
      melpList = await this.melpModel
        .find({
          year,
          isDeleted: false,
          networkId: { $ne: null },
          partnerId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    } else {
      melpList = await this.melpModel
        .find({
          year,
          isDeleted: false,
          partnerId: { $ne: null },
          networkId: { $eq: null },
          statusId: { $ne: inProgressStatusId },
        })
        .exec();
    }
    await this.commonFunctionForMultipleDownload(
      res,
      year,
      melpList,
      resultsSheet,
      risksSheet,
      outcomesSheet,
      workbook,
    );
  }

  async getPMCodeCount(outcomeId) {
    Logger.debug('MelpService.getPMCodeCount');
    await this.getOutcomeByOutcomeId(outcomeId);
    const outcome = await this.melpOutcomesModel
      .findOne({ outcomeId, isDeleted: false })
      .exec();
    return outcome.progressMarkerCount;
  }

  async increasePMCodeCount(outcomeId) {
    Logger.debug('MelpService.increasePMCodeCount');
    await this.getOutcomeByOutcomeId(outcomeId);
    const outcome = await this.melpOutcomesModel
      .findOne({ outcomeId, isDeleted: false })
      .exec();
    return this.melpOutcomesModel
      .findOneAndUpdate(
        { outcomeId, isDeleted: false },
        { progressMarkerCount: outcome.progressMarkerCount + 1 },
        { new: true },
      )
      .exec();
  }

  async getProgressMonitoringList() {
    Logger.debug('MelpService.getProgressMonitoringList');
    return this.progressMonitoringModel.find().exec();
  }

  async getProgressMonitoringIdByName(progressMonitoring: string) {
    try {
      Logger.debug('MelpService.getProgressMonitoring');
      const progressMonitoringObject = await this.progressMonitoringModel
        .findOne({ progressMonitoring })
        .exec();
      return progressMonitoringObject._id;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getListOfMelpByYear(year: number, networkId: any, partnerId: any) {
    Logger.debug('MelpService.getProgressMonitoringList');
    const approvedStatusId = await this.userService.getStatusId(
      StatusEnum.APPROVED,
    );

    if (networkId === 'null') networkId = null;
    else networkId = new Types.ObjectId(networkId);

    if (partnerId === 'null') partnerId = null;
    else partnerId = new Types.ObjectId(partnerId);

    if (networkId === null && partnerId === null) {
      return this.melpModel
        .find({
          year,
          isDeleted: false,
          statusId: approvedStatusId,
        })
        .exec();
    } else {
      return this.melpModel
        .find({
          year,
          isDeleted: false,
          statusId: approvedStatusId,
          networkId: networkId,
          partnerId: partnerId,
        })
        .exec();
    }
  }

  async getProgressMonitoringCountsByMelpId(melpId, isQ2: boolean) {
    Logger.debug('MelpService.getProgressMonitoringCountsByMelpId');
    const outcomes = await this.melpOutcomesModel
      .find({
        melpId,
        isDeleted: false,
      })
      .exec();

    let totalLowPMCount = 0,
      totalMediumPMCount = 0,
      totalHighPMCount = 0;
    for (const outcome of outcomes) {
      let lowPMCount = 0,
        highPMCount = 0,
        mediumPMCount = 0;
      const progressMonitoringList = await this.getProgressMonitoringList();
      if (isQ2) {
        lowPMCount += await this.melpOutcomeProgressMarkersModel
          .find({
            outcomeId: outcome._id,
            isDeleted: false,
            progressMonitoringQ2: progressMonitoringList[0]._id,
          })
          .count()
          .exec();

        mediumPMCount += await this.melpOutcomeProgressMarkersModel
          .find({
            outcomeId: outcome._id,
            isDeleted: false,
            progressMonitoringQ2: progressMonitoringList[1]._id,
          })
          .count()
          .exec();

        highPMCount += await this.melpOutcomeProgressMarkersModel
          .find({
            outcomeId: outcome._id,
            isDeleted: false,
            progressMonitoringQ2: progressMonitoringList[2]._id,
          })
          .count()
          .exec();
      } else {
        lowPMCount += await this.melpOutcomeProgressMarkersModel
          .find({
            outcomeId: outcome._id,
            isDeleted: false,
            progressMonitoringQ4: progressMonitoringList[0]._id,
          })
          .count()
          .exec();

        mediumPMCount += await this.melpOutcomeProgressMarkersModel
          .find({
            outcomeId: outcome._id,
            isDeleted: false,
            progressMonitoringQ4: progressMonitoringList[1]._id,
          })
          .count()
          .exec();

        highPMCount += await this.melpOutcomeProgressMarkersModel
          .find({
            outcomeId: outcome._id,
            isDeleted: false,
            progressMonitoringQ4: progressMonitoringList[2]._id,
          })
          .count()
          .exec();
      }

      totalLowPMCount += lowPMCount;
      totalMediumPMCount += mediumPMCount;
      totalHighPMCount += highPMCount;
    }

    return {
      totalLowPMCount,
      totalMediumPMCount,
      totalHighPMCount,
    };
  }

  async getMelp(melpId: string) {
    Logger.debug('MelpService.getMelp');
    const melp = await this.melpModel.find({ melpId, isDeleted: false }).exec();
    if (melp === null)
      throw new NotFoundException(errorMessages.MELP_NOT_FOUND);
    else return melp;
  }

  async getIndicatorMonitoringCounts(
    year: number,
    networkId: any,
    partnerId: any,
  ) {
    Logger.debug('MelpService.getIndicatorMonitoringCounts');
    const melpList = await this.getListOfMelpByYear(year, networkId, partnerId);
    let indicatorsCount = 0;
    for (const melp of melpList) {
      const resultList = await this.melpResultsModel
        .find({
          melpId: melp._id,
          isDeleted: false,
        })
        .exec();

      for (const result of resultList) {
        indicatorsCount += await this.melpResultIndicatorsModel
          .find({
            resultId: result._id,
            isDeleted: false,
          })
          .count()
          .exec();
      }
    }
    return {
      indicatorsCount,
    };
  }
}
