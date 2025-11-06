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
  [key: string]: any;
}

export class SmartBillAssociateDto {
  // ใส่ field ตาม associate ที่ใช้
  [key: string]: any;
}

export class CreateSmartBillDto {
  sb_code?: string;
  smartBill_Header: SmartBillHeaderDto[];
  carInfo: CarInfoDto[];
  smartBill_Operation: SmartBillOperationDto[];
  smartBill_Associate: SmartBillAssociateDto[];
}

export class outputSmartBill {
  result: string;
}
