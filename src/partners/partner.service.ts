import {
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
import { AddPartnerDTO } from './dto/add-partner.dto';
import { Partner, PartnerDocument } from './schema/partner.schema';
import { v4 as uuidv4 } from 'uuid';
import { NetworkService } from '../networks/network.service';

@Injectable()
export class PartnerService {
  constructor(
    @InjectModel(Partner.name) private partnerModel: Model<PartnerDocument>,

    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,

    private readonly networkService: NetworkService,
  ) {}

  async addPartner(addPartner: AddPartnerDTO): Promise<Partner> {
    try {
      Logger.debug('PartnerService.addNetwork');
      const existingPartnerCode = await this.checkIfPartnerAbbreviationExists(
        addPartner.abbreviation,
      );
      if (existingPartnerCode)
        throw new ConflictException(
          errorMessages.PARTNER_ABBREVIATION_ALREADY_EXISTS,
        );
      return new this.partnerModel({
        ...addPartner,
        partnerId: uuidv4(),
      }).save();
    } catch (error) {}
  }

  async checkIfPartnerAbbreviationExists(abbreviation) {
    try {
      Logger.debug('PartnerService.checkIfPartnerAbbreviationExists');
      const existingPartner = await this.partnerModel
        .findOne({ instituteAbbreviation: abbreviation })
        .exec();
      if (existingPartner) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async checkIfPartnerExists(partnerId) {
    try {
      Logger.debug('PartnerService.checkIfPartnerExists');
      const existingPartner = await this.partnerModel
        .findById({ _id: partnerId })
        .exec();
      if (existingPartner) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getPartnerInstitutes() {
    try {
      Logger.debug('PartnerService.getPartnerInstitutes');
      return this.partnerModel.find().exec();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getPartnerInstituteNameById(partnerId) {
    try {
      Logger.debug('PartnerService.getPartnerInstituteNameById');
      const partner = await this.partnerModel
        .findById({ _id: partnerId })
        .exec();
      if (partner === null)
        throw new NotFoundException(errorMessages.PARTNER_NOT_FOUND);
      else return partner.partnerInstitute;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getPartnerAbbreviationById(partnerId) {
    try {
      Logger.debug('PartnerService.getPartnerAbbreviationById');
      const partner = await this.partnerModel
        .findById({ _id: partnerId })
        .exec();
      if (partner === null)
        throw new NotFoundException(errorMessages.PARTNER_NOT_FOUND);
      else return partner.abbreviation;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getActivityLogPerPartner(
    partnerId: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('PartnerService.getActivityLogPerPartner');
    const partner_id = new Types.ObjectId(partnerId);
    const partner = await this.partnerModel.findOne({_id: partner_id }).exec();
    if (partner === null) {
      throw new NotFoundException(errorMessages.PARTNER_NOT_FOUND);
    } else {
      const sortQuery = {};
      sortKey = sortKey.length === 0 ? 'timeStamp' : sortKey;
      sortQuery[sortKey] = sortDirection == 1 ? '1' : '-1';

      const activityLogs = await this.activityLogModel
        .find({
          partnerId: partner._id,
        })
        .sort(sortQuery)
        .skip(pageIndex * pageLimit)
        .limit(pageLimit)
        .exec();

      const activityLogCount = await this.activityLogModel
        .find({ partnerId: partner._id })
        .count()
        .exec();

      return this.networkService.getArrayOfActivityLogObject(
        activityLogs,
        activityLogCount,
      );
    }
  }

  async getPartnersActivityLog(
    searchKeyword: string,
    pageLimit: number,
    pageIndex: number,
    sortKey: string,
    sortDirection: number,
  ) {
    Logger.debug('PartnerService.getPartnersActivityLog');
    const regex = new RegExp(searchKeyword, 'i');
    const sortQuery = {};
    sortKey = sortKey.length === 0 ? 'timeStamp' : sortKey;
    sortQuery[sortKey] = sortDirection == 1 ? '1' : '-1';

    const activityLogs = await this.activityLogModel
      .find({
        $and: [
          {
            partnerId: { $ne: null },
            networkId: { $eq: null },
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
            partnerId: { $ne: null },
            networkId: { $eq: null },
          },
          {
            $or: [{ instituteName: regex }],
          },
        ],
      })
      .count()
      .exec();

    return this.networkService.getArrayOfActivityLogObject(
      activityLogs,
      activityLogCount,
    );
  }
}
