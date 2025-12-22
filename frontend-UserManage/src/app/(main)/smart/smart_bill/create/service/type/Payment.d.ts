interface smartBill_Withdraw {
    Name?: string | null
    UserCode?: string | null
    car_band?: string | null
    car_color?: string | null
    car_infocode?: string | null
    car_infoid?: number | null
    car_payname?: string | null
    car_paytype?: number | null
    car_tier?: string | null
    condition?: number | null
    createby?: number | null
    createdate?: string | null
    depcode?: string | null
    lock_status: boolean
    ownercode?: string | null
    ownerid?: number | null
    pure_card?: number | null
    sbw_code?: string | null
    sbw_id?: number | null
    seccode?: string | null
    statusid?: number | null
    typePay?: string | null
    condition?: number | null
}

interface smartBill_CategoryDetails {
    active: boolean
    amount?: number
    category_id?: number
    category_name?: string
    cost_id?: number
    count?: number
    enddate?: string
    foodStatus: boolean
    id: string
    sbc_allowanceid?: string
    sbc_hotelProvince?: string
    sbc_hotelid?: string
    sbc_hotelname?: string
    sbwdtl_id: string
    startdate?: String
    usercode?: string
    userid?: number
    max_allowance?: number
}

interface smartBill_Withdraw_Detail {
  amouthAll: number
  amouthAllowance: number
  amouthHotel: number
  amouthRush: number
  amouthTrueOil: number
  amouthother: number
  car_categary_name: string
  car_infostatus_companny: boolean
  car_typename: string
  oilBath: number
  oil_name: string
  price: number
  price_rateoil: number
  remark: string
  sb_operationid: number | null
  sbw_code: string | null
  sbwdtl_id: string
  sbwdtl_operationid_enddate: string
  sbwdtl_operationid_endmile: number
  sbwdtl_operationid_location: string
  sbwdtl_operationid_startdate: string
  sbwdtl_operationid_startmile: number
  sum_mile: number
  typePay: string
  sb_paystatus: boolean
}

interface smartBill_Withdraw_Header{
  Name: string
  UserCode: string
  active: boolean
  car_band: string
  car_color: string
  car_infocode: string
  car_infoid: number
  car_payname: string
  car_paytype: number
  car_tier: string
  condition: number
  createby: number
  createdate: string
  depcode: string
  lock_status: boolean
  ownercode: string
  ownerid: number
  pure_card: number
  sbw_code: string
  sbw_id: string
  seccode: string
  statusid: number
  typePay: string
}
interface smartBill_SelectHotelGroup{
    amount: number
    sbc_hotelgroupid: string
    sbc_hotelid: number
    usercode: string
}

interface smartBill_userGetWelfare {
  active: boolean
  amount: number
  usercode?: string
  userid?: number
  welfareid?: string
  welfaretypeid?: number
  province?: string  // เพิ่มสำหรับ hotel
  welfare_right?: number  // เพิ่มสำหรับ allowance
  
}
interface WelfareDataMap {
  [key: string]: smartBill_userGetWelfare | null
}

interface BaseNewItem {
  amount?: number | string
}

interface FuelNewItem extends BaseNewItem {
  date?: string
}

interface TollNewItem extends BaseNewItem {
  // toll ไม่มี field เพิ่มเติม
}

interface AllowanceNewItem extends BaseNewItem {
  usercode?: string
  startdate?: string
  enddate?: string
  rate?: number
  welfare_right?: number
  days?: number
  foodStatus?: boolean
}

interface HotelGuestItem {
  id: number | string
  usercode: string
  hotel_rate: number
  sbc_hotelgroupid?: string
  amount?: number | string
}

interface HotelNewItem extends BaseNewItem {
  hotel_name?: string
  province?: string
  nights?: number | string
  startdate?: string
  enddate?: string
  guests?: HotelGuestItem[]
}

interface OtherNewItem extends BaseNewItem {
  category_name?: string
}

interface Provinces {
  code: string
  geography_id: number
  id: number
  name_en: string
  name_th: string
  welfaretypeid: number
}

interface CostOther {
  category_id: number
  category_name: string
  createby: number
  createdate: string
  other_status: boolean
  updateby: number | null
  updatedate: string | null
}

interface UserHotelWelfare {
  BranchID: number
  DepCode: string
  DepID: number
  Email: string
  Name: string
  UserCode: string
  UserID: number
  UserType: null
  fristName: string
  lastName: string
}


type NewItemForm = 
  | FuelNewItem 
  | TollNewItem 
  | AllowanceNewItem 
  | HotelNewItem 
  | OtherNewItem
  | Record<string, any> 