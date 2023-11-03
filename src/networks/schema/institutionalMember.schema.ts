import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Member } from './members.schema';

@Schema({
  timestamps: true,
})
export class InstitutionalMember extends Member {
  @Prop()
  institutionalMemberId: string;

  @Prop()
  address: string;

  @Prop()
  website: string;

  @Prop()
  focalPoint: string;

  @Prop()
  position: string;

  @Prop()
  email: string;

  @Prop({ required: true })
  isPartnerMember: boolean;
}

export const InstitutionalMemberSchema =
  SchemaFactory.createForClass(InstitutionalMember);
