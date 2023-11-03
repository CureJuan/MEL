import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class ProposalIdListDto {
  @IsArray()
  @ApiProperty()
  proposalIds: [Types.ObjectId];
}
