import { OptionEntity } from 'src/PTEC_FA/domain/ptec_fa.entity';

export class SmartBillHeaderDto {
  usercode: string;
  sb_name: string;
  sb_fristName: string;
  sb_lastName: string;
  clean_status: string;
  group_status: string;
  reamarks: string;
}

export class CarInfoDto {
  car_infocode: string;
  car_infostatus_companny: any;
  car_categaryid: number;
  car_typeid: number;
  car_band: string;
  car_tier: string;
  car_color: string;
  car_remarks: string;
  car_milerate: number;
}

export class SmartBillOperationDto {
  sb_code: string;
  sb_operationid?: number;
  sb_operationid_startdate: string;
  sb_operationid_startmile: number;
  sb_operationid_startoil: number;
  sb_operationid_enddate: string;
  sb_operationid_endoil: number;
  sb_operationid_endmile: number;
  sb_paystatus: number;
  sb_operationid_location: string;
  image1?: string;
  image2?: string;
  image3?: string;
}

export class SmartBillAssociateDto {
  // ใส่ field ตาม associate ที่ใช้
  [key: string]: any;
}

export class CreateSmartBillDto {
  sb_code?: string;
  create_usercode: string;
  smartBill_Header: SmartBillHeaderDto[];
  carInfo: CarInfoDto[];
  smartBill_Operation: SmartBillOperationDto[];
  smartBill_Associate: SmartBillAssociateDto[];
}

export class outputSmartBill {
  result: string;
}

export class SmartBillHeaderSearchDto {
  usercode?: string;
  sb_id?: number;
  sb_code?: string;
  sb_status_name?: string;
  sb_name?: string;
  userid?: number;
  sb_fristName?: string;
  sb_lastName?: string;
  car_infoid?: string;
  reamarks?: string;
  clean_status?: number;
  admin_approve?: string;
  admin_approveDate?: string;
  createdate?: string;
  car_infocode?: string;
  car_band?: string;
  car_tier?: string;
  car_color?: string;
  car_categary_name?: number;
  car_categaryid?: number;
  TotalCount: number;
  CurrentUserRole?: number;
}

export interface SmartCar_Fetch_FilterOptions_Entity {
  sb_codes: OptionEntity[];
  usercodes: OptionEntity[];
  car_infocodes: OptionEntity[];
  car_categories: OptionEntity[];
  sb_status: OptionEntity[];
}

export interface SmartBill_Fetch_FilterOptions_Entity {
  sbw_code: OptionEntity[];
  usercode: OptionEntity[];
  car_infocode: OptionEntity[];
  company: OptionEntity[];
}

export class SmartBill_Withdraw_AddrowDtlResponseDto {
  success: boolean;
  message?: string;
  inserted_id?: number | null;
  detail?: Record<string, any>;
  status?: string;
  error_message: string;
}

export class SmartBill_Withdraw_ListEntity {
  Name: string;
  UserCode: string;
  active: boolean;
  car_band: string;
  car_color: string;
  car_infocode: string;
  car_infoid: number;
  car_payname: string;
  car_paytype: number;
  car_tier: string;
  condition: number;
  createby: number;
  createdate: string;
  depcode: string;
  lock_status: boolean;
  ownercode: string;
  ownerid: number;
  pure_card: any;
  sbw_code: string;
  sbw_id: number;
  seccode: string;
  statusid: number;
  typePay: string;
  TotalCount: number;
  CurrentUserRole?: number;
}

export interface ESG_Report_Entity {
  car_band: string;
  car_color: string;
  car_infocode: string;
  car_remarks: string;
  car_tier: string;
  mile: number;
  oil: number;
  rateoil: number;
  TotalCount: number;
}

export interface SmartCarOperationResponse {
  status: 'SUCCESS' | 'FAILED';
  message: string;
  sb_operationid?: number;
}

export interface SmartCarOperationEntityImage {
  status: 'SUCCESS' | 'FAILED';
  message: string;
  sb_image_id?: number;
  image_url?: string;
}

export interface SmartCarOperationSelectForm {
  created_at: string;
  image_name: string;
  image_url: string;
  operation_index: number;
  sb_image_id: number;
  sb_operationid: number;
}

export interface SmartCarOperationFilesEntity {
  sb_image_id: number;
  sb_operationid: number;
  image_name: string;
  image_url: string;
  created_at: string;
  active: boolean | number;
}

export interface SmartCarOperationEntity {
  sb_code: string;
  sb_operationid: number;
  sb_operationid_startdate: string;
  sb_operationid_startmile: number;
  sb_operationid_startoil: number;
  sb_operationid_enddate: string;
  sb_operationid_endoil: number;
  sb_operationid_endmile: number;
  sb_paystatus: number;
  sb_operationid_location: string;
  active: boolean | number;
}

export interface SmartBillAcceptResult {
  success: number;
  message: string;
  sb_code: string;
  sb_id: number | null;
  admin_approve: string | null;
  admin_approveDate: Date | null;
  sb_status: number | null;
  car_infoid: number | null;
  updated_mile: number | null;
  car_infocode: string | null;
  usercode: string | null;
  sb_name: string | null;
  sb_fristName: string | null;
  sb_lastName: string | null;
  sb_status_name: string | null;
}
export interface SmartBillAcceptSuccessResponse {
  success: true;
  message: string;
  data: {
    sb_code: string;
    sb_id: number;
    sb_status: number;
    sb_status_name: string;
    admin_approve: string;
    admin_approveDate: Date;
    car_infoid: number;
    car_infocode: string;
    updated_mile: number;
    usercode: string;
    sb_name: string;
    sb_fristName: string;
    sb_lastName: string;
  };
}
export interface SmartBillAcceptErrorResponse {
  success: false;
  message: string;
  error: string;
  sb_code?: string | null;
}
