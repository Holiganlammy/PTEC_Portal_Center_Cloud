import { IsString, IsNotEmpty, IsNumber } from 'class-validator'; // ใช้ class-validator เพื่อตรวจสอบความถูกต้องของข้อมูล

export class SmartBillHeaderInput {
  @IsString()
  @IsNotEmpty()
  sb_code: string;

  @IsString()
  @IsNotEmpty()
  usercode: string;

  @IsString()
  @IsNotEmpty()
  sb_name: string;

  @IsString()
  @IsNotEmpty()
  sb_fristName: string;

  @IsString()
  @IsNotEmpty()
  sb_lastName: string;

  @IsNotEmpty()
  clean_status: boolean | number;

  @IsNotEmpty()
  group_status: boolean | number;

  @IsString()
  @IsNotEmpty()
  reamarks: string;

  @IsString()
  @IsNotEmpty()
  car_infocode: string;

  @IsNotEmpty()
  car_infostatus_companny: boolean | number | string;

  @IsNotEmpty()
  car_categaryid: boolean | number;

  @IsNotEmpty()
  car_typeid: boolean | number;

  @IsString()
  @IsNotEmpty()
  car_band: string;

  @IsString()
  @IsNotEmpty()
  car_tier: string;

  @IsString()
  @IsNotEmpty()
  car_color: string;

  @IsString()
  @IsNotEmpty()
  car_remarks: string;

  @IsNumber()
  @IsNotEmpty()
  car_milerate: number;
}

export class SmartBillOperationInput {
  @IsString()
  @IsNotEmpty()
  sb_code: string;

  @IsString()
  @IsNotEmpty()
  sb_operationid_startdate: string;

  @IsNumber()
  @IsNotEmpty()
  sb_operationid_startmile: number;

  @IsNumber()
  @IsNotEmpty()
  sb_operationid_startoil: number;

  @IsString()
  @IsNotEmpty()
  sb_operationid_enddate: string;

  @IsNumber()
  @IsNotEmpty()
  sb_operationid_endoil: number;

  @IsNumber()
  @IsNotEmpty()
  sb_operationid_endmile: number;

  @IsNumber()
  @IsNotEmpty()
  sb_paystatus: number;

  @IsString()
  @IsNotEmpty()
  sb_operationid_location: string;

  @IsString()
  @IsNotEmpty()
  car_milerate: number;
}

export class SmartBillAssociateInput {
  @IsString()
  @IsNotEmpty()
  sb_code: string;

  @IsString()
  @IsNotEmpty()
  allowance_usercode: string;

  @IsString()
  @IsNotEmpty()
  sb_associate_startdate: string;

  @IsString()
  @IsNotEmpty()
  sb_associate_enddate: string;
}

export class SmartBill_CarInfoSearchInput {
  @IsString()
  @IsNotEmpty()
  car_infocode: string;
}

export class SmartBill_HeaderSearchInput {
  @IsNumber()
  @IsNotEmpty()
  page: number;

  @IsNumber()
  @IsNotEmpty()
  limit: number;

  @IsString()
  search: string;

  @IsString()
  sb_code: string;

  @IsString()
  user_code: string;

  @IsString()
  car_info_code: string;

  @IsNumber()
  car_category_id: number;

  @IsString()
  status: string;
}
