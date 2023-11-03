import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApprovalTypeEnum } from '../enum/approvalTypes.enum';

export class SendForApprovalDto {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  @IsEnum(ApprovalTypeEnum, { message: 'Enter valid approval type' })
  approvalTypeName: string;

  @IsNotEmpty()
  @ApiProperty()
  entityToBeApprovedId: string; //uuid
}
export default SendForApprovalDto;
