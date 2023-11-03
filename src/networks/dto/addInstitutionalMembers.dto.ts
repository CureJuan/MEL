import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AddMembersDto } from './members.dto';

export class AddInstitutionalMembersDto extends AddMembersDto {
  @IsOptional()
  @ApiProperty()
  institutionalMemberId: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  address: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  website: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  focalPoint: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  position: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  isPartnerMember: boolean;
}
