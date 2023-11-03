import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { CommonBankDataDTO } from 'src/networkReporting/dto/commonBankData.dto';

export class CreateNetworkProfileDTO extends CommonBankDataDTO {
  @IsNotEmpty()
  @ApiProperty()
  dateOfInception: Date;

  @IsNotEmpty()
  @ApiProperty()
  regionId: Types.ObjectId;

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  typeOfMembership: any[];

  @IsNumber()
  @ApiProperty()
  numberOfMembers: number;

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  countryId: any[]; // coverage

  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  mainThematicFocus: any[];

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  networkManagerName: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  networkManagerEmail: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  networkHostName: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  networkWebsite: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  accountName: string;

  @IsNotEmpty()
  @ApiProperty()
  accountNumber: number;

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
  email: string;
}
