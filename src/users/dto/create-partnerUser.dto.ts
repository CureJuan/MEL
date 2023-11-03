import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

import { CapnetUserDTO } from './create-capnetUser.dto';

export class PartnerUserDTO extends CapnetUserDTO {
  @IsMongoId()
  @ApiProperty()
  partnerId: Types.ObjectId;
}
