import { PartialType } from '@nestjs/swagger';
import { AddStorytellerInfoDTO } from './addStorytellerInfo.dto';

export class EditStorytellerInfoDTO extends PartialType(
  AddStorytellerInfoDTO,
) {}
