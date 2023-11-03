import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ThematicAreaOfChange {
  @Prop()
  thematicAreaOfChange: string;

  @Prop()
  translationKey: string;
}

export const ThematicAreaOfChangeSchema =
  SchemaFactory.createForClass(ThematicAreaOfChange);
