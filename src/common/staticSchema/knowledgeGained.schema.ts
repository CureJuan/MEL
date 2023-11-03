import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class KnowledgeGained {
  @Prop()
  knowledgeGained: string;

  @Prop()
  translationKey: string;
}
export const KnowledgeGainedSchema =
  SchemaFactory.createForClass(KnowledgeGained);
