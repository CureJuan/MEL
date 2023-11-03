import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLog } from '../common/schema/activityLog.schema';
import { errorMessages } from '../utils/error-messages.utils';
import { CreateNetworkDTO } from './dto/create-network.dto';
import { Network, NetworkDocument } from './schema/network.schema';
import { v4 as uuidv4 } from 'uuid';
import { CreateNetworkProfileDTO } from './dto/createNetworkProfile.dto';
import { AddAnalysisDto } from './dto/addAnalysis.dto';
import { AddIndividualMembersDto } from './dto/addIndividualMembers.dto';
import { IndividualMember } from './schema/individualMember.schema';
import { InstitutionalMember } from './schema/institutionalMember.schema';
import { EditNetworkProfileDto } from './dto/editNetworkProfile.dto';
import { Workbook, Worksheet } from 'exceljs';
import { Country } from '../common/staticSchema/country.schema';
import { Gender } from '../common/staticSchema/gender.schema';
import { TypeOfInstitution } from '../common/staticSchema/typeOfInstitution.schema';
import { Region } from '../common/staticSchema/region.schema';
import { EditNetworkNameDTO } from './dto/editNetworkName.dto';
import { ActivateOrDeactivateNetworkDTO } from './dto/activateOrDeactivateNetwork.dto';
import { AddInstitutionalMembersDto } from './dto/addInstitutionalMembers.dto';
import { TypeOfMembership } from '../common/staticSchema/typeOfMemberShip.schema';
import { ExpertiseAreaOrThematicFocus } from '../common/staticSchema/expertiseAreaOrThematicFocus.schema';
import { User } from '../users/schema/user.schema';

