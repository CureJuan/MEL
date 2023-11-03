import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class BoundaryPartner extends Base {
  @Prop({ required: true })
  boundaryPartnerId: string;

  @Prop({ required: true })
  partnerName: string;
}
export const BoundaryPartnerSchema =
  SchemaFactory.createForClass(BoundaryPartner);
