import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ExpertiseAreaOrThematicFocus {
  @Prop()
  expertiseAreaOrThematicFocus: string;
}

export const ExpertiseAreaOrThematicFocusSchema = SchemaFactory.createForClass(
  ExpertiseAreaOrThematicFocus,
);
