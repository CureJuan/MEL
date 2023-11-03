import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class TypeOfChangeObserved {
  @Prop()
  typeOfChangeObserved: string;

  @Prop()
  translationKey: string;
}

export const TypeOfChangeObservedSchema =
  SchemaFactory.createForClass(TypeOfChangeObserved);
