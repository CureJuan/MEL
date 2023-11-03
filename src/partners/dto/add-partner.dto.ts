import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class AddPartnerDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  partnerInstitute: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  abbreviation: string;
}
