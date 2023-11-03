import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class AddFormValueDto {
  // @ApiProperty()
  // @IsString()
  // email: string;

  @ApiProperty()
  formResponseJson: any;

  @ApiProperty()
  surveyjsFormId: Types.ObjectId;
}
