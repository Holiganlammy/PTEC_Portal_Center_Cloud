import {
  Body,
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
  HttpCode,
  Res,
  Req,
} from '@nestjs/common';
import { AppService } from '../service/ptec_smart.service';
import { CreateSmartBillDto } from '../domain/model/ptec_smart.entity';
import {
  SmartBillAssociateInput,
  SmartBillOperationInput,
  SmartBillHeaderInput,
  SmartBill_CarInfoSearchInput,
} from '../dto/SmartCar.dto';
import { Response, Request as ExpressRequest } from 'express';
import {
  SmartBill_CreateCostInput,
  SmartBill_Withdraw_AddrowDtlInput,
  SmartBill_Withdraw_SaveInput,
  SmartBill_Withdraw_updateSBWInput,
  SmartBill_WithdrawDtl_DeleteCategoryInput,
  SmartBill_WithdrawDtl_SaveChangesCategoryInput,
} from '../dto/SmartBill.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('')
export class AppController {
  constructor(private readonly service: AppService) {}

  @Post('SmartBill_CreateForms')
  @HttpCode(200)
  async createSmartBill(
    @Body() dataBody: CreateSmartBillDto,
    @Res() res: Response,
  ) {
    try {
      const header = dataBody.smartBill_Header[0];
      const car = dataBody.carInfo[0];

      const headerInput: SmartBillHeaderInput = {
        usercode: header.usercode || 'SYSTEM',
        sb_code: dataBody.sb_code ?? '',
        sb_name: header.sb_name,
        sb_fristName: header.sb_fristName,
        sb_lastName: header.sb_lastName,
        clean_status: Number(header.clean_status),
        group_status: Number(header.group_status),
        car_infocode: car.car_infocode,
        reamarks: header.reamarks,
        car_infostatus_companny: car.car_infostatus_companny as boolean,
        car_categaryid: car.car_categaryid,
        car_typeid: car.car_typeid,
        car_band: car.car_band,
        car_tier: car.car_tier,
        car_color: car.car_color,
        car_remarks: car.car_remarks,
        car_milerate: car.car_milerate,
      };

      const headerResult = (await this.service.SmartBill_CreateForms(
        headerInput,
      )) as { sb_code?: string }[];
      const sb_code = (headerResult[0]?.sb_code as string) || undefined;
      if (!sb_code) {
        throw new HttpException(
          'ไม่สามารถสร้าง SmartBill ได้',
          HttpStatus.BAD_REQUEST,
        );
      }

      for (const op of dataBody.smartBill_Operation) {
        await this.service.SmartBill_CreateOperation(
          op as SmartBillOperationInput,
          sb_code,
        );
      }

      if (Number(header.group_status) === 1) {
        for (const associate of dataBody.smartBill_Associate) {
          await this.service.SmartBill_CreateAssociate(
            associate as SmartBillAssociateInput,
            sb_code,
          );
        }
      }

      res.status(200).send(sb_code);
    } catch (error) {
      console.error('[SmartBill_CreateForms] Error:', error);
      throw new HttpException(
        'Internal Server Error: ' + error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Post('SmartBill_CarInfoSearch')
  @HttpCode(200)
  async SmartBill_CarInfoSearch(
    @Body() body: SmartBill_CarInfoSearchInput,
    @Res() res: Response,
  ) {
    try {
      const carInfo = await this.service.SmartBill_CarInfoSearch(body);
      if (!carInfo) {
        throw new HttpException('ไม่พบข้อมูลรถยนต์', HttpStatus.NOT_FOUND);
      }
      res.status(200).send(carInfo);
    } catch (error) {
      console.error('[SmartBill_CarInfoSearch] Error:', error);
      throw new HttpException(
        'Internal Server Error: ' + error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('SmartBill_files')
  @HttpCode(200)
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

  @Get('SmartBill_SelectHeaders')
  @HttpCode(200)
  async SmartBill_SelectHeaders(@Res() res: Response) {
    try {
      const dataHeaders = await this.service.SmartBill_SelectHeaders();
      if (!dataHeaders) {
        throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      }
      res.status(200).send(dataHeaders);
    } catch (error) {
      console.error('[SmartBill_SelectHeaders] Error:', error);
      throw new HttpException(
        'Internal Server Error: ' + error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('SmartBill_SelectAllForms')
  @HttpCode(200)
  async SmartBill_SelectAllForms(
    @Body() body: { sb_Code: string },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.SmartBill_SelectAllForms(body);
      if (!data) {
        throw new HttpException('ไม่พบข้อมูลแบบฟอร์ม', HttpStatus.NOT_FOUND);
      }
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('SmartBill_ESGQuery')
  @HttpCode(200)
  async SmartBill_ESGQuery(
    @Body() body: { startDate: string; endDate: string },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.SmartBill_ESGQuery(body);
      if (!data) {
        throw new HttpException(
          'ไม่พบข้อมูลแบบ ESGQuery',
          HttpStatus.NOT_FOUND,
        );
      }
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('SmartBill_Withdraw_Save')
  @HttpCode(200)
  async SmartBill_Withdraw_Save(
    @Body() body: SmartBill_Withdraw_SaveInput,
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.SmartBill_Withdraw_Save(body);
      if (!data) {
        throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      }
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('SmartBill_Withdraw_SelectAllForms')
  @HttpCode(200)
  async SmartBill_Withdraw_SelectAllForms(
    @Body() body: { sbw_code: string },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.SmartBill_Withdraw_SelectAllForms(body);
      if (!data) {
        throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      }
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('SmartBill_CreateCost')
  @HttpCode(200)
  async createCost(
    @Body() body: SmartBill_CreateCostInput[],
    @Res() res: Response,
  ) {
    try {
      const costResult = await this.service.SmartBill_CreateCost(body[0]);
      let createdCostId: number | undefined;
      if (
        Array.isArray(costResult) &&
        Array.isArray(costResult[0]) &&
        costResult[0][0] &&
        typeof (costResult[0][0] as { Cost_id?: unknown }).Cost_id === 'number'
      ) {
        createdCostId = (costResult[0][0] as { Cost_id: number }).Cost_id;
      }

      if (createdCostId) {
        for (const element of body) {
          await this.service.SmartBill_CreateCostAllowance({
            sbwdtl_id: element.sbwdtl_id,
            cost_id: createdCostId,
            category_id: element.category_id,
            usercode: element.usercode,
            amount: element.amount,
          });
        }
      }

      res
        .status(200)
        .send({ message: 'Cost and allowances created successfully.' });
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('SmartBill_WithdrawDtl_SelectCategory')
  @HttpCode(200)
  async selectCategory(
    @Body() body: { sbwdtl_id: number; category_id: number },
    @Res() res: Response,
  ) {
    try {
      const data =
        await this.service.SmartBill_WithdrawDtl_SelectCategory(body);
      if (!data) {
        throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      }
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('SmartBill_WithdrawDtl_SaveChangesCategory')
  @HttpCode(200)
  async saveChangesCategory(
    @Body() body: SmartBill_WithdrawDtl_SaveChangesCategoryInput[],
    @Res() res: Response,
  ) {
    try {
      for (let i = 0; i < body.length; i++) {
        const data =
          await this.service.SmartBill_WithdrawDtl_SaveChangesCategory(body[i]);
        if (i + 1 === body.length) {
          res.status(200).send(data);
        }
      }
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('SmartBill_WithdrawDtl_DeleteCategory')
  @HttpCode(200)
  async deleteCategory(
    @Body() body: SmartBill_WithdrawDtl_DeleteCategoryInput,
    @Res() res: Response,
  ) {
    try {
      const data =
        await this.service.SmartBill_WithdrawDtl_DeleteCategory(body);
      if (!data) {
        throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      }
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('Withdraw_Delete')
  @HttpCode(200)
  async withdrawDelete(
    @Body() body: { sbw_code: string },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.SmartBill_Withdraw_Delete(body);
      if (!data) throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('WithdrawDtl_SaveChangesHotelGroup')
  @HttpCode(200)
  async saveHotelGroup(
    @Body()
    body: {
      sbc_hotelid: number;
      usercode: string;
      amount: number;
    }[],
    @Res() res: Response,
  ) {
    try {
      let result: any[] | null = null;
      for (let i = 0; i < body.length; i++) {
        result = await this.service.SmartBill_WithdrawDtl_SaveChangesHotelGroup(
          body[i],
        );
      }
      if (!result?.length)
        throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      res.status(200).send(result);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('WithdrawDtl_SelectHotelGroup')
  @HttpCode(200)
  async selectHotelGroup(
    @Body() body: { sbc_hotelid: number },
    @Res() res: Response,
  ) {
    try {
      const data =
        await this.service.SmartBill_WithdrawDtl_SelectHotelGroup(body);
      if (!data) throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('WithdrawDtl_DeleteHotelGroup')
  @HttpCode(200)
  async deleteHotelGroup(
    @Body()
    body: {
      sbc_hotelgroupid: number;
    },
    @Res() res: Response,
  ) {
    try {
      const data =
        await this.service.SmartBill_WithdrawDtl_DeleteHotelGroup(body);
      if (!data) throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('Withdraw_Addrow')
  @HttpCode(200)
  async addRow(@Body() body: { car_infocode: string }, @Res() res: Response) {
    try {
      const data = await this.service.SmartBill_Withdraw_Addrow(body);
      if (!data) throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('Withdraw_AddrowDtl')
  @HttpCode(200)
  async addRowDtl(
    @Body() body: SmartBill_Withdraw_AddrowDtlInput,
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.SmartBill_Withdraw_AddrowDtl(body);
      if (!data) throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('WithdrawDtl_Delete')
  @HttpCode(200)
  async withdrawDtlDelete(
    @Body() body: { sbwdtl_id: number },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.SmartBill_WithdrawDtl_Delete(body);
      if (!data) throw new HttpException('ไม่พบข้อมูล', HttpStatus.NOT_FOUND);
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('Withdraw_updateSBW')
  @HttpCode(200)
  async updateSBW(
    @Body() body: SmartBill_Withdraw_updateSBWInput,
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.SmartBill_Withdraw_updateSBW(body);
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('Withdraw_SelectCostOther')
  @HttpCode(200)
  async selectCostOther(@Res() res: Response) {
    try {
      const data = await this.service.SmartBill_Withdraw_SelectCostOther();
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('NonPO_Delete_Attach_By_attachid')
  @HttpCode(200)
  async deleteAttach(@Body() body: { attachid: number }, @Res() res: Response) {
    try {
      const data = await this.service.NonPO_Delete_Attach_By_attachid(body);
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('AcceptHeader')
  @HttpCode(200)
  async acceptHeader(
    @Body() body: { sb_code: string; usercode: string },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.SmartBill_AcceptHeader(body);
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('NonPO_PermisstionOperator')
  @HttpCode(200)
  async permissionOperator(
    @Body() body: { category_nonpo: string },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.NonPO_PermisstionOperator(body);
      res.status(200).send(data);
    } catch (error: unknown) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
