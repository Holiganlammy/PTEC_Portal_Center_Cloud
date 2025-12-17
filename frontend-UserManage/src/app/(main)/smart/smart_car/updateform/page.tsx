'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { AlertCircle, Check, Lock } from 'lucide-react'; //  เพิ่ม Lock icon
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation'; //  เพิ่ม useRouter
import client from '@/lib/axios/interceptors';
import { SmartBillFile } from '../create/service/type/types';
import {
  AlertDialog,
  AlertDialogAction,
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

// Import components
import CompanyHeader from '@/app/(main)/smart/smart_car/create/components/FormSubmit/CompanyHeader';
import UserInformation from '@/app/(main)/smart/smart_car/create/components/FormSubmit/UserInformation';
import CarTypeSelection from '@/app/(main)/smart/smart_car/create/components/CarForm/CarTypeSelection';
import CarForm from '@/app/(main)/smart/smart_car/create/components/CarForm/CarForm';

// Import types
import { UserData, CarInfo, Operation, SmartBillHeader } from '@/app/(main)/smart/smart_car/create/service/type/types';
import { Button } from '@/components/ui/button';

export default function FormsUpdate() {
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
  
  const [typeCar, setTypeCar] = useState<string>('');
  const [carInfoDataCompanny, setCarInfoDataCompanny] = useState<CarInfo[]>([]);
  const [carInfoData, setCarInfoData] = useState<CarInfo[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  
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

  const [dataFilesCount, setDataFilesCount] = useState<any>(null);

  const checkAccess = (ownerUserCode: string) => {
    const currentUserCode = session?.user?.UserCode;
    const currentRoleId = session?.user?.role_id;
    
    // ตรวจสอบ: เป็นเจ้าของ หรือ เป็น Admin
    const canAccess = currentUserCode === ownerUserCode || currentRoleId === 1;
    
    return canAccess;
  };

  const fetchSmartBillData = async (code: string) => {
    try {
      setIsLoading(true);
      setIsCheckingAccess(true);
      
      const response = await client.post('/SmartBill_SelectAllForms', {
        sb_Code: code
      });

      if (!response.data || response.data.length === 0) {
        showAlert('ไม่พบข้อมูล', 'ไม่พบข้อมูลที่ต้องการแก้ไข');
        setIsLoading(false);
        setIsCheckingAccess(false);
        return;
      }

      const headerAndCarData = response.data[0];
      
      if (headerAndCarData && headerAndCarData.length > 0) {
        const firstRecord = headerAndCarData[0];
        
        const canAccess = checkAccess(firstRecord.usercode);
        setHasAccess(canAccess);
        
        if (!canAccess) {
          setIsCheckingAccess(false);
          setIsLoading(false);
          return; // ออกจากฟังก์ชัน ไม่โหลดข้อมูล
        }
        
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

        // ตั้งค่า Cars
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
        
        // ตั้งค่าประเภทรถ
        if (carsData[0]?.car_infostatus_companny === true) {
          setTypeCar('1');
        } else {
          setTypeCar('0');
        }
      }

      // Index 1: Operations
      const operationsData = response.data[1];
      
      // Index 2: Associate
      const associateData = response.data[2];
      if (associateData && associateData.length > 0) {
        setSmartBill_Associate(associateData.map((assoc: any) => ({
          allowance_usercode: assoc.allowance_usercode || '',
          sb_associate_startdate: assoc.sb_associate_startdate || '',
          sb_associate_enddate: assoc.sb_associate_enddate || ''
        })));
      }

      // Index 3: Files
      const filesData = response.data[3];
      
      // ประมวลผล operations พร้อม files
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

  // Handlers
  const handleCompanyChange = (value: string) => {
    setSmartBillHeader(prev => ({ ...prev, sb_name: value }));
  };

  const handleHeaderChange = (header: SmartBillHeader) => {
    setSmartBillHeader(header);
  };

  const handleCarInfoDataChange = (companyData: CarInfo[], personalData: CarInfo[]) => {
    setCarInfoDataCompanny(companyData);
    setCarInfoData(personalData);
  };

  const handleCarChange = (index: number, field: keyof CarInfo, value: any) => {
    const newCars = [...cars];
    newCars[index] = { ...newCars[index], [field]: value };
    setCars(newCars);
  };

  const handleOperationChange = (index: number, field: keyof Operation, value: any) => {
    const newOperations = [...operations];
    newOperations[index] = { ...newOperations[index], [field]: value };
    setOperations(newOperations);
  };

  const handleRemoveCar = (carIndex: number) => {
    const newCars = [...cars];
    newCars.splice(carIndex, 1);
    setCars(newCars);

    const newOperations = operations
      .filter(op => op.carIndex !== carIndex)
      .map(op => ({
        ...op,
        carIndex: op.carIndex > carIndex ? op.carIndex - 1 : op.carIndex
      }));
    setOperations(newOperations);
  };

  const handleCarUpdate = (index: number, updatedCarData: Partial<CarInfo>) => {
    setCars(prevCars => {
      const newCars = [...prevCars];
      newCars[index] = { ...newCars[index], ...updatedCarData };
      return newCars;
    });
  };

  const handleAddOperation = (carIndex: number) => {
    const carOperations = operations.filter(op => op.carIndex === carIndex);
    const lastOp = carOperations[carOperations.length - 1];

    setOperations([...operations, {
      carIndex: carIndex,
      sb_operationid_startdate: null,
      sb_operationid_startmile: lastOp?.sb_operationid_endmile 
        ? parseFloat(lastOp.sb_operationid_endmile) 
        : cars[carIndex]?.car_milerate || 0,
      sb_operationid_startoil: '',
      sb_operationid_enddate: null,
      sb_operationid_endoil: '',
      sb_operationid_endmile: '',
      sb_paystatus: '',
      sb_operationid_location: '',
      sb_operationid: 0,
    }]);
  };

  const updateOperationMileRates = (carIndex: number, mileRate: number) => {
    const carOperations = operations.filter(op => op.carIndex === carIndex);
    if (carOperations.length > 0) {
      const newOperations = [...operations];
      const firstOpIndex = operations.indexOf(carOperations[0]);
      if (firstOpIndex !== -1) {
        newOperations[firstOpIndex].sb_operationid_startmile = mileRate;
      }
      setOperations(newOperations);
    }
  };

  const handleRemoveOperation = (opIndex: number) => {
    const newOperations = [...operations];
    newOperations.splice(opIndex, 1);
    setOperations(newOperations);
  };

  const handleFileUpload = async (event: any) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (!file) return;

    const fileBolb = URL.createObjectURL(file);
    const newFile = {
      file: fileBolb,
      fileData: file,
      filename: file.name,
      isExisting: false,
    };

    if (!dataFilesCount) {
      setDataFilesCount([newFile]);
    } else {
      setDataFilesCount([...dataFilesCount, newFile]);
    }
  };

  const handleFileRemove = async (index: number) => {
    const list = [...dataFilesCount];
    const fileToRemove = list[index];
    
    if (fileToRemove.isExisting && fileToRemove.fileId) {
      try {
        const response = await client.post('/SmartBill_Operation_DeleteImage', {
          attachid: fileToRemove.fileId
        });
        
        showAlert(
          "ลบไฟล์สำเร็จ", 
          `ไฟล์ ${fileToRemove.filename} ถูกลบออกจากระบบแล้ว`, 
          'success'
        );
        
      } catch (error: any) {
        console.error('Error deleting file from backend:', error);
        showAlert(
          "เกิดข้อผิดพลาด", 
          `ไม่สามารถลบไฟล์ ${fileToRemove.filename} จากระบบได้: ${error.message || 'กรุณาลองใหม่อีกครั้ง'}`
        );
        return;
      }
    }
    
    list.splice(index, 1);
    setDataFilesCount(list.length > 0 ? list : null);
    
    if (!fileToRemove.isExisting) {
      showAlert(
        "ลบไฟล์สำเร็จ", 
        `ไฟล์ ${fileToRemove.filename} ถูกลบออกจากรายการแล้ว`, 
        'success'
      );
    }
  };

  const handleSubmit = async () => {
    if (typeCar === '') {
      showAlert(
        "แจ้งเตือน",
        "กรุณาเลือกประเภทการใช้งานรถยนต์ (รถบริษัท หรือ รถส่วนตัว)"
      );
      return;
    }

    if (
      smartBillHeader.usercode === '' ||
      smartBillHeader.sb_fristName === '' ||
      smartBillHeader.sb_lastName === '' ||
      smartBillHeader.reamarks === ''
    ) {
      showAlert(
        "แจ้งเตือน",
        (smartBillHeader.sb_fristName === '' || smartBillHeader.sb_lastName === '') ? `ระบุชื่อจริง-นามสกุล` :
          (smartBillHeader.usercode === '') ? `ระบุผู้ทำรายการ` :
            smartBillHeader.reamarks === '' ? 'ระบุสถานที่จอดรถหลังการใช้งาน' : 'Error Code #54878584'
      );
      return;
    }

    const allCarsAreExisting = cars.every(car => 
      (typeCar === '1' ? carInfoDataCompanny : carInfoData)
        .some((existingCar) => existingCar.car_infocode === car.car_infocode)
    );

    if (allCarsAreExisting && operations.length === 0) {
      showAlert(
        "แจ้งเตือน",
        "กรุณาเพิ่มกิจกรรมการใช้งานก่อนส่งฟอร์ม"
      );
      return;
    }

    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      if (
        car.car_infocode === '' ||
        car.car_typeid === 0 ||
        car.car_band === '' ||
        car.car_tier === '' ||
        car.car_color === ''
      ) {
        showAlert(
          "แจ้งเตือน",
          `รถคันที่ ${i + 1}: ${car.car_infocode === '' ? 'ระบุเลขทะเบียน' :
          car.car_typeid === 0 ? 'ระบุประเภท' :
            car.car_band === '' ? 'ระบุแบรนด์' :
              car.car_tier === '' ? 'ระบุรุ่น' :
                car.car_color === '' ? 'ระบุสี' : 'Error Code #54878584'}`
        );
        return;
      }
    }

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      if (
        !op.sb_operationid_startdate ||
        op.sb_operationid_startmile === null ||
        op.sb_operationid_startmile === undefined ||
        op.sb_operationid_startoil === '' ||
        !op.sb_operationid_enddate ||
        op.sb_operationid_endoil === '' ||
        op.sb_operationid_endmile === '' ||
        op.sb_paystatus === '' ||
        op.sb_operationid_location === ''
      ) {
        const carOps = operations.filter(o => o.carIndex === op.carIndex);
        const opIndexInCar = carOps.indexOf(op) + 1;
        showAlert("แจ้งเตือน", 
          `รถคันที่ ${op.carIndex + 1}, กิจกรรมที่ ${opIndexInCar}: ${
            !op.sb_operationid_startdate || !op.sb_operationid_enddate ? 'ระบุวันที่เดินทาง' :
            !op.sb_operationid_startmile || !op.sb_operationid_endmile ? 'ระบุเลขไมลล์เดินทาง' :
            op.sb_operationid_startoil === '' || op.sb_operationid_endoil === '' ? 'ระบุปริมาณน้ำมัน' :
            op.sb_operationid_location === '' ? 'ระบุกิจกรรมที่ทำ' : 'ระบุข้อมูล Pay (เบิก/ไม่เบิก)'
          }`);
        return;
      }

      if (parseFloat(op.sb_operationid_startmile as any) > parseFloat(op.sb_operationid_endmile)) {
        const carOps = operations.filter(o => o.carIndex === op.carIndex);
        const opIndexInCar = carOps.indexOf(op) + 1;
        showAlert("แจ้งเตือน", `รถคันที่ ${op.carIndex + 1}, กิจกรรมที่ ${opIndexInCar}: เกิดข้อผิดพลาด *(ไมลล์สิ้นสุด < ไมลล์เริ่มต้น)`);
        return;
      }
    }

    const body = {
      sb_code: sbCode,
      create_usercode: session?.user?.UserCode || '',
      smartBill_Header: [smartBillHeader],
      carInfo: cars.map(car => ({
        ...car,
        car_infostatus_companny: typeCar
      })),
      smartBill_Operation: operations.map(({ carIndex, ...rest }) => ({
        ...rest,
        sb_operationid_startdate: rest.sb_operationid_startdate 
          ? dayjs(rest.sb_operationid_startdate).format('YYYY-MM-DD HH:mm:ss') 
          : null,
        sb_operationid_enddate: rest.sb_operationid_enddate 
          ? dayjs(rest.sb_operationid_enddate).format('YYYY-MM-DD HH:mm:ss') 
          : null,
      })),
      smartBill_Associate: smartBill_Associate,
    };

    console.log('Updating data:', JSON.stringify(body, null, 2));

    try {
      const response = await client.post('/SmartBill_UpdateForms', body);
      const { sb_code, sb_operationids } = response.data;
      
      for (let opIndex = 0; opIndex < operations.length; opIndex++) {
        const op = operations[opIndex];
        
        if (!op.files || op.files.length === 0) {
          console.log(`⚠️ Operation ${opIndex} ไม่มีไฟล์`);
          continue;
        }

        const sb_operationid = sb_operationids[opIndex];

        if (!sb_operationid) {
          console.error(`❌ Operation ${opIndex} ไม่มี ID`);
          continue;
        }

     
        for (let fileIndex = 0; fileIndex < op.files.length; fileIndex++) {
          const file = op.files[fileIndex];
          
          if (!file.fileData) {
            console.warn(`⚠️ File ${fileIndex} ไม่มี fileData`);
            continue;
          }

          let formData = new FormData();
          formData.append('file', file.fileData, file.filename);
          formData.append('sb_operationid', sb_operationid.toString());
          formData.append('usercode', session?.user?.UserCode || '');

          console.log(`📤 Uploading file ${fileIndex + 1}/${op.files.length} for operation ${opIndex}`);

          try {
            const uploadRes = await client.post('/SmartCar_files_save_image', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            console.log(` Upload success:`, uploadRes.data);
          } catch (uploadErr: any) {
            console.error(`❌ Upload error for operation ${opIndex}, file ${fileIndex}:`, uploadErr);
            throw new Error(`ไม่สามารถอัพโหลดไฟล์ที่ ${fileIndex + 1} ของกิจกรรมที่ ${opIndex + 1}: ${uploadErr.message}`);
          }
        }
      }

      showAlert("สำเร็จ", 'อัปเดตรายการแล้ว', 'success');
      
      setTimeout(() => {
        fetchSmartBillData(sbCode || '');
      }, 1500);

    } catch (error: any) {
      console.error('Update error:', error);
      showAlert("เกิดข้อผิดพลาด", `ไม่สามารถอัปเดตข้อมูลได้: ${error.message}`);
    }
  };

  const gettingUsers = async () => {
    await client.get('/getsUserForAssetsControl')
      .then((res) => {
        setUsers(res.data.data);
      });
  };

  useEffect(() => {
    gettingUsers();
  }, []);

  // Loading State
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

  // No Access Screen
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
              คุณไม่มีสิทธิ์ในการแก้ไขเอกสารนี้
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
                  ต้องเป็นเจ้าของเอกสาร
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  หรือเป็น Admin
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <CompanyHeader 
            companyName={smartBillHeader.sb_name}
            onCompanyChange={handleCompanyChange}
            sbCode={sbCode}
          />

          {/* Form Content */}
          <div className="p-8 space-y-8">
            {/* User Information */}
            <UserInformation 
              users={users}
              smartBillHeader={smartBillHeader}
              onHeaderChange={handleHeaderChange}
            />

            <div className="h-px bg-gray-200"></div>

            {/* Car Type Selection */}
            <CarTypeSelection 
              key={`car-type-${typeCar}-${Date.now()}`}
              typeCar={typeCar}
              onTypeCarChange={setTypeCar}
              onCarInfoDataChange={handleCarInfoDataChange}
              updateMode={true}
            />
            
            <div className="h-px bg-gray-200"></div>

            {/* Cars Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">รายการรถยนต์</h2>
              </div>

              {/* Cars List */}
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
                  onCarChange={handleCarChange}
                  onRemoveCar={handleRemoveCar}
                  onAddOperation={handleAddOperation}
                  onOperationChange={handleOperationChange}
                  onRemoveOperation={handleRemoveOperation}
                  onCarUpdate={handleCarUpdate}
                  onUpdateOperationMileRates={updateOperationMileRates}
                  isUpdateMode={true}
                />
              ))}
            </div>

            <div className="h-px bg-gray-200"></div>

            {/* Parking Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                ระบุสถานที่จอดรถหลังการใช้งาน <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={smartBillHeader.reamarks}
                onChange={(e) => setSmartBillHeader(prev => ({ ...prev, reamarks: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="ระบุสถานที่จอดรถ"
              />
            </div>

            {/* Car Wash Status */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">สถานะการล้างรถ</label>
              <RadioGroup
                className="flex gap-6"
                value={smartBillHeader.clean_status.toString()}
                onValueChange={(value) => setSmartBillHeader(prev => ({
                  ...prev,
                  clean_status: parseInt(value)
                }))}
              >
                {[
                  { value: 0, label: 'ไม่ได้ล้างรถ' },
                  { value: 1, label: 'ล้างรถ' }
                ].map((option) => (
                  <Label key={option.value} className="flex items-center gap-2 cursor-pointer group">
                    <RadioGroupItem
                      value={option.value.toString()}
                      checked={smartBillHeader.clean_status === option.value}
                      className="w-4 h-4 text-black border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="h-px bg-gray-200"></div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                onClick={() => handleSubmit()}
                className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all"
              >
                อัปเดตข้อมูล
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {alertTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              ตรวจสอบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}