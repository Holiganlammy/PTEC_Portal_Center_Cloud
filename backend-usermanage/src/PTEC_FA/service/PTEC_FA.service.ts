import { Injectable } from '@nestjs/common';
import * as sql from 'mssql';
import axios from 'axios';
import { DatabaseManagerService } from 'src/database/database-manager.service';
import { databaseConfig } from '../config/database.config';
import {
  FA_Control_New_Assets_Xlsx,
  FA_control_update_DTL,
  FAMobileUploadImageDto,
  store_FA_control_comment,
  stroe_FA_control_Path,
  UpdateDtlAssetDto,
  updateReferenceDto,
} from '../dto/FA_Control.dto';
import {
  FAControlUpdateDetailCountedInput,
  NacCreateInput,
  FAControlUpdateInput,
  FAControlCreateDetailNacInput,
} from '../domain/ptec_fa.entity';
import { Request } from 'express';
import { UploadedFile } from 'express-fileupload';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AppService {
  private readonly uploadDir = 'D:/files/NEW_NAC/';
  private readonly baseUrl = 'http://vpnptec.dyndns.org:33080/NEW_NAC/';
  private readonly usercode = 'SYSTEM';
  constructor(private readonly dbManager: DatabaseManagerService) {}

  async FA_Control_Running_NO() {
    try {
      return this.dbManager.query(
        `declare @nac_code varchar(100)
         declare @date_time datetime = getdate()
         exec [${databaseConfig.database}].[dbo].[RunningNo] 'ATT', @date_time, @nac_code output
         select @nac_code as ATT`,
      );
    } catch (error) {
      console.error('Error in RunningNo:', error);
      throw error;
    }
  }

  async FA_Control_Report_All_Counted_by_Description(Report_All_Counted_by_Description: {
    PeriodID: number;
  }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Report_All_Counted_by_Description_Cloud`,
        [
          {
            name: 'PeriodID',
            type: sql.Int(),
            value: Report_All_Counted_by_Description.PeriodID,
          },
        ],
      );
    } catch (error) {
      console.error(
        'Error in FA_Control_Report_All_Counted_by_Description:',
        error,
      );
      throw error;
    }
  }

  async FA_Control_NAC_Backlog() {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_NAC_Backlog`,
        [],
      );
    } catch (error) {
      console.error('Error in FA_Control_NAC_Backlog:', error);
      throw error;
    }
  }
  async FA_Control_AnnualGraph(TargetYear: number) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_AnnualGraph`,
        [{ name: 'TargetYear', type: sql.Int(), value: TargetYear }],
      );
    } catch (error) {
      console.error('Error in FA_Control_AnnualGraph:', error);
      throw error;
    }
  }

  async FA_Control_Fetch_Assets(
    usercode: string,
    page: number = 1,
    limit: number = 12,
    typeCode: string,
    code: string,
    name: string,
    owner: string,
    group: string,
    location: string,
    search: string,
  ) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Fetch_Assets_Cloud`,
        [
          { name: 'usercode', type: sql.VarChar(10), value: usercode },
          { name: 'page', type: sql.Int(), value: page },
          { name: 'limit', type: sql.Int(), value: limit },
          { name: 'typeCode', type: sql.NVarChar(50), value: typeCode },
          { name: 'code', type: sql.NVarChar(50), value: code },
          { name: 'name', type: sql.NVarChar(150), value: name },
          { name: 'owner', type: sql.NVarChar(50), value: owner },
          { name: 'group', type: sql.NVarChar(50), value: group },
          { name: 'location', type: sql.NVarChar(100), value: location },
          { name: 'search', type: sql.NVarChar(100), value: search },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Control_Fetch_Assets:', error);
      throw error;
    }
  }

  async FA_Control_UpdateDetailCounted(
    body: FAControlUpdateDetailCountedInput,
  ) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_UpdateDetailCounted`,
        [
          { name: 'roundid', type: sql.Int(), value: body.roundid },
          { name: 'code', type: sql.NVarChar(20), value: body.code },
          { name: 'status', type: sql.Int(), value: body.status },
          { name: 'comment', type: sql.NVarChar(255), value: body.comment },
          { name: 'reference', type: sql.NVarChar(100), value: body.reference },
          { name: 'image_1', type: sql.NVarChar(), value: body.image_1 },
          { name: 'image_2', type: sql.NVarChar(), value: body.image_2 },
          { name: 'userid', type: sql.Int(), value: body.userid },
          {
            name: 'UserBranch',
            type: sql.NVarChar(20),
            value: body.UserBranch,
          },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Control_UpdateDetailCounted:', error);
      throw error;
    }
  }

  async FA_Control_Assets_TypeGroup() {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Assets_TypeGroup`,
        [],
      );
    } catch (error) {
      console.error('Error in FA_Control_Assets_TypeGroup:', error);
      throw error;
    }
  }
  async FA_ControlNew_Create_NAC(body: NacCreateInput) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_ControlNew_Create_NAC`,
        [
          { name: 'nac_code', type: sql.VarChar(20), value: body.nac_code },
          { name: 'usercode', type: sql.VarChar(30), value: body.usercode },
          { name: 'nac_type', type: sql.Int(), value: body.nac_type },
          { name: 'nac_status', type: sql.Int(), value: body.nac_status },
          { name: 'sum_price', type: sql.Float(), value: body.sum_price },
          {
            name: 'des_dep_owner',
            type: sql.NVarChar(50),
            value: body.des_dep_owner,
          },
          {
            name: 'des_bu_owner',
            type: sql.NVarChar(50),
            value: body.des_bu_owner,
          },
          {
            name: 'des_usercode',
            type: sql.NVarChar(10),
            value: body.des_usercode ?? null,
          },
          {
            name: 'desFristName',
            type: sql.NVarChar(),
            value: body.desFristName ?? null,
          },
          {
            name: 'desLastName',
            type: sql.NVarChar(),
            value: body.desLastName,
          },
          { name: 'des_date', type: sql.DateTime(), value: body.des_date },
          {
            name: 'des_remark',
            type: sql.NVarChar(1024),
            value: body.des_remark,
          },
          {
            name: 'source_dep_owner',
            type: sql.NVarChar(50),
            value: body.source_dep_owner,
          },
          {
            name: 'source_bu_owner',
            type: sql.NVarChar(50),
            value: body.source_bu_owner ?? null,
          },
          {
            name: 'source_usercode',
            type: sql.NVarChar(10),
            value: body.source_usercode ?? null,
          },
          {
            name: 'sourceFristName',
            type: sql.NVarChar(),
            value: body.sourceFristName,
          },
          {
            name: 'sourceLastName',
            type: sql.NVarChar(),
            value: body.sourceLastName,
          },
          {
            name: 'source_date',
            type: sql.DateTime(),
            value: body.source_date,
          },
          {
            name: 'source_remark',
            type: sql.NVarChar(1024),
            value: body.source_remark,
          },
          {
            name: 'verify_by_userid',
            type: sql.Int(),
            value: body.verify_by_userid ?? null,
          },
          {
            name: 'verify_date',
            type: sql.DateTime(),
            value: body.verify_date ?? null,
          },
          {
            name: 'source_approve_userid',
            type: sql.Int(),
            value: body.source_approve_userid ?? null,
          },
          {
            name: 'source_approve_date',
            type: sql.DateTime(),
            value: body.source_approve_date ?? null,
          },
          {
            name: 'account_aprrove_id',
            type: sql.Int(),
            value: body.account_aprrove_id ?? null,
          },
          {
            name: 'account_aprrove_date',
            type: sql.DateTime(),
            value: body.account_aprrove_date ?? null,
          },
          {
            name: 'finance_aprrove_id',
            type: sql.Int(),
            value: body.finance_aprrove_id ?? null,
          },
          {
            name: 'finance_aprrove_date',
            type: sql.DateTime(),
            value: body.finance_aprrove_date ?? null,
          },
          {
            name: 'real_price',
            type: sql.Float(),
            value: body.real_price ?? null,
          },
          {
            name: 'realPrice_Date',
            type: sql.DateTime(),
            value: body.realPrice_Date ?? null,
          },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Control_Create_Document_NAC:', error);
      throw error;
    }
  }

  async store_FA_control_update_table(req: FAControlUpdateInput) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Update_Table`,
        [
          { name: 'nac_code', type: sql.VarChar(30), value: req.nac_code },
          { name: 'usercode', type: sql.VarChar(10), value: req.usercode },
          {
            name: 'nacdtl_assetsCode',
            type: sql.VarChar(50),
            value: req.nacdtl_assetsCode,
          },
          { name: 'nac_type', type: sql.Int(), value: req.nac_type },
          { name: 'nac_status', type: sql.Int(), value: req.nac_status },
        ],
      );
    } catch (error) {
      console.error('Error in store_FA_control_upadate_table:', error);
      throw error;
    }
  }
  async store_FA_control_comment(req: store_FA_control_comment) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_NAC_Comment`,
        [
          { name: 'nac_code', type: sql.VarChar(20), value: req.nac_code },
          { name: 'usercode', type: sql.NVarChar(20), value: req.usercode },
          { name: 'comment', type: sql.NVarChar(200), value: req.comment },
        ],
      );
    } catch (error) {
      console.error('Error in store_FA_control_comment:', error);
      throw error;
    }
  }

  async FA_Control_Create_Detail_NAC(req: FAControlCreateDetailNacInput) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Create_Detail_NAC`,
        [
          { name: 'usercode', type: sql.VarChar(20), value: req.usercode },
          { name: 'nac_code', type: sql.VarChar(20), value: req.nac_code },
          { name: 'nacdtl_row', type: sql.Int(), value: req.nacdtl_row },
          {
            name: 'nacdtl_assetsCode',
            type: sql.NVarChar(20),
            value: req.nacdtl_assetsCode,
          },
          {
            name: 'nacdtl_assetsSeria',
            type: sql.NVarChar(100),
            value: req.nacdtl_assetsSeria ?? null,
          },
          {
            name: 'nacdtl_assetsName',
            type: sql.NVarChar(200),
            value: req.nacdtl_assetsName ?? null,
          },
          {
            name: 'create_date',
            type: sql.DateTime(),
            value: req.create_date ?? null,
          },
          {
            name: 'OwnerCode',
            type: sql.NVarChar(20),
            value: req.OwnerCode ?? null,
          },
          {
            name: 'nacdtl_assetsDtl',
            type: sql.NVarChar(200),
            value: req.nacdtl_assetsDtl ?? null,
          },
          { name: 'nacdtl_bookV', type: sql.Float(), value: req.nacdtl_bookV },
          {
            name: 'nacdtl_PriceSeals',
            type: sql.Float(),
            value: req.nacdtl_PriceSeals,
          },
          {
            name: 'nacdtl_profit',
            type: sql.Float(),
            value: req.nacdtl_profit,
          },
          {
            name: 'nacdtl_image_1',
            type: sql.NVarChar(255),
            value: req.nacdtl_image_1,
          },
          {
            name: 'nacdtl_image_2',
            type: sql.NVarChar(255),
            value: req.nacdtl_image_2,
          },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Control_Create_Detail_NAC:', error);
      throw error;
    }
  }

  async store_FA_SendMail(req: { nac_code: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Controls_NAC_SendMail`,
        [{ name: 'nac_code', type: sql.VarChar(30), value: req.nac_code }],
      );
    } catch (error) {
      console.error('Error in store_FA_SendMail:', error);
      throw error;
    }
  }

  async AssetsAll_Control(req: { BranchID: number; usercode: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Mobile_AssetsAll_Control`,
        [
          { name: 'BranchID', type: sql.Int(), value: req.BranchID },
          {
            name: 'usercode',
            type: sql.NVarChar(),
            value: req.usercode ?? null,
          },
        ],
      );
    } catch (error) {
      console.error('Error in AssetsAll_Control:', error);
      throw error;
    }
  }

  async FA_control_select_headers(req: { nac_code: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_select_headers`,
        [{ name: 'nac_code', type: sql.NVarChar(20), value: req.nac_code }],
      );
    } catch (error) {
      console.error('Error in FA_control_select_headers:', error);
      throw error;
    }
  }

  async FA_Control_execDocID(req: { usercode: string; nac_code: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_execDocID`,
        [
          { name: 'nac_code', type: sql.NVarChar(20), value: req.nac_code },
          { name: 'usercode', type: sql.VarChar(10), value: req.usercode },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Control_execDocID:', error);
      throw error;
    }
  }

  async FA_Control_select_dtl(req: { nac_code: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_select_dtl`,
        [{ name: 'nac_code', type: sql.NVarChar(20), value: req.nac_code }],
      );
    } catch (error) {
      console.error('Error in FA_Control_select_dtl:', error);
      throw error;
    }
  }

  async FA_control_update_DTL(req: FA_control_update_DTL) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Update_DTL`,
        [
          { name: 'usercode', type: sql.VarChar(10), value: req.usercode },
          { name: 'nac_code', type: sql.NVarChar(20), value: req.nac_code },
          {
            name: 'nacdtl_assetsCode',
            type: sql.NVarChar(50),
            value: req.nacdtl_assetsCode,
          },
          {
            name: 'nacdtl_assetsName',
            type: sql.NVarChar(200),
            value: req.nacdtl_assetsName,
          },
          {
            name: 'nacdtl_assetsSeria',
            type: sql.NVarChar(50),
            value: req.nacdtl_assetsSeria,
          },
          {
            name: 'nacdtl_assetsDtl',
            type: sql.NVarChar(200),
            value: req.nacdtl_assetsDtl,
          },
          {
            name: 'nacdtl_assetsPrice',
            type: sql.Float(),
            value: req.nacdtl_assetsPrice,
          },
          { name: 'image_1', type: sql.NVarChar(), value: req.image_1 ?? null },
          { name: 'image_2', type: sql.NVarChar(), value: req.image_2 ?? null },
        ],
      );
    } catch (error) {
      console.error('Error in FA_control_update_DTL:', error);
      throw error;
    }
  }

  async FA_Control_CheckAssetCode_Process(req: { nacdtl_assetsCode: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_CheckAssetCode_Process`,
        [
          {
            name: 'nacdtl_assetsCode',
            type: sql.NVarChar(20),
            value: req.nacdtl_assetsCode,
          },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Control_CheckAssetCode_Process:', error);
      throw error;
    }
  }

  async stroe_FA_control_Path(req: stroe_FA_control_Path) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_NAC_PATH`,
        [
          { name: 'nac_code', type: sql.VarChar(20), value: req.nac_code },
          { name: 'usercode', type: sql.VarChar(10), value: req.usercode },
          {
            name: 'description',
            type: sql.NVarChar(200),
            value: req.description,
          },
          { name: 'linkpath', type: sql.NVarChar(200), value: req.linkpath },
        ],
      );
    } catch (error) {
      console.error('Error in stroe_FA_control_Path:', error);
      throw error;
    }
  }

  async qureyNAC_comment(req: { nac_code: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_qureyNAC_comment`,
        [{ name: 'nac_code', type: sql.VarChar(20), value: req.nac_code }],
      );
    } catch (error) {
      console.error('Error in qureyNAC_comment:', error);
      throw error;
    }
  }
  async qureyNAC_path(req: { nac_code: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_qureyNAC_path`,
        [{ name: 'nac_code', type: sql.VarChar(20), value: req.nac_code }],
      );
    } catch (error) {
      console.error('Error in qureyNAC_path:', error);
      throw error;
    }
  }

  async store_FA_control_HistorysAssets(req: { userCode: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.Fix_Assets_Control_HistoryAssets`,
        [{ name: 'userCode', type: sql.VarChar(20), value: req.userCode }],
      );
    } catch (error) {
      console.error('Error in store_FA_control_HistorysAssets:', error);
      throw error;
    }
  }

  async FA_Control_BPC_Running_NO() {
    try {
      return this.dbManager.query(
        `
          declare @KeyID varchar(100)
          declare @date_time datetime = getdate()
          exec [${databaseConfig.database}].[dbo].[RunningNo] 'TAB', @date_time, @KeyID output

          select @KeyID as TAB
      `,
      );
    } catch (error) {
      console.error('Error in FA_Control_BPC_Running_NO:', error);
      throw error;
    }
  }

  async FA_Control_New_Assets_Xlsx(req: FA_Control_New_Assets_Xlsx) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Upload_Assets_Xlsx`,
        [
          {
            name: 'UserCode',
            type: sql.NVarChar(),
            value: req.UserCode ?? null,
          },
          { name: 'Code', type: sql.NVarChar(), value: req.Code ?? null },
          { name: 'Name', type: sql.NVarChar(), value: req.Name ?? null },
          { name: 'BranchID', type: sql.Int(), value: req.BranchID ?? null },
          { name: 'Price', type: sql.NVarChar(), value: req.Price ?? null },
          {
            name: 'OwnerCode',
            type: sql.NVarChar(),
            value: req.OwnerCode ?? null,
          },
          {
            name: 'Asset_group',
            type: sql.NVarChar(),
            value: req.Asset_group ?? null,
          },
          {
            name: 'Group_name',
            type: sql.NVarChar(),
            value: req.Group_name ?? null,
          },
          {
            name: 'SerialNo',
            type: sql.NVarChar(),
            value: req.SerialNo ?? null,
          },
          {
            name: 'CreateDate',
            type: sql.NVarChar(),
            value: req.CreateDate ?? null,
          },
          {
            name: 'CreateBy',
            type: sql.NVarChar(),
            value: req.CreateBy ?? null,
          },
          {
            name: 'Position',
            type: sql.NVarChar(),
            value: req.Position ?? null,
          },
          { name: 'Details', type: sql.NVarChar(), value: req.Details ?? null },
          {
            name: 'TypeGroup',
            type: sql.NVarChar(),
            value: req.TypeGroup ?? null,
          },
          {
            name: 'bac_type',
            type: sql.NVarChar(),
            value: req.bac_type ?? null,
          },
          { name: 'key', type: sql.NVarChar(), value: req.keyID ?? null },
          {
            name: 'user_name',
            type: sql.NVarChar(),
            value: req.user_name ?? null,
          },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Control_New_Assets_Xlsx:', error);
      throw error;
    }
  }

  async FA_Control_import_dataXLSX_toAssets(req: {
    count: number;
    keyID: string;
  }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_import_dataXLSX_toAssets`,
        [
          { name: 'count', type: sql.Int(), value: req.count },
          { name: 'keyID', type: sql.NVarChar(), value: req.keyID },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Control_import_dataXLSX_toAssets:', error);
      throw error;
    }
  }

  async UpdateDtlAsset(req: UpdateDtlAssetDto) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.UpdateDtlAsset`,
        [
          { name: 'Code', type: sql.NVarChar(20), value: req.Code },
          { name: 'Name', type: sql.NVarChar(150), value: req.Name || null },
          {
            name: 'Asset_group',
            type: sql.NVarChar(50),
            value: req.Asset_group || null,
          },
          {
            name: 'Group_name',
            type: sql.NVarChar(50),
            value: req.Group_name || null,
          },
          { name: 'BranchID', type: sql.Int(), value: req.BranchID || null },
          {
            name: 'OwnerCode',
            type: sql.NVarChar(50),
            value: req.OwnerCode || null,
          },
          {
            name: 'Details',
            type: sql.NVarChar(255),
            value: req.Details || null,
          },
          {
            name: 'SerialNo',
            type: sql.NVarChar(100),
            value: req.SerialNo || null,
          },
          { name: 'Price', type: sql.Float(), value: req.Price || null },
          {
            name: 'Position',
            type: sql.NVarChar(100),
            value: req.Position || null,
          },
          {
            name: 'ImagePath',
            type: sql.NVarChar(),
            value: req.ImagePath || null,
          },
          {
            name: 'ImagePath_2',
            type: sql.NVarChar(),
            value: req.ImagePath_2 || null,
          },
          { name: 'UserCode', type: sql.NVarChar(50), value: req.UserCode },
        ],
      );
    } catch (error) {
      console.error('Error in UpdateDtlAsset:', error);
      throw error;
    }
  }

  async FA_control_updateStatus(req: {
    usercode: string;
    nac_code: string;
    nac_status: number;
  }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_updateStatus`,
        [
          { name: 'usercode', type: sql.NVarChar(10), value: req.usercode },
          { name: 'nac_code', type: sql.NVarChar(20), value: req.nac_code },
          { name: 'nac_status', type: sql.Int(), value: req.nac_status },
        ],
      );
    } catch (error) {
      console.error('Error in FA_control_updateStatus:', error);
      throw error;
    }
  }

  async store_FA_control_drop_NAC(req: { usercode: string; nac_code: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Drop_DocumentNAC`,
        [
          { name: 'usercode', type: sql.NVarChar(10), value: req.usercode },
          { name: 'nac_code', type: sql.NVarChar(20), value: req.nac_code },
        ],
      );
    } catch (error) {
      console.error('Error in store_FA_control_drop_NAC:', error);
      throw error;
    }
  }

  async FA_Control_Select_MyNAC(req: { usercode: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Select_MyNAC`,
        [{ name: 'usercode', type: sql.NVarChar(10), value: req.usercode }],
      );
    } catch (error) {
      console.error('Error in FA_Control_Select_MyNAC:', error);
      throw error;
    }
  }

  async FA_Control_Select_MyNAC_Approve(req: { usercode: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Select_MyNAC_Approve`,
        [{ name: 'usercode', type: sql.NVarChar(10), value: req.usercode }],
      );
    } catch (error) {
      console.error('Error in FA_Control_Select_MyNAC_Approve:', error);
      throw error;
    }
  }

  async FA_Control_ListStatus() {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_ListStatus`,
        [],
      );
    } catch (error) {
      console.error('Error in FA_Control_ListStatus:', error);
      throw error;
    }
  }

  async check_code_result(req: { Code: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Mobile_scan_check_result`,
        [{ name: 'Code', type: sql.NVarChar(30), value: req.Code }],
      );
    } catch (error) {
      console.error('Error in check_code_result:', error);
      throw error;
    }
  }

  async uploadImage(
    body: FAMobileUploadImageDto,
  ): Promise<FAMobileUploadImageDto[]> {
    const check = (await this.check_code_result({ Code: body.Code })) as {
      Code: string;
      ImagePath: string | null;
      ImagePath_2: string | null;
    }[];

    if (body.index === 0) {
      const isValid = await this.checkImageUrl(check[0].ImagePath as string);
      if (!isValid) {
        const dataImg = {
          code: check[0].Code,
          imagePath: null,
          imagePath_2: check[0].ImagePath_2,
        };
        await this.delete_image_asset(dataImg);
      }
    } else {
      const isValid = await this.checkImageUrl(check[0].ImagePath_2 as string);
      if (!isValid) {
        const dataImg = {
          code: check[0].Code,
          imagePath: check[0].ImagePath,
          imagePath_2: null,
        };
        await this.delete_image_asset(dataImg);
      }
    }

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.FA_Mobile_UploadImage`,
      [
        { name: 'Code', type: sql.NVarChar(30), value: body.Code },
        { name: 'index', type: sql.Int(), value: body.index },
        {
          name: 'imagePath',
          type: sql.NVarChar(),
          value: body.imagePath ?? null,
        },
        {
          name: 'imagePath_2',
          type: sql.NVarChar(),
          value: body.imagePath_2 ?? null,
        },
      ],
    );
  }

  private async checkImageUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url);
      const contentType = response.headers['content-type'] as
        | string
        | undefined;
      return contentType?.startsWith('image') ?? false;
    } catch (error) {
      console.error('Error checking image URL:', error);
      return false;
    }
  }

  private async delete_image_asset(data: {
    code: string;
    imagePath: string | null;
    imagePath_2: string | null;
  }) {
    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.[dbo].[FA_Mobile_checkImgUplode]`,
      [
        { name: 'code', type: sql.NVarChar(20), value: data.code },
        { name: 'image_1', type: sql.NVarChar(), value: data.imagePath },
        { name: 'image_2', type: sql.NVarChar(), value: data.imagePath_2 },
      ],
    );
  }

  async updateReference(req: updateReferenceDto) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Mobile_update_reference`,
        [
          { name: 'Reference', type: sql.NVarChar(100), value: req.Reference },
          { name: 'Code', type: sql.NVarChar(30), value: req.Code },
          { name: 'RoundID', type: sql.BigInt(), value: req.RoundID },
          { name: 'UserID', type: sql.BigInt(), value: req.UserID },
          { name: 'choice', type: sql.Int(), value: req.choice ?? 0 },
          { name: 'comment', type: sql.NVarChar(), value: req.comment ?? null },
        ],
      );
    } catch (error) {
      console.error('Error in updateReference:', error);
      throw error;
    }
  }

  //For Period System
  async period_login(req: { BranchID: number; RoundID: number }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Period_Time_Login`,
        [
          { name: 'BranchID', type: sql.Int(), value: Number(req.BranchID) },
          { name: 'RoundID', type: sql.Int(), value: Number(req.RoundID) },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Period_Time_Login:', error);
      throw error;
    }
  }

  async store_check_periodForUpdate(req: { PeriodID: number }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Period_check_periodForUpdate`,
        [{ name: 'PeriodID', type: sql.Int(), value: Number(req.PeriodID) }],
      );
    } catch (error) {
      console.error('Error in FA_Period_check_periodForUpdate:', error);
      throw error;
    }
  }

  async getsperiod_round(req: {
    BranchID: number;
    depCode: string;
    personID: number;
  }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Period_all_rounds`,
        [
          { name: 'BranchID', type: sql.Int(), value: Number(req.BranchID) },
          { name: 'depCode', type: sql.NVarChar(20), value: req.depCode },
          { name: 'personID', type: sql.Int(), value: Number(req.personID) },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Period_all_rounds:', error);
      throw error;
    }
  }

  async faPermissionBranch(req: { userCode: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Permission_Branch`,
        [{ name: 'userCode', type: sql.NVarChar(10), value: req.userCode }],
      );
    } catch (error) {
      console.error('Error in FA_Permission_Branch:', error);
      throw error;
    }
  }

  async createPeriod(req: {
    begindate: Date;
    enddate: Date;
    branchid: string;
    description: string;
    usercode: string;
    depcode?: string | null;
    personID?: string | null;
    keyID?: string | null;
  }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Create_Assets_Counted_After_Period`,
        [
          { name: 'begindate', type: sql.DateTime(), value: req.begindate },
          { name: 'enddate', type: sql.DateTime(), value: req.enddate },
          { name: 'branchid', type: sql.NVarChar(200), value: req.branchid },
          {
            name: 'description',
            type: sql.NVarChar(100),
            value: req.description,
          },
          { name: 'usercode', type: sql.NVarChar(10), value: req.usercode },
          {
            name: 'depcode',
            type: sql.NVarChar(200),
            value: req.depcode ?? null,
          },
          {
            name: 'personID',
            type: sql.NVarChar(200),
            value: req.personID ?? null,
          },
          { name: 'keyID', type: sql.NVarChar(100), value: req.keyID ?? null },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Create_Assets_Counted_After_Period:', error);
      throw error;
    }
  }

  async deletePeriod(req: { PeriodID: number }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Controls_Delete_Period`,
        [{ name: 'periodID', type: sql.Int(), value: req.PeriodID }],
      );
    } catch (error) {
      console.error('Error in FA_Controls_Delete_Period:', error);
      throw error;
    }
  }

  async FA_Period_update_period(req: {
    PeriodID: number;
    BeginDate: Date;
    EndDate: Date;
    BranchID: number;
    Description: string;
    usercode: string;
  }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Period_update_period`,
        [
          { name: 'BranchID', type: sql.Int(), value: req.BranchID },
          { name: 'BeginDate', type: sql.DateTime(), value: req.BeginDate },
          { name: 'EndDate', type: sql.DateTime(), value: req.EndDate },
          {
            name: 'Description',
            type: sql.NVarChar(100),
            value: req.Description,
          },
          { name: 'usercode', type: sql.VarChar(10), value: req.usercode },
          { name: 'PeriodID', type: sql.BigInt(), value: req.PeriodID },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Period_update_period:', error);
      throw error;
    }
  }

  async checkAssetsInPeriod(req: { PeriodID: number }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Period_check_assets_in_period`,
        [{ name: 'PeriodID', type: sql.Int(), value: req.PeriodID }],
      );
    } catch (error) {
      console.error('Error in FA_Period_check_assets_in_period:', error);
      throw error;
    }
  }

  async checkBranchInPeriod(req: { BranchID: number }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Period_check_branch`,
        [{ name: 'BranchID', type: sql.Int(), value: req.BranchID }],
      );
    } catch (error) {
      console.error('Error in FA_Period_check_branch:', error);
      throw error;
    }
  }

  async selectPeriod(req: { usercode: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.select_callPeriod`,
        [{ name: 'usercode', type: sql.VarChar(10), value: req.usercode }],
      );
    } catch (error) {
      console.error('Error in select_callPeriod:', error);
      throw error;
    }
  }

  async fetchBranchPeriod(req: { usercode: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Fetch_Branch_Period`,
        [{ name: 'usercode', type: sql.VarChar(10), value: req.usercode }],
      );
    } catch (error) {
      console.error('Error in FA_Control_Fetch_Branch_Period:', error);
      throw error;
    }
  }

  async getWebsiteRound(req: { BranchID: number }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Permission_Website`,
        [{ name: 'BranchID', type: sql.Int(), value: req.BranchID }],
      );
    } catch (error) {
      console.error('Error in FA_Permission_Website:', error);
      throw error;
    }
  }

  async FA_Period_GroupBy() {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Period_GroupBy`,
        [],
      );
    } catch (error) {
      console.error('Error in FA_Permission_Website:', error);
      throw error;
    }
  }

  //Upload Files
  async FA_Control_Running_NO_Files(
    attach: string,
  ): Promise<{ docno: string }[]> {
    const params = [
      { name: 'code', type: sql.VarChar(100), value: attach },
      { name: 'date', type: sql.DateTime(), value: new Date() },
      { name: 'docno', type: sql.VarChar(255), output: true },
    ];

    return this.dbManager.executeStoredProcedure(
      `${databaseConfig.database}.dbo.RunningNo`,
      params,
      (result) => {
        return [{ docno: (result.output as { docno?: string })?.docno ?? '' }];
      },
    );
  }

  async handleFileUpload(req: Request) {
    const file = req.files?.file as UploadedFile;
    const reqBody = req.body as { nac_code?: string };
    const nac_code = reqBody.nac_code;
    if (!file) {
      throw new Error('No file uploaded');
    }

    const filename = file.name;
    const extension = path.extname(filename);
    const attach = 'ATT';
    if (nac_code) {
      const newPath = await this.FA_Control_Running_NO_Files(attach);

      if (!newPath || !newPath[0]?.docno) {
        throw new Error('Cannot generate running number');
      }

      const newFileName = `${newPath[0].docno}${extension}`;
      const savePath = path.join(this.uploadDir, newFileName);
      fs.mkdirSync(this.uploadDir, { recursive: true });
      await file.mv(savePath);

      const attachBody = {
        nonpocode: nac_code ?? '',
        url: `${this.baseUrl}${newFileName}`,
        user: this.usercode,
        description: nac_code ?? '',
      };
      await this.NonPO_Attatch_Save(attachBody);

      return {
        message: 'successfully',
        code: newPath,
        url: `${this.baseUrl}${newFileName}`,
      };
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

  //Period
  async FA_Control_Fetch_Branch_Period(req: { usercode: string }) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Fetch_Branch_Period`,
        [{ name: 'usercode', type: sql.NVarChar(), value: req.usercode }],
      );
    } catch (error) {
      console.error('Error in FA_Control_Fetch_Branch_Period:', error);
      throw error;
    }
  }

  async FA_Control_Fetch_Assets_FilterOptions() {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Fetch_Assets_FilterOptions_Cloud`,
        [],
      );
    } catch (error) {
      console.error('Error in FA_Control_Fetch_Assets_FilterOptions:', error);
      throw error;
    }
  }

  async FA_Control_Fetch_Assets_FilterCode(
    search: string,
    offset: number,
    pageSize: number,
  ) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Fetch_Asset_SearchCodes`,
        [
          {
            name: 'search',
            type: sql.NVarChar(100),
            value: search,
          },
          {
            name: 'offset',
            type: sql.Int(),
            value: offset,
          },
          {
            name: 'pageSize',
            type: sql.Int(),
            value: pageSize,
          },
        ],
      );
    } catch (error) {
      console.error('Error in FA_Control_Fetch_Assets_FilterCode:', error);
      throw error;
    }
  }

  async FA_Control_Check_Assets_Codes(codes: string[]) {
    try {
      return this.dbManager.executeStoredProcedure(
        `${databaseConfig.database}.dbo.FA_Control_Validate_Import_Data`,
        [{ name: 'codes', type: sql.NVarChar(), value: codes }],
      );
    } catch (error) {
      console.error('Error in FA_Control_Check_Assets_Codes:', error);
      throw error;
    }
  }
}
