import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsEnum, MaxLength } from 'class-validator';
import { ApprovalTypeEnum } from '../enum/approvalTypes.enum';

export class DenyRequestDto {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  @IsEnum(ApprovalTypeEnum, { message: 'Enter valid approval type' })
  approvalTypeName: string;

  @IsNotEmpty()
  @ApiProperty()
  entityToBeApprovedId: string; //uuid

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  @MaxLength(500)
  reason: string;
}
export default DenyRequestDto;
