export interface FA_Control_Running_NO_Entity {
  nac_code: string;
  date_time: Date;
}

export interface FAControlUpdateDetailCountedInput {
  roundid: number;
  code: string;
  status: number;
  comment?: string;
  reference?: string;
  image_1?: string;
  image_2?: string;
  userid: number;
  UserBranch: string;
}

export interface NacCreateInput {
  nac_code: string;
  usercode: string;
  nac_type: number;
  nac_status: number;
  sum_price: number;
  des_dep_owner: string;
  des_bu_owner: string;
  des_usercode?: string;
  desFristName?: string;
  desLastName: string;
  des_date: string;
  des_remark: string;
  source_dep_owner: string;
  source_bu_owner?: string;
  source_usercode?: string;
  sourceFristName: string;
  sourceLastName: string;
  source_date: string;
  source_remark: string;
  verify_by_userid?: number;
  verify_date?: string;
  source_approve_userid?: number;
  source_approve_date?: string;
  account_aprrove_id?: number;
  account_aprrove_date?: string;
  finance_aprrove_id?: number;
  finance_aprrove_date?: string;
  real_price?: number;
  realPrice_Date?: string;
}

export interface FAControlUpdateInput {
  nac_code: string;
  usercode: string;
  nacdtl_assetsCode: string;
  nac_type: number;
  nac_status: number;
}

export interface store_FA_control_comment {
  nac_code: string;
  usercode: string;
  comment: string;
}

export interface FAControlCreateDetailNacInput {
  usercode: string;
  nac_code: string;
  nacdtl_row: number;
  nacdtl_assetsCode: string;
  nacdtl_assetsSeria?: string;
  nacdtl_assetsName?: string;
  create_date?: string;
  OwnerCode?: string;
  nacdtl_assetsDtl?: string;
  nacdtl_bookV: number;
  nacdtl_PriceSeals: number;
  nacdtl_profit: number;
  nacdtl_image_1: string;
  nacdtl_image_2: string;
}
export interface AssetReportItem {
  RowID: string;
  AssetID: string;
  Code: string;
  Name: string;
  BranchID: number;
  Status: boolean;
  Date: string;
  UserID: string;
  UserBranch: number;
  RoundID: string;
  Reference: string;
  comment: string | null;
  Position: string;
  remarker: string;
  typeCode: string;
  detail: string | null;
  ImagePath: string;
  ImagePath_2: string;
  personID: string;
  DepCode: string;
  OwnerID: string;
  EndDate_Success: string;
}

export interface FA_Control_NAC_Backlog {
  source_dep_owner: string;
  add_nac: number;
  tranfer_nac: number;
  delete_nac: number;
  sell_nac: number;
}

export interface FA_Control_AnnualGraph {
  create_year: number;
  nac_type: number;
  create_month: number;
  nac_count: number;
}
export interface FA_Control_Assets_TypeGroup {
  typeGroupID: string;
  typeCode: string;
  typeName: string;
  typeMenu: number;
}

export interface store_FA_control_comment_entity {
  nac_code: string;
  userid: string;
  comment: string;
  create_date: string;
}

export interface FA_Control_Create_Detail_NAC_Entity {
  nac_code: string;
  nacdtl_id: number;
  count_nac: number;
}

export interface AssetEntity {
  AssetID: number;
  Code: string;
  Name: string;
  AssetTypeID: number | null;
  Asset_group: string;
  Group_name: string;
  SupplierID: number | null;
  BranchID: number;
  OwnerID: number;
  DepID: number;
  SecID: number | null;
  Details: string;
  WarrantyBegin: string | null;
  WarrantyEnd: string | null;
  SerialNo: string;
  Price: number;
  InvoiceNo: string | null;
  InvoiceDate: string | null;
  AccountCode: string | null;
  StatusID: number | null;
  CreateBy: string;
  CreateDate: string;
  UpdateBy: string;
  UpdateDate: string;
  Position: string;
  ImagePath: string;
  active: number;
  ImagePath_2: string;
  PositionNumber: string | null;
  bac_status: number;
  CommitDate: string | null;
  typeCode: string;
  OwnerCode: string;
  BranchName: string;
}

