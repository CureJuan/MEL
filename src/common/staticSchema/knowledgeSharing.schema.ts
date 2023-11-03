import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class KnowledgeSharing {
  @Prop()
  knowledgeSharing: string;

  @Prop()
  translationKey: string;
}
export const KnowledgeSharingSchema =
  SchemaFactory.createForClass(KnowledgeSharing);
