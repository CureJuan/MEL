import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class User extends Base {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  position: string;

  @Prop({ default: null })
  password: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Status' })
  statusId: Types.ObjectId;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Roles' })
  roleId: Types.ObjectId;

  @Prop({ default: '', required: false })
  roleName?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Partner', default: null })
  partnerId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Network', default: null })
  networkId: Types.ObjectId;

  @Prop()
  instituteAbbreviation: string;

  @Prop({ default: null })
  newPwdToken: string;

  @Prop({ default: null })
  forgetPwdToken: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
