import { PartialType } from '@nestjs/swagger';
import { AddResultDTO } from './addResult.dto';

export class EditResultDTO extends PartialType(AddResultDTO) {}
