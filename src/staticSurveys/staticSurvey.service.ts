import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivitiesService } from '../activities/activities.service';
import { NetworkService } from '../networks/network.service';
import { PartnerService } from '../partners/partner.service';
import { v4 as uuidv4 } from 'uuid';
import { EntrySurveyResponseDTO } from './dto/entrySurveyResponse.dto';
import { ExitSurveyResponseDTO } from './dto/exitSurveyResponse.dto';
import { SurveyFormDTO } from './dto/surveyForm.dto';
import { EntrySurveyForm } from './schema/entrySurveyForm.schema';
import { EntrySurveyResponse } from './schema/entrySurveyResponse.schema';
import { ExitSurveyForm } from './schema/exitSurveyForm.schema';
import { ExitSurveyResponse } from './schema/exitSurveyResponse.schema';
import { Workbook, Worksheet } from 'exceljs';
import { Gender } from '../common/staticSchema/gender.schema';
import { AgeGroup } from '../common/staticSchema/ageGroup.schema';
import { Region } from '../common/staticSchema/region.schema';
import { ScopeOfWork } from '../common/staticSchema/scopeOfWork.schema';
import { TypeOfInstitution } from '../common/staticSchema/typeOfInstitution.schema';
import { OutcomeSurveyForm } from './schema/outcomeSurveyForm.schema';
import { errorMessages } from '../utils/error-messages.utils';
import { OutcomeSurveyResponse } from './schema/outcomeSurveyResponse.schema';
import { OutcomeSurveyResponseDTO } from './dto/outcomeSurveyResponse.dto';
import { KnowledgeApplicationEnum } from './enum/knowledgeApplication.enum';
import { GenderEnum } from './enum/gender.enum';
import { TypeOfInstitutionEnum } from './enum/typeOfInstitution.enum';
import { AgeGroupEnum } from './enum/ageGroup.enum';
import { RegionEnum } from './enum/region.enum';
import { KnowledgeRatingEnum } from './enum/knowledgeRating.enum';
import { DegreeOfNewKnowledgeEnum } from './enum/degreeOfNewKnowledge.enum';
import { BenefitsLevelEnum } from './enum/benefitsLevel.enum';
import { RelevanceLevelEnum } from './enum/relevanceLevel.enum';
import { ExpectationLevelEnum } from './enum/expectationLevel.enum';
import { KnowledgeGainedEnum } from './enum/knowledgeGained.enum';
import { Country } from '../common/staticSchema/country.schema';
import { ActivityLog } from '../common/schema/activityLog.schema';
import { CourseMainObjectives } from '../common/staticSchema/courseMainObjectives.schema';
import { Beneficiality } from '../common/staticSchema/beneficiality.schema';
import { Relevance } from '../common/staticSchema/relevance.schema';
import { Expectation } from '../common/staticSchema/expectation.schema';
import { KnowledgeGained } from '../common/staticSchema/knowledgeGained.schema';
import { KnowledgeSharing } from '../common/staticSchema/knowledgeSharing.schema';
import { KnowledgeApplication } from '../common/staticSchema/knowledgeApplication.schema';
import { DegreeOfNewKnowledge } from '../common/staticSchema/degreeOfNewKnowledge.schema';
import { MelpService } from '../melp/melp.service';
import { CapnetEnum } from '../common/enum/capnet.enum';

@Injectable()
export class StaticSurveyService {
  constructor(
    @InjectModel(EntrySurveyForm.name)
    private entrySurveyFormModel: Model<EntrySurveyForm>,

    @InjectModel(EntrySurveyResponse.name)
    private entrySurveyResponseModel: Model<EntrySurveyResponse>,

    @InjectModel(ExitSurveyForm.name)
    private exitSurveyFormModel: Model<ExitSurveyForm>,

    @InjectModel(ExitSurveyResponse.name)
    private exitSurveyResponseModel: Model<ExitSurveyResponse>,

    @InjectModel(OutcomeSurveyForm.name)
    private outcomeSurveyFormModel: Model<OutcomeSurveyForm>,

    @InjectModel(OutcomeSurveyResponse.name)
    private outcomeSurveyResponseModel: Model<OutcomeSurveyResponse>,

    @InjectModel(Gender.name) private genderModel: Model<Gender>,

    @InjectModel(AgeGroup.name) private ageGroupModel: Model<AgeGroup>,

    @InjectModel(Region.name) private regionModel: Model<Region>,

    @InjectModel(ScopeOfWork.name) private scopeOfWorkModel: Model<ScopeOfWork>,

    @InjectModel(TypeOfInstitution.name)
    private typeOfInstitutionModel: Model<TypeOfInstitution>,

    @InjectModel(Country.name) private countryModel: Model<Country>,

    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,

    @InjectModel(CourseMainObjectives.name)
    private courseMainObjectivesModel: Model<CourseMainObjectives>,

    @InjectModel(Beneficiality.name)
    private beneficialityModel: Model<Beneficiality>,

    @InjectModel(Relevance.name) private relevanceModel: Model<Relevance>,

    @InjectModel(Expectation.name) private expectationModel: Model<Expectation>,

    @InjectModel(KnowledgeGained.name)
    private knowledgeGainedModel: Model<KnowledgeGained>,

    @InjectModel(KnowledgeSharing.name)
    private knowledgeSharingModel: Model<KnowledgeSharing>,

    @InjectModel(KnowledgeApplication.name)
    private knowledgeApplicationModel: Model<KnowledgeApplication>,

    @InjectModel(DegreeOfNewKnowledge.name)
    private degreeOfNewKnowledgeModel: Model<DegreeOfNewKnowledge>,

    private readonly configService: ConfigService,
    private readonly networkService: NetworkService,
    private readonly partnerService: PartnerService,
    private readonly activityService: ActivitiesService,
    private readonly melpService: MelpService,
  ) {}

  // Get Static Tables Data
  async getStaticDataTables() {
    Logger.debug('StaticSurveyService.getStaticDataTables');
    const genderList = await this.genderModel.find().exec();
    const ageGroupList = await this.ageGroupModel.find().exec();
    const regionList = await this.regionModel.find().exec();
    const scopeOfWorkList = await this.scopeOfWorkModel.find().exec();
    const typeOfInstitutionList = await this.typeOfInstitutionModel
      .find()
      .exec();
    const networkList = await this.networkService.getAllNetworksList();
    const countryList = await this.countryModel.find().exec();
    const courseObjectivesList = await this.countryModel.find().exec();
    const beneficialityList = await this.beneficialityModel.find().exec();
    const relevanceList = await this.relevanceModel.find().exec();
    const expectationList = await this.expectationModel.find().exec();
    const knowledgeGainedList = await this.knowledgeGainedModel.find().exec();
    const knowledgeSharingList = await this.knowledgeSharingModel.find().exec();
    const knowledgeApplicationList = await this.knowledgeApplicationModel
      .find()
      .exec();
    const degreeOfNewKnowledgeList = await this.degreeOfNewKnowledgeModel
      .find()
      .exec();
    return {
      genderList,
      ageGroupList,
      regionList,
      scopeOfWorkList,
      typeOfInstitutionList,
      networkList,
      countryList,
      courseObjectivesList,
      beneficialityList,
      relevanceList,
      expectationList,
      knowledgeGainedList,
      knowledgeSharingList,
      knowledgeApplicationList,
      degreeOfNewKnowledgeList,
    };
  }

  // async getGenderById(id) {
  //   try {
  //     Logger.debug('StaticSurveyService.getGenderById');
  //     const gender = await this.genderModel.findOne({ _id: id }).exec();
  //     return gender.gender;
  //   } catch (error) {
  //     throw new InternalServerErrorException();
  //   }
  // }

