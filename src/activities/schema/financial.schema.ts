import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { ActivityProposals } from './activityProposals.schema';

@Schema()
export class Financial extends Base {
  @Prop({ type: SchemaTypes.ObjectId, ref: ActivityProposals.name })
  activityProposalId: Types.ObjectId;

  @Prop()
  budget: number;

  @Prop()
  amountPerUnit: number;

  @Prop()
  numberOfUnits: number;

  @Prop()
  capnetFinancialFunding: number;

  @Prop()
  networkFinancialFunding: number;

  @Prop()
  partnerFinancialFunding: number;

  @Prop()
  networkInKindFunding: number;

  @Prop()
  partnerInKindFunding: number;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const FinancialSchema = SchemaFactory.createForClass(Financial);
