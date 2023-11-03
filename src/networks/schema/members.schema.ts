import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Country } from '../../common/staticSchema/country.schema';
import { TypeOfInstitution } from '../../common/staticSchema/typeOfInstitution.schema';
import { Base } from '../../common/schema/base.schema';
import { Network } from './network.schema';

@Schema({
  timestamps: true,
})
export class Member extends Base {
  @Prop({ type: Types.ObjectId, ref: Network.name })
  networkId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Country.name })
  countryId: Types.ObjectId;

  @Prop()
  institution: string;

  @Prop({ type: Types.ObjectId, ref: TypeOfInstitution.name })
  typeOfInstitutionId: Types.ObjectId;

  @Prop()
  contactNumber: number;

  @Prop()
  startYearOfMembership: number;

  @Prop()
  mainExpertise: string;

  @Prop()
  secondaryExpertise: string[];

  @Prop()
  scopeOfwork: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
