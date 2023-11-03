import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class TypeOfMembership {
  @Prop()
  typeOfMembership: string;
}

export const TypeOfMembershipSchema =
  SchemaFactory.createForClass(TypeOfMembership);
