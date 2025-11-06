interface DataUserList {
  UserID: number;          // ค่าที่ดูเหมือนเป็นหมายเลข ID
  UserCode: string;        // รหัสผู้ใช้
  Name: string | null;            // ชื่อเต็มของผู้ใช้
  BranchID: number;
  DepID: number;
  SecCode: string | null
  Email: string | null
  DepCode: string;
  UserType: string | null;
  fristName: string | null; 
  lastName: string | null;       
  img_profile: string | null | undefined;
  Tel: string | null | undefined;
  Position: string | null | undefined;
  PositionID: number;
  PositionCode: string | null | undefined;
  Actived: boolean;
  EmpUpper: string | null | undefined;
  password: string | null | undefined;
}

interface AssetValidateResult {
  Code: string;
  ExistsStatus: number; // 0 = ไม่ซ้ำ, 1 = ซ้ำ
}


interface AssetDataExcel {
    Code: string;
    Name: string;
    OwnerCode: string;
    Asset_group: string;
    Group_name: string;
    BranchID: string;
    SerialNo?: string;
    Price: number;
    CreateDate: string;
    CreateBy: string;
    Position: string;
    TypeGroup: string;
}


interface ValidationResult {
    valid: AssetDataExcel[];
    duplicateCodes: string[];
    invalidOwners: string[];
    invalidBranches: string[];
    invalidTypes: string[];
}