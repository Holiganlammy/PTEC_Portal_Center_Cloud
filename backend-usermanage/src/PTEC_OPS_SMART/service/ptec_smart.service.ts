import { Injectable } from '@nestjs/common';
import { databaseConfig } from '../config/database.config';
import * as sql from 'mssql';
import {
  SmartBill_CarInfoSearchInput,
  SmartBill_HeaderSearchInput,
  SmartBillAssociateInput,
  SmartBillHeaderInput,
  SmartBillOperationInput,
} from '../dto/SmartCar.dto';
import { DatabaseManagerService } from 'src/database/database-manager.service';
import {
  SmartBill_CreateCostAllowanceInput,
  SmartBill_CreateCostInput,
  SmartBill_Withdraw_AddrowDtlInput,
  SmartBill_Withdraw_SaveInput,
  SmartBill_Withdraw_updateSBWInput,
  SmartBill_WithdrawDtl_DeleteCategoryInput,
  SmartBill_WithdrawDtl_SaveChangesCategoryInput,
} from '../dto/SmartBill.dto';
import { Request } from 'express';
import { UploadedFile } from 'express-fileupload';
import * as path from 'path';
import * as fs from 'fs';
@Injectable()
export class AppService {
  private readonly uploadDir = 'D:/files/smartBill/';
  private readonly baseUrl =
    process.env.BASE_URL || 'https://localhost:7777/smartbill/';
  private readonly usercode = 'SYSTEM';
  constructor(private readonly dbManager: DatabaseManagerService) {}

  async SmartBill_CreateForms(req: SmartBillHeaderInput) {
    const params = [
      { name: 'sb_code', type: sql.NVarChar(50), value: req.sb_code ?? '' },
      { name: 'usercode', type: sql.NVarChar(50), value: req.usercode },
      { name: 'sb_name', type: sql.NVarChar(100), value: req.sb_name },
      { name: 'sb_fristName', type: sql.NVarChar(50), value: req.sb_fristName },
      { name: 'sb_lastName', type: sql.NVarChar(50), value: req.sb_lastName },
      { name: 'clean_status', type: sql.Int(), value: req.clean_status },
      { name: 'group_status', type: sql.Int(), value: req.group_status },
      { name: 'reamarks', type: sql.NVarChar(200), value: req.reamarks },
      { name: 'car_infocode', type: sql.NVarChar(50), value: req.car_infocode },
      {
        name: 'car_infostatus_companny',
        type: sql.Bit(),
        value:
          req.car_infostatus_companny === '' || !req.car_infostatus_companny
            ? 0
            : req.car_infostatus_companny,
      },
      { name: 'car_categaryid', type: sql.Int(), value: req.car_categaryid },
      { name: 'car_typeid', type: sql.Int(), value: req.car_typeid },
      { name: 'car_band', type: sql.NVarChar(100), value: req.car_band },
      { name: 'car_tier', type: sql.NVarChar(50), value: req.car_tier },
      { name: 'car_color', type: sql.NVarChar(50), value: req.car_color },
      { name: 'car_remarks', type: sql.NVarChar(200), value: req.car_remarks },
      { name: 'car_milerate', type: sql.Int(), value: req.car_milerate },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_CreateForms`,
      params,
    );
  }

  async SmartBill_CreateOperation(
    data: SmartBillOperationInput,
    sb_code: string,
  ) {
    const params = [
      { name: 'sb_code', type: sql.NVarChar(50), value: sb_code },
      {
        name: 'sb_operationid_startdate',
        type: sql.NVarChar(20),
        value: data.sb_operationid_startdate,
      },
      {
        name: 'sb_operationid_startmile',
        type: sql.Int(),
        value: data.sb_operationid_startmile,
      },
      {
        name: 'sb_operationid_startoil',
        type: sql.Int(),
        value: data.sb_operationid_startoil,
      },
      {
        name: 'sb_operationid_enddate',
        type: sql.NVarChar(20),
        value: data.sb_operationid_enddate,
      },
      {
        name: 'sb_operationid_endoil',
        type: sql.Int(),
        value: data.sb_operationid_endoil,
      },
      {
        name: 'sb_operationid_endmile',
        type: sql.Int(),
        value: data.sb_operationid_endmile,
      },
      {
        name: 'sb_paystatus',
        type: sql.Int(),
        value: data.sb_paystatus,
      },
      {
        name: 'sb_operationid_location',
        type: sql.NVarChar(500),
        value: data.sb_operationid_location,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_CreateOperation`,
      params,
    );
  }

