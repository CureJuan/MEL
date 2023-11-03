import { PartialType } from '@nestjs/swagger';
import { CreateNetworkProfileDTO } from './createNetworkProfile.dto';

export class EditNetworkProfileDto extends PartialType(
  CreateNetworkProfileDTO,
) {}
