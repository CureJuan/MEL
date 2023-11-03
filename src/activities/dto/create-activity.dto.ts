import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { Types } from 'mongoose';
import { BaseActivityDTO } from './baseActivity.dto';

export class CreateActivityDTO extends BaseActivityDTO {
  @ApiProperty()
  virtualCampusCode: string;

  @ApiProperty()
  @IsArray()
  indicatorsObjectArray: any[];

  @ApiProperty()
  categoryId: Types.ObjectId;

  @ApiProperty()
  contractReferenceNumber: string;

  @ApiProperty()
  modalityId: Types.ObjectId;

  @ApiProperty()
  implementationQuarter: string;

  @ApiProperty()
  dateOfImplementation: Date;

  @ApiProperty()
  activityStatusId: Types.ObjectId;

  @ApiProperty()
  potentialNetworkCollaboration: string;

  @ApiProperty()
  potentialGWPCollaboration: string;

  @ApiProperty()
  contributionToExpectedOutput: string;

  @ApiProperty()
  totalContractValue: string;

  @ApiProperty()
  totalActivityExpenditure: string;

  @ApiProperty()
  totalCapnetAllocation: string;

  @ApiProperty()
  partnersInKindContribution: string;

  @ApiProperty()
  partnerContributionForAct: string;

  @ApiProperty()
  partnerContributionToCapnet: string;

  @ApiProperty()
  vcActivityTypes: string;

  @ApiProperty()
  potentialPartnersForCapnet: string; //dropdown single input

  @ApiProperty()
  potentialPartnersForGeneralUsers: string[]; //multiple input fields

  @ApiProperty()
  comments: string;
}
