'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { AlertCircle, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import client from '@/lib/axios/interceptors';
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
import FileUpload from '@/app/(main)/smart/smart_car/create/components/FormSubmit/FileUpload';

// Import types
import { UserData, CarInfo, Operation, SmartBillHeader } from '@/app/(main)/smart/smart_car/create/service/type/types';

export default function FormsUpdate() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const sbCode = searchParams.get('code');
  
  dayjs.extend(utc);
  dayjs.extend(timezone);
  
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchSmartBillData = async (code: string) => {
    try {
      setIsLoading(true);
      
      const response = await client.post('/SmartBill_SelectAllForms', {
        sb_Code: code
      });

      console.log('Fetched data:', response.data);

      if (!response.data || response.data.length === 0) {
        showAlert('ไม่พบข้อมูล', 'ไม่พบข้อมูลที่ต้องการแก้ไข');
        setIsLoading(false);
        return;
      }
      const headerAndCarData = response.data[0];
      
      if (headerAndCarData && headerAndCarData.length > 0) {
        const firstRecord = headerAndCarData[0];
        
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

        // ตั้งค่า Cars จาก header data (แต่ละ record คือ 1 รถ)
        const carsData = headerAndCarData.map((record: any) => ({
          car_infocode: record.car_infocode || '',
          car_infostatus_companny: record.car_infostatus_companny || false,
          car_categaryid: 5, // ใช้ค่า default หรือดึงจาก record ถ้ามี
          car_typeid: parseInt(record.car_typeid) || 0,
          car_band: record.car_band || '',
          car_tier: record.car_tier || '',
          car_color: record.car_color || '',
          car_remarks: record.car_remarks || '',
          car_milerate: 0,
        }));
        
        setCars(carsData);
        if (carsData[0].car_infostatus_companny) {
          setTypeCar('1'); // รถบริษัท
        } else {
          setTypeCar('2'); // รถส่วนตัว
        }
      }

      // Index 1: Operations
      const operationsData = response.data[1];
      
      if (operationsData && operationsData.length > 0) {
        const opsData = operationsData.map((op: any, index: number) => ({
          carIndex: 0, // ถ้ามีหลายรถ ต้องจับคู่กับรถที่ถูกต้อง
          sb_operationid_startdate: op.sb_operationid_startdate 
            ? dayjs(op.sb_operationid_startdate).toDate() 
            : null,
          sb_operationid_startmile: parseFloat(op.sb_operationid_startmile) || 0,
          sb_operationid_startoil: op.sb_operationid_startoil?.toString() || '',
          sb_operationid_enddate: op.sb_operationid_enddate 
            ? dayjs(op.sb_operationid_enddate).toDate() 
            : null,
          sb_operationid_endoil: op.sb_operationid_endoil?.toString() || '',
          sb_operationid_endmile: op.sb_operationid_endmile?.toString() || '',
          sb_paystatus: op.sb_paystatus ? '1' : '0',
          sb_operationid_location: op.sb_operationid_location || '',
        }));
        
        setOperations(opsData);

        // อัปเดต car_milerate จาก operation แรก
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

      // Index 2: Associate (ถ้ามี)
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
      
      if (filesData && filesData.length > 0) {
        const files = filesData.map((file: any) => ({
          file: file.url, // URL ของรูปภาพ
          fileData: null, // ไม่มี fileData สำหรับไฟล์ที่มีอยู่แล้ว
          filename: file.description || `File_${file.NonPO_attatchid}`,
          isExisting: true, // flag สำหรับไฟล์ที่มีอยู่แล้ว
          fileId: file.NonPO_attatchid, // เก็บ ID ไว้สำหรับการลบ (ถ้าต้องการ)
        }));
        setDataFilesCount(files);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  // เรียกใช้ fetchSmartBillData เมื่อมี sbCode
  useEffect(() => {
    if (sbCode) {
      fetchSmartBillData(sbCode);
    } else {
      setIsLoading(false);
    }
  }, [sbCode]);

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

  const handleFileRemove = (index: number) => {
    const list = [...dataFilesCount];
    list.splice(index, 1);
    setDataFilesCount(list.length > 0 ? list : null);
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
        op.sb_operationid_startmile === 0 ||
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

    if (!dataFilesCount || dataFilesCount.length === 0) {
      showAlert("แจ้งเตือน", 'อัปโหลดรูปภาพอย่างน้อย 1 รูป');
      return;
    }

    const body = {
      sb_code: sbCode,
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
      // ใช้ POST สำหรับ update (ตาม API ของคุณ)
      const response = await client.post('/SmartBill_CreateForms', body);
      
      // อัปโหลดไฟล์ใหม่ (ถ้ามี)
      const newFiles = dataFilesCount.filter((file: any) => !file.isExisting);
      
      for (let i = 0; i < newFiles.length; i++) {
        let formData_1 = new FormData();
        formData_1.append('file', newFiles[i].fileData);
        formData_1.append('sb_code', sbCode || '');

        await client.post('/SmartBill_files', formData_1, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      showAlert("สำเร็จ", 'อัปเดตรายการแล้ว', 'success');
      
      // รีเฟรชข้อมูล
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

  // แสดง Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
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
              typeCar={typeCar}
              onTypeCarChange={setTypeCar}
              onCarInfoDataChange={handleCarInfoDataChange}
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

            {/* File Upload */}
            <FileUpload 
              dataFilesCount={dataFilesCount}
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
            />

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
              {alertType === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Check className="h-5 w-5 text-green-600" />
              )}
              {alertTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className={cn(
                "min-w-[100px]",
                alertType === 'success' 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-gray-900 hover:bg-gray-800"
              )}
            >
              ตรวจสอบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}