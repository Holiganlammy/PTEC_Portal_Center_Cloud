import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class SmartBill_Withdraw_SaveInput {
  @IsString()
  @IsNotEmpty()
  ownercode: string;

  @IsString()
  @IsNotEmpty()
  car_infocode: string;

  @IsString()
  @IsNotEmpty()
  typePay: string;

  @IsBoolean()
  @IsNotEmpty()
  condition: number;
}

export class SmartBill_CreateCostInput {
  @IsNotEmpty()
  sbwdtl_id: number | string;

  @IsNotEmpty()
  cost_id: number | string;

  @IsNotEmpty()
  category_id: number | string;

  @IsString()
  @IsNotEmpty()
  usercode: string;
  amount: number;
}

export class SmartBill_CreateCostAllowanceInput {
  @IsNotEmpty()
  sbwdtl_id: number | string;

  @IsNotEmpty()
  cost_id: number | string;

  @IsNotEmpty()
  category_id: number | string;

  @IsString()
  @IsNotEmpty()
  usercode: string;

  @IsOptional()
  @IsNotEmpty()
  amount?: number | string;
}

export class SmartBill_WithdrawDtl_SaveChangesCategoryInput {
  @IsNotEmpty()
  sbwdtl_id: number | string;

  @IsNotEmpty()
  cost_id: number | string;

  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  category_id: number | string;

  @IsNumber()
  @IsNotEmpty()
  count: number;

  @IsString()
  @IsNotEmpty()
  startdate: string;

  @IsString()
  @IsNotEmpty()
  enddate: string;

  @IsString()
  @IsNotEmpty()
  sbc_hotelProvince: string;

  @IsString()
  @IsNotEmpty()
  sbc_hotelname: string;

  @IsString()
  usercode?: string;

  @IsNotEmpty()
  foodStatus: number | string;

  @IsNotEmpty()
  amount: number | string;

  @IsString()
  category_name?: string;
}

export class SmartBill_WithdrawDtl_DeleteCategoryInput {
  @IsNotEmpty()
  sbwdtl_id: number | string;

  @IsNotEmpty()
  cost_id: number | string;

  @IsNumber()
  @IsNotEmpty()
  category_id: number;

  @IsNotEmpty()
  id: number | string;

  @IsString()
  @IsNotEmpty()
  usercode: string;
}

export class SmartBill_Withdraw_AddrowDtlInput {
  @IsString()
  @IsNotEmpty()
  sbw_code: string;

  @IsNotEmpty()
  sb_operationid?: number | null;

  @IsString()
  @IsNotEmpty()
  ownercode: string;

  @IsString()
  @IsNotEmpty()
  car_infocode: string;

  @IsString()
  @IsNotEmpty()
  remark: string;

  @IsString()
  @IsNotEmpty()
  sbwdtl_operationid_startdate: string;

  @IsString()
  @IsNotEmpty()
  sbwdtl_operationid_enddate: string;

  @IsNumber()
  @IsNotEmpty()
  sbwdtl_operationid_endmile: number;

  @IsNumber()
  @IsNotEmpty()
  sbwdtl_operationid_startmile: number;
}

export class SmartBill_Withdraw_updateSBWInput {
  @IsString()
  @IsNotEmpty()
  sbw_code: string;

  @IsNotEmpty()
  usercode?: string | null;

  @IsNotEmpty()
  purecard?: number | null;

  @IsNotEmpty()
  condition: number | string;

  @IsString()
  @IsNotEmpty()
  car_infocode: string;

  @IsNumber()
  @IsNotEmpty()
  lock_status?: number;

  @IsString()
  @IsNotEmpty()
  typePay: string;
}

export class SmartBillUploadInput {
  @IsString()
  @IsNotEmpty()
  sb_code: string;
}

export class SmartBill_Withdraw_List {
  @IsNumber()
  @IsNotEmpty()
  page: number;

  @IsNumber()
  @IsNotEmpty()
  limit: number;

  @IsString()
  @IsOptional()
  sbw_code?: string;

  @IsString()
  @IsOptional()
  usercode?: string;

  @IsString()
  @IsOptional()
  car_infocode?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  search?: string;
}

export class ESG_Report {
  @IsNumber()
  @IsNotEmpty()
  page: number;

  @IsNumber()
  @IsNotEmpty()
  limit: number;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  car_infocode?: string;

  @IsString()
  @IsOptional()
  car_band?: string;

  @IsString()
  @IsOptional()
  car_color?: string;

  @IsString()
  @IsOptional()
  car_tier?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
