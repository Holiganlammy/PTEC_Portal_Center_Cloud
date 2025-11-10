interface carInfo {
    car_infoid: string,
    car_infocode: string,
    starting_mile: number,
    car_infostatus_companny: boolean,
    car_categaryid: number,
    car_typeid: number,
    car_band: string,
    car_tier: string,
    car_color: string,
    car_remarks: string,
    rateoil: number,
    active: number,
    createby: number,
    createdate: string,
    updateby: number | null,
    updatedate: string | null,
    seat_count: number | null,
    mileRate: number,
    car_payname: string
}

interface SmartCarData {
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
}

interface SmartCar_FilterOption {
  sb_codes?: OptionEntity[];
  usercodes?: OptionEntity[];
  car_infocodes?: OptionEntity[];
  car_categories?: OptionEntity[];
  sb_statuses?: OptionEntity[];
}
