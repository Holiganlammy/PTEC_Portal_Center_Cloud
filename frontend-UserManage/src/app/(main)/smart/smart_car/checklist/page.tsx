'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { AlertCircle, Check, CheckCircle, Info, Lock } from 'lucide-react'; //  เพิ่ม Lock
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation'; //  เพิ่ม useRouter
import client from '@/lib/axios/interceptors';
import { SmartBillFile } from '../create/service/type/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Import components
import CompanyHeader from '@/app/(main)/smart/smart_car/create/components/FormSubmit/CompanyHeader';
import UserInformation from '@/app/(main)/smart/smart_car/create/components/FormSubmit/UserInformation';
import CarTypeSelection from '@/app/(main)/smart/smart_car/create/components/CarForm/CarTypeSelection';
import CarForm from '@/app/(main)/smart/smart_car/create/components/CarForm/CarForm';

// Import types
import { UserData, CarInfo, Operation, SmartBillHeader } from '@/app/(main)/smart/smart_car/create/service/type/types';
import { Button } from '@/components/ui/button';

export default function ChecklistForm() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter(); //  เพิ่ม router
  const sbCode = searchParams.get('code');
  
  dayjs.extend(utc);
  dayjs.extend(timezone);
  
  const [isLoading, setIsLoading] = useState(true);
  
  //  เพิ่ม state สำหรับตรวจสอบสิทธิ์
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [adminApprove, setAdminApprove] = useState<string | null>(null);
  
  const [typeCar, setTypeCar] = useState<string>('');
  const [carInfoDataCompanny, setCarInfoDataCompanny] = useState<CarInfo[]>([]);
  const [carInfoData, setCarInfoData] = useState<CarInfo[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  
  // State สำหรับแสดงสถานะ
  const [statusName, setStatusName] = useState<string>('');
  const [statusType, setStatusType] = useState<'pending' | 'approved' | 'completed'>('pending');
  
  // State สำหรับปุ่มอนุมัติ
  const [showApproveButton, setShowApproveButton] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [usercheckCode, setUsercheckCode] = useState<string | null>(null);
  
  // Alert Dialog states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');

  const showAlert = (title: string, message: string, type: 'error' | 'success' = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
  };

  const [smartBillHeader, setSmartBillHeader] = useState<SmartBillHeader>({
    usercode: session?.user?.UserCode || '',
    sb_name: 'PTEC',
    sb_fristName: session?.user?.fristName || '',
    sb_lastName: session?.user?.lastName || '',
    clean_status: 0,
    group_status: 0,
    reamarks: '',
  });

  const [cars, setCars] = useState<CarInfo[]>([{
    car_infocode: '',
    car_infostatus_companny: false,
    car_categaryid: 5,
    car_typeid: 0,
    car_band: '',
    car_tier: '',
    car_color: '',
    car_remarks: '',
    car_milerate: 0,
  }]);

  const [operations, setOperations] = useState<Operation[]>([]);

  const [smartBill_Associate, setSmartBill_Associate] = useState([{
    allowance_usercode: '',
    sb_associate_startdate: '',
    sb_associate_enddate: ''
  }]);

  //  ฟังก์ชันตรวจสอบสิทธิ์การเข้าถึง
  const checkAccess = (adminApproveValue: string | null) => {
    const currentDepId = session?.user?.depid;
    
    // ตรวจสอบ: admin_approve เป็น null และ depid = 19 หรือ 23
    const canAccess = adminApproveValue == null && 
                     (currentDepId === 19 || currentDepId === 23);
    
    console.log('🔐 Checklist Access Check:', {
      adminApproveValue,
      currentDepId,
      canAccess
    });
    
    return canAccess;
  };

  // ฟังก์ชันกำหนด status type และ style
  const getStatusStyle = (statusText: string) => {
    if (statusText.includes('ตรวจสอบแล้ว')) {
      return {
        type: 'approved' as const,
        className: 'bg-green-100 text-green-800 border-green-300'
      };
    } else if (statusText.includes('ดำเนินการเสร็จสิ้น')) {
      return {
        type: 'completed' as const,
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      };
    } else if (statusText.includes('รอ Admin ตรวจสอบ')) {
      return {
        type: 'pending' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      };
    }
    return {
      type: 'pending' as const,
      className: 'bg-gray-100 text-gray-800 border-gray-300'
    };
  };

  // ฟังก์ชันตรวจสอบว่าควรแสดงปุ่มอนุมัติหรือไม่
  const checkApproveButtonVisibility = (carsData: CarInfo[], userCheckCode: string | null = null) => {
    const shouldShowApprove = carsData.length > 0 && 
      carsData.every(car => parseInt(car.car_typeid?.toString() || '0') === 3) &&
      (!userCheckCode || userCheckCode.trim() === '');
    
    setShowApproveButton(shouldShowApprove);
  };

  const handleApprove = async () => {
    setShowApproveDialog(false);
    setIsApproving(true);

    try {
      const response = await client.post('/SmartBill_AcceptHeader', {
        sb_code: sbCode,
        usercode: session?.user?.UserCode || ''
      });
      
      console.log('📤 Approve response:', response.data);
      
      if (response.data.success === true) {
        showAlert(
          "อนุมัติสำเร็จ", 
          `อนุมัติเอกสาร ${response.data.data.sb_code} เรียบร้อยแล้ว\n` +
          `โดย: ${response.data.data.admin_approve}\n` +
          `เวลา: ${dayjs(response.data.data.admin_approveDate).format('DD/MM/YYYY HH:mm')}\n` +
          `อัปเดตเลขไมล์: ${response.data.data.updated_mile} กม.`, 
          'success'
        );
      } else {
        showAlert(
          "เกิดข้อผิดพลาด", 
          response.data.message || 'ไม่สามารถอนุมัติเอกสารได้'
        );
      }

      setTimeout(() => {
        setAlertOpen(false);
        fetchSmartBillData(sbCode || '');
      }, 5000);

    } catch (error: any) {
      console.error('❌ Approve error:', error);
      showAlert(
        "เกิดข้อผิดพลาด", 
        `ไม่สามารถอนุมัติเอกสารได้: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsApproving(false);
    }
  };

  const fetchSmartBillData = async (code: string) => {
    try {
      setIsLoading(true);
      setIsCheckingAccess(true);
      
      const response = await client.post('/SmartBill_SelectAllForms', {
        sb_Code: code
      });

      console.log('📥 Fetched data:', response.data);

      if (!response.data || response.data.length === 0) {
        showAlert('ไม่พบข้อมูล', 'ไม่พบข้อมูลที่ต้องการแก้ไข');
        setIsLoading(false);
        setIsCheckingAccess(false);
        return;
      }

      const headerAndCarData = response.data[0];
      
      if (headerAndCarData && headerAndCarData.length > 0) {
        const firstRecord = headerAndCarData[0];
        
        //  เก็บค่า admin_approve
        const adminApproveValue = firstRecord.admin_approve || null;
        setAdminApprove(adminApproveValue);
        
        //  ตรวจสอบสิทธิ์การเข้าถึง
        const canAccess = checkAccess(adminApproveValue);
        setHasAccess(canAccess);
        
        if (!canAccess) {
          setIsCheckingAccess(false);
          setIsLoading(false);
          return; // ออกจากฟังก์ชัน ไม่โหลดข้อมูล
        }
        
        // ตั้งค่า Status Name และ Type
        const status = firstRecord.sb_status_name || 'รอ Admin ตรวจสอบ';
        setStatusName(status);
        const { type } = getStatusStyle(status);
        setStatusType(type);
        
        // ตั้งค่า Header
        setSmartBillHeader({
          usercode: firstRecord.usercode || '',
          sb_name: firstRecord.sb_name || 'PTEC',
          sb_fristName: firstRecord.sb_fristName || '',
          sb_lastName: firstRecord.sb_lastName || '',
          clean_status: firstRecord.clean_status ? 1 : 0,
          group_status: firstRecord.group_status ? 1 : 0,
          reamarks: firstRecord.reamarks || '',
        });

        setUsercheckCode(firstRecord.usercheck_code || null);

        const carsData = headerAndCarData.map((record: any) => ({
          car_infocode: record.car_infocode || '',
          car_infostatus_companny: record.car_infostatus_companny || false,
          car_categaryid: 5,
          car_typeid: parseInt(record.car_typeid) || 0,
          car_band: record.car_band || '',
          car_tier: record.car_tier || '',
          car_color: record.car_color || '',
          car_remarks: record.car_remarks || '',
          car_milerate: 0,
        }));
        
        setCars(carsData);
        checkApproveButtonVisibility(carsData, firstRecord.usercheck_code || null);
        
        if (carsData[0]?.car_infostatus_companny === true) {
          setTypeCar('1');
        } else {
          setTypeCar('0');
        }
      }

      const operationsData = response.data[1];
      const associateData = response.data[2];
      if (associateData && associateData.length > 0) {
        setSmartBill_Associate(associateData.map((assoc: any) => ({
          allowance_usercode: assoc.allowance_usercode || '',
          sb_associate_startdate: assoc.sb_associate_startdate || '',
          sb_associate_enddate: assoc.sb_associate_enddate || ''
        })));
      }

      const filesData = response.data[3];
      
      if (operationsData && operationsData.length > 0) {
        const operationIdToIndex = new Map<number, number>();
        operationsData.forEach((op: any, index: number) => {
          operationIdToIndex.set(parseInt(op.sb_operationid), index);
        });

        const filesByOperationId: { [key: number]: SmartBillFile[] } = {};
        
        if (filesData && filesData.length > 0) {
          filesData.forEach((file: any) => {
            const opId = parseInt(file.sb_operationid);
            
            if (!filesByOperationId[opId]) {
              filesByOperationId[opId] = [];
            }
            
            filesByOperationId[opId].push({
              image_url: file.image_url,
              sb_operationid: file.sb_operationid,
              image_name: file.image_name,
              sb_image_id: file.sb_image_id,
              operation_index: operationIdToIndex.get(opId) || 0,
              created_at: file.created_at,
              isExisting: true,
              fileData: null,
            });
          });
        }

        const opsData = operationsData.map((op: Operation, index: number) => {
          const opId = op.sb_operationid;
          const opFiles = filesByOperationId[opId] || [];
          return {
            carIndex: 0,
            sb_operationid: op.sb_operationid,
            sb_operationid_startdate: op.sb_operationid_startdate 
              ? dayjs(op.sb_operationid_startdate).toDate() 
              : null,
            sb_operationid_startmile: parseFloat(op.sb_operationid_startmile?.toString() || '0') || 0,
            sb_operationid_startoil: op.sb_operationid_startoil?.toString() || '',
            sb_operationid_enddate: op.sb_operationid_enddate 
              ? dayjs(op.sb_operationid_enddate).toDate() 
              : null,
            sb_operationid_endoil: op.sb_operationid_endoil?.toString() || '',
            sb_operationid_endmile: op.sb_operationid_endmile?.toString() || '',
            sb_paystatus: op.sb_paystatus ? '1' : '0',
            sb_operationid_location: op.sb_operationid_location || '',
            files: opFiles,
          };
        });
        setOperations(opsData);

        if (opsData.length > 0) {
          setCars(prevCars => {
            const newCars = [...prevCars];
            if (newCars[0]) {
              newCars[0].car_milerate = opsData[0].sb_operationid_startmile;
            }
            return newCars;
          });
        }
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
      setIsCheckingAccess(false);
    }
  };

  useEffect(() => {
    if (sbCode) {
      fetchSmartBillData(sbCode);
    } else {
      setIsLoading(false);
      setIsCheckingAccess(false);
    }
  }, [sbCode]);

  useEffect(() => {
    const loadCarData = async () => {
      if (typeCar && (typeCar === '0' || typeCar === '1')) {
        try {
          const body = { car_infocode: null };
          const response = await client.post('/SmartBill_CarInfoSearch', body);
          
          const companyData = response.data.filter((res: any) => res.car_infostatus_companny === true);
          const personalData = response.data.filter((res: any) => res.car_infostatus_companny === false);
          
          setCarInfoDataCompanny(companyData);
          setCarInfoData(personalData);
        } catch (error) {
          console.error('Error loading car data:', error);
        }
      }
    };

    loadCarData();
  }, [typeCar]);

  const gettingUsers = async () => {
    await client.get('/getsUserForAssetsControl').then((res) => {
      setUsers(res.data.data);
    });
  };

  useEffect(() => {
    gettingUsers();
  }, []);

  //  Loading State
  if (isLoading || isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isCheckingAccess ? 'กำลังตรวจสอบสิทธิ์...' : 'กำลังโหลดข้อมูล...'}
          </p>
        </div>
      </div>
    );
  }

  //  No Access Screen
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ไม่มีสิทธิ์เข้าถึง
            </h2>
            <p className="text-gray-600 mb-6">
              {adminApprove 
                ? 'เอกสารนี้ได้รับการอนุมัติแล้ว' 
                : 'คุณไม่มีสิทธิ์ในการตรวจสอบเอกสารนี้'}
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                เอกสาร: {sbCode}
              </span>
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/smart/smart_car')}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                กลับไปหน้ารายการ
              </Button>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="w-full"
              >
                ย้อนกลับ
              </Button>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 text-left">
              <p className="font-medium mb-2">เงื่อนไขการเข้าถึง:</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  เอกสารยังไม่ได้รับการอนุมัติ
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  เป็น Admin หรือ ฝ่าย IT (101ITO) หรือ ฝ่ายบริหารทั่วไป (101CAD)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //  No Code Screen
  if (!sbCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">ไม่พบรหัสเอกสาร กรุณาระบุ code ใน URL</p>
        </div>
      </div>
    );
  }

  //  Main Form (มีสิทธิ์เข้าถึง)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <CompanyHeader 
            companyName={smartBillHeader.sb_name}
            onCompanyChange={() => {}}
            sbCode={sbCode}
          />

          {/* Status Badge Section */}
          {statusName && (
            <div className="px-8 pt-6 pb-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-gray-600" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">สถานะเอกสาร:</span>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "px-3 py-1 text-sm font-medium border",
                      getStatusStyle(statusName).className
                    )}
                  >
                    {statusName}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Form Content - VIEW ONLY */}
          <div className="p-8 space-y-8">
            {/* User Information - Disabled */}
            <div className="space-y-4 opacity-75 pointer-events-none">
              <UserInformation 
                users={users}
                smartBillHeader={smartBillHeader}
                onHeaderChange={() => {}}
              />
            </div>

            <div className="h-px bg-gray-200"></div>

            {/* Car Type Selection - Disabled */}
            <div className="opacity-75 pointer-events-none">
              <CarTypeSelection 
                key={`car-type-${typeCar}-${Date.now()}`}
                typeCar={typeCar}
                onTypeCarChange={() => {}}
                onCarInfoDataChange={() => {}}
                updateMode={true}
              />
            </div>
            
            <div className="h-px bg-gray-200"></div>

            {/* Cars Section - Disabled */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">รายการรถยนต์</h2>
              </div>

              <div className="opacity-75 pointer-events-none">
                {cars.map((car, carIndex) => (
                  <CarForm
                    key={carIndex}
                    car={car}
                    carIndex={carIndex}
                    typeCar={typeCar}
                    carInfoDataCompanny={carInfoDataCompanny}
                    carInfoData={carInfoData}
                    operations={operations}
                    totalCars={cars.length}
                    onCarChange={() => {}}
                    onRemoveCar={() => {}}
                    onAddOperation={() => {}}
                    onOperationChange={() => {}}
                    onRemoveOperation={() => {}}
                    onCarUpdate={() => {}}
                    onUpdateOperationMileRates={() => {}}
                    isUpdateMode={true}
                  />
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-200"></div>

            {/* Parking Location - Disabled */}
            <div className="space-y-2 opacity-75 pointer-events-none">
              <label className="text-sm font-medium text-gray-900">
                สถานที่จอดรถหลังการใช้งาน
              </label>
              <Input
                type="text"
                value={smartBillHeader.reamarks}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            {/* Car Wash Status - Disabled */}
            <div className="space-y-3 opacity-75 pointer-events-none">
              <label className="text-sm font-medium text-gray-900">สถานะการล้างรถ</label>
              <RadioGroup
                className="flex gap-6"
                value={smartBillHeader.clean_status.toString()}
                disabled
              >
                {[
                  { value: 0, label: 'ไม่ได้ล้างรถ' },
                  { value: 1, label: 'ล้างรถ' }
                ].map((option) => (
                  <Label key={option.value} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={option.value.toString()}
                      checked={smartBillHeader.clean_status === option.value}
                      disabled
                      className="w-4 h-4 text-black border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="h-px bg-gray-200"></div>

            {/*  เหลือแค่ปุ่มอนุมัติ */}
            {showApproveButton && (
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={!(session?.user?.depid === 19 || session?.user?.depid === 23) || isApproving}
                  className={cn(
                    "px-6 py-2.5 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all",
                    "bg-green-600 text-white hover:bg-green-700 focus:ring-green-600",
                    "flex items-center gap-2",
                    isApproving && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isApproving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      กำลังอนุมัติ...
                    </>
                  ) : (
                    <>
                      <Check className='w-4 h-4'/>
                      ยืนยันการตรวจสอบ
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              ยืนยันการตรวจสอบเอกสาร
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              คุณต้องการยืนยันการตรวจสอบเอกสาร <span className="font-semibold">{sbCode}</span> ใช่หรือไม่?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                การอนุมัติจะบันทึกโดย: {session?.user?.UserCode || 'ไม่ทราบ'}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              ยืนยันการอนุมัติ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {alertType === 'success' ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {alertTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => fetchSmartBillData(sbCode || '')}>
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}