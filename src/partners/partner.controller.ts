import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AddPartnerDTO } from './dto/add-partner.dto';
import { PartnerService } from './partner.service';
import { Partner } from './schema/partner.schema';

@Controller('partner')
@ApiTags('Partner Controller')
export class PartnerController {
  constructor(private partnerService: PartnerService) {}

  @Get('allPartners')
  async getPartnerInstitutes() {
    Logger.debug('PartnerController.getPartnerInstitutes');
    return this.partnerService.getPartnerInstitutes();
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addPartner(@Body() addPartner: AddPartnerDTO): Promise<Partner> {
    Logger.debug('PartnerController.addPartner');
    return this.partnerService.addPartner(addPartner);
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @ApiParam({ name: 'partnerId' })
  @Get('activityLog/:partnerId')
  async getActivityLogPerPartner(
    @Param('partnerId') partnerId: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('PartnerController.getActivityLogPerNetwork');
    return this.partnerService.getActivityLogPerPartner(
      partnerId,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'searchKeyword' })
  @ApiQuery({ name: 'pageLimit' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'sortKey' })
  @ApiQuery({ name: 'sortDirection' })
  @Get('partnersActivityLog')
  async getPartnersActivityLog(
    @Query('searchKeyword') searchKeyword: string,
    @Query('pageLimit', ParseIntPipe) pageLimit: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection', ParseIntPipe) sortDirection: number,
  ) {
    Logger.debug('PartnerController.getPartnersActivityLog');
    return this.partnerService.getPartnersActivityLog(
      searchKeyword,
      pageLimit,
      pageIndex,
      sortKey,
      sortDirection,
    );
  }
}
