import { PartialType } from '@nestjs/swagger';
import { AddStoryInfoDTO } from './addStoryInfo.dto';

export class EditStoryInfoDTO extends PartialType(AddStoryInfoDTO) {}
