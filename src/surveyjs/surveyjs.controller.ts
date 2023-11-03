import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import RequestWithUser from '../users/user.service';
import { AddFormValueDto } from './dto/add-form-value.dto';
import { AddSurveyFormDto } from './dto/add-surveyForm.dto';
import { EditSurveyFormDto } from './dto/edit-surveyForm.dto';
import { SurveyjsService } from './surveyjs.service';

@ApiTags('SurveyJS Controller')
@UseGuards(JwtAuthGuard)
@Controller('surveyjs')
export class SurveyjsController {
  constructor(private readonly surveyjsService: SurveyjsService) {}

  @Post('addSurveyjsForm')
  async createFormStructure(
    @Body() addSurveyFormDto: AddSurveyFormDto,
    @Req() request: RequestWithUser,
  ): Promise<any> {
    console.log('addSurveyFormDto = ', addSurveyFormDto);
    console.log(JSON.stringify(addSurveyFormDto));

    return this.surveyjsService.createFormStructure(
      addSurveyFormDto,
      request.user,
    );
  }

  @ApiQuery({ name: 'pageSize' })
  @ApiQuery({ name: 'pageIndex' })
  @ApiQuery({ name: 'searchKeyword' })
  @Get('getAllFormStructures')
  async getAllFormStructures(
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('pageIndex', ParseIntPipe) pageIndex: number,
    @Query('searchKeyword') searchKeyword: string,
  ): Promise<any> {
    return this.surveyjsService.getAllFormStructures(
      pageSize,
      pageIndex,
      searchKeyword,
    );
  }

  @ApiQuery({ name: 'formId' })
  @ApiQuery({ name: 'isPublished' })
  @Put('publishFormStructure')
  async publishFormStructures(
    @Query('formId') formId: string,
    @Query('isPublished') isPublished: boolean,
  ) {
    return this.surveyjsService.publishFormStructures(formId, isPublished); //make isDirty: true
  }

  @Get('getAllPublishedFormStructures')
  async getAllPublishedFormStructures(): Promise<any> {
    return this.surveyjsService.getAllPublishedFormStructures();
  }

  //validate published link
  @ApiQuery({ name: 'formId' })
  @Get('validatePublishedForm')
  async validatePublishedForm(@Query('formId') formId: string): Promise<any> {
    return this.surveyjsService.validatePublishedForm(formId);
  }

  //edit form structures: isDirty
  @ApiQuery({ name: 'formId' })
  @Put('editSurveyJsForm')
  async editSurveyJsForm(
    @Body() editSurveyFormDto: EditSurveyFormDto,
    @Req() request: RequestWithUser,
    @Query('formId') formId: string,
  ): Promise<any> {
    return this.surveyjsService.editSurveyFormDto(
      formId,
      editSurveyFormDto,
      request.user,
    );
  }

  //add survey form responses
  @Post('addFormResponse')
  async addFormResponse(
    @Body() addFormValueDto: AddFormValueDto,
  ): Promise<any> {
    console.log('addFormValueDto = ');
    console.log(addFormValueDto);
    return this.surveyjsService.addFormResponse(addFormValueDto);
  }

  //get survey form responses
  @Get('getAllFormResponse')
  async getFormResponse(): Promise<any> {
    return this.surveyjsService.getFormResponse();
  }
}
