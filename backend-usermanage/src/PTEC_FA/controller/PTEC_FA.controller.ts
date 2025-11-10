import {
  Controller,
  Post,
  Body,
  Get,
  HttpException,
  HttpStatus,
  Res,
  Req,
  Query,
} from '@nestjs/common';
import { AppService } from '../service/PTEC_FA.service';
import { Response, Request as ExpressRequest } from 'express';
// import { Public } from '../../auth/decorators/public.decorator';
import {
  FA_Control_Create_Detail_NAC,
  FA_Control_New_Assets_Xlsx,
  FA_control_update_DTL,
  FA_control_update_Dto,
  FA_Control_UpdateDetailCounted_Dto,
  FAMobileUploadImageDto,
  NacCreateDto,
  store_FA_control_comment,
  stroe_FA_control_Path,
  UpdateDtlAssetDto,
  updateReferenceDto,
} from '../dto/FA_Control.dto';
import {
  FA_Control_Fetch_Assets,
  FA_Control_Fetch_Assets_FilterOptions,
} from '../domain/ptec_fa.entity';

@Controller('')
export class AppController {
  constructor(private readonly service: AppService) {}

  @Post('/check_files_NewNAC')
  async uploadSmartBill(@Req() req: ExpressRequest, @Res() res: Response) {
    try {
      const result = await this.service.handleFileUpload(req);
      res.status(HttpStatus.OK).json(result);
    } catch (error: unknown) {
      let errorMessage = 'Unexpected error';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage =
          String((error as { message?: unknown }).message) || errorMessage;
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: errorMessage,
      });
    }
  }

  @Post('/FA_Control_Report_All_Counted_by_Description')
  async FA_Control_Report_All_Counted_by_Description(
    @Body() body: { PeriodID: number },
    @Res() res: Response,
  ) {
    try {
      console.log('Request body:', body);
      const result =
        await this.service.FA_Control_Report_All_Counted_by_Description(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/FA_Control_NAC_Backlog')
  async FA_Control_NAC_Backlog(@Res() res: Response) {
    try {
      const result = await this.service.FA_Control_NAC_Backlog();
      if (result.length == 0) {
        return {
          message: 'ไม่พบข้อมูล',
          code: 400,
        };
      } else {
        res.status(200).send(result);
      }
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_AnnualGraph')
  async FA_Control_AnnualGraph(
    @Body() body: { TargetYear: number },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Control_AnnualGraph(body.TargetYear);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // @Public()
  @Get('/FA_Control_Fetch_Assets')
  async FA_Control_Fetch_Assets(
    @Query('usercode') usercode: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('typeCode') typeCode: string,
    @Query('code') code: string,
    @Query('name') name: string,
    @Query('owner') owner: string,
    @Query('group') group: string,
    @Query('location') location: string,
    @Query('search') search: string,
    @Res() res: Response,
  ) {
    try {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const result = (await this.service.FA_Control_Fetch_Assets(
        usercode,
        pageNum,
        limitNum,
        typeCode,
        code,
        name,
        owner,
        group,
        location,
        search,
      )) as FA_Control_Fetch_Assets[];

      if (result && result.length > 0) {
        const totalCount = result[0].TotalCount;
        const totalPages = Math.ceil(totalCount / limitNum);
        // ลบ TotalCount ออกจากแต่ละแถว (เพราะเป็น metadata)
        const data = result.map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { TotalCount, ...rest } = item;
          return rest;
        });

        res.status(200).send({
          message: 'Assets fetched successfully',
          code: 200,
          data,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
          },
        });
      } else {
        // ไม่มีข้อมูล
        res.status(200).send({
          message: 'No assets found',
          code: 200,
          data: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_UpdateDetailCounted')
  async FA_Control_UpdateDetailCounted(
    @Body() body: FA_Control_UpdateDetailCounted_Dto,
  ): Promise<{
    message: string;
    code: number;
    data?: string[];
    error?: string;
  }> {
    try {
      const result = await this.service.FA_Control_UpdateDetailCounted(body);
      return {
        message: 'Detail counted updated successfully',
        code: 200,
        data: result,
      };
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/FA_Control_Assets_TypeGroup')
  async FA_Control_Assets_TypeGroup(@Res() res: Response) {
    try {
      const result = await this.service.FA_Control_Assets_TypeGroup();
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_ControlNew_Create_NAC')
  async FA_ControlNew_Create_NAC(
    @Body() body: NacCreateDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_ControlNew_Create_NAC(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/store_FA_control_update_table')
  async store_FA_control_update_table(
    @Body() body: FA_control_update_Dto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.store_FA_control_update_table(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/store_FA_control_comment')
  async store_FA_control_comment(
    @Body() body: store_FA_control_comment,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.store_FA_control_comment(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_Create_Detail_NAC')
  async FA_Control_Create_Detail_NAC(
    @Body() body: FA_Control_Create_Detail_NAC,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Control_Create_Detail_NAC(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/store_FA_SendMail')
  async store_FA_SendMail(
    @Body() body: { nac_code: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.store_FA_SendMail({
        nac_code: body.nac_code,
      });
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/AssetsAll_Control')
  async AssetsAll_Control(
    @Body() body: { BranchID: number; usercode: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.AssetsAll_Control(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_control_select_headers')
  async FA_control_select_headers(
    @Body() body: { nac_code: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_control_select_headers(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_execDocID')
  async FA_Control_execDocID(
    @Body() body: { nac_code: string; usercode: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Control_execDocID(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_select_dtl')
  async FA_Control_select_dtl(
    @Body() body: { nac_code: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Control_select_dtl(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_control_update_DTL')
  async FA_control_update_DTL(
    @Body() body: FA_control_update_DTL,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_control_update_DTL(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_CheckAssetCode_Process')
  async FA_Control_CheckAssetCode_Process(
    @Body() body: { nacdtl_assetsCode: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Control_CheckAssetCode_Process(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/stroe_FA_control_Path')
  async stroe_FA_control_Path(
    @Body() body: stroe_FA_control_Path,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.stroe_FA_control_Path(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/qureyNAC_comment')
  async qureyNAC_comment(
    @Body() body: { nac_code: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.qureyNAC_comment(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/qureyNAC_path')
  async qureyNAC_path(
    @Body() body: { nac_code: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.qureyNAC_path(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/store_FA_control_HistorysAssets')
  async store_FA_control_HistorysAssets(
    @Body() body: { userCode: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.store_FA_control_HistorysAssets(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_BPC_Running_NO')
  async FA_Control_BPC_Running_NO(@Res() res: Response) {
    try {
      const result = await this.service.FA_Control_BPC_Running_NO();
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_New_Assets_Xlsx')
  async FA_Control_New_Assets_Xlsx(
    @Body() req: FA_Control_New_Assets_Xlsx,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Control_New_Assets_Xlsx(req);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_import_dataXLSX_toAssets')
  async FA_Control_import_dataXLSX_toAssets(
    @Body() req: { count: number; keyID: string },
    @Res() res: Response,
  ) {
    try {
      const result =
        await this.service.FA_Control_import_dataXLSX_toAssets(req);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/UpdateDtlAsset')
  async UpdateDtlAsset(@Body() req: UpdateDtlAssetDto, @Res() res: Response) {
    try {
      const result = await this.service.UpdateDtlAsset(req);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_control_updateStatus')
  async FA_control_updateStatus(
    @Body() req: { usercode: string; nac_code: string; nac_status: number },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_control_updateStatus(req);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/store_FA_control_drop_NAC')
  async store_FA_control_drop_NAC(
    @Body() req: { usercode: string; nac_code: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.store_FA_control_drop_NAC(req);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_Select_MyNAC')
  async FA_Control_Select_MyNAC(
    @Body() req: { usercode: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Control_Select_MyNAC(req);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Control_Select_MyNAC_Approve')
  async FA_Control_Select_MyNAC_Approve(
    @Body() req: { usercode: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Control_Select_MyNAC_Approve(req);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/FA_Control_ListStatus')
  async FA_Control_ListStatus(@Res() res: Response) {
    try {
      const result = await this.service.FA_Control_ListStatus();
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/check_code_result')
  async check_code_result(@Body() req: { Code: string }, @Res() res: Response) {
    try {
      const result = await this.service.check_code_result({
        Code: req.Code,
      });
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('FA_Mobile_UploadImage')
  async uploadImage(
    @Body() body: FAMobileUploadImageDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.uploadImage(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/updateReference')
  async updateReference(
    @Body() body: updateReferenceDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.updateReference(body);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Period
  @Post('/FA_Control_Fetch_Branch_Period')
  async FA_Control_Fetch_Branch_Period(
    @Body() req: { usercode: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Control_Fetch_Branch_Period({
        usercode: req.usercode,
      });
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/FA_Period_update_period')
  async FA_Period_update_period(
    @Body()
    req: {
      PeriodID: number;
      BeginDate: Date;
      EndDate: Date;
      BranchID: number;
      Description: string;
      usercode: string;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Period_update_period(req);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/deletePeriod')
  async deletePeriod(
    @Body()
    req: { PeriodID: number },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.deletePeriod(req);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/createPeriod')
  async createPeriod(
    @Body()
    req: {
      begindate: Date;
      enddate: Date;
      branchid: string;
      description: string;
      usercode: string;
      depcode?: string | null;
      personID?: string | null;
      keyID?: string | null;
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.createPeriod(req);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Public()
  @Get('/FA_Control_Fetch_Assets_FilterOptions')
  async FA_Control_Fetch_Assets_FilterOptions(@Res() res: Response) {
    try {
      const result = await this.service.FA_Control_Fetch_Assets_FilterOptions();

      if (!Array.isArray(result) || result.length === 0) {
        return res.status(404).json({ message: 'No data found' });
      }
      const raw = result[0] as Record<string, string>;
      const jsonKey = Object.keys(raw)[0];
      const parsed = JSON.parse(
        raw[jsonKey],
      ) as FA_Control_Fetch_Assets_FilterOptions;

      return res.status(200).json(parsed);
    } catch (error: unknown) {
      console.error('Error in FA_Control_Fetch_Assets_FilterOptions:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Public()
  @Get('/FA_Control_Fetch_Assets_FilterCode')
  async FA_Control_Fetch_Assets_FilterCode(
    @Res() res: Response,
    @Query('search') search: string = '',
    @Query('offset') offset: number = 0,
    @Query('pageSize') pageSize: number = 200,
  ) {
    try {
      const result = await this.service.FA_Control_Fetch_Assets_FilterCode(
        search,
        offset,
        pageSize,
      );
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Public()
  @Get('/FA_Control_Check_Assets_Codes')
  async FA_Control_Check_Assets_Codes(
    @Query('codes') codes: string[],
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.FA_Control_Check_Assets_Codes(codes);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
