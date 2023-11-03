import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { PriceAndQty } from '../schema/invoice.schema';
import { CommonBankDataDTO } from './commonBankData.dto';

export class AddInvoiceDTO extends CommonBankDataDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  address: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  hostInstitute: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  typeOfPayment: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  paymentTerms: string;

  @IsNotEmpty()
  @ApiProperty()
  dueDate: Date;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  bankAccountName: string;

  @IsNotEmpty()
  @ApiProperty()
  bankAccountNumber: number;

  // @Transform(({ value }) => value.trim())
  // @IsNotEmpty()
  // @MinLength(5)
  // @MaxLength(100)
  // @ApiProperty()
  // bankAddress: string;

  // @Transform(({ value }) => value.trim())
  // @IsNotEmpty()
  // @MinLength(5)
  // @MaxLength(100)
  // @ApiProperty()
  // swiftCode: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  emailAddress: string;

  @IsOptional()
  @ApiProperty()
  outputReportId: Types.ObjectId;

  @IsOptional()
  @ApiProperty()
  outcomeReportId: Types.ObjectId;

  @IsOptional()
  @ApiProperty()
  progressReportId: Types.ObjectId;

  @IsOptional()
  @ApiProperty()
  annualReportId: Types.ObjectId;

  @IsNotEmpty()
  @ApiProperty()
  totalOfUnitPrice: number;

  @IsNotEmpty()
  @ApiProperty()
  totalOfLineTotal: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  invoiceTo: string;

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  priceAndQtyArray: PriceAndQty[];
}
