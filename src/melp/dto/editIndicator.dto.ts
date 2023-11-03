import { PartialType } from '@nestjs/swagger';
import { AddIndicatorDTO } from './addIndicator.dto';

export class EditIndicatorDTO extends PartialType(AddIndicatorDTO) {}
