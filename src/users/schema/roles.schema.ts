import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../enum/role.enum';

@Schema({
  timestamps: true,
})
export class Roles extends Document {
  // @Prop({required:true})
  // roleName:{
  //     type:string,
  //     enum:[Role.ADMIN, Role.CAPNET, Role.NETWORK, Role.PARTNER, Role.GUEST]
  // }

  @Prop({ type: String, enum: Role })
  roleName: Role;
}

export const RolesSchema = SchemaFactory.createForClass(Roles);