  async getAgeGroupById(id) {
    try {
      Logger.debug('StaticSurveyService.getAgeGroupById');
      const ageGroup = await this.ageGroupModel.findOne({ _id: id }).exec();
      return ageGroup.ageGroup;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getScopeOfWorkById(id) {
    try {
      Logger.debug('StaticSurveyService.getScopeOfWorkById');
      const scopeOfWork = await this.scopeOfWorkModel
        .findOne({ _id: id })
        .exec();
      return scopeOfWork.scopeOfWork;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getGenderIdByValue(gender: string) {
    try {
      Logger.debug('StaticSurveyService.getGenderIdByValue');
      const genderObject = await this.genderModel.findOne({ gender }).exec();
      return genderObject._id;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getInstitutionIdByValue(typeOfInstitution: string) {
    try {
      Logger.debug('StaticSurveyService.getInstitutionIdByValue');
      const genderObject = await this.typeOfInstitutionModel
        .findOne({ typeOfInstitution })
        .exec();
      return genderObject._id;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getAgeGroupIdByValue(ageGroup: string) {
    try {
      Logger.debug('StaticSurveyService.getAgeGroupIdByValue');
      const ageGroupObject = await this.ageGroupModel
        .findOne({ ageGroup })
        .exec();
      return ageGroupObject._id;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getRegionIdByValue(region: string) {
    try {
      Logger.debug('StaticSurveyService.getRegionIdByValue');
      const regionObject = await this.regionModel.findOne({ region }).exec();
      return regionObject._id;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async commonFunctionForSearchSort(
    searchKeyword: string,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('StaticSurveyService.commonFunctionForSearchSort');
    const regex = new RegExp(searchKeyword, 'i');
    sortKey = sortKey.trim().length === 0 ? 'updatedAt' : sortKey;
    const sortQuery = {};
    sortQuery[sortKey] = sortDirection === 1 ? 1 : -1;

    return {
      regex,
      sortQuery,
    };
  }

  // Check if a survey form with provided year, language, activityId exists.
  async checkIfEntrySurveyFormExists(
    year: number,
    language: string,
    proposalId: any,
    networkId: any,
    partnerId: any,
  ) {
    Logger.debug('StaticSurveyService.checkIfEntrySurveyFormExists');
    const existingForm = await this.entrySurveyFormModel
      .findOne({
        year,
        language,
        proposalId,
        networkId,
        partnerId,
      })
      .exec();
    if (!existingForm) return false;
    else throw new ConflictException(errorMessages.SURVEY_ALREADY_EXISTS);
  }

  async checkIfExitSurveyFormExists(
    year: number,
    language: string,
    proposalId: any,
    networkId: any,
    partnerId: any,
  ) {
    Logger.debug('StaticSurveyService.checkIfExitSurveyFormExists');
    const existingForm = await this.exitSurveyFormModel
      .findOne({
        year,
        language,
        proposalId,
        networkId,
        partnerId,
      })
      .exec();
    if (!existingForm) return false;
    else throw new ConflictException(errorMessages.SURVEY_ALREADY_EXISTS);
  }

  async checkIfOutcomeSurveyFormExists(
    year: number,
    language: string,
    proposalId: any,
    networkId: any,
    partnerId: any,
  ) {
    Logger.debug('StaticSurveyService.checkIfOutcomeSurveyFormExists');
    const existingForm = await this.outcomeSurveyFormModel
      .findOne({
        year,
        language,
        proposalId,
        networkId,
        partnerId,
      })
      .exec();
    if (!existingForm) return false;
    else throw new ConflictException(errorMessages.SURVEY_ALREADY_EXISTS);
  }

  // Detailed View of Survey Form Data
  async getEntrySurveyFormData(entrySurveyFormId) {
    Logger.debug('StaticSurveyService.getEntrySurveyFormData');
    const entrySurveyForm = await this.entrySurveyFormModel
      .findOne({ entrySurveyFormId: entrySurveyFormId })
      .exec();

    if (!entrySurveyForm)
      throw new NotFoundException(errorMessages.SURVEY_NOT_FOUND);
    else return entrySurveyForm;
  }

  async getExitSurveyFormData(exitSurveyFormId: string) {
    Logger.debug('StaticSurveyService.getExitSurveyFormData');
    const exitSurveyForm = await this.exitSurveyFormModel
      .findOne({ exitSurveyFormId })
      .exec();

    if (!exitSurveyForm)
      throw new NotFoundException(errorMessages.SURVEY_NOT_FOUND);
    else return exitSurveyForm;
  }

  async getOutcomeSurveyFormData(outcomeSurveyFormId) {
    Logger.debug('StaticSurveyService.getOutcomeSurveyFormData');
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ outcomeSurveyFormId })
      .exec();

    if (!outcomeSurveyForm)
      throw new NotFoundException(errorMessages.SURVEY_NOT_FOUND);
    else return outcomeSurveyForm;
  }

  // Create a Survey Form
  async addEntrySurveyForm(entrySurveyFormDto: SurveyFormDTO, user: any) {
    Logger.debug('StaticSurveyService.addEntrySurveyForm');
    const existingForm = await this.checkIfEntrySurveyFormExists(
      entrySurveyFormDto.year,
      entrySurveyFormDto.language,
      entrySurveyFormDto.proposalId,
      user.networkId,
      user.partnerId,
    );
    if (!existingForm) {
      let instituteName;
      if (user.networkId !== null && user.partnerId === null) {
        instituteName = await this.networkService.getNetworkNameById(
          user.networkId,
        );
      } else if (user.networkId === null && user.partnerId !== null) {
        instituteName = await this.partnerService.getPartnerInstituteNameById(
          user.partnerId,
        );
      } else {
        instituteName = CapnetEnum.CAPNET;
      }
      const entrySurveyForm = await this.entrySurveyFormModel.create({
        ...entrySurveyFormDto,
        entrySurveyFormId: uuidv4(),
        instituteName,
        networkId: user.networkId,
        partnerId: user.partnerId,
        createdBy: user._id,
        updatedBy: user._id,
      });
      const url = `${this.configService.get(
        'APP_URL',
      )}/staticSurvey/entrySurvey/${entrySurveyForm.language}/${
        entrySurveyForm.entrySurveyFormId
      }`;
      await this.entrySurveyFormModel
        .findOneAndUpdate(
          {
            entrySurveyFormId: entrySurveyForm.entrySurveyFormId,
            isActive: true,
          },
          { link: url },
          { new: true },
        )
        .exec();

      await this.melpService.addActivityLog(
        user,
        `Entry Survey Form - ${entrySurveyForm.formCode} created`,
      );
      return url;
    }
  }

  async addExitSurveyForm(exitSurveyFormDto: SurveyFormDTO, user: any) {
    Logger.debug('StaticSurveyService.addExitSurveyForm');
    const existingForm = await this.checkIfExitSurveyFormExists(
      exitSurveyFormDto.year,
      exitSurveyFormDto.language,
      exitSurveyFormDto.proposalId,
      user.networkId,
      user.partnerId,
    );
    if (!existingForm) {
      let instituteName;
      if (user.networkId !== null && user.partnerId === null) {
        instituteName = await this.networkService.getNetworkNameById(
          user.networkId,
        );
      } else if (user.networkId === null && user.partnerId !== null) {
        instituteName = await this.partnerService.getPartnerInstituteNameById(
          user.partnerId,
        );
      } else {
        instituteName = CapnetEnum.CAPNET;
      }
      const exitSurveyForm = await this.exitSurveyFormModel.create({
        ...exitSurveyFormDto,
        exitSurveyFormId: uuidv4(),
        instituteName,
        networkId: user.networkId,
        partnerId: user.partnerId,
        createdBy: user._id,
        updatedBy: user._id,
      });
      const url = `${this.configService.get(
        'APP_URL',
      )}/staticSurvey/exitSurvey/${exitSurveyForm.language}/${
        exitSurveyForm.exitSurveyFormId
      }`;

      await this.exitSurveyFormModel
        .findOneAndUpdate(
          {
            exitSurveyFormId: exitSurveyForm.exitSurveyFormId,
            isActive: true,
          },
          { link: url },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Exit Survey Form - ${exitSurveyForm.formCode} created`,
      );
      return url;
    }
  }

  async addOutcomeSurveyForm(outcomeSurveyFormDto: SurveyFormDTO, user: any) {
    Logger.debug('StaticSurveyService.addOutcomeSurveyForm');
    const existingForm = await this.checkIfOutcomeSurveyFormExists(
      outcomeSurveyFormDto.year,
      outcomeSurveyFormDto.language,
      outcomeSurveyFormDto.proposalId,
      user.networkId,
      user.partnerId,
    );
    if (!existingForm) {
      let instituteName;
      if (user.networkId !== null && user.partnerId === null) {
        instituteName = await this.networkService.getNetworkNameById(
          user.networkId,
        );
      } else if (user.networkId === null && user.partnerId !== null) {
        instituteName = await this.partnerService.getPartnerInstituteNameById(
          user.partnerId,
        );
      } else {
        instituteName = CapnetEnum.CAPNET;
      }
      const outcomeSurveyForm = await this.outcomeSurveyFormModel.create({
        ...outcomeSurveyFormDto,
        outcomeSurveyFormId: uuidv4(),
        instituteName,
        networkId: user.networkId,
        partnerId: user.partnerId,
        createdBy: user._id,
        updatedBy: user._id,
      });
      const url = `${this.configService.get(
        'APP_URL',
      )}/staticSurvey/outcomeSurvey/${outcomeSurveyForm.language}/${
        outcomeSurveyForm.outcomeSurveyFormId
      }`;
      await this.outcomeSurveyFormModel
        .findOneAndUpdate(
          {
            outcomeSurveyFormId: outcomeSurveyForm.outcomeSurveyFormId,
            isActive: true,
          },
          { link: url },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Outcome Survey Form - ${outcomeSurveyForm.formCode} created`,
      );
      return url;
    }
  }

  // Add Response for a survey form
  async entrySurveyResponse(
    entrySurveyResponseDto: EntrySurveyResponseDTO,
    entrySurveyFormId: string,
  ) {
    Logger.debug('StaticSurveyService.entrySurveyResponse');
    const entrySurveyForm = await this.getEntrySurveyFormData(
      entrySurveyFormId,
    );

    if (!entrySurveyForm.isActive) {
      throw new BadRequestException(errorMessages.SURVEY_DEACTIVATED);
    }
    const existingEmail = await this.entrySurveyResponseModel
      .findOne({
        email: entrySurveyResponseDto.email,
        entrySurveyFormId: entrySurveyForm._id,
      })
      .exec();

    if (existingEmail)
      throw new ConflictException(errorMessages.SURVEY_ALREADY_FILLED);
    else {
      if (entrySurveyResponseDto.networkId === 'none') {
        entrySurveyResponseDto.networkId = null;
      }
      return new this.entrySurveyResponseModel({
        ...entrySurveyResponseDto,
        entrySurveyResponseId: uuidv4(),
        entrySurveyFormId: entrySurveyForm._id,
      }).save();
    }
  }

  async exitSurveyResponse(
    exitSurveyResponseDto: ExitSurveyResponseDTO,
    exitSurveyFormId: string,
  ) {
    Logger.debug('StaticSurveyService.exitSurveyResponse');
    const exitSurveyForm = await this.getExitSurveyFormData(exitSurveyFormId);

    if (!exitSurveyForm.isActive) {
      throw new BadRequestException(errorMessages.SURVEY_DEACTIVATED);
    }

    const existingEmail = await this.exitSurveyResponseModel
      .findOne({
        email: exitSurveyResponseDto.email,
        exitSurveyFormId: exitSurveyForm._id,
      })
      .exec();

    if (existingEmail)
      throw new ConflictException(errorMessages.SURVEY_ALREADY_FILLED);
    else {
      return this.exitSurveyResponseModel.create({
        ...exitSurveyResponseDto,
        exitSurveyResponseId: uuidv4(),
        exitSurveyFormId: exitSurveyForm._id,
      });
    }
  }

  async outcomeSurveyResponse(
    outcomeSurveyResponseDto: OutcomeSurveyResponseDTO,
    outcomeSurveyFormId: string,
  ) {
    Logger.debug('StaticSurveyService.outcomeSurveyResponse');
    const outcomeSurveyForm = await this.getOutcomeSurveyFormData(
      outcomeSurveyFormId,
    );

    if (!outcomeSurveyForm.isActive) {
      throw new BadRequestException(errorMessages.SURVEY_DEACTIVATED);
    }

    const existingEmail = await this.outcomeSurveyResponseModel
      .findOne({
        email: outcomeSurveyResponseDto.email,
        outcomeSurveyFormId: outcomeSurveyForm._id,
      })
      .exec();

    if (existingEmail)
      throw new ConflictException(errorMessages.SURVEY_ALREADY_FILLED);
    else {
      if (
        outcomeSurveyResponseDto.isRelevantChange &&
        (outcomeSurveyResponseDto.elaborateChange === undefined ||
          outcomeSurveyResponseDto.locationOfChange === undefined ||
          outcomeSurveyResponseDto.typeOfInstitutionInvolved === undefined)
      ) {
        throw new BadRequestException(errorMessages.FILL_MANDATORY_FIELDS);
      }
      return this.outcomeSurveyResponseModel.create({
        ...outcomeSurveyResponseDto,
        outcomeSurveyResponseId: uuidv4(),
        outcomeSurveyFormId: outcomeSurveyForm._id,
      });
    }
  }

  async getEntrySurveysList(
    user: any,
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('StaticSurveyService.getEntrySurveysList');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    let entrySurveysList,
      entrySurveysCount,
      entrySurveys = [];
    if (user.networkId === null && user.partnerId === null) {
      entrySurveysList = await this.entrySurveyFormModel
        .find({
          $and: [
            { year },
            {
              $or: [
                { activityCode: regex },
                { activityName: regex },
                { language: regex },
                { instituteName: regex },
              ],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      entrySurveysCount = await this.entrySurveyFormModel
        .find({ year })
        .count()
        .exec();
    } else {
      entrySurveysList = await this.entrySurveyFormModel
        .find({
          $and: [
            { year, partnerId: user.partnerId, networkId: user.networkId },
            {
              $or: [
                { activityCode: regex },
                { activityName: regex },
                { language: regex },
              ],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      entrySurveysCount = await this.entrySurveyFormModel
        .find({ year, partnerId: user.partnerId, networkId: user.networkId })
        .count()
        .exec();
    }

    for (const entrySurvey of entrySurveysList) {
      const temp = {};
      // const activity = await this.activityService.getActivityById(entrySurvey.activityId)
      const numberOfResponses = await this.entrySurveyResponseModel
        .find({ entrySurveyFormId: entrySurvey._id })
        .count()
        .exec();
      temp['entrySurveyFormId'] = entrySurvey.entrySurveyFormId;
      temp['year'] = entrySurvey.year;
      temp['proposalId'] = entrySurvey.proposalId;
      temp['activityCode'] = entrySurvey.activityCode;
      temp['activityName'] = entrySurvey.activityName;
      temp['instituteName'] = entrySurvey.instituteName;
      temp['language'] = entrySurvey.language;
      temp['link'] = entrySurvey.link;
      temp['status'] = entrySurvey.isActive ? 'Active' : 'Closed';
      temp['numberOfResponses'] = numberOfResponses;
      temp['createdAt'] = entrySurvey.createdAt;
      temp['closedAt'] = entrySurvey.closedAt;
      temp['isActive'] = entrySurvey.isActive;
      entrySurveys = [...entrySurveys, { ...temp }];
    }

    return {
      entrySurveys,
      entrySurveysCount,
      totalPageCount: Math.ceil(entrySurveysCount / 10),
    };
  }

  async getExitSurveysList(
    user: any,
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('StaticSurveyService.getExitSurveysList');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    let exitSurveysList,
      exitSurveysCount,
      exitSurveys = [];

    if (user.networkId === null && user.partnerId === null) {
      exitSurveysList = await this.exitSurveyFormModel
        .find({
          $and: [
            { year },
            {
              $or: [
                { activityCode: regex },
                { activityName: regex },
                { language: regex },
                { instituteName: regex },
              ],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      exitSurveysCount = await this.exitSurveyFormModel
        .find({ year })
        .count()
        .exec();
    } else {
      exitSurveysList = await this.exitSurveyFormModel
        .find({
          $and: [
            { year, partnerId: user.partnerId, networkId: user.networkId },
            {
              $or: [
                { activityCode: regex },
                { activityName: regex },
                { language: regex },
              ],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      exitSurveysCount = await this.exitSurveyFormModel
        .find({ year, partnerId: user.partnerId, networkId: user.networkId })
        .count()
        .exec();
    }

    for (const exitSurvey of exitSurveysList) {
      const temp = {};
      const numberOfResponses = await this.exitSurveyResponseModel
        .find({ exitSurveyFormId: exitSurvey._id })
        .count()
        .exec();
      temp['exitSurveyFormId'] = exitSurvey.exitSurveyFormId;
      temp['year'] = exitSurvey.year;
      temp['proposalId'] = exitSurvey.proposalId;
      temp['activityCode'] = exitSurvey.activityCode;
      temp['activityName'] = exitSurvey.activityName;
      temp['instituteName'] = exitSurvey.instituteName;
      temp['language'] = exitSurvey.language;
      temp['link'] = exitSurvey.link;
      temp['status'] = exitSurvey.isActive ? 'Active' : 'Closed';
      temp['numberOfResponses'] = numberOfResponses;
      temp['createdAt'] = exitSurvey.createdAt;
      temp['closedAt'] = exitSurvey.closedAt;
      temp['isActive'] = exitSurvey.isActive;
      exitSurveys = [...exitSurveys, { ...temp }];
    }

    return {
      exitSurveys,
      exitSurveysCount,
      totalPageCount: Math.ceil(exitSurveysCount / 10),
    };
  }

  async getOutcomeSurveysList(
    user: any,
    year: number,
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('StaticSurveyService.getOutcomeSurveysList');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    let outcomeSurveysList,
      outcomeSurveysCount,
      outcomeSurveys = [];
    if (user.networkId === null && user.partnerId === null) {
      outcomeSurveysList = await this.outcomeSurveyFormModel
        .find({
          $and: [
            { year },
            {
              $or: [
                { activityCode: regex },
                { activityName: regex },
                { language: regex },
                { instituteName: regex },
              ],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      outcomeSurveysCount = await this.outcomeSurveyFormModel
        .find({ year })
        .count()
        .exec();
    } else {
      outcomeSurveysList = await this.outcomeSurveyFormModel
        .find({
          $and: [
            { year, partnerId: user.partnerId, networkId: user.networkId },
            {
              $or: [
                { activityCode: regex },
                { activityName: regex },
                { language: regex },
              ],
            },
          ],
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      outcomeSurveysCount = await this.outcomeSurveyFormModel
        .find({ year, partnerId: user.partnerId, networkId: user.networkId })
        .count()
        .exec();
    }

    for (const outcomeSurvey of outcomeSurveysList) {
      const temp = {};
      const numberOfResponses = await this.outcomeSurveyResponseModel
        .find({ outcomeSurveyFormId: outcomeSurvey._id })
        .count()
        .exec();
      temp['outcomeSurveyFormId'] = outcomeSurvey.outcomeSurveyFormId;
      temp['year'] = outcomeSurvey.year;
      temp['proposalId'] = outcomeSurvey.proposalId;
      temp['activityCode'] = outcomeSurvey.activityCode;
      temp['activityName'] = outcomeSurvey.activityName;
      temp['instituteName'] = outcomeSurvey.instituteName;
      temp['language'] = outcomeSurvey.language;
      temp['link'] = outcomeSurvey.link;
      temp['status'] = outcomeSurvey.isActive ? 'Active' : 'Closed';
      temp['numberOfResponses'] = numberOfResponses;
      temp['createdAt'] = outcomeSurvey.createdAt;
      temp['closedAt'] = outcomeSurvey.closedAt;
      temp['isActive'] = outcomeSurvey.isActive;
      outcomeSurveys = [...outcomeSurveys, { ...temp }];
    }

    return {
      outcomeSurveys,
      outcomeSurveysCount,
      totalPageCount: Math.ceil(outcomeSurveysCount / 10),
    };
  }

  //Get Responses List
  async getEntrySurveyResponsesList(
    // user: any,
    pageLimit: number,
    pageIndex: number,
    proposalId,
  ) {
    Logger.debug('StaticSurveyService.getEntrySurveyResponsesList');
    const entrySurveyForms = await this.entrySurveyFormModel
      .find({
        proposalId,
      })
      .exec();
    let responseList = [],
      responseCount = 0;
    for (const entrySurvey of entrySurveyForms) {
      const responses = await this.entrySurveyResponseModel
        .find({ entrySurveyFormId: entrySurvey._id })
        .exec();

      const count = await this.entrySurveyResponseModel
        .find({ entrySurveyFormId: entrySurvey._id })
        .count()
        .exec();

      for (const response of responses) {
        const temp = {};
        temp['language'] = entrySurvey.language;
        temp['email'] = response.email;
        temp['name'] = response.firstName + ' ' + response.lastName;
        temp['gender'] = await this.networkService.getGenderById(
          response.genderId,
        );
        temp['ageGroup'] = await this.getAgeGroupById(response.ageGroupId);
        temp['region'] = await this.networkService.getRegionById(
          response.regionId,
        );
        temp['country'] = await this.networkService.getCountryById(
          response.countryId,
        );
        temp['scopeOfWork'] = await this.getScopeOfWorkById(
          response.scopeOfWorkId,
        );
        temp['typeOfInstitution'] =
          await this.networkService.getTypeOfInstituionById(
            response.institutionTypeId,
          );
        responseList = [...responseList, { ...temp }];
      }

      responseCount += count;
    }

    return {
      responseList: responseList.slice(
        (pageIndex - 1) * pageLimit,
        pageIndex * pageLimit,
      ),
      responseCount,
      totalPageCount: Math.ceil(responseCount / 10),
    };
  }

  async getExitSurveyResponsesList(
    // user: any,
    pageLimit: number,
    pageIndex: number,
    proposalId,
  ) {
    Logger.debug('StaticSurveyService.getExitSurveyResponsesList');
    const exitSurveyForms = await this.exitSurveyFormModel
      .find({
        proposalId,
      })
      .exec();
    let responseList = [],
      responseCount = 0;
    for (const exitSurvey of exitSurveyForms) {
      const responses = await this.exitSurveyResponseModel
        .find({ exitSurveyFormId: exitSurvey._id })
        .exec();

      const count = await this.exitSurveyResponseModel
        .find({ exitSurveyFormId: exitSurvey._id })
        .count()
        .exec();

      for (const response of responses) {
        const temp = {};
        temp['language'] = exitSurvey.language;
        temp['email'] = response.email;
        temp['name'] = response.firstName + ' ' + response.lastName;
        temp['gender'] = await this.networkService.getGenderById(
          response.genderId,
        );
        temp['ageGroup'] = await this.getAgeGroupById(response.ageGroupId);
        responseList = [...responseList, { ...temp }];
      }
      responseCount += count;
    }
    return {
      responseList: responseList.slice(
        (pageIndex - 1) * pageLimit,
        pageIndex * pageLimit,
      ),
      responseCount,
      totalPageCount: Math.ceil(responseCount / 10),
    };
  }

  async getOutcomeSurveyResponsesList(
    // user: any,
    pageLimit: number,
    pageIndex: number,
    proposalId,
  ) {
    Logger.debug('StaticSurveyService.getOutcomeSurveyResponsesList');
    const outcomeSurveyForms = await this.outcomeSurveyFormModel
      .find({
        proposalId,
      })
      .exec();
    let responseList = [],
      responseCount = 0;
    for (const outcomeSurvey of outcomeSurveyForms) {
      const responses = await this.outcomeSurveyResponseModel
        .find({ outcomeSurveyFormId: outcomeSurvey._id })
        .exec();

      const count = await this.outcomeSurveyResponseModel
        .find({ outcomeSurveyFormId: outcomeSurvey._id })
        .count()
        .exec();

      for (const response of responses) {
        const temp = {};
        temp['language'] = outcomeSurvey.language;
        temp['email'] = response.email;
        temp['name'] = response.firstName + ' ' + response.lastName;
        temp['gender'] = await this.networkService.getGenderById(
          response.genderId,
        );
        temp['ageGroup'] = await this.getAgeGroupById(response.ageGroupId);
        temp['country'] = await this.networkService.getCountryById(
          response.countryId,
        );
        temp['typeOfInstitution'] =
          await this.networkService.getTypeOfInstituionById(
            response.institutionTypeId,
          );
        responseList = [...responseList, { ...temp }];
      }
      responseCount += count;
    }
    return {
      responseList: responseList.slice(
        (pageIndex - 1) * pageLimit,
        pageIndex * pageLimit,
      ),
      responseCount,
      totalPageCount: Math.ceil(responseCount / 10),
    };
  }
  // Activate or deactivate survey form links
  async activateOrDeactivateEntrySurveyLink(
    action: string,
    entrySurveyFormId: string,
    user: any,
  ) {
    Logger.debug('StaticSurveyService.activateOrDeactivateEntrySurveyLink');
    await this.getEntrySurveyFormData(entrySurveyFormId);
    if (action === 'Activate') {
      const entrySurveyForm = await this.entrySurveyFormModel
        .findOneAndUpdate(
          { entrySurveyFormId },
          { isActive: true, updatedBy: user._id },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Entry Survey Form - ${entrySurveyForm.formCode} activated`,
      );
      return entrySurveyForm;
    } else if (action === 'Deactivate') {
      const entrySurveyForm = await this.entrySurveyFormModel
        .findOneAndUpdate(
          { entrySurveyFormId },
          { isActive: false, closedAt: Date.now(), updatedBy: user._id },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Entry Survey Form - ${entrySurveyForm.formCode} deactivated`,
      );
      return entrySurveyForm;
    }
  }

  async activateOrDeactivateExitSurveyLink(
    action: string,
    exitSurveyFormId: string,
    user: any,
  ) {
    Logger.debug('StaticSurveyService.activateOrDeactivateExitSurveyLink');
    await this.getExitSurveyFormData(exitSurveyFormId);
    if (action === 'Activate') {
      const exitSurveyForm = await this.exitSurveyFormModel
        .findOneAndUpdate(
          { exitSurveyFormId },
          { isActive: true, updatedBy: user._id },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Exit Survey Form - ${exitSurveyForm.formCode} activated`,
      );
      return exitSurveyForm;
    } else if (action === 'Deactivate') {
      const exitSurveyForm = await this.exitSurveyFormModel
        .findOneAndUpdate(
          { exitSurveyFormId },
          { isActive: false, closedAt: Date.now(), updatedBy: user._id },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Exit Survey Form - ${exitSurveyForm.formCode} deactivated`,
      );
      return exitSurveyForm;
    }
  }

  async activateOrDeactivateOutcomeSurveyLink(
    action: string,
    outcomeSurveyFormId: string,
    user: any,
  ) {
    Logger.debug('StaticSurveyService.activateOrDeactivateOutcomeSurveyLink');
    await this.getOutcomeSurveyFormData(outcomeSurveyFormId);
    if (action === 'Activate') {
      const outcomeSurveyForm = await this.outcomeSurveyFormModel
        .findOneAndUpdate(
          { outcomeSurveyFormId },
          { isActive: true, updatedBy: user._id },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Outcome Survey Form - ${outcomeSurveyForm.formCode} activated`,
      );
      return outcomeSurveyForm;
    } else if (action === 'Deactivate') {
      const outcomeSurveyForm = await this.outcomeSurveyFormModel
        .findOneAndUpdate(
          { outcomeSurveyFormId },
          { isActive: false, closedAt: Date.now(), updatedBy: user._id },
          { new: true },
        )
        .exec();
      await this.melpService.addActivityLog(
        user,
        `Outcome Survey Form - ${outcomeSurveyForm.formCode} deactivated`,
      );
      return outcomeSurveyForm;
    }
  }

  // Download Survey Responses
  async workbookAndWorksheetCreation(formName: string, language: string) {
    Logger.debug('StaticSurveyService.downloadResponse');
    const workbook = new Workbook();
    const responseSheet = workbook.addWorksheet(`${formName} - ${language}`);
    return { responseSheet, workbook };
  }

  async getEntrySurveyResponseSheet(
    response,
    responseSheet,
    responseCount,
    entrySurveyForm,
  ) {
    Logger.debug('StaticSurveyService.getEntrySurveyResponseSheet');
    let objectiveValue = '',
      count = 1;
    for (const objective of response.courseObjectives) {
      if (objective.value) {
        if (count === 1) {
          objectiveValue += objective.key;
          count++;
        } else {
          objectiveValue += ', ' + objective.key;
        }
      }
    }
    objectiveValue += '.';

    responseSheet.getRow(responseCount).values = {
      year: entrySurveyForm.year,
      activityCode: entrySurveyForm.activityCode,
      activityName: entrySurveyForm.activityName,
      language: entrySurveyForm.language,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      gender: await this.networkService.getGenderById(response.genderId),
      ageGroup: await this.getAgeGroupById(response.ageGroupId),
      region: await this.networkService.getRegionById(response.regionId),
      country: await this.networkService.getCountryById(response.countryId),
      scopeOfWork: await this.getScopeOfWorkById(response.scopeOfWorkId),
      typeOfInstitution: await this.networkService.getTypeOfInstituionById(
        response.institutionTypeId,
      ),
      organisationName: response.orgainsationName,
      typeOfInfluence: response.influenceType,
      networkName:
        response.networkId === null
          ? 'NA'
          : await this.networkService.getNetworkNameById(response.networkId),
      knowledgeRating: response.knowledgeRating,
      courseObjectives: objectiveValue,
      mainMotivation: response.mainMotivation,
    };
  }

  async getExitSurveyResponseSheet(
    response,
    responseSheet,
    responseCount,
    exitSurveyForm,
  ) {
    Logger.debug('StaticSurveyService.getExitSurveyResponseSheet');
    responseSheet.getRow(responseCount).values = {
      year: exitSurveyForm.year,
      activityCode: exitSurveyForm.activityCode,
      activityName: exitSurveyForm.activityName,
      language: exitSurveyForm.language,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      gender: await this.networkService.getGenderById(response.genderId),
      ageGroup: await this.getAgeGroupById(response.ageGroupId),
      activityCompletedInEntirety: response.activityCompletedInEntirety,
      beneficiality: response.beneficiality,
      relevance: response.relevance,
      expectations: response.expectations,
      degreeOfKnowledge: response.degreeOfKnowledge,
      applicationOfKnowledge: response.applicationOfKnowledge,
      valuableConcept: response.valuableConcept,
      topicsInGreaterDepth: response.topicsInGreaterDepth,
      interactionWithFellowParticipants:
        response.interactionWithFellowParticipants,
      feedback: response.feedback,
    };
  }

  async getOutcomeSurveyResponseSheet(
    response,
    responseSheet,
    responseCount,
    outcomeSurveyForm,
  ) {
    Logger.debug('StaticSurveyService.getOutcomeSurveyResponseSheet');
    let knowledgeSharingValue = '',
      count = 1;
    for (const knowledgeSharing of response.knowledgeSharing) {
      if (knowledgeSharing.value) {
        if (count === 1) {
          knowledgeSharingValue += knowledgeSharing.key;
          count++;
        } else {
          knowledgeSharingValue += ', ' + knowledgeSharing.key;
        }
      }
    }
    knowledgeSharingValue += '.';
    responseSheet.getRow(responseCount).values = {
      year: outcomeSurveyForm.year,
      activityCode: outcomeSurveyForm.activityCode,
      activityName: outcomeSurveyForm.activityName,
      language: outcomeSurveyForm.language,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      gender: await this.networkService.getGenderById(response.genderId),
      ageGroup: await this.getAgeGroupById(response.ageGroupId),
      country: await this.networkService.getCountryById(response.countryId),
      typeOfInstitution: await this.networkService.getTypeOfInstituionById(
        response.institutionTypeId,
      ),
      orgainsation: response.orgainsation,
      knowledgeSharing: knowledgeSharingValue,
      knowledgeApplication: response.knowledgeApplication,
      explaination: response.knowledgeApplicationExplaination,
      isRelevantChange: response.isRelevantChange ? 'Yes' : 'No',
      elaborateChange: response.elaborateChange,
      typeOfInstitutionInvolved: response.typeOfInstitutionInvolved,
      locationOfChange: response.locationOfChange,
      isStoryOfChange: response.isStoryOfChange ? 'Yes' : 'No',
      comments: response.comments,
    };
  }

  async addColumnAndRowForEntrySurvey(responseSheet: Worksheet) {
    Logger.debug('StaticSurveyService.addColumnAndRowForEntrySurvey');
    responseSheet.columns = [
      { header: 'Year', key: 'year', width: 20 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 40 },
      { header: 'Language', key: 'language', width: 20 },
      { header: 'Email', key: 'email', width: 40 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Gender', key: 'gender', width: 20 },
      { header: 'Age Group', key: 'ageGroup', width: 20 },
      { header: 'Region', key: 'region', width: 20 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'Scope Of Work', key: 'scopeOfWork', width: 20 },
      { header: 'Type Of Institution', key: 'typeOfInstitution', width: 30 },
      { header: 'Organisation Name', key: 'organisationName', width: 20 },
      { header: 'Type Of Influence', key: 'typeOfInfluence', width: 20 },
      { header: 'Network Name', key: 'networkName', width: 20 },
      { header: 'Knowledge Rating', key: 'knowledgeRating', width: 20 },
      { header: 'Course Objectives', key: 'courseObjectives', width: 20 },
      { header: 'Main Motivation', key: 'mainMotivation', width: 40 },
    ];

    responseSheet.addRow({
      year: 'Year',
      activityCode: 'Activity Code',
      activityName: 'Activity Name',
      language: 'Language',
      email: 'Email',
      firstName: 'First Name',
      lastName: 'Last Name',
      gender: 'Gender',
      ageGroup: 'Age Group',
      region: 'Region',
      country: 'Country',
      scopeOfWork: 'Scope Of Work',
      typeOfInstitution: 'Type Of Institution',
      organisationName: 'Organisation Name',
      typeOfInfluence: 'Type Of Influence',
      networkName: 'Network Name',
      knowledgeRating: 'Knowledge Rating',
      courseObjectives: 'Course Objectives',
      mainMotivation: 'Main Motivation',
    });

    responseSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async addColumnAndRowForExitSurvey(responseSheet: Worksheet) {
    Logger.debug('StaticSurveyService.addColumnAndRowForExitSurvey');
    responseSheet.columns = [
      { header: 'Year', key: 'year', width: 20 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 40 },
      { header: 'Language', key: 'language', width: 20 },
      { header: 'Email', key: 'email', width: 40 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Gender', key: 'gender', width: 20 },
      { header: 'Age Group', key: 'ageGroup', width: 20 },
      {
        header: 'Activity Completed In Entirety',
        key: 'activityCompletedInEntirety',
        width: 20,
      },
      { header: 'Beneficiality', key: 'beneficiality', width: 20 },
      { header: 'Relevance', key: 'relevance', width: 20 },
      { header: 'Expectations', key: 'expectations', width: 30 },
      { header: 'Degree Of Knowledge', key: 'degreeOfKnowledge', width: 20 },
      {
        header: 'Application Of Knowledge',
        key: 'applicationOfKnowledge',
        width: 20,
      },
      { header: 'Valuable Concept', key: 'valuableConcept', width: 20 },
      {
        header: 'Topics In Greater Depth',
        key: 'topicsInGreaterDepth',
        width: 20,
      },
      {
        header: 'Interaction With Fellow Participants',
        key: 'interactionWithFellowParticipants',
        width: 40,
      },
      { header: 'Feedback', key: 'feedback', width: 40 },
    ];

    responseSheet.addRow({
      year: 'Year',
      activityCode: 'Activity Code',
      activityName: 'Activity Name',
      language: 'Language',
      email: 'Email',
      firstName: 'First Name',
      lastName: 'Last Name',
      gender: 'Gender',
      ageGroup: 'Age Group',
      activityCompletedInEntirety: 'Activity Completed In Entirety',
      beneficiality: 'Beneficiality',
      relevance: 'Relevance',
      expectations: 'Expectations',
      degreeOfKnowledge: 'Degree Of Knowledge',
      applicationOfKnowledge: 'Application Of Knowledge',
      valuableConcept: 'Valuable Concept',
      topicsInGreaterDepth: 'Topics In Greater Depth',
      interactionWithFellowParticipants: 'Interaction With Fellow Participants',
      feedback: 'Feedback',
    });

    responseSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async addColumnAndRowForOutcomeSurvey(responseSheet: Worksheet) {
    Logger.debug('StaticSurveyService.addColumnAndRowForOutcomeSurvey');
    responseSheet.columns = [
      { header: 'Year', key: 'year', width: 20 },
      { header: 'Activity Code', key: 'activityCode', width: 20 },
      { header: 'Activity Name', key: 'activityName', width: 40 },
      { header: 'Language', key: 'language', width: 20 },
      { header: 'Email', key: 'email', width: 40 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Gender', key: 'gender', width: 20 },
      { header: 'Age Group', key: 'ageGroup', width: 20 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'Type Of Institution', key: 'typeOfInstitution', width: 30 },
      { header: 'Organisation', key: 'orgainsation', width: 20 },
      { header: 'Knowledge Sharing', key: 'knowledgeSharing', width: 30 },
      {
        header: 'Knowledge Application',
        key: 'knowledgeApplication',
        width: 30,
      },
      { header: 'Explaination', key: 'explaination', width: 30 },
      { header: 'Is Relevant Change', key: 'isRelevantChange', width: 20 },
      { header: 'Change Elaboration', key: 'elaborateChange', width: 20 },
      {
        header: 'Type Of Institution Involved',
        key: 'typeOfInstitutionInvolved',
        width: 20,
      },
      { header: 'Location Of Change', key: 'locationOfChange', width: 20 },
      { header: 'Is Story Of Change', key: 'isStoryOfChange', width: 20 },
      { header: 'Additional Comments', key: 'comments', width: 20 },
    ];

    responseSheet.addRow({
      year: 'Year',
      activityCode: 'Activity Code',
      activityName: 'Activity Name',
      language: 'Language',
      email: 'Email',
      firstName: 'First Name',
      lastName: 'Last Name',
      gender: 'Gender',
      ageGroup: 'Age Group',
      country: 'Country',
      typeOfInstitution: 'Type Of Institution',
      orgainsation: 'Organisation',
      knowledgeSharing: 'Knowledge Sharing',
      knowledgeApplication: 'Knowledge Application',
      explaination: 'Explaination',
      isRelevantChange: 'Is Relevant Change',
      elaborateChange: 'Change Elaboration',
      typeOfInstitutionInvolved: 'Type Of Institution Involved',
      locationOfChange: 'Location Of Change',
      isStoryOfChange: 'Is Story Of Change',
      comments: 'Additional Comments',
    });
    responseSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async downloadEntrySurveyResponses(res, entrySurveyFormId: string) {
    Logger.debug('StaticSurveyService.downloadEntrySurveyResponses');
    const entrySurveyForm = await this.getEntrySurveyFormData(
      entrySurveyFormId,
    );
    const { responseSheet, workbook } = await this.workbookAndWorksheetCreation(
      'Entry Survey',
      entrySurveyForm.language,
    );

    await this.addColumnAndRowForEntrySurvey(responseSheet);
    let responseCount = 2;
    const responses = await this.entrySurveyResponseModel
      .find({ entrySurveyFormId: entrySurveyForm._id })
      .exec();

    for (const response of responses) {
      await this.getEntrySurveyResponseSheet(
        response,
        responseSheet,
        responseCount,
        entrySurveyForm,
      );
      responseCount++;
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition': 'attachment; filename=EntrySurveyResponse.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    await workbook.xlsx.write(res);
  }

  async downloadExitSurveyResponses(res, exitSurveyFormId: string) {
    Logger.debug('StaticSurveyService.downloadExitSurveyResponses');
    const exitSurveyForm = await this.getExitSurveyFormData(exitSurveyFormId);
    const { responseSheet, workbook } = await this.workbookAndWorksheetCreation(
      'Exit Survey',
      exitSurveyForm.language,
    );
    let responseCount = 2;
    await this.addColumnAndRowForExitSurvey(responseSheet);

    const responses = await this.exitSurveyResponseModel
      .find({ exitSurveyFormId: exitSurveyForm._id })
      .exec();

    for (const response of responses) {
      await this.getExitSurveyResponseSheet(
        response,
        responseSheet,
        responseCount,
        exitSurveyForm,
      );
      responseCount++;
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition': 'attachment; filename=ExitSurveyResponse.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async downloadOutcomeSurveyResponses(res, outcomeSurveyFormId: string) {
    Logger.debug('StaticSurveyService.downloadOutcomeSurveyResponses');
    const outcomeSurveyForm = await this.getOutcomeSurveyFormData(
      outcomeSurveyFormId,
    );
    const { responseSheet, workbook } = await this.workbookAndWorksheetCreation(
      'Outcome Survey',
      outcomeSurveyForm.language,
    );
    let responseCount = 2;
    await this.addColumnAndRowForOutcomeSurvey(responseSheet);

    const responses = await this.outcomeSurveyResponseModel
      .find({ outcomeSurveyFormId: outcomeSurveyForm._id })
      .exec();

    for (const response of responses) {
      await this.getOutcomeSurveyResponseSheet(
        response,
        responseSheet,
        responseCount,
        outcomeSurveyForm,
      );
      responseCount++;
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition': 'attachment; filename=OutcomeSurveyResponse.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async downloadEntrySurveyResponsesByProposalId(res, proposalId) {
    Logger.debug(
      'StaticSurveyService.downloadEntrySurveyResponsesByProposalId',
    );
    const entrySurveyForms = await this.entrySurveyFormModel
      .find({ proposalId })
      .exec();

    const workbook = new Workbook();
    const responseSheet = workbook.addWorksheet(`Entry Survey Responses`);
    await this.addColumnAndRowForEntrySurvey(responseSheet);
    let responseCount = 2;
    for (const entrySurveyForm of entrySurveyForms) {
      const responses = await this.entrySurveyResponseModel
        .find({ entrySurveyFormId: entrySurveyForm._id })
        .exec();

      for (const response of responses) {
        await this.getEntrySurveyResponseSheet(
          response,
          responseSheet,
          responseCount,
          entrySurveyForm,
        );
        responseCount++;
      }
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition': 'attachment; filename=EntrySurveyResponses.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async downloadExitSurveyResponsesByProposalId(res, proposalId) {
    Logger.debug('StaticSurveyService.downloadExitSurveyResponsesByProposalId');
    const exitSurveyForms = await this.exitSurveyFormModel
      .find({ proposalId })
      .exec();

    const workbook = new Workbook();
    const responseSheet = workbook.addWorksheet(`Exit Survey Responses`);
    let responseCount = 2;
    await this.addColumnAndRowForExitSurvey(responseSheet);
    for (const exitSurveyForm of exitSurveyForms) {
      const responses = await this.exitSurveyResponseModel
        .find({ exitSurveyFormId: exitSurveyForm._id })
        .exec();

      for (const response of responses) {
        await this.getExitSurveyResponseSheet(
          response,
          responseSheet,
          responseCount,
          exitSurveyForm,
        );
        responseCount++;
      }
    }
    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition': 'attachment; filename=ExitSurveyResponses.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  async downloadOutcomeSurveyResponsesByProposalId(res, proposalId) {
    Logger.debug(
      'StaticSurveyService.downloadOutcomeSurveyResponsesByProposalId',
    );
    const outcomeSurveyForms = await this.outcomeSurveyFormModel
      .find({ proposalId })
      .exec();

    const workbook = new Workbook();
    const responseSheet = workbook.addWorksheet(`Outcome Survey Responses`);
    responseSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    let responseCount = 2;
    await this.addColumnAndRowForOutcomeSurvey(responseSheet);
    for (const outcomeSurveyForm of outcomeSurveyForms) {
      const responses = await this.outcomeSurveyResponseModel
        .find({ outcomeSurveyFormId: outcomeSurveyForm._id })
        .exec();

      for (const response of responses) {
        await this.getOutcomeSurveyResponseSheet(
          response,
          responseSheet,
          responseCount,
          outcomeSurveyForm,
        );
        responseCount++;
      }
    }

    res.set({
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition': 'attachment; filename=OutcomeSurveyResponses.xlsx',
    });
    res.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    await workbook.xlsx.write(res);
  }

  // API For Dashboard
  async getNumberOfResponsesForAllSurveys(year: number, user: any) {
    Logger.debug('StaticSurveyService.getNumberOfResponsesForAllSurveys');
    let entrySurveyResponseCount = 0,
      exitSurveyResponseCount = 0,
      outcomeSurveyResponseCount = 0;
    let entrySurveyFormList, exitSurveyFormList, outcomeSurveyFormList;
    if (user.networkId === null && user.partnerId === null) {
      entrySurveyFormList = await this.entrySurveyFormModel
        .find({ year })
        .exec();
      exitSurveyFormList = await this.exitSurveyFormModel.find({ year }).exec();
      outcomeSurveyFormList = await this.outcomeSurveyFormModel
        .find({ year })
        .exec();
    } else {
      entrySurveyFormList = await this.entrySurveyFormModel
        .find({ networkId: user.networkId, partnerId: user.partnerId, year })
        .exec();
      exitSurveyFormList = await this.exitSurveyFormModel
        .find({ networkId: user.networkId, partnerId: user.partnerId, year })
        .exec();
      outcomeSurveyFormList = await this.outcomeSurveyFormModel
        .find({ networkId: user.networkId, partnerId: user.partnerId, year })
        .exec();
    }
    for (const entrySurveyForm of entrySurveyFormList) {
      entrySurveyResponseCount += await this.entrySurveyResponseModel
        .find({ entrySurveyFormId: entrySurveyForm._id })
        .count()
        .exec();
    }

    for (const exitSurveyForm of exitSurveyFormList) {
      exitSurveyResponseCount += await this.exitSurveyResponseModel
        .find({ exitSurveyFormId: exitSurveyForm._id })
        .count()
        .exec();
    }

    for (const outcomeSurveyForm of outcomeSurveyFormList) {
      outcomeSurveyResponseCount += await this.outcomeSurveyResponseModel
        .find({ outcomeSurveyFormId: outcomeSurveyForm._id })
        .count()
        .exec();
    }
    return {
      entrySurveyResponseCount,
      exitSurveyResponseCount,
      outcomeSurveyResponseCount,
    };
  }

  // Count API's for Outcome Report from OutcomeSurvey

  async getGenderIds() {
    Logger.debug('StaticSurveyService.getGenderIds');
    const manId = await this.getGenderIdByValue(GenderEnum.MAN);
    const womanId = await this.getGenderIdByValue(GenderEnum.WOMAN);
    const otherId = await this.getGenderIdByValue(GenderEnum.OTHER);
    const notSayId = await this.getGenderIdByValue(GenderEnum.NOTSAY);
    return { manId, womanId, otherId, notSayId };
  }

  async getGenderCountForOutcomeSurvey(proposalId) {
    Logger.debug('StaticSurveyService.getGenderCountForOutcomeSurvey');
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const { manId, womanId, otherId, notSayId } = await this.getGenderIds();
    const manCount = await this.outcomeSurveyResponseModel
      .find({ outcomeSurveyFormId, genderId: manId })
      .count()
      .exec();
    const womanCount = await this.outcomeSurveyResponseModel
      .find({ outcomeSurveyFormId, genderId: womanId })
      .count()
      .exec();
    const otherCount = await this.outcomeSurveyResponseModel
      .find({ outcomeSurveyFormId, genderId: otherId })
      .count()
      .exec();
    const notSayCount = await this.outcomeSurveyResponseModel
      .find({ outcomeSurveyFormId, genderId: notSayId })
      .count()
      .exec();
    const sum = manCount + womanCount + otherCount + notSayCount;
    // }
    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      sum,
    };
  }

  async getGenderCountForOutcomeSurveysRelevantInstitution(proposalId) {
    Logger.debug(
      'StaticSurveyService.getGenderCountForOutcomeSurveysRelevantInstitution',
    );
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const { manId, womanId, otherId, notSayId } = await this.getGenderIds();
    const manCount = await this.outcomeSurveyResponseModel
      .find({ outcomeSurveyFormId, genderId: manId, isRelevantChange: true })
      .count()
      .exec();
    const womanCount = await this.outcomeSurveyResponseModel
      .find({ outcomeSurveyFormId, genderId: womanId, isRelevantChange: true })
      .count()
      .exec();
    const otherCount = await this.outcomeSurveyResponseModel
      .find({ outcomeSurveyFormId, genderId: otherId, isRelevantChange: true })
      .count()
      .exec();
    const notSayCount = await this.outcomeSurveyResponseModel
      .find({ outcomeSurveyFormId, genderId: notSayId, isRelevantChange: true })
      .count()
      .exec();
    const sum = manCount + womanCount + otherCount + notSayCount;

    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      sum,
    };
  }

  async getGenderCountForOutcomeSurveysRaisingAwareness(proposalId) {
    Logger.debug(
      'StaticSurveyService.getGenderCountForOutcomeSurveysRaisingAwareness',
    );
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const { manId, womanId, otherId, notSayId } = await this.getGenderIds();
    const manCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: manId,
        knowledgeApplication: KnowledgeApplicationEnum.AWARENESS,
      })
      .count()
      .exec();
    const womanCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: womanId,
        knowledgeApplication: KnowledgeApplicationEnum.AWARENESS,
      })
      .count()
      .exec();
    const otherCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: otherId,
        knowledgeApplication: KnowledgeApplicationEnum.AWARENESS,
      })
      .count()
      .exec();
    const notSayCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: notSayId,
        knowledgeApplication: KnowledgeApplicationEnum.AWARENESS,
      })
      .count()
      .exec();
    const sum = manCount + womanCount + otherCount + notSayCount;

    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      sum,
    };
  }

  async getGenderCountForOutcomeSurveysRoutine(proposalId) {
    Logger.debug('StaticSurveyService.getGenderCountForOutcomeSurveysRoutine');
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const { manId, womanId, otherId, notSayId } = await this.getGenderIds();
    const manCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: manId,
        knowledgeApplication: KnowledgeApplicationEnum.ROUTINE,
      })
      .count()
      .exec();
    const womanCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: womanId,
        knowledgeApplication: KnowledgeApplicationEnum.ROUTINE,
      })
      .count()
      .exec();
    const otherCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: otherId,
        knowledgeApplication: KnowledgeApplicationEnum.ROUTINE,
      })
      .count()
      .exec();
    const notSayCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: notSayId,
        knowledgeApplication: KnowledgeApplicationEnum.ROUTINE,
      })
      .count()
      .exec();
    const sum = manCount + womanCount + otherCount + notSayCount;

    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      sum,
    };
  }

  async getGenderCountForOutcomeSurveysEducational(proposalId) {
    Logger.debug(
      'StaticSurveyService.getGenderCountForOutcomeSurveysEducational',
    );
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const { manId, womanId, otherId, notSayId } = await this.getGenderIds();
    const manCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: manId,
        knowledgeApplication: KnowledgeApplicationEnum.EDUCATIONAL,
      })
      .count()
      .exec();
    const womanCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: womanId,
        knowledgeApplication: KnowledgeApplicationEnum.EDUCATIONAL,
      })
      .count()
      .exec();
    const otherCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: otherId,
        knowledgeApplication: KnowledgeApplicationEnum.EDUCATIONAL,
      })
      .count()
      .exec();
    const notSayCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: notSayId,
        knowledgeApplication: KnowledgeApplicationEnum.EDUCATIONAL,
      })
      .count()
      .exec();
    const sum = manCount + womanCount + otherCount + notSayCount;

    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      sum,
    };
  }

  async getGenderCountForOutcomeSurveysImplementations(proposalId) {
    Logger.debug(
      'StaticSurveyService.getGenderCountForOutcomeSurveysImplementations',
    );
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const { manId, womanId, otherId, notSayId } = await this.getGenderIds();
    const manCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: manId,
        knowledgeApplication: KnowledgeApplicationEnum.IMPLEMENTATIONS,
      })
      .count()
      .exec();
    const womanCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: womanId,
        knowledgeApplication: KnowledgeApplicationEnum.IMPLEMENTATIONS,
      })
      .count()
      .exec();
    const otherCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: otherId,
        knowledgeApplication: KnowledgeApplicationEnum.IMPLEMENTATIONS,
      })
      .count()
      .exec();
    const notSayCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: notSayId,
        knowledgeApplication: KnowledgeApplicationEnum.IMPLEMENTATIONS,
      })
      .count()
      .exec();
    const sum = manCount + womanCount + otherCount + notSayCount;

    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      sum,
    };
  }

  async getGenderCountForOutcomeSurveysInnovation(proposalId) {
    Logger.debug(
      'StaticSurveyService.getGenderCountForOutcomeSurveysInnovation',
    );
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const { manId, womanId, otherId, notSayId } = await this.getGenderIds();
    const manCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: manId,
        knowledgeApplication: KnowledgeApplicationEnum.INNOVATIONS,
      })
      .count()
      .exec();
    const womanCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: womanId,
        knowledgeApplication: KnowledgeApplicationEnum.INNOVATIONS,
      })
      .count()
      .exec();
    const otherCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: otherId,
        knowledgeApplication: KnowledgeApplicationEnum.INNOVATIONS,
      })
      .count()
      .exec();
    const notSayCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: notSayId,
        knowledgeApplication: KnowledgeApplicationEnum.INNOVATIONS,
      })
      .count()
      .exec();
    const sum = manCount + womanCount + otherCount + notSayCount;

    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      sum,
    };
  }

  async getGenderCountForOutcomeSurveysSDG(proposalId) {
    Logger.debug('StaticSurveyService.getGenderCountForOutcomeSurveysSDG');
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const { manId, womanId, otherId, notSayId } = await this.getGenderIds();

    const manCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: manId,
        knowledgeApplication: KnowledgeApplicationEnum.SDG,
      })
      .count()
      .exec();
    const womanCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: womanId,
        knowledgeApplication: KnowledgeApplicationEnum.SDG,
      })
      .count()
      .exec();
    const otherCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: otherId,
        knowledgeApplication: KnowledgeApplicationEnum.SDG,
      })
      .count()
      .exec();
    const notSayCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: notSayId,
        knowledgeApplication: KnowledgeApplicationEnum.SDG,
      })
      .count()
      .exec();
    const sum = manCount + womanCount + otherCount + notSayCount;

    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      sum,
    };
  }

  async getGenderCountForOutcomeSurveysPolicy(proposalId) {
    Logger.debug('StaticSurveyService.getGenderCountForOutcomeSurveysPolicy');
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const { manId, womanId, otherId, notSayId } = await this.getGenderIds();
    const manCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: manId,
        knowledgeApplication: KnowledgeApplicationEnum.POLICY,
      })
      .count()
      .exec();
    const womanCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: womanId,
        knowledgeApplication: KnowledgeApplicationEnum.POLICY,
      })
      .count()
      .exec();
    const otherCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: otherId,
        knowledgeApplication: KnowledgeApplicationEnum.POLICY,
      })
      .count()
      .exec();
    const notSayCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: notSayId,
        knowledgeApplication: KnowledgeApplicationEnum.POLICY,
      })
      .count()
      .exec();
    const sum = manCount + womanCount + otherCount + notSayCount;

    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      sum,
    };
  }

  async getGenderCountForOutcomeSurveysNotApplied(proposalId) {
    Logger.debug(
      'StaticSurveyService.getGenderCountForOutcomeSurveysNotApplied',
    );
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const { manId, womanId, otherId, notSayId } = await this.getGenderIds();

    const manCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: manId,
        knowledgeApplication: KnowledgeApplicationEnum.NOTAPPLIED,
      })
      .count()
      .exec();
    const womanCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: womanId,
        knowledgeApplication: KnowledgeApplicationEnum.NOTAPPLIED,
      })
      .count()
      .exec();
    const otherCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: otherId,
        knowledgeApplication: KnowledgeApplicationEnum.NOTAPPLIED,
      })
      .count()
      .exec();
    const notSayCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        genderId: notSayId,
        knowledgeApplication: KnowledgeApplicationEnum.NOTAPPLIED,
      })
      .count()
      .exec();
    const sum = manCount + womanCount + otherCount + notSayCount;

    return {
      manCount,
      womanCount,
      otherCount,
      notSayCount,
      sum,
    };
  }

  async getTypeOfInstitutionIds() {
    Logger.debug('StaticSurveyService.getTypeOfInstitutionIds');
    const govtId = await this.getInstitutionIdByValue(
      TypeOfInstitutionEnum.GOVT,
    );
    const unId = await this.getInstitutionIdByValue(TypeOfInstitutionEnum.UN);
    const ngotId = await this.getInstitutionIdByValue(
      TypeOfInstitutionEnum.NGO,
    );
    const academiatId = await this.getInstitutionIdByValue(
      TypeOfInstitutionEnum.ACADEMIA,
    );
    const riverId = await this.getInstitutionIdByValue(
      TypeOfInstitutionEnum.RIVER,
    );
    const utilityId = await this.getInstitutionIdByValue(
      TypeOfInstitutionEnum.UTILITY,
    );
    const privateId = await this.getInstitutionIdByValue(
      TypeOfInstitutionEnum.PRIVATE,
    );
    const independentId = await this.getInstitutionIdByValue(
      TypeOfInstitutionEnum.INDEPENDENT,
    );

    return {
      govtId,
      unId,
      ngotId,
      academiatId,
      riverId,
      utilityId,
      privateId,
      independentId,
    };
  }

  async getInstitutionTypeCountForOutcomeSurveysRelevantInstitution(
    proposalId,
  ) {
    Logger.debug(
      'StaticSurveyService.getInstitutionTypeCountForOutcomeSurveysRelevantInstitution',
    );
    const outcomeSurveyForm = await this.outcomeSurveyFormModel
      .findOne({ proposalId })
      .exec();
    const outcomeSurveyFormId = outcomeSurveyForm._id;
    const {
      govtId,
      unId,
      ngotId,
      academiatId,
      riverId,
      utilityId,
      privateId,
      independentId,
    } = await this.getTypeOfInstitutionIds();
    const govtCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        institutionTypeId: govtId,
        isRelevantChange: true,
      })
      .count()
      .exec();
    const unCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        institutionTypeId: unId,
        isRelevantChange: true,
      })
      .count()
      .exec();
    const ngoCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        institutionTypeId: ngotId,
        isRelevantChange: true,
      })
      .count()
      .exec();
    const academiaCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        institutionTypeId: academiatId,
        isRelevantChange: true,
      })
      .count()
      .exec();
    const riverCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        institutionTypeId: riverId,
        isRelevantChange: true,
      })
      .count()
      .exec();
    const utilityCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        institutionTypeId: utilityId,
        isRelevantChange: true,
      })
      .count()
      .exec();
    const privateCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        institutionTypeId: privateId,
        isRelevantChange: true,
      })
      .count()
      .exec();
    const independentCount = await this.outcomeSurveyResponseModel
      .find({
        outcomeSurveyFormId,
        institutionTypeId: independentId,
        isRelevantChange: true,
      })
      .count()
      .exec();
    const sum =
      govtCount +
      unCount +
      ngoCount +
      academiaCount +
      riverCount +
      utilityCount +
      privateCount +
      independentCount;

    return {
      govtCount,
      unCount,
      ngoCount,
      academiaCount,
      riverCount,
      utilityCount,
      privateCount,
      independentCount,
      sum,
    };
  }

  // Count API's for Output-Report
  // Gender wise participant enrolled count
  async getParticipantsEnrolledGenderWiseCount(proposalId, user: any) {
    try {
      Logger.debug(
        'StaticSurveyService.getParticipantsEnrolledGenderWiseCount',
      );
      // check if activity with activityId exists or not
      // activityExists = await
      const entrySurveyFormList = await this.entrySurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
      const { manId, womanId, otherId, notSayId } = await this.getGenderIds();

      let manCount = 0,
        womanCount = 0,
        otherCount = 0,
        notSayCount = 0;

      for (const entrySurveyForm of entrySurveyFormList) {
        const entrySurveyFormId = entrySurveyForm._id;
        manCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, genderId: manId })
          .count()
          .exec();
        womanCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, genderId: womanId })
          .count()
          .exec();
        otherCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, genderId: otherId })
          .count()
          .exec();
        notSayCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, genderId: notSayId })
          .count()
          .exec();
      }
      const sum = manCount + womanCount + otherCount + notSayCount;

      return {
        manCount,
        womanCount,
        otherCount,
        notSayCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Gender wise activity completed count
  async getParticipantsCompletedActivityGenderWiseCount(proposalId, user: any) {
    try {
      Logger.debug(
        'StaticSurveyService.getParticipantsCompletedActivityGenderWiseCount',
      );
      // check if activity with activityId exists or not
      // activityExists = await
      const exitSurveyFormList = await this.exitSurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
      const { manId, womanId, otherId, notSayId } = await this.getGenderIds();

      let manCount = 0,
        womanCount = 0,
        otherCount = 0,
        notSayCount = 0;

      for (const exitSurveyForm of exitSurveyFormList) {
        const exitSurveyFormId = exitSurveyForm._id;
        manCount += await this.exitSurveyResponseModel
          .find({ exitSurveyFormId, genderId: manId })
          .count()
          .exec();
        womanCount += await this.exitSurveyResponseModel
          .find({ exitSurveyFormId, genderId: womanId })
          .count()
          .exec();
        otherCount += await this.exitSurveyResponseModel
          .find({ exitSurveyFormId, genderId: otherId })
          .count()
          .exec();
        notSayCount += await this.exitSurveyResponseModel
          .find({ exitSurveyFormId, genderId: notSayId })
          .count()
          .exec();
      }
      const sum = manCount + womanCount + otherCount + notSayCount;

      return {
        manCount,
        womanCount,
        otherCount,
        notSayCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Age-group wise count of participants
  async getParticipantCountByAgeGroup(proposalId, user: any) {
    try {
      Logger.debug('StaticSurveyService.getParticipantCountByAgeGroup');
      // check if activity with activityId exists or not
      // activityExists = await
      const entrySurveyFormList = await this.entrySurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
      const under18Id = await this.getAgeGroupIdByValue(AgeGroupEnum.UNDER18);
      const under25Id = await this.getAgeGroupIdByValue(AgeGroupEnum.UNDER25);
      const under65Id = await this.getAgeGroupIdByValue(AgeGroupEnum.UNDER65);
      const over66Id = await this.getAgeGroupIdByValue(AgeGroupEnum.OVER66);

      let under18Count = 0,
        under25Count = 0,
        under65Count = 0,
        over66Count = 0;

      for (const entrySurveyForm of entrySurveyFormList) {
        const entrySurveyFormId = entrySurveyForm._id;
        under18Count += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, ageGroupId: under18Id })
          .count()
          .exec();
        under25Count += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, ageGroupId: under25Id })
          .count()
          .exec();
        under65Count += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, ageGroupId: under65Id })
          .count()
          .exec();
        over66Count += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, ageGroupId: over66Id })
          .count()
          .exec();
      }
      const sum = under18Count + under25Count + under65Count + over66Count;

      return {
        under18Count,
        under25Count,
        under65Count,
        over66Count,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Region wise count of participants
  async getParticipantCountByRegion(proposalId, user: any) {
    try {
      Logger.debug('StaticSurveyService.getParticipantCountByRegion');
      // check if activity with activityId exists or not
      // activityExists = await
      const entrySurveyFormList = await this.entrySurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
      const asiaRegionId = await this.getRegionIdByValue(RegionEnum.ASIA);
      const americaRegionId = await this.getRegionIdByValue(RegionEnum.AMERICA);
      const africaRegionId = await this.getRegionIdByValue(RegionEnum.AFRICA);
      const arabRegionId = await this.getRegionIdByValue(RegionEnum.ARAB);
      const eurapeRegionId = await this.getRegionIdByValue(RegionEnum.EUROPE);

      let asiaRegionCount = 0,
        americaRegionCount = 0,
        africaRegionCount = 0,
        arabRegionCount = 0,
        europeRegionCount = 0;

      for (const entrySurveyForm of entrySurveyFormList) {
        const entrySurveyFormId = entrySurveyForm._id;
        asiaRegionCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, regionId: asiaRegionId })
          .count()
          .exec();
        americaRegionCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, regionId: americaRegionId })
          .count()
          .exec();
        africaRegionCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, regionId: africaRegionId })
          .count()
          .exec();
        arabRegionCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, regionId: arabRegionId })
          .count()
          .exec();
        europeRegionCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, regionId: eurapeRegionId })
          .count()
          .exec();
      }
      const sum =
        asiaRegionCount +
        americaRegionCount +
        africaRegionCount +
        arabRegionCount +
        europeRegionCount;

      return {
        asiaRegionCount,
        americaRegionCount,
        africaRegionCount,
        arabRegionCount,
        europeRegionCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Type of Institution wise count of participants
  async getParticipantCountByTypeOfInstitution(proposalId, user: any) {
    try {
      Logger.debug(
        'StaticSurveyService.getParticipantCountByTypeOfInstitution',
      );
      // check if activity with activityId exists or not
      // activityExists = await
      const entrySurveyFormList = await this.entrySurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();

      const {
        govtId,
        unId,
        ngotId,
        academiatId,
        riverId,
        utilityId,
        privateId,
        independentId,
      } = await this.getTypeOfInstitutionIds();
      let govtCount = 0,
        unCount = 0,
        ngoCount = 0,
        academiaCount = 0,
        riverCount = 0,
        utilityCount = 0,
        privateCount = 0,
        independentCount = 0;

      for (const entrySurveyForm of entrySurveyFormList) {
        const entrySurveyFormId = entrySurveyForm._id;
        govtCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, institutionTypeId: govtId })
          .count()
          .exec();
        unCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, institutionTypeId: unId })
          .count()
          .exec();
        ngoCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, institutionTypeId: ngotId })
          .count()
          .exec();
        academiaCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, institutionTypeId: academiatId })
          .count()
          .exec();
        riverCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, institutionTypeId: riverId })
          .count()
          .exec();
        utilityCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, institutionTypeId: utilityId })
          .count()
          .exec();
        privateCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, institutionTypeId: privateId })
          .count()
          .exec();
        independentCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, institutionTypeId: independentId })
          .count()
          .exec();
      }
      const sum =
        govtCount +
        unCount +
        ngoCount +
        academiaCount +
        riverCount +
        utilityCount +
        privateCount +
        independentCount;

      return {
        govtCount,
        unCount,
        ngoCount,
        academiaCount,
        riverCount,
        utilityCount,
        privateCount,
        independentCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Count of participants that are member of network
  async getCapnetAffiliationCount(proposalId, user: any) {
    try {
      Logger.debug('StaticSurveyService.getCapnetAffiliationCount');
      // check if activity with activityId exists or not
      // activityExists = await
      const entrySurveyFormList = await this.entrySurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();

      let capnetAffiliationCount = 0;
      for (const entrySurveyForm of entrySurveyFormList) {
        const entrySurveyFormId = entrySurveyForm._id;
        capnetAffiliationCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, networkId: { $ne: null } })
          .count()
          .exec();
      }
      return {
        capnetAffiliationCount,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Knowledge Rating wise count of participants - Entry Survey
  async getParticipantCountBeforeKnowledgeRating(proposalId, user: any) {
    try {
      Logger.debug(
        'StaticSurveyService.getParticipantCountBeforeKnowledgeRating',
      );
      // check if activity with activityId exists or not
      // activityExists = await
      const entrySurveyFormList = await this.entrySurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();

      let highCount = 0,
        lowCount = 0,
        mediumCount = 0,
        noneCount = 0;
      for (const entrySurveyForm of entrySurveyFormList) {
        const entrySurveyFormId = entrySurveyForm._id;
        highCount += await this.entrySurveyResponseModel
          .find({
            entrySurveyFormId,
            knowledgeRating: KnowledgeRatingEnum.HIGH,
          })
          .count()
          .exec();
        lowCount += await this.entrySurveyResponseModel
          .find({ entrySurveyFormId, knowledgeRating: KnowledgeRatingEnum.LOW })
          .count()
          .exec();
        mediumCount += await this.entrySurveyResponseModel
          .find({
            entrySurveyFormId,
            knowledgeRating: KnowledgeRatingEnum.MEDIUM,
          })
          .count()
          .exec();
        noneCount += await this.entrySurveyResponseModel
          .find({
            entrySurveyFormId,
            knowledgeRating: KnowledgeRatingEnum.NONE,
          })
          .count()
          .exec();
      }
      const sum = highCount + lowCount + mediumCount + noneCount;

      return {
        highCount,
        lowCount,
        mediumCount,
        noneCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // DegreeOfKnowledge wise count of participants - Exit Survey
  async getParticipantCountAfterDegreeOfKnowledge(proposalId, user: any) {
    try {
      Logger.debug(
        'StaticSurveyService.getParticipantCountAfterDegreeOfKnowledge',
      );
      // check if activity with activityId exists or not
      // activityExists = await
      const exitSurveyFormList = await this.exitSurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();

      let highCount = 0,
        lowCount = 0,
        mediumCount = 0,
        noneCount = 0,
        veryhighCount = 0;
      for (const exitSurveyForm of exitSurveyFormList) {
        const exitSurveyFormId = exitSurveyForm._id;
        veryhighCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            degreeOfKnowledge: DegreeOfNewKnowledgeEnum.VERYHIGH,
          })
          .count()
          .exec();
        highCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            degreeOfKnowledge: DegreeOfNewKnowledgeEnum.HIGH,
          })
          .count()
          .exec();
        lowCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            degreeOfKnowledge: DegreeOfNewKnowledgeEnum.LOW,
          })
          .count()
          .exec();
        mediumCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            degreeOfKnowledge: DegreeOfNewKnowledgeEnum.MEDIUM,
          })
          .count()
          .exec();
        noneCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            degreeOfKnowledge: DegreeOfNewKnowledgeEnum.NONE,
          })
          .count()
          .exec();
      }
      const sum =
        veryhighCount + highCount + lowCount + mediumCount + noneCount;

      return {
        veryhighCount,
        highCount,
        lowCount,
        mediumCount,
        noneCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Beneficiality wise count of participants - Exit Survey
  async getParticipantCountByBeneficiality(proposalId, user: any) {
    try {
      Logger.debug('StaticSurveyService.getParticipantCountByBeneficiality');
      // check if activity with activityId exists or not
      // activityExists = await
      const exitSurveyFormList = await this.exitSurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();

      let beneficialCount = 0,
        notBeneficialCount = 0,
        somewhatBeneficialCount = 0;
      for (const exitSurveyForm of exitSurveyFormList) {
        const exitSurveyFormId = exitSurveyForm._id;
        beneficialCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            beneficiality: BenefitsLevelEnum.BENEFICIAL,
          })
          .count()
          .exec();
        notBeneficialCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            beneficiality: BenefitsLevelEnum.NOTBENEFICIAL,
          })
          .count()
          .exec();
        somewhatBeneficialCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            beneficiality: BenefitsLevelEnum.SOMEWHATBENEFICIAL,
          })
          .count()
          .exec();
      }
      const sum =
        beneficialCount + notBeneficialCount + somewhatBeneficialCount;

      return {
        beneficialCount,
        notBeneficialCount,
        somewhatBeneficialCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // Relevance wise count of participants - Exit Survey
  async getParticipantCountByRelevance(proposalId, user: any) {
    try {
      Logger.debug('StaticSurveyService.getParticipantCountByRelevance');
      // check if activity with activityId exists or not
      // activityExists = await
      const exitSurveyFormList = await this.exitSurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();

      let notRelevantCount = 0,
        relevantCount = 0,
        extremelyRelevant = 0,
        slightlyRelevant = 0;
      for (const exitSurveyForm of exitSurveyFormList) {
        const exitSurveyFormId = exitSurveyForm._id;
        notRelevantCount += await this.exitSurveyResponseModel
          .find({ exitSurveyFormId, relevance: RelevanceLevelEnum.NOTRELEVANT })
          .count()
          .exec();
        relevantCount += await this.exitSurveyResponseModel
          .find({ exitSurveyFormId, relevance: RelevanceLevelEnum.RELEVANT })
          .count()
          .exec();
        extremelyRelevant += await this.exitSurveyResponseModel
          .find({ exitSurveyFormId, relevance: RelevanceLevelEnum.EXTREME })
          .count()
          .exec();
        slightlyRelevant += await this.exitSurveyResponseModel
          .find({ exitSurveyFormId, relevance: RelevanceLevelEnum.SLIGHTLY })
          .count()
          .exec();
      }
      const sum =
        notRelevantCount + relevantCount + extremelyRelevant + slightlyRelevant;

      return {
        notRelevantCount,
        relevantCount,
        extremelyRelevant,
        slightlyRelevant,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // ExpectationLevel wise count of participants - Exit Survey
  async getParticipantCountByExpectationLevel(proposalId, user: any) {
    try {
      Logger.debug('StaticSurveyService.getParticipantCountByExpectationLevel');
      // check if activity with activityId exists or not
      // activityExists = await
      const exitSurveyFormList = await this.exitSurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();

      let notMetCount = 0,
        partialCount = 0,
        fullCount = 0,
        exceededCount = 0;
      for (const exitSurveyForm of exitSurveyFormList) {
        const exitSurveyFormId = exitSurveyForm._id;
        notMetCount += await this.exitSurveyResponseModel
          .find({ exitSurveyFormId, expectations: ExpectationLevelEnum.NOTMET })
          .count()
          .exec();
        partialCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            expectations: ExpectationLevelEnum.PARTIAL,
          })
          .count()
          .exec();
        fullCount += await this.exitSurveyResponseModel
          .find({ exitSurveyFormId, expectations: ExpectationLevelEnum.FULL })
          .count()
          .exec();
        exceededCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            expectations: ExpectationLevelEnum.EXCEEDED,
          })
          .count()
          .exec();
      }
      const sum = notMetCount + partialCount + fullCount + exceededCount;

      return {
        notMetCount,
        partialCount,
        fullCount,
        exceededCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // KnowledgeApplication wise count of participants - Exit Survey
  async getKnowledgeApplicationParticipantCountPerInstitute(
    proposalId,
    user: any,
  ) {
    try {
      Logger.debug(
        'StaticSurveyService.getKnowledgeApplicationParticipantCountPerInstitute',
      );
      // check if activity with activityId exists or not
      // activityExists = await
      const exitSurveyFormList = await this.exitSurveyFormModel
        .find({
          proposalId,
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();

      let insideInstitutionCount = 0,
        outsideInstitutionCount = 0,
        routineCount = 0,
        educationalCount = 0,
        improvementsCount = 0,
        policyLevelCount = 0,
        lawCount = 0,
        notAppliedCount = 0;
      for (const exitSurveyForm of exitSurveyFormList) {
        const exitSurveyFormId = exitSurveyForm._id;
        insideInstitutionCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            applicationOfKnowledge: KnowledgeGainedEnum.INSIDE_INSTITUTION,
          })
          .count()
          .exec();

        outsideInstitutionCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            applicationOfKnowledge: KnowledgeGainedEnum.OUTSIDE_INSTITUTION,
          })
          .count()
          .exec();

        routineCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            applicationOfKnowledge: KnowledgeGainedEnum.ROUTINE,
          })
          .count()
          .exec();

        educationalCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            applicationOfKnowledge: KnowledgeGainedEnum.EDUCATIONAL,
          })
          .count()
          .exec();

        improvementsCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            applicationOfKnowledge: KnowledgeGainedEnum.IMPROVEMENTS,
          })
          .count()
          .exec();

        policyLevelCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            applicationOfKnowledge: KnowledgeGainedEnum.POLICY_LEVEL,
          })
          .count()
          .exec();

        lawCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            applicationOfKnowledge: KnowledgeGainedEnum.LAW,
          })
          .count()
          .exec();

        notAppliedCount += await this.exitSurveyResponseModel
          .find({
            exitSurveyFormId,
            applicationOfKnowledge: KnowledgeGainedEnum.NOT_APPLIED,
          })
          .count()
          .exec();
      }

      const sum =
        insideInstitutionCount +
        outsideInstitutionCount +
        routineCount +
        educationalCount +
        improvementsCount +
        policyLevelCount +
        lawCount +
        notAppliedCount;

      return {
        insideInstitutionCount,
        outsideInstitutionCount,
        routineCount,
        educationalCount,
        improvementsCount,
        policyLevelCount,
        lawCount,
        notAppliedCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //Gender-wise knowledge shared
  async getParticipantCountByKnowledgeShared(proposalId, user: any) {
    Logger.debug('StaticSurveyService.getParticipantCountByKnowledgeShared');
    try {
      // check if activity with activityId exists or not
      // activityExists = await
      const outcomeSurveyForms = await this.outcomeSurveyFormModel
        .find({
          proposalId,
          closedAt: { $ne: null },
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
      if (outcomeSurveyForms.length === 0)
        throw new NotFoundException(
          errorMessages.OUTCOME_SURVEY_FORM_NOT_FOUND,
        );

      const { manId, womanId, otherId, notSayId } = await this.getGenderIds();

      let manCount = 0,
        womanCount = 0,
        otherCount = 0,
        notSayCount = 0;

      for (const form of outcomeSurveyForms) {
        const outcomeSurveyFormId = form._id;
        const responses = await this.outcomeSurveyResponseModel
          .find({ outcomeSurveyFormId })
          .exec();

        for (const eachResponse of responses) {
          for (const data of eachResponse.knowledgeSharing) {
            if (
              data.key ===
                'I have not shared or spread knowledge gained from activity' &&
              data.value === false
            ) {
              if (eachResponse.genderId === manId) manCount++;
              else if (eachResponse.genderId === womanId) womanCount++;
              else if (eachResponse.genderId === otherId) otherCount++;
              else if (eachResponse.genderId === notSayId) notSayCount++;
            }
          }
        }
      }
      const sum = manCount + womanCount + otherCount + notSayCount;

      return {
        manCount,
        womanCount,
        otherCount,
        notSayCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //Gender-wise knowledge application
  async getParticipantCountByKnowledgeApplied(proposalId, user: any) {
    Logger.debug('StaticSurveyService.getParticipantCountByKnowledgeApplied');
    try {
      const outcomeSurveyForms = await this.outcomeSurveyFormModel
        .find({
          proposalId,
          closedAt: { $ne: null },
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
      if (outcomeSurveyForms.length === 0)
        throw new NotFoundException(
          errorMessages.OUTCOME_SURVEY_FORM_NOT_FOUND,
        );

      const { manId, womanId, otherId, notSayId } = await this.getGenderIds();
      let manCount = 0,
        womanCount = 0,
        otherCount = 0,
        notSayCount = 0;

      for (const form of outcomeSurveyForms) {
        const outcomeSurveyFormId = form._id;
        const responses = await this.outcomeSurveyResponseModel
          .find({ outcomeSurveyFormId })
          .exec();

        for (const eachResponse of responses) {
          if (
            eachResponse.knowledgeApplication !==
            'I have not applied knowledge gained from activity'
          ) {
            if (eachResponse.genderId === manId) manCount++;
            else if (eachResponse.genderId === womanId) womanCount++;
            else if (eachResponse.genderId === otherId) otherCount++;
            else if (eachResponse.genderId === notSayId) notSayCount++;
          }
        }
      }
      const sum = manCount + womanCount + otherCount + notSayCount;

      return {
        manCount,
        womanCount,
        otherCount,
        notSayCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //Institution wise knowledge application count
  async getParticipantCountKnowledgeAppliedByInstitution(
    proposalId,
    user: any,
  ) {
    Logger.debug(
      'StaticSurveyService.getParticipantCountKnowledgeAppliedByInstitution',
    );
    try {
      const outcomeSurveyForms = await this.outcomeSurveyFormModel
        .find({
          proposalId,
          closedAt: { $ne: null },
          networkId: user.networkId,
          partnerId: user.partnerId,
        })
        .exec();
      if (outcomeSurveyForms.length === 0)
        throw new NotFoundException(
          errorMessages.OUTCOME_SURVEY_FORM_NOT_FOUND,
        );

      const {
        govtId,
        unId,
        ngotId,
        academiatId,
        riverId,
        utilityId,
        privateId,
        independentId,
      } = await this.getTypeOfInstitutionIds();
      let govtCount = 0;
      let unCount = 0;
      let ngoCount = 0;
      let academiaCount = 0;
      let riverCount = 0;
      let utilityCount = 0;
      let privateCount = 0;
      let indCount = 0;
      for (const form of outcomeSurveyForms) {
        const outcomeSurveyFormId = form._id;
        const responses = await this.outcomeSurveyResponseModel
          .find({ outcomeSurveyFormId })
          .exec();

        for (const eachResponse of responses) {
          if (
            eachResponse.knowledgeApplication !==
            'I have not applied knowledge gained from activity'
          ) {
            if (eachResponse.institutionTypeId === govtId) govtCount++;
            else if (eachResponse.institutionTypeId === unId) unCount++;
            else if (eachResponse.institutionTypeId === ngotId) ngoCount++;
            else if (eachResponse.institutionTypeId === academiatId)
              academiaCount++;
            else if (eachResponse.institutionTypeId === riverId) riverCount++;
            else if (eachResponse.institutionTypeId === utilityId)
              utilityCount++;
            else if (eachResponse.institutionTypeId === privateId)
              privateCount++;
            else if (eachResponse.institutionTypeId === independentId)
              indCount++;
          }
        }
      }

      const sum =
        govtCount +
        unCount +
        ngoCount +
        academiaCount +
        riverCount +
        utilityCount +
        privateCount +
        indCount;
      return {
        govtCount,
        unCount,
        ngoCount,
        academiaCount,
        riverCount,
        utilityCount,
        privateCount,
        indCount,
        sum,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  //Country count for relevant institution change outcome report
  async getCountryCountForRelevantInstitutionChange(
    proposalId: string,
    user: any,
  ) {
    Logger.debug(
      'StaticSurveyService.getCountryCountForRelevantInstitutionChange',
    );
    const outcomeSurveyForms = await this.outcomeSurveyFormModel
      .find({
        proposalId,
        closedAt: { $ne: null },
        networkId: user.networkId,
        partnerId: user.partnerId,
      })
      .exec();
    if (outcomeSurveyForms.length === 0)
      throw new NotFoundException(errorMessages.OUTCOME_SURVEY_FORM_NOT_FOUND);

    for (const form of outcomeSurveyForms) {
      const outcomeSurveyFormId = form._id;
      const responses = await this.outcomeSurveyResponseModel
        .aggregate([
          {
            $match: {
              outcomeSurveyFormId,
              isRelevantChange: true,
            },
          },
          { $group: { _id: '$countryId' } },
        ])
        .exec();
      return {
        countryTotal: responses.length,
      };
    }
  }

  //Country count for demographic country output report
  async getParticipantProfileDemographicCountry(proposalId: string, user: any) {
    Logger.debug('StaticSurveyService.getParticipantProfileDemographicCountry');
    const entrySurveyForms = await this.entrySurveyFormModel
      .find({
        proposalId,
        closedAt: { $ne: null },
        networkId: user.networkId,
        partnerId: user.partnerId,
      })
      .exec();
    if (entrySurveyForms.length === 0)
      throw new NotFoundException(errorMessages.SURVEY_NOT_FOUND);

    for (const form of entrySurveyForms) {
      const entrySurveyFormId = form._id;
      const responses = await this.entrySurveyResponseModel
        .aggregate([
          {
            $match: {
              entrySurveyFormId,
            },
          },
          { $group: { _id: '$countryId' } },
        ])
        .exec();
      return {
        countryTotal: responses.length,
      };
    }
  }
}
