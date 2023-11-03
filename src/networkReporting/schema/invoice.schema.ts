import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AnnualReport } from '../../networkReporting/schema/annualReport.schema';
import { ProgressReport } from '../../networkReporting/schema/progressReport.schema';
import { Network } from '../../networks/schema/network.schema';
import { Partner } from '../../partners/schema/partner.schema';
import { OutcomeReport } from '../../reports/schema/outcomeReport.schema';
import { OutputReport } from '../../reports/schema/outputReport.schema';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class Invoice extends Base {
  @Prop()
  invoiceNumber: string;

  @Prop()
  name: string;

  @Prop()
  address: string;

  @Prop()
  hostInstitute: string;

  @Prop()
  typeOfPayment: string;

  @Prop()
  paymentTerms: string;

  @Prop()
  dueDate: Date;

  @Prop()
  bankAccountName: string;

  @Prop({ default: '' })
  bankAccountNumber: string;

  @Prop()
  bankAddress: string;

  @Prop()
  swiftCode: string;

  @Prop()
  emailAddress: string;

  @Prop({ type: Types.ObjectId, ref: OutputReport.name, default: null })
  outputReportId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: OutcomeReport.name, default: null })
  outcomeReportId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: ProgressReport.name, default: null })
  progressReportId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: AnnualReport.name, default: null })
  annualReportId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Network.name })
  networkId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Partner.name })
  partnerId: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;

  @Prop()
  invoiceTo: string;

  @Prop()
  priceAndQtyArray: PriceAndQty[];

  @Prop()
  totalOfUnitPrice: number;

  @Prop()
  totalOfLineTotal: number;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

export interface PriceAndQty {
  qty: number;
  description: string;
  unitPrice: number;
  lineTotal: number;
}