  async SmartBill_CreateAssociate(
    body: SmartBillAssociateInput,
    sb_code: string,
  ) {
    const params = [
      { name: 'sb_code', type: sql.NVarChar(50), value: sb_code },
      {
        name: 'allowance_usercode',
        type: sql.NVarChar(50),
        value: body.allowance_usercode,
      },
      {
        name: 'sb_associate_startdate',
        type: sql.NVarChar(20),
        value: body.sb_associate_startdate,
      },
      {
        name: 'sb_associate_enddate',
        type: sql.NVarChar(20),
        value: body.sb_associate_enddate,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_CreateAssociate`,
      params,
    );
  }

  async SmartBill_CarInfoSearch(body: SmartBill_CarInfoSearchInput) {
    const params = [
      {
        name: 'car_infocode',
        type: sql.NVarChar(50),
        value: body.car_infocode,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_CarInfoSearch`,
      params,
    );
  }

  async SmartBill_SelectHeaders(req: SmartBill_HeaderSearchInput) {
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_SelectHeaders_Cloud`,
      [
        { name: 'page', type: sql.Int(), value: req.page },
        { name: 'limit', type: sql.Int(), value: req.limit },
        { name: 'search', type: sql.NVarChar(200), value: req.search },
        { name: 'sb_code', type: sql.NVarChar(50), value: req.sb_code },
        {
          name: 'user_code',
          type: sql.NVarChar(50),
          value: req.user_code,
        },
        {
          name: 'car_info_code',
          type: sql.NVarChar(50),
          value: req.car_info_code,
        },
        {
          name: 'car_category_id',
          type: sql.Int(),
          value: req.car_category_id,
        },
        { name: 'status', type: sql.NVarChar(50), value: req.status },
      ],
    );
  }

  async SmartBill_Fetch_FilterOptions() {
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_Fetch_FilterOptions_Cloud`,
      [],
    );
  }

