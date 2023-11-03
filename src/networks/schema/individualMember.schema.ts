import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Member } from './members.schema';
import { Gender } from 'src/common/staticSchema/gender.schema';

@Schema({
  timestamps: true,
})
export class IndividualMember extends Member {
  @Prop()
  individualMemberId: string;

  @Prop()
  name: string;

  @Prop()
  lastName: string;

  @Prop()
  title: string;

  @Prop({ type: Types.ObjectId, ref: Gender.name })
  genderId: Types.ObjectId;

  @Prop()
  email: string;

  @Prop()
  availabilityAsTrainer: string;
}

export const IndividualMemberSchema =
  SchemaFactory.createForClass(IndividualMember);
