import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { Region } from '../../common/staticSchema/region.schema';

export type NetworkDocument = Network & Document;

@Schema({
  timestamps: true,
})
export class Network extends Base {
  @Prop()
  networkId: string;

  @Prop({ required: true })
  networkName: string;

  @Prop({ required: true })
  code: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  dateOfInception: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: Region.name })
  regionId: Types.ObjectId;

  @Prop()
  typeOfMembership: any[];

  @Prop()
  numberOfMembers: number;

  // @Prop({ type: [SchemaTypes.ObjectId], ref: Country.name })
  @Prop()
  countryId: any[]; // coverage

  @Prop()
  mainThematicFocus: any[];

  @Prop({ minlength: 5, maxlength: 100 })
  networkManagerName: string;

  @Prop()
  networkManagerEmail: string;

  @Prop({ minlength: 5, maxlength: 100 })
  networkHostName: string;

  @Prop({ minlength: 5, maxlength: 100 })
  networkWebsite: string;

  @Prop({ minlength: 5, maxlength: 100 })
  accountName: string;

  @Prop()
  accountNumber: number;

  @Prop({ minlength: 5, maxlength: 100 })
  bankAddress: string;

  @Prop()
  swiftCode: string;

  @Prop()
  email: string;

  @Prop({ minlength: 5, maxlength: 500, required: false })
  analysisAndLearning: string;

  @Prop({ minlength: 5, maxlength: 500, required: false })
  weaknessAndRisk: string;

  @Prop({ minlength: 5, maxlength: 500, required: false })
  challengesInNetworkManagement: string;

  @Prop({ minlength: 5, maxlength: 500, required: false })
  challengesInCapacityDevelopment: string;

  @Prop({ minlength: 5, maxlength: 500, required: false })
  challengesInKnowledgeManagement: string;

  @Prop({ minlength: 5, maxlength: 500, required: false })
  challengesInPartnership: string;

  @Prop({ minlength: 5, maxlength: 500, required: false })
  typeOfSupportRequest: string;

  @Prop({ minlength: 5, maxlength: 500, required: false })
  actionPlans: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const NetworkSchema = SchemaFactory.createForClass(Network);

export interface MultiSelectInputs {
  key: string;
  value: boolean;
}
