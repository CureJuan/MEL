import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class DegreeOfNewKnowledge {
  @Prop()
  degreeOfNewKnowledge: string;

  @Prop()
  translationKey: string;
}
export const DegreeOfNewKnowledgeSchema =
  SchemaFactory.createForClass(DegreeOfNewKnowledge);