@Injectable()
export class NetworkService {
  constructor(
    @InjectModel(Network.name) private networkModel: Model<NetworkDocument>,

    @InjectModel(IndividualMember.name)
    private individualMemberModel: Model<IndividualMember>,

    @InjectModel(InstitutionalMember.name)
    private institutionalMemberModel: Model<InstitutionalMember>,

    @InjectModel(Gender.name) private genderModel: Model<Gender>,

    @InjectModel(TypeOfInstitution.name)
    private typeOfInstitutionModel: Model<TypeOfInstitution>,

    @InjectModel(Country.name) private countryModel: Model<Country>,

    @InjectModel(Region.name) private regionModel: Model<Region>,

    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,

    @InjectModel(TypeOfMembership.name)
    private typeOfMembershipModel: Model<TypeOfMembership>,

    @InjectModel(ExpertiseAreaOrThematicFocus.name)
    private expertiseOrThematicModel: Model<ExpertiseAreaOrThematicFocus>,

    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async checkIfNetworkNameExists(networkName: string) {
    Logger.debug('NetworksService.checkIfNetworkNameExists');
    const existingNetworkName = await this.networkModel
      .findOne({ networkName })
      .exec();
    if (existingNetworkName)
      throw new ConflictException(errorMessages.NETWORK_ALREADY_EXISTS);
    else return false;
  }

  async checkIfNetworkExists(networkId: Types.ObjectId) {
    try {
      Logger.debug('NetworksService.checkIfNetworkExists');
      const existingNetwork = await this.networkModel
        .findById({ _id: networkId })
        .exec();
      if (existingNetwork) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async addNetwork(network: CreateNetworkDTO): Promise<Network> {
    Logger.debug('NetworksService.addNetwork');
    const existingNetworkName = await this.checkIfNetworkNameExists(
      network.networkName,
    );
    if (!existingNetworkName)
      return new this.networkModel({
        ...network,
        networkId: uuidv4(),
        isActive: true,
      }).save();
  }

  async editNetworkName(
    networkId: string,
    editNetworkName: EditNetworkNameDTO,
    user: any,
  ) {
    Logger.debug('NetworksService.editNetworkName');
    const existingNetworkName = await this.checkIfNetworkNameExists(
      editNetworkName.networkName,
    );
    if (!existingNetworkName)
      return this.networkModel
        .findOneAndUpdate(
          { networkId, isActive: true },
          { ...editNetworkName, updatedBy: user._id },
          { new: true },
        )
        .exec();
  }

  async activateOrDeactiveNetwork(
    activateOrDeactivateNetwork: ActivateOrDeactivateNetworkDTO,
    user: any,
  ) {
    Logger.debug('NetworksService.activateOrDeactiveNetwork');
    const network = await this.networkModel
      .findOne({ networkId: activateOrDeactivateNetwork.networkId })
      .exec();
    if (network === null)
      throw new NotFoundException(errorMessages.NETWORK_NOT_FOUND);
    if (activateOrDeactivateNetwork.action === 'Activate') {
      await this.networkModel
        .findOneAndUpdate(
          { networkId: activateOrDeactivateNetwork.networkId, isActive: false },
          { isActive: true, updatedBy: user._id },
          { new: true },
        )
        .exec();
      return {
        message: 'Network Activated',
      };
    } else if (activateOrDeactivateNetwork.action === 'Deactivate') {
      await this.networkModel
        .findOneAndUpdate(
          { networkId: activateOrDeactivateNetwork.networkId, isActive: true },
          { isActive: false, updatedBy: user._id },
          { new: true },
        )
        .exec();

      // Deactivate all the users of the network which is deactivated
      await this.userModel
        .updateMany(
          {
            networkId: network._id,
            isActive: true,
          },
          {
            $set: { isActive: false, updatedBy: user._id },
          },
        )
        .exec();

      return {
        message: 'Network Deactivated',
      };
    }
  }

  async getAllNetworksList() {
    Logger.debug('NetworksService.getAllNetworksList');
    return this.networkModel.find({ isActive: true }).exec();
  }

  async getAllNetworksNameList() {
    Logger.debug('NetworksService.getAllNetworksNameList');
    const networks = await this.networkModel.find({ isActive: true }).exec();
    let networkList = [];
    for (const network of networks) {
      const temp = {};
      temp['network_id'] = network._id;
      temp['networkName'] = network.networkName;
      networkList = [...networkList, { ...temp }];
    }
    return { networkList };
  }

  async getNetworkNameById(networkId) {
    try {
      Logger.debug('NetworksService.getNetworkNameById');
      const network = await this.networkModel
        .findById({ _id: networkId })
        .exec();
      if (network === null) {
        throw new NotFoundException(errorMessages.NETWORK_NOT_FOUND);
      } else {
        return network.networkName;
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getNetworkAbbreviationById(networkId) {
    try {
      Logger.debug('NetworksService.getNetworkAbbreviationById');
      const network = await this.networkModel
        .findById({ _id: networkId })
        .exec();
      if (network === null) {
        throw new NotFoundException(errorMessages.NETWORK_NOT_FOUND);
      } else {
        return network.code;
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

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

  async getArrayOfActivityLogObject(
    activityLogs: ActivityLog[],
    activityLogCount: number,
  ) {
    Logger.debug('NetworksService.getArrayOfActivityLogObject');
    let logArray = [];
    for (const log of activityLogs) {
      const temp = {};
      temp['fullName'] = log.name;
      temp['instituteName'] = log.instituteName;
      temp['description'] = log.description;
      temp['timeStamp'] = log.timeStamp.toLocaleString('en-US');
      logArray = [...logArray, { ...temp }];
    }

    return {
      logArray,
      activityLogCount,
      totalPageCount: Math.ceil(activityLogCount / 10),
    };
  }

  async getActivityLogPerNetwork(
    networkId: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('NetworksService.getActivityLogPerNetwork');
    const network_id = new Types.ObjectId(networkId);
    const network = await this.networkModel.findOne({ _id:network_id }).exec();
    console.log("network ", network)
    if (network === null) {
      throw new NotFoundException(errorMessages.NETWORK_NOT_FOUND);
    } else {
      const sortQuery = {};
      sortKey = sortKey.length === 0 ? 'timeStamp' : sortKey;
      sortQuery[sortKey] = sortDirection == 1 ? '1' : '-1';

      const activityLogs = await this.activityLogModel
        .find({
          networkId: network._id,
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      const activityLogCount = await this.activityLogModel
        .find({ networkId: network._id })
        .count()
        .exec();

      return this.getArrayOfActivityLogObject(activityLogs, activityLogCount);
    }
  }

  async getActivityLog(
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('NetworksService.getActivityLog');
    const regex = new RegExp(searchKeyword, 'i');
    const sortQuery = {};
    sortKey = sortKey.length === 0 ? 'timeStamp' : sortKey;
    sortQuery[sortKey] = sortDirection == 1 ? '1' : '-1';

    const activityLogs = await this.activityLogModel
      .find({
        $and: [
          {
            networkId: { $ne: null },
            partnerId: { $eq: null },
          },
          {
            $or: [{ instituteName: regex }],
          },
        ],
      })
      .sort(sortQuery)
      .skip(pageIndex * pageLimit)
      .limit(pageLimit)
      .exec();

    const activityLogCount = await this.activityLogModel
      .find({
        $and: [
          {
            networkId: { $ne: null },
            partnerId: { $eq: null },
          },
          {
            $or: [{ instituteName: regex }],
          },
        ],
      })
      .count()
      .exec();

    return this.getArrayOfActivityLogObject(activityLogs, activityLogCount);
  }

  async getStaticDataTables() {
    Logger.debug('NetworksService.getStaticDataTables');
    const genderList = await this.genderModel.find().exec();
    const typeOfInstitutionList = await this.typeOfInstitutionModel
      .find()
      .exec();
    const countryList = await this.countryModel.find().exec();
    const regionList = await this.regionModel.find().exec();
    const typeOfMembershipList = await this.typeOfMembershipModel.find().exec();
    const expertiseOrThematicList = await this.expertiseOrThematicModel
      .find()
      .exec();

    return {
      genderList,
      typeOfInstitutionList,
      countryList,
      regionList,
      typeOfMembershipList,
      expertiseOrThematicList,
    };
  }

  async getGenderById(id) {
    try {
      Logger.debug('NetworksService.getGenderById');
      const gender = await this.genderModel.findOne({ _id: id }).exec();
      return gender.gender;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getTypeOfInstituionById(id) {
    try {
      Logger.debug('NetworksService.getTypeOfInstituionById');
      const typeOfInstitution = await this.typeOfInstitutionModel
        .findOne({ _id: id })
        .exec();
      return typeOfInstitution.typeOfInstitution;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getCountryById(id) {
    try {
      Logger.debug('NetworksService.getCountryById');
      const country = await this.countryModel.findOne({ _id: id }).exec();
      return country.country;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getRegionById(id) {
    // try {
    Logger.debug('NetworksService.getRegionById');
    const region = await this.regionModel.findOne({ _id: id }).exec();
    return region.region;
    // } catch (error) {
    //   throw new InternalServerErrorException();
    // }
  }

  async createNetworkProfile(
    createNetworkProfile: CreateNetworkProfileDTO,
    user: any,
  ) {
    Logger.debug('NetworksService.createNetworkProfile');
    const existingNetwork = await this.checkIfNetworkExists(user.networkId);
    if (existingNetwork) {
      return this.networkModel.findOneAndUpdate(
        {
          _id: user.networkId,
        },
        {
          ...createNetworkProfile,
          updatedBy: user._id,
        },
        { new: true },
      );
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async editNetworkProfile(
    editNetworkProfile: EditNetworkProfileDto,
    user: any,
  ) {
    Logger.debug('NetworksService.editNetworkProfile');
    const existingNetwork = await this.checkIfNetworkExists(user.networkId);
    if (existingNetwork) {
      return this.networkModel.findOneAndUpdate(
        {
          _id: user.networkId,
        },
        {
          ...editNetworkProfile,
          updatedBy: user._id,
        },
        { new: true },
      );
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async addAnalysisAndLearning(
    addAnalysisAndLearning: AddAnalysisDto,
    user: any,
  ) {
    Logger.debug('NetworksService.addAnalysisAndLearning');
    const existingNetwork = await this.checkIfNetworkExists(user.networkId);
    if (existingNetwork) {
      return this.networkModel.findOneAndUpdate(
        {
          _id: user.networkId,
        },
        {
          ...addAnalysisAndLearning,
          updatedBy: user._id,
        },
        { new: true },
      );
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async addIndividualMembers(
    addIndividualMembers: AddIndividualMembersDto[],
    user: any,
  ) {
    Logger.debug('NetworksService.addIndividualMembers');
    const existingNetwork = await this.checkIfNetworkExists(user.networkId);
    if (existingNetwork) {
      const individualMemberList = addIndividualMembers.map((data) => ({
        ...data,
        updatedBy: user._id,
      }));
      for (const individualMember of individualMemberList) {
        if (individualMember.individualMemberId !== undefined) {
          await this.individualMemberModel
            .updateOne(
              {
                individualMemberId: individualMember.individualMemberId,
                isDeleted: false,
              },
              individualMember,
            )
            .exec();
        } else {
          await this.individualMemberModel.create({
            ...individualMember,
            individualMemberId: uuidv4(),
            networkId: user.networkId,
            createdBy: user._id,
            updatedBy: user._id,
          });
        }
      }
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async addInstitutionalMembers(
    addInstitutionalMembers: AddInstitutionalMembersDto[],
    user: any,
  ) {
    Logger.debug('NetworksService.addInstitutionalMembers');
    const existingNetwork = await this.checkIfNetworkExists(user.networkId);
    if (existingNetwork) {
      const institutionalMemberList = addInstitutionalMembers.map((data) => ({
        ...data,
        updatedBy: user._id,
      }));
      for (const institutionalMember of institutionalMemberList) {
        if (institutionalMember.institutionalMemberId !== undefined) {
          await this.institutionalMemberModel
            .updateOne(
              {
                institutionalMemberId:
                  institutionalMember.institutionalMemberId,
                isDeleted: false,
              },
              institutionalMember,
            )
            .exec();
        } else {
          await this.institutionalMemberModel.create({
            ...institutionalMember,
            institutionalMemberId: uuidv4(),
            networkId: user.networkId,
            createdBy: user._id,
            updatedBy: user._id,
          });
        }
      }
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async deleteIndividualMember(individualMemberId: string, user: any) {
    Logger.debug('NetworksService.deleteIndividualMember');
    const existingNetwork = await this.checkIfNetworkExists(user.networkId);
    if (existingNetwork) {
      return this.individualMemberModel
        .findOneAndUpdate(
          {
            individualMemberId,
            isDeleted: false,
          },
          {
            isDeleted: true,
            updatedBy: user._id,
          },
          { new: true },
        )
        .exec();
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async deleteInstitutionalMember(institutionalMemberId: string, user: any) {
    Logger.debug('NetworksService.deleteInstitutionalMember');
    const existingNetwork = await this.checkIfNetworkExists(user.networkId);
    if (existingNetwork) {
      return this.institutionalMemberModel
        .findOneAndUpdate(
          {
            institutionalMemberId,
            isDeleted: false,
          },
          {
            isDeleted: true,
            updatedBy: user._id,
          },
          { new: true },
        )
        .exec();
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async getMemberCount(user: any) {
    Logger.debug('NetworksService.getMemberCount');
    const existingNetwork = await this.checkIfNetworkExists(user.networkId);
    if (existingNetwork) {
      const individualMemberCount = await this.individualMemberModel
        .find({
          networkId: user.networkId,
          isDeleted: false,
        })
        .count()
        .exec();

      const institutionalMemberCount = await this.institutionalMemberModel
        .find({
          networkId: user.networkId,
          isDeleted: false,
          isPartnerMember: false,
        })
        .count()
        .exec();

      const partnerMemberCount = await this.institutionalMemberModel
        .find({
          networkId: user.networkId,
          isDeleted: false,
          isPartnerMember: true,
        })
        .count()
        .exec();

      return {
        numberOfMembers:
          individualMemberCount + institutionalMemberCount + partnerMemberCount,
      };
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  // For both Network Details and Analysis Tab
  async viewNetworkProfile(networkId: Types.ObjectId) {
    Logger.debug('NetworksService.viewNetworkProfile');
    const existingNetwork = await this.checkIfNetworkExists(networkId);
    if (existingNetwork) {
      const network = await this.networkModel
        .findOne({ _id: networkId })
        .exec();
      let countryList = [];
      for (const country of network.countryId) {
        countryList = [...countryList, await this.getCountryById(country)];
      }

      return {
        network,
        region: network.regionId
          ? await this.getRegionById(network.regionId)
          : null,
        countryList,
      };
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  // List of all networks for Admin User
  async getNetworksList(
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('NetworksService.getNetworksList');
    const { regex, sortQuery } = await this.commonFunctionForSearchSort(
      searchKeyword,
      sortKey,
      sortDirection,
    );
    const networkList = await this.networkModel
      .find({
        $or: [
          { networkName: regex },
          { networkWebsite: regex },
          { networkManagerName: regex },
          { email: regex },
        ],
      })
      .sort(sortQuery)
      .skip(pageIndex * pageLimit)
      .limit(pageLimit)
      .exec();

    const networkCount = await this.networkModel
      .find({
        $or: [
          { networkName: regex },
          { networkWebsite: regex },
          { networkManagerName: regex },
          { email: regex },
        ],
      })
      .count()
      .exec();

    let networkArray = [];
    for (const network of networkList) {
      const temp = {};
      temp['network_id'] = network._id;
      temp['networkId'] = network.networkId;
      temp['networkName'] = network.networkName;
      temp['region'] = network.regionId
        ? await this.getRegionById(network.regionId)
        : 'NA';
      temp['website'] = network.networkWebsite ? network.networkWebsite : 'NA';
      temp['networkManager'] = network.networkManagerName
        ? network.networkManagerName
        : 'NA';
      temp['email'] = network.email ? network.email : 'NA';
      temp['dateOfInception'] = network.dateOfInception
        ? network.dateOfInception
        : 'NA';
      temp['lastUpdated'] = network.updatedAt;
      temp['isActive'] = network.isActive;
      networkArray = [...networkArray, { ...temp }];
    }

    return {
      networkArray,
      networkCount,
      totalPageCount: Math.ceil(networkCount / 10),
    };
  }

  async getIndividualMembersList(networkId: Types.ObjectId) {
    Logger.debug('NetworksService.getIndividualMembersList');
    const existingNetwork = await this.networkModel
      .findOne({ _id: networkId })
      .exec();
    if (existingNetwork !== null) {
      return this.individualMemberModel
        .find({ networkId: existingNetwork._id, isDeleted: false })
        .exec();
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async getInstitutionalMembersList(networkId: Types.ObjectId) {
    Logger.debug('NetworksService.getInstitutionalMembersList');
    const existingNetwork = await this.networkModel
      .findOne({ _id: networkId })
      .exec();
    if (existingNetwork !== null) {
      return this.institutionalMemberModel
        .find({
          networkId: existingNetwork._id,
          isDeleted: false,
          isPartnerMember: false,
        })
        .exec();
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async getInstitutionalPartnerMembersList(networkId: Types.ObjectId) {
    Logger.debug('NetworksService.getInstitutionalPartnerMembersList');
    const existingNetwork = await this.networkModel
      .findOne({ _id: networkId })
      .exec();
    if (existingNetwork !== null) {
      return this.institutionalMemberModel
        .find({
          networkId: existingNetwork._id,
          isDeleted: false,
          isPartnerMember: true,
        })
        .exec();
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async createWorksheetForInstitutionMembers(worksheet: Worksheet) {
    Logger.debug('NetworksService.createWorksheetForInstitutionMembers');
    worksheet.columns = [
      { header: 'Network Name', key: 'networkName', width: 30 },
      { header: 'Institution', key: 'institution', width: 30 },
      { header: 'Type of Institution', key: 'typeOfInstitution', width: 30 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Country', key: 'country', width: 30 },
      { header: 'Contact Number', key: 'contactNumber', width: 30 },
      { header: 'Website', key: 'website', width: 30 },
      {
        header: 'Start year of membership',
        key: 'startYearOfMembership',
        width: 30,
      },
      { header: 'Main Expertise', key: 'mainExpertise', width: 30 },
      { header: 'Secondary Expertise', key: 'secondaryExpertise', width: 30 },
      { header: 'Scope Of work', key: 'scopeOfWork', width: 30 },
      { header: 'Focal Point', key: 'focalPoint', width: 30 },
      { header: 'Position', key: 'position', width: 30 },
      { header: 'Email Address', key: 'email', width: 30 },
    ];

    worksheet.addRow({
      networkName: 'Network Name',
      institution: 'Institution',
      typeOfInstitution: 'Type of Institution',
      address: 'Address',
      country: 'Country',
      contactNumber: 'Contact Number',
      website: 'Website',
      startYearOfMembership: 'Start year of membership',
      mainExpertise: 'Main Expertise',
      secondaryExpertise: 'Secondary Expertise',
      scopeOfWork: 'Scope Of work',
      focalPoint: 'Focal Point',
      position: 'Position',
      email: 'Email Address',
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  async commonDownloadForInstituionalMembers(
    institutionalMemberList: InstitutionalMember[],
    worksheet: Worksheet,
    networkName: string,
  ) {
    Logger.debug('NetworksService.commonDownloadForInstituionalMembers');
    let worksheetCount = 2;
    for (const institutionalMember of institutionalMemberList) {
      let secondaryExpertiseValue = '',
        secondaryExpertiseCount = 1;
      for (const secondaryExpertise of institutionalMember.secondaryExpertise) {
        if (secondaryExpertiseCount === 1) {
          secondaryExpertiseValue += secondaryExpertise;
          secondaryExpertiseCount++;
        } else {
          secondaryExpertiseValue += ', ' + secondaryExpertise;
        }
      }
      secondaryExpertiseValue += '.';

      worksheet.getRow(worksheetCount).values = {
        networkName: networkName,
        institution: institutionalMember.institution,
        typeOfInstitution: await this.getTypeOfInstituionById(
          institutionalMember.typeOfInstitutionId,
        ),
        address: institutionalMember.address,
        country: await this.getCountryById(institutionalMember.countryId),
        contactNumber: institutionalMember.contactNumber,
        website: institutionalMember.website,
        startYearOfMembership: institutionalMember.startYearOfMembership,
        mainExpertise: institutionalMember.mainExpertise,
        secondaryExpertise: secondaryExpertiseValue,
        scopeOfWork: institutionalMember.scopeOfwork,
        focalPoint: institutionalMember.focalPoint,
        position: institutionalMember.position,
        email: institutionalMember.email,
      };

      worksheetCount++;
    }
  }

  async downloadIndividualMemberList(res, networkId: Types.ObjectId) {
    Logger.debug('NetworksService.downloadIndividualMemberList');
    const existingNetwork = await this.networkModel
      .findOne({ _id: networkId })
      .exec();
    if (existingNetwork !== null) {
      const networkName = await this.getNetworkNameById(networkId);
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet(
        `Individual Members List - ${networkName}`,
      );

      worksheet.columns = [
        { header: 'Network Name', key: 'networkName', width: 30 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Last Name', key: 'lastName', width: 30 },
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Gender', key: 'gender', width: 30 },
        { header: 'Country', key: 'country', width: 30 },
        { header: 'Institution', key: 'institution', width: 30 },
        { header: 'Type of Institution', key: 'typeOfInstitution', width: 30 },
        { header: 'Contact Number', key: 'contactNumber', width: 30 },
        { header: 'Email Address', key: 'email', width: 30 },
        {
          header: 'Start year of membership',
          key: 'startYearOfMembership',
          width: 30,
        },
        { header: 'Main Expertise', key: 'mainExpertise', width: 30 },
        { header: 'Secondary Expertise', key: 'secondaryExpertise', width: 30 },
        {
          header: 'Availability as a trainer',
          key: 'availabilityAsATrainer',
          width: 20,
        },
        { header: 'Scope Of work', key: 'scopeOfWork', width: 30 },
      ];

      worksheet.addRow({
        networkName: 'Network Name',
        name: 'Name',
        lastName: 'Last Name',
        title: 'Title',
        gender: 'Gender',
        country: 'Country',
        institution: 'Institution',
        typeOfInstitution: 'Type of Institution',
        contactNumber: 'Contact Number',
        email: 'Email Address',
        startYearOfMembership: 'Start year of membership',
        mainExpertise: 'Main Expertise',
        secondaryExpertise: 'Secondary Expertise',
        availabilityAsATrainer: 'Availability as a trainer',
        scopeOfWork: 'Scope Of work',
      });

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      const individualMemberList = await this.individualMemberModel
        .find({ networkId: existingNetwork._id, isDeleted: false })
        .exec();

      let worksheetCount = 2;
      for (const individualMember of individualMemberList) {
        let secondaryExpertiseValue = '',
          secondaryExpertiseCount = 1;
        for (const secondaryExpertise of individualMember.secondaryExpertise) {
          if (secondaryExpertiseCount === 1) {
            secondaryExpertiseValue += secondaryExpertise;
            secondaryExpertiseCount++;
          } else {
            secondaryExpertiseValue += ', ' + secondaryExpertise;
          }
        }
        secondaryExpertiseValue += '.';

        worksheet.getRow(worksheetCount).values = {
          networkName: networkName,
          name: individualMember.name,
          lastName: individualMember.lastName,
          title: individualMember.title,
          gender: await this.getGenderById(individualMember.genderId),
          country: await this.getCountryById(individualMember.countryId),
          institution: individualMember.institution,
          typeOfInstitution: await this.getTypeOfInstituionById(
            individualMember.typeOfInstitutionId,
          ),
          contactNumber: individualMember.contactNumber,
          email: individualMember.email,
          startYearOfMembership: individualMember.startYearOfMembership,
          mainExpertise: individualMember.mainExpertise,
          secondaryExpertise: secondaryExpertiseValue,
          availabilityAsATrainer: individualMember.availabilityAsTrainer,
          scopeOfWork: individualMember.scopeOfwork,
        };

        worksheetCount++;
      }

      res.set({
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Content-Disposition':
          'attachment; filename=' +
          'IndividualMembers-' +
          networkName +
          '.xlsx',
      });
      res.contentType(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      await workbook.xlsx.write(res);
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async downloadInstitutionalMembersList(res, networkId: Types.ObjectId) {
    Logger.debug('NetworksService.downloadInstitutionalMembersList');
    const existingNetwork = await this.networkModel
      .findOne({ _id: networkId })
      .exec();
    if (existingNetwork !== null) {
      const networkName = await this.getNetworkNameById(networkId);
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet(
        `Institutional Members List - ${networkName}`,
      );

      await this.createWorksheetForInstitutionMembers(worksheet);
      const institutionalMemberList = await this.institutionalMemberModel
        .find({
          networkId: existingNetwork._id,
          isDeleted: false,
          isPartnerMember: false,
        })
        .exec();
      if (institutionalMemberList.length > 0) {
        // await this.createWorksheetForInstitutionMembers(worksheet);
        await this.commonDownloadForInstituionalMembers(
          institutionalMemberList,
          worksheet,
          networkName,
        );
      }

      res.set({
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Content-Disposition':
          'attachment; filename=' +
          'InstitutionalMembers-' +
          networkName +
          '.xlsx',
      });
      res.contentType(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      await workbook.xlsx.write(res);
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }

  async downloadPartnerMembersList(res, networkId: Types.ObjectId) {
    Logger.debug('NetworksService.downloadPartnerMembersList');
    const existingNetwork = await this.networkModel
      .findOne({ _id: networkId })
      .exec();
    if (existingNetwork !== null) {
      const networkName = await this.getNetworkNameById(networkId);
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet(
        `Partner Members List - ${networkName}`,
      );
      await this.createWorksheetForInstitutionMembers(worksheet);
      const institutionalMemberList = await this.institutionalMemberModel
        .find({
          networkId: existingNetwork._id,
          isDeleted: false,
          isPartnerMember: true,
        })
        .exec();
      await this.commonDownloadForInstituionalMembers(
        institutionalMemberList,
        worksheet,
        networkName,
      );

      res.set({
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Content-Disposition':
          'attachment; filename=' + 'PartnerMembers-' + networkName + '.xlsx',
      });
      res.contentType(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      await workbook.xlsx.write(res);
    } else {
      throw new BadRequestException(errorMessages.NETWORK_NOT_FOUND);
    }
  }
}
