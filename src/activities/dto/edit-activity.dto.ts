import { PartialType } from '@nestjs/swagger';
import { CreateActivityDTO } from './create-activity.dto';

export class EditActivityDTO extends PartialType(CreateActivityDTO) {}
