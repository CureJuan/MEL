import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { CapnetUserDTO } from './create-capnetUser.dto';

export class NetworkUserDTO extends CapnetUserDTO {
  @IsMongoId()
  @ApiProperty()
  networkId: Types.ObjectId;
}
