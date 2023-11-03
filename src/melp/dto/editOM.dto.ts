import { PartialType } from '@nestjs/swagger';
import { CreateMelpOMDTO } from './createMelpOM.dto';

export class EditOmDTO extends PartialType(CreateMelpOMDTO) {}
