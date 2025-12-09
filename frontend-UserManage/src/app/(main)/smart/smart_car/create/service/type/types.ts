export interface UserData {
  UserCode: string;
  fristName: string;
  lastName: string;
}

export interface CarInfo {
  car_infocode: string;
  car_infostatus_companny: boolean;
  car_categaryid: number;
  car_typeid: number;
  car_band: string;
  car_tier: string;
  car_color: string;
  car_remarks: string;
  car_milerate?: number;
  car_payname?: string;
}

export interface Operation {
  carIndex: number;
  sb_operationid: number;
  sb_operationid_startdate: any;
  sb_operationid_startmile: number;
  sb_operationid_startoil: string;
  sb_operationid_enddate: any;
  sb_operationid_endoil: string;
  sb_operationid_endmile: string;
  sb_paystatus: string;
  sb_operationid_location: string;
  files?: SmartBillFile[]; 
  active?: boolean;
}
export interface SmartBillHeader {
  usercode: string;
  sb_name: string;
  sb_fristName: string;
  sb_lastName: string;
  clean_status: number;
  group_status: number;
  reamarks: string;
}
export interface SmartBillFile {
  image_url: string;
  image_name?: string; // ชื่อไฟล์ภาพจาก backend
  operation_index: number;
  sb_operationid: number | null;
  sb_image_id: number;
  created_at: string;
  filename?: string;
  fileData?: File | Blob | null;   
  isExisting: boolean;
}
