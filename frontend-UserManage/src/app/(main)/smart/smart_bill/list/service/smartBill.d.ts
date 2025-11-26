interface SmartBillData {
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
    condition:number
    createby: number
    createdate: string
    depcode: string
    lock_status: boolean
    ownercode: string
    ownerid: number
    pure_card: string | null
    sbw_code: string
    sbw_id: number
    seccode: string
    statusid: number
    typePay: string
    TotalCount: number;
}

interface SmartBill_FilterOption {
    sbw_code?: OptionEntity[];
    usercode?: OptionEntity[];
    car_infocode?: OptionEntity[];
    company?: OptionEntity[];
}
