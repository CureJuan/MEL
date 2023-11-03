import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Network } from '../../networks/schema/network.schema';
import { Partner } from '../../partners/schema/partner.schema';
import { Base } from '../../common/schema/base.schema';
import { ActivityProposals } from '../../activities/schema/activityProposals.schema';
import { CapnetEnum } from '../../common/enum/capnet.enum';

@Schema()
export class BaseSurveyForm extends Base {
  @Prop()
  formCode: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  language: string;

  @Prop({ default: CapnetEnum.CAPNET })
  instituteName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: ActivityProposals.name })
  proposalId: Types.ObjectId;

  @Prop()
  activityCode: string;

  @Prop()
  activityName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Network.name, default: null })
  networkId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Partner.name, default: null })
  partnerId: Types.ObjectId;

  @Prop()
  link: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  closedAt: Date;
}

export const BaseSurveyFormSchema =
  SchemaFactory.createForClass(BaseSurveyForm);
