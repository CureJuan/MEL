import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { ActivityProposals } from '../../activities/schema/activityProposals.schema';
import { MelpResultIndicators } from '../../melp/schema/melpResultIndicators.schema';
import { Base } from '../../common/schema/base.schema';
import { Status } from '../../common/schema/status.schema';
import { AgeGroup } from '../../common/staticSchema/ageGroup.schema';
import { Gender } from '../../common/staticSchema/gender.schema';
import { TypeOfInstitution } from '../../common/staticSchema/typeOfInstitution.schema';
import { Network } from '../../networks/schema/network.schema';
import { Partner } from '../../partners/schema/partner.schema';
import { User } from '../../users/schema/user.schema';
import { FileUploadDTO } from '../../reports/schema/outputReport.schema';

@Schema({
  timestamps: true,
})
export class ImpactStory extends Base {
  @Prop()
  year: number;

  @Prop()
  impactStoryId: string;

  @Prop()
  impactStoryCode: string;

  @Prop()
  instituteName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Status.name })
  statusId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Network.name, default: null })
  networkId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Partner.name, default: null })
  partnerId: Types.ObjectId;

  @Prop({ default: 0, required: false })
  approvedCount: number;

  @Prop()
  storyTitle: string;

  //focal person
  @Prop({ type: SchemaTypes.ObjectId, ref: User.name })
  focalPersonId: Types.ObjectId;

  @Prop({
    type: [SchemaTypes.ObjectId],
    ref: ActivityProposals.name,
    required: true,
  })
  proposalId: Types.ObjectId[];

  @Prop()
  proposalList: any[];

  @Prop()
  informationCollectionMedium: string;

  @Prop()
  whatChangeObserved: string;

  @Prop()
  capnetInfluenceOnChange: string;

  @Prop()
  effectOnInstitution: string;

  @Prop()
  significantChange: string;

  @Prop()
  howChangeWasOccured: string;

  @Prop()
  changeOccuredPeriod: string;

  @Prop()
  typeOfChange: TypeOfChange[];

  @Prop()
  otherTypeOfChange: string;

  @Prop({ type: [SchemaTypes.ObjectId], ref: MelpResultIndicators.name })
  indicatorId: Types.ObjectId[];

  @Prop()
  indicatorList: any[];

  @Prop()
  boundaryLevelOfChange: BoundaryLevelOfChange[];

  @Prop()
  otherBoundaryLevelOfChange: string;

  @Prop()
  thematicAreaOfChange: ThematicAreaOfChange[];

  @Prop()
  otherThematicAreaOfChange: string;

  @Prop()
  keyPartners: string;

  @Prop()
  isParticipantAStoryteller: boolean;

  @Prop()
  storyTellerContactedMedium: string;

  @Prop()
  otherContactMedium: string;

  @Prop()
  hasGivenConsent: boolean;

  @Prop()
  isAnonymous: boolean;

  @Prop()
  storyTellerFirstName: string;

  @Prop()
  storyTellerLastName: string;

  @Prop()
  storyTellerEmail: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Gender.name })
  storyTellerGenderId: Types.ObjectId;

  @Prop()
  storyTellerGenderPronounPreference: string;

  @Prop()
  otherGenderPronounPreference: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: AgeGroup.name })
  storyTellerAgeGroupId: Types.ObjectId;

  @Prop()
  nationality: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: TypeOfInstitution.name })
  typeOfInstitutionId: Types.ObjectId;

  @Prop()
  nameOfInstitution: string;

  @Prop()
  positionInInstitution: string;

  @Prop()
  isNetworkMember: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: Network.name })
  affiliatedNetworkId: Types.ObjectId;

  @Prop()
  informationSignificance: string;

  @Prop()
  missingInformation: string;

  @Prop()
  nextActions: string;

  @Prop()
  additionalComments: string;

  @Prop()
  hasStoryOfChange: boolean;

  // .doc file
  @Prop()
  storyOfChangeDraft: FileUploadDTO;

  // file uploads - max 10 files
  @Prop()
  linksToSourcesOfInformation: FileUploadDTO[];

  @Prop()
  angle: string;

  @Prop()
  title: string;

  @Prop()
  outline: string;

  @Prop()
  storyDraft: string;

  @Prop()
  storyHighlight: string;

  @Prop()
  storyQuote: string;

  @Prop()
  dynamicMaterial: string;

  @Prop()
  publishWhere: string;

  @Prop()
  publishWhen: string;

  @Prop({ default: false })
  isStoryInfoTabFilled: boolean;

  @Prop({ default: false })
  isStoryTellerTabFilled: boolean;

  @Prop({ default: false })
  isStorySelectionTabFilled: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;

  @Prop({ default: null })
  submittedAt: Date;

  @Prop({ default: null })
  approvedAt: Date;
}

export const ImpactStorySchema = SchemaFactory.createForClass(ImpactStory);

export interface TypeOfChange {
  key: string;
  value: boolean;
}

export interface BoundaryLevelOfChange {
  key: string;
  value: boolean;
}

export interface ThematicAreaOfChange {
  key: string;
  value: boolean;
}

export interface ObjectArray {
  key: Types.ObjectId;
  value: string;
}
