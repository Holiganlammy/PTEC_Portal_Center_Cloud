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
}

export interface Operation {
  carIndex: number;
  sb_operationid_startdate: any;
  sb_operationid_startmile: number;
  sb_operationid_startoil: string;
  sb_operationid_enddate: any;
  sb_operationid_endoil: string;
  sb_operationid_endmile: string;
  sb_paystatus: string;
  sb_operationid_location: string;
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