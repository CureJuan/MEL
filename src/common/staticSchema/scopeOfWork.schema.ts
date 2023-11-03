import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ScopeOfWork {
  @Prop()
  scopeOfWork: string;

  @Prop()
  translationKey: string;
}

export const ScopeOfWorkSchema = SchemaFactory.createForClass(ScopeOfWork);
