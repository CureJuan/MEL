import { PartialType } from '@nestjs/swagger';
import { CreateNetworkMelpSRFDTO } from './createNetworkMelpSRF.dto';

export class EditNetworkMelpSRFDTO extends PartialType(
  CreateNetworkMelpSRFDTO,
) {}
