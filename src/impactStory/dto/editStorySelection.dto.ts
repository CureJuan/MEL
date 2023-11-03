import { PartialType } from '@nestjs/swagger';
import { AddStorySelectionDTO } from './addStorySelection.dto';

export class EditStorySelectionDTO extends PartialType(AddStorySelectionDTO) {}