  async SmartBill_Control_Fetch_Filter_SearchCodes(
    search: string,
    offset: number,
    pageSize: number,
  ) {
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_Control_Fetch_Filter_SearchCodes`,
      [
        { name: 'search', type: sql.NVarChar(100), value: search },
        { name: 'offset', type: sql.Int(), value: offset },
        { name: 'pageSize', type: sql.Int(), value: pageSize },
      ],
    );
  }

  async SmartBill_SelectAllForms(body: { sb_Code: string }) {
    const params = [
      {
        name: 'sb_code',
        type: sql.VarChar(20),
        value: body.sb_Code,
      },
    ];
    return this.dbManager.executeStoredProcedureMultiple(
      `${databaseConfig.database}.dbo.SmartBill_SelectAllForms`,
      params,
    );
  }

  async SmartBill_ESGQuery(body: { startDate: string; endDate: string }) {
    const params = [
      {
        name: 'startDate',
        type: sql.NVarChar(100),
        value: body.startDate,
      },
      {
        name: 'endDate',
        type: sql.NVarChar(100),
        value: body.endDate,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_ESGQuery`,
      params,
    );
  }

  async SmartBill_Withdraw_Save(body: SmartBill_Withdraw_SaveInput) {
    const params = [
      {
        name: 'ownercode',
        type: sql.NVarChar(100),
        value: body.ownercode,
      },
      {
        name: 'car_infocode',
        type: sql.NVarChar(100),
        value: body.car_infocode === '' ? null : body.car_infocode,
      },
      {
        name: 'typePay',
        type: sql.NVarChar(20),
        value: body.typePay,
      },
      {
        name: 'condition',
        type: sql.Int(),
        value: body.condition,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_Withdraw_Save`,
      params,
    );
  }

  async SmartBill_Withdraw_SelectAllForms(body: { sbw_code: string }) {
    const params = [
      {
        name: 'sbw_code',
        type: sql.VarChar(50),
        value: body.sbw_code,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_Withdraw_SelectAllForms`,
      params,
    );
  }

  async SmartBill_WithdrawDtl_SelectCategory(body: {
    sbwdtl_id: number;
    category_id: number;
  }) {
    const params = [
      {
        name: 'sbwdtl_id',
        type: sql.Int(),
        value: body.sbwdtl_id,
      },
      {
        name: 'category_id',
        type: sql.Int(),
        value: body.category_id,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_Withdraw_SelectAllForms`,
      params,
    );
  }

  async SmartBill_CreateCost(body: SmartBill_CreateCostInput) {
    const params = [
      {
        name: 'sbwdtl_id',
        type: sql.Int(),
        value: parseInt(body.sbwdtl_id as string),
      },
      {
        name: 'cost_id',
        type: sql.Int(),
        value: body.cost_id === '' ? 0 : parseInt(body.cost_id as string),
      },
      {
        name: 'category_id',
        type: sql.Int(),
        value: parseInt(body.category_id as string),
      },
      {
        name: 'usercode',
        type: sql.VarChar(20),
        value: body.usercode,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_CreateCost`,
      params,
    );
  }

  async SmartBill_CreateCostAllowance(
    body: SmartBill_CreateCostAllowanceInput,
  ) {
    const params = [
      {
        name: 'sbwdtl_id',
        type: sql.Int(),
        value: parseInt(body.sbwdtl_id as string),
      },
      {
        name: 'cost_id',
        type: sql.Int(),
        value: parseInt(body.cost_id as string),
      },
      {
        name: 'category_id',
        type: sql.Int(),
        value: parseInt(body.category_id as string),
      },
      {
        name: 'usercode',
        type: sql.VarChar(20),
        value: body.usercode,
      },
      {
        name: 'amount',
        type: sql.Float(),
        value: parseFloat(body.amount as string),
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_CreateCostAllowance`,
      params,
    );
  }

  async SmartBill_WithdrawDtl_SaveChangesCategory(
    body: SmartBill_WithdrawDtl_SaveChangesCategoryInput,
  ) {
    const params = [
      {
        name: 'sbwdtl_id',
        type: sql.Int(),
        value: parseInt(body.sbwdtl_id as string),
      },
      {
        name: 'cost_id',
        type: sql.Int(),
        value: body.cost_id === '' ? null : parseInt(body.cost_id as string),
      },
      {
        name: 'id',
        type: sql.Int(),
        value: body.id,
      },
      {
        name: 'category_id',
        type: sql.Int(),
        value: parseInt(body.category_id as string),
      },
      {
        name: 'count',
        type: sql.Int(),
        value: body.count,
      },
      {
        name: 'startdate',
        type: sql.NVarChar(100),
        value: body.startdate,
      },
      {
        name: 'enddate',
        type: sql.NVarChar(100),
        value: body.enddate,
      },
      {
        name: 'sbc_hotelProvince',
        type: sql.NVarChar(200),
        value: body.sbc_hotelProvince,
      },
      {
        name: 'sbc_hotelname',
        type: sql.NVarChar(200),
        value: body.sbc_hotelname,
      },
      {
        name: 'usercode',
        type: sql.NVarChar(20),
        value: body.usercode ?? 'SYSTEM',
      },
      {
        name: 'foodStatus',
        type: sql.Int(),
        value: parseInt(body.foodStatus as string),
      },
      {
        name: 'amount',
        type: sql.Float(),
        value: parseFloat(body.amount as string),
      },
      {
        name: 'category_name',
        type: sql.NVarChar(100),
        value: body.category_name ?? null,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_WithdrawDtl_SaveChangesCategory`,
      params,
    );
  }

  async SmartBill_WithdrawDtl_DeleteCategory(
    body: SmartBill_WithdrawDtl_DeleteCategoryInput,
  ) {
    const params = [
      {
        name: 'sbwdtl_id',
        type: sql.Int(),
        value: parseInt(body.sbwdtl_id as string),
      },
      {
        name: 'cost_id',
        type: sql.Int(),
        value: body.cost_id === '' ? null : parseInt(body.cost_id as string),
      },
      {
        name: 'category_id',
        type: sql.Int(),
        value: body.category_id,
      },
      {
        name: 'id',
        type: sql.Int(),
        value: parseInt(body.id as string),
      },
      {
        name: 'usercode',
        type: sql.NVarChar(20),
        value: body.usercode,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_WithdrawDtl_DeleteCategory`,
      params,
    );
  }

  async SmartBill_Withdraw_Delete(body: { sbw_code: string }) {
    const params = [
      {
        name: 'sbw_code',
        type: sql.VarChar(20),
        value: body.sbw_code,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_Withdraw_Delete`,
      params,
    );
  }

  async SmartBill_WithdrawDtl_SaveChangesHotelGroup(body: {
    sbc_hotelid: number;
    usercode: string;
    amount: number;
  }) {
    const params = [
      { name: 'sbc_hotelid', type: sql.Int(), value: body.sbc_hotelid },
      { name: 'usercode', type: sql.VarChar(20), value: body.usercode },
      { name: 'amount', type: sql.Float(), value: body.amount },
    ];
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_WithdrawDtl_SaveChangesHotelGroup`,
      params,
    );
  }

  async SmartBill_WithdrawDtl_SelectHotelGroup(body: { sbc_hotelid: number }) {
    const params = [
      { name: 'sbc_hotelid', type: sql.Int(), value: body.sbc_hotelid },
    ];
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_WithdrawDtl_SelectHotelGroup`,
      params,
    );
  }

  async SmartBill_WithdrawDtl_DeleteHotelGroup(body: {
    sbc_hotelgroupid: number;
  }) {
    const params = [
      {
        name: 'sbc_hotelgroupid',
        type: sql.Int(),
        value: body.sbc_hotelgroupid,
      },
    ];
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_WithdrawDtl_DeleteHotelGroup`,
      params,
    );
  }

  async SmartBill_Withdraw_Addrow(body: { car_infocode: string }) {
    const params = [
      {
        name: 'car_infocode',
        type: sql.NVarChar(20),
        value: body.car_infocode,
      },
    ];
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_Withdraw_Addrow`,
      params,
    );
  }

  async SmartBill_Withdraw_AddrowDtl(body: SmartBill_Withdraw_AddrowDtlInput) {
    const params = [
      { name: 'sbw_code', type: sql.NVarChar(20), value: body.sbw_code },
      {
        name: 'sb_operationid',
        type: sql.Int(),
        value: body.sb_operationid ?? null,
      },
      { name: 'ownercode', type: sql.NVarChar(20), value: body.ownercode },
      {
        name: 'car_infocode',
        type: sql.NVarChar(20),
        value: body.car_infocode,
      },
      { name: 'remark', type: sql.NVarChar(20), value: body.remark },
      {
        name: 'sbwdtl_operationid_startdate',
        type: sql.NVarChar(20),
        value: body.sbwdtl_operationid_startdate,
      },
      {
        name: 'sbwdtl_operationid_enddate',
        type: sql.NVarChar(20),
        value: body.sbwdtl_operationid_enddate,
      },
      {
        name: 'sbwdtl_operationid_endmile',
        type: sql.Float(),
        value: body.sbwdtl_operationid_endmile,
      },
      {
        name: 'sbwdtl_operationid_startmile',
        type: sql.Float(),
        value: body.sbwdtl_operationid_startmile,
      },
    ];
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_Withdraw_AddrowDtl`,
      params,
    );
  }

  async SmartBill_WithdrawDtl_Delete(body: { sbwdtl_id: number }) {
    const params = [
      { name: 'sbwdtl_id', type: sql.Int(), value: body.sbwdtl_id },
    ];
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_WithdrawDtl_Delete`,
      params,
    );
  }

  async SmartBill_Withdraw_updateSBW(body: SmartBill_Withdraw_updateSBWInput) {
    const params = [
      { name: 'sbw_code', type: sql.NVarChar(20), value: body.sbw_code },
      {
        name: 'usercode',
        type: sql.NVarChar(20),
        value: body.usercode ?? null,
      },
      { name: 'pure_card', type: sql.Money(), value: body.pure_card ?? null },
      {
        name: 'condition',
        type: sql.Int(),
        value: parseInt(body.condition as string),
      },
      {
        name: 'car_infocode',
        type: sql.NVarChar(20),
        value: body.car_infocode,
      },
      { name: 'lock_status', type: sql.Int(), value: body.lock_status ?? 0 },
      { name: 'typePay', type: sql.NVarChar(20), value: body.typePay },
    ];
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_Withdraw_updateSBW`,
      params,
    );
  }

  async SmartBill_Withdraw_SelectCostOther() {
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_Withdraw_SelectCostOther`,
      [],
    );
  }

  async NonPO_Delete_Attach_By_attachid(body: { attachid: number }) {
    const params = [
      { name: 'attachid', type: sql.Int(), value: body.attachid },
      { name: 'userid', type: sql.Int(), value: 145 },
    ];
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.NonPO_Delete_Attach_By_attachid`,
      params,
    );
  }

  async SmartBill_AcceptHeader(body: { sb_code: string; usercode: string }) {
    const params = [
      { name: 'sb_code', type: sql.NVarChar(20), value: body.sb_code },
      { name: 'usercode', type: sql.NVarChar(20), value: body.usercode },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.SmartBill_AcceptHeader`,
      params,
    );
  }

  async NonPO_PermisstionOperator(body: { category_nonpo: string }) {
    const params = [
      {
        name: 'category_nonpo',
        type: sql.NVarChar(20),
        value: body.category_nonpo,
      },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.NonPO_PermisstionOperator`,
      params,
    );
  }

  async FA_Control_Running_NO(attach: string): Promise<string> {
    try {
      const pool = await this.dbManager.getPool();
      const request = pool.request();
      request.input('code', sql.VarChar(100), attach);
      request.input('date', sql.DateTime(), new Date());
      request.output('docno', sql.VarChar(100));
      const result = await request.execute(
        `${databaseConfig.database}.dbo.RunningNo`,
      );

      const docno = result.output.docno as string;

      if (!docno) {
        throw new Error('Failed to generate running number');
      }

      console.log('Generated docno:', docno);
      return docno;
    } catch (error) {
      console.error('Error in FA_Control_Running_NO:', error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`Cannot generate running number: ${error.message}`);
    }
  }

  async NonPO_Attatch_Save(req: {
    nonpocode: string;
    url: string;
    user: string;
    description: string;
  }) {
    const params = [
      { name: 'nonpocode', type: sql.NVarChar(255), value: req.nonpocode },
      { name: 'url', type: sql.NVarChar(255), value: req.url },
      { name: 'user', type: sql.NVarChar(255), value: req.user },
      { name: 'description', type: sql.NVarChar(255), value: req.description },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.NonPO_Attatch_Save`,
      params,
    );
  }

  async handleFileUpload(req: Request) {
    const file = req.files?.file as UploadedFile;
    const reqBody = req.body as { sb_code?: string };
    const st_code = reqBody.sb_code;

    if (!file) throw new Error('No file uploaded');

    console.log('📦 req.files:', req.files);
    console.log('📂 TEMP FILE PATH:', file.tempFilePath);

    const filename = file.name;
    const extension = path.extname(filename);
    const attach = 'ATT';
    const newPath = await this.FA_Control_Running_NO(attach);

    if (!newPath) throw new Error('Cannot generate running number');

    const newFileName = `${newPath}${extension}`;
    const savePath = path.join(this.uploadDir, newFileName);
    fs.mkdirSync(this.uploadDir, { recursive: true });

    // Copy file
    await fs.promises.copyFile(file.tempFilePath, savePath);
    await fs.promises.unlink(file.tempFilePath);
    const fileExists = fs.existsSync(savePath);
    console.log('📄 File exists?', fileExists);

    if (fileExists) {
      const stats = fs.statSync(savePath);
      console.log('📊 File size:', stats.size, 'bytes');
    }

    const fileUrl = `${this.baseUrl}${newFileName}`;

    const attachBody = {
      nonpocode: st_code ?? '',
      url: fileUrl,
      user: this.usercode,
      description: st_code ?? '',
    };

    await this.NonPO_Attatch_Save(attachBody);

    return {
      message: 'successfully',
      code: newPath,
      url: fileUrl,
      filePath: savePath, // เพิ่ม path จริง
    };
  }
}
