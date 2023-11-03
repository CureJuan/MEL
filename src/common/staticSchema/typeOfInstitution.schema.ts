import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class TypeOfInstitution {
  @Prop()
  typeOfInstitution: string;

  @Prop()
  translationKey: string;
}

export const TypeOfInstitutionSchema =
  SchemaFactory.createForClass(TypeOfInstitution);