export interface NacHeaderEntity {
  nac_code: string;
  nac_type: number;
  status_name: string;
  nac_status: number;
  source_dep_owner: string;
  source_bu_owner: string;
  source_usercode: string;
  source_userid: number;
  sourceFristName: string;
  sourceLastName: string;
  source_date: string; // ISO 8601 date string
  source_approve_usercode: string;
  source_approve_userid: number;
  source_approve_date: string;
  source_remark: string;
  des_dep_owner: string;
  des_bu_owner: string;
  des_usercode: string;
  des_userid: number;
  desFristName: string;
  desLastName: string;
  des_date: string;
  des_approve_usercode: string;
  des_approve_userid: number;
  des_approve_date: string;
  des_remark: string;
  verify_by_usercode: string;
  verify_by_userid: number;
  verify_date: string;
  sum_price: number;
  create_by: string;
  create_date: string;
  account_aprrove_usercode: string;
  account_aprrove_id: number;
  account_aprrove_date: string;
  real_price: number;
  realPrice_Date: string;
  finance_aprrove_usercode: string;
  finance_aprrove_id: number;
  finance_aprrove_date: string;
}

export interface FA_Control_execDocID_Entity {
  workflowlevel: number;
  name: string;
  approverid: string;
  limitamount: number;
  pendingday: number | null;
  status: number;
}

export interface FA_Control_select_dtl_Entity {
  nac_code: string;
  nacdtl_row: number;
  nacdtl_assetsCode: string;
  OwnerCode: string;
  nacdtl_assetsName: string;
  nacdtl_assetsSeria: number | null;
  nacdtl_assetsPrice: number;
  nacdtl_bookV: number | null;
  nacdtl_PriceSeals: number | null;
  nacdtl_profit: number | null;
  nacdtl_image_1: string;
  nacdtl_image_2: string;
}

export interface FA_control_update_DTL_Entity {
  nac_code: string;
  nacdtl_id: number;
  count_row: number;
}

export interface store_control_path {
  nac_code: string;
  userid: string;
  description: string;
  linkpath: string;
  create_date: string;
}

export interface QueryNACCommentEntity {
  userid: string;
  comment: string;
  create_date: string;
}

export interface QueryNACPath {
  nac_code: string;
  description: string;
  linkpath: string;
  userid: string;
  create_by: string;
  create_date: string;
}

export interface HistoryAssets {
  nacdtl_id: string;
  nac_code: string;
  nacdtl_assetsCode: string;
  name: string;
  workflowtypeid: number;
  nacdtl_assetsName: string;
  nacdtl_bookV: number | null;
  nacdtl_PriceSeals: number | null;
  nacdtl_profit: number | null;
  nacdtl_assetsPrice: number;
  nacdtl_date_asset: string; // ISO date string
  update_date: string;
  create_by: string;
  source_approve_userid: string;
  account_aprrove_id: string;
  OwnerID: string;
  typeCode: string;
}

export interface FA_Control_Select_MyNAC_Entity {
  nac_code: string;
  nac_status: number;
  status_name: string;
  sum_price: number;
  name: string;
  workflowtypeid: number;
  create_date: string;
  verify_by_userid: number | null;
  source_approve_userid: string;
  create_by: string;
  source_userid: string;
  des_userid: string;
  userid_approver: number | null;
  TypeCode: string;
}

export interface FA_Control_Fetch_Assets {
  AssetID: string;
  Code: string;
  Name: string;
  BranchID: number;
  Details: string | null;
  typeCode: string;
  SerialNo: string | null;
  Asset_group: string;
  Group_name: string;
  Price: number;
  CreateDate: string;
  UpdateDate: string;
  UpdateBy: string;
  Position: string;
  OwnerID: string;
  ImagePath: string;
  ImagePath_2: string;
  nac_processing: string | null;
  bac_status: number;
  Old_Details: string;
  Old_UpdateBy: string;
  Old_UpdateDate: string;
  TotalCount: number;
}

export interface FA_Control_Fetch_Assets_FilterOptions {
  codes?: OptionEntity[];
  name?: OptionEntity[];
  assetGroups?: OptionEntity[];
  groups?: OptionEntity[];
  locations?: OptionEntity[];
}

export interface OptionEntity {
  value: string;
  label: string;
}
