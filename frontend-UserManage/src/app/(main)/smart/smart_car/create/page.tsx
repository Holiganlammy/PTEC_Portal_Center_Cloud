'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { AlertCircle, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import client from '@/lib/axios/interceptors';
import { useRouter } from 'next/navigation'
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

// Import components
import CompanyHeader from '@/app/(main)/smart/smart_car/create/components/FormSubmit/CompanyHeader';
import UserInformation from '@/app/(main)/smart/smart_car/create/components/FormSubmit/UserInformation';
import CarTypeSelection from '@/app/(main)/smart/smart_car/create/components/CarForm/CarTypeSelection';
import CarForm from '@/app/(main)/smart/smart_car/create/components/CarForm/CarForm';
import FileUpload from '@/app/(main)/smart/smart_car/create/components/FormSubmit/FileUpload';

import { UserData, CarInfo, Operation, SmartBillHeader } from '@/app/(main)/smart/smart_car/create/service/type/types';

interface UploadedFile {
  file: string;
  fileData: File;
  filename: string;
}

export default function FormsStart() {
  const router = useRouter();
  const { data: session } = useSession();
  dayjs.extend(utc);
  dayjs.extend(timezone);

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

  const [dataFilesCount, setDataFilesCount] = useState<UploadedFile[] | null>(null);

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

  const handleCarChange = (index: number, field: keyof CarInfo, value: CarInfo[keyof CarInfo]) => {
    const newCars = [...cars];
    newCars[index] = { ...newCars[index], [field]: value };
    setCars(newCars);
  };

  const handleOperationChange = (index: number, field: keyof Operation, value: Operation[keyof Operation]) => {
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
    setOperations(prevOperations => {
      const carOperations = prevOperations.filter(op => op.carIndex === carIndex);

      // ถ้าไม่มีกิจกรรมเลย ให้เพิ่มได้เลย
      if (carOperations.length === 0) {
        const today = dayjs();
        return [...prevOperations, {
          carIndex: carIndex,
          sb_operationid_startdate: today.hour(8).minute(0).second(0),
          sb_operationid_startmile: cars[carIndex]?.car_milerate || 0,
          sb_operationid_startoil: '',
          sb_operationid_enddate: today.hour(17).minute(0).second(0),
          sb_operationid_endoil: '',
          sb_operationid_endmile: '',
          sb_paystatus: '',
          sb_operationid_location: '',
          files: [],
          sb_operationid: 0,
          return_parking_location: '',
        }];
      }

      const lastOp = carOperations[carOperations.length - 1];

      const lastEndMile = parseFloat(lastOp.sb_operationid_endmile || '0');
      const lastStartMile = parseFloat(lastOp.sb_operationid_startmile?.toString() || '0');

      if (!lastOp.sb_operationid_endmile || lastEndMile <= 0) {
        showAlert(
          'กรุณากรอกข้อมูลให้ครบ',
          'กรุณากรอกไมล์สิ้นสุดของกิจกรรมปัจจุบันก่อนเพิ่มกิจกรรมใหม่',
          'error'
        );
        return prevOperations;
      }

      if (lastEndMile < lastStartMile) {
        showAlert(
          'ข้อมูลไมล์ไม่ถูกต้อง',
          'ไมล์สิ้นสุดต้องมากกว่าหรือเท่ากับไมล์เริ่มต้น กรุณาตรวจสอบกิจกรรมปัจจุบัน',
          'error'
        );
        return prevOperations;
      }

      // เช็คว่ากรอกข้อมูลอื่นๆ ครบหรือยัง
      if (!lastOp.sb_paystatus || lastOp.sb_paystatus === '') {
        showAlert(
          'กรุณาเลือกสถานะการเบิก',
          'กรุณาเลือกสถานะ เบิก/ไม่เบิก ของกิจกรรมปัจจุบันก่อนเพิ่มกิจกรรมใหม่',
          'error'
        );
        return prevOperations;
      }

      if (!lastOp.sb_operationid_location || lastOp.sb_operationid_location.trim() === '') {
        showAlert(
          'กรุณากรอกรายละเอียดกิจกรรม',
          'กรุณาบันทึกกิจกรรมการใช้งานของกิจกรรมปัจจุบันก่อนเพิ่มกิจกรรมใหม่',
          'error'
        );
        return prevOperations;
      }

      if (!lastOp.sb_operationid_startoil || lastOp.sb_operationid_startoil === '') {
        showAlert(
          'กรุณาเลือกน้ำมันเริ่มต้น',
          'กรุณาเลือกปริมาณน้ำมันเริ่มต้นของกิจกรรมปัจจุบันก่อนเพิ่มกิจกรรมใหม่',
          'error'
        );
        return prevOperations;
      }

      if (!lastOp.sb_operationid_endoil || lastOp.sb_operationid_endoil === '') {
        showAlert(
          'กรุณาเลือกน้ำมันสิ้นสุด',
          'กรุณาเลือกปริมาณน้ำมันสิ้นสุดของกิจกรรมปัจจุบันก่อนเพิ่มกิจกรรมใหม่',
          'error'
        );
        return prevOperations;
      }

      // เช็คสถานที่จอดรถหลังการใช้งาน
      if (!lastOp.return_parking_location || lastOp.return_parking_location.trim() === '') {
        showAlert(
          'กรุณาระบุสถานที่จอดรถ',
          'กรุณาระบุสถานที่จอดรถหลังการใช้งานของกิจกรรมปัจจุบันก่อนเพิ่มกิจกรรมใหม่',
          'error'
        );
        return prevOperations;
      }

      // เช็ครูปภาพ
      if (!lastOp.files || lastOp.files.length === 0) {
        showAlert(
          'กรุณาอัพโหลดรูปภาพ',
          'กรุณาอัพโหลดรูปภาพอย่างน้อย 1 รูปสำหรับกิจกรรมปัจจุบันก่อนเพิ่มกิจกรรมใหม่',
          'error'
        );
        return prevOperations;
      }

      // เช็ควันที่และเวลา
      if (lastOp.sb_operationid_startdate && lastOp.sb_operationid_enddate) {
        const startDateTime = dayjs(lastOp.sb_operationid_startdate);
        const endDateTime = dayjs(lastOp.sb_operationid_enddate);

        if (startDateTime.isAfter(endDateTime)) {
          showAlert(
            'วันที่และเวลาไม่ถูกต้อง',
            'วันที่ออกเดินทางต้องไม่มากกว่าวันที่สิ้นสุด กรุณาตรวจสอบกิจกรรมปัจจุบัน',
            'error'
          );
          return prevOperations;
        }
      }

      //  ทุกอย่างผ่าน -> เพิ่มกิจกรรมใหม่
      const today = dayjs();
      const newOperation = {
        carIndex: carIndex,
        sb_operationid_startdate: lastOp.sb_operationid_enddate || today.hour(8).minute(0).second(0),
        sb_operationid_startmile: lastEndMile, // ใช้ไมล์สิ้นสุดจากกิจกรรมก่อนหน้า
        sb_operationid_startoil: lastOp.sb_operationid_endoil || '',
        sb_operationid_enddate: today.hour(17).minute(0).second(0),
        sb_operationid_endoil: '',
        sb_operationid_endmile: '',
        sb_paystatus: '',
        sb_operationid_location: '',
        files: [],
        sb_operationid: 0,
        return_parking_location: '',
      };

      console.log(' Adding new operation:', {
        carIndex,
        lastEndMile,
        newStartMile: newOperation.sb_operationid_startmile
      });

      return [...prevOperations, newOperation];
    });
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
    };

    if (!dataFilesCount) {
      setDataFilesCount([newFile]);
    } else {
      setDataFilesCount([...dataFilesCount, newFile]);
    }
  };

  const handleFileRemove = (index: number) => {
    if (!dataFilesCount) return;

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
      smartBillHeader.sb_lastName === ''
    ) {
      showAlert(
        "แจ้งเตือน",
        (smartBillHeader.sb_fristName === '' || smartBillHeader.sb_lastName === '') ? `ระบุชื่อจริง-นามสกุล` :
          (smartBillHeader.usercode === '') ? `ระบุผู้ทำรายการ` : 'Error Code #54878584'
      );
      return;
    }

    const allCarsAreExisting = cars.every(car =>
      (typeCar === '1' ? carInfoDataCompanny : carInfoData)
        .some((existingCar) => existingCar.car_infocode === car.car_infocode)
    );

    if (typeCar === '1') {
      const hasNewCars = cars.some(car =>
        !carInfoDataCompanny.some((existingCar) => existingCar.car_infocode === car.car_infocode)
      );

      if (hasNewCars) {
        showAlert(
          "แจ้งเตือน",
          "ไม่สามารถเพิ่มรถใหม่ในหมวดหมู่ 'รถบริษัท' ได้ กรุณาเลือกรถที่มีอยู่แล้ว หรือเปลี่ยนเป็น 'รถส่วนตัว'"
        );
        return;
      }
    }

    if (allCarsAreExisting && operations.length === 0) {
      showAlert(
        "แจ้งเตือน",
        "กรุณาเพิ่มกิจกรรมการใช้งานก่อนส่งฟอร์ม"
      );
      return;
    }

    // Validate all cars
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

      if (op.sb_operationid_startdate && op.sb_operationid_enddate) {
        const startDateTime = dayjs(op.sb_operationid_startdate);
        const endDateTime = dayjs(op.sb_operationid_enddate);

        if (startDateTime.isAfter(endDateTime)) {
          const carOps = operations.filter(o => o.carIndex === op.carIndex);
          const opIndexInCar = carOps.indexOf(op) + 1;
          showAlert(
            "แจ้งเตือน",
            `รถคันที่ ${op.carIndex + 1}, กิจกรรมที่ ${opIndexInCar}: วันที่ออกเดินทางต้องไม่มากกว่าวันที่สิ้นสุด`
          );
          return;
        }
        if (!op.files || op.files.length === 0) {
          const carOps = operations.filter(o => o.carIndex === op.carIndex);
          const opIndexInCar = carOps.indexOf(op) + 1;
          showAlert(
            "แจ้งเตือน",
            `รถคันที่ ${op.carIndex + 1}, กิจกรรมที่ ${opIndexInCar}: กรุณาอัพโหลดรูปภาพอย่างน้อย 1 รูป`
          );
          return;
        }

        if (endDateTime.isBefore(startDateTime)) {
          const carOps = operations.filter(o => o.carIndex === op.carIndex);
          const opIndexInCar = carOps.indexOf(op) + 1;
          showAlert(
            "แจ้งเตือน",
            `รถคันที่ ${op.carIndex + 1}, กิจกรรมที่ ${opIndexInCar}: วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่ออกเดินทาง`
          );
          return;
        }
      }

      if (!op.sb_paystatus || op.sb_paystatus === '') {
        const carOps = operations.filter(o => o.carIndex === op.carIndex);
        const opIndexInCar = carOps.indexOf(op) + 1;
        showAlert(
          "แจ้งเตือน",
          `รถคันที่ ${op.carIndex + 1}, กิจกรรมที่ ${opIndexInCar}: กรุณาเลือกสถานะการเบิก (เบิก/ไม่เบิก)`
        );
        return;
      }

      if (
        !op.sb_operationid_startdate ||
        op.sb_operationid_startmile === null ||
        op.sb_operationid_startmile === undefined ||
        op.sb_operationid_startoil === '' ||
        !op.sb_operationid_enddate ||
        op.sb_operationid_endoil === '' ||
        op.sb_operationid_endmile === '' ||
        op.sb_paystatus === '' ||
        op.sb_operationid_location === '' ||
        op.return_parking_location === ''
      ) {
        const carOps = operations.filter(o => o.carIndex === op.carIndex);
        const opIndexInCar = carOps.indexOf(op) + 1;
        showAlert("แจ้งเตือน",
          `รถคันที่ ${op.carIndex + 1}, กิจกรรมที่ ${opIndexInCar}: ${!op.sb_operationid_startdate || !op.sb_operationid_enddate ? 'ระบุวันที่เดินทาง' :
            !op.sb_operationid_startmile || !op.sb_operationid_endmile ? 'ระบุเลขไมลล์เดินทาง' :
              op.sb_operationid_startoil === '' || op.sb_operationid_endoil === '' ? 'ระบุปริมาณน้ำมัน' :
                op.sb_operationid_location === '' ? 'ระบุกิจกรรมที่ทำ' :
                  op.return_parking_location === '' ? 'ระบุสถานที่จอดรถหลังการใช้งาน' : 'ระบุข้อมูล Pay (เบิก/ไม่เบิก)'
          }`);
        return;
      }

      // Check mile validation
      if (parseFloat(op.sb_operationid_startmile as any) > parseFloat(op.sb_operationid_endmile)) {
        const carOps = operations.filter(o => o.carIndex === op.carIndex);
        const opIndexInCar = carOps.indexOf(op) + 1;
        showAlert("แจ้งเตือน", `รถคันที่ ${op.carIndex + 1}, กิจกรรมที่ ${opIndexInCar}: เกิดข้อผิดพลาด *(ไมลล์สิ้นสุด < ไมลล์เริ่มต้น)`);
        return;
      }
    }

    // if (!dataFilesCount) {
    //   showAlert("แจ้งเตือน", 'อัปโหลดรูปภาพอย่างน้อย 1 รูป');
    //   return;
    // }

    const body = {
      smartBill_Header: [smartBillHeader],
      carInfo: cars.map(car => ({
        ...car,
        car_infostatus_companny: parseInt(typeCar)
      })),
      smartBill_Operation: operations.map(({ carIndex, files, ...rest }) => ({
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

    console.log('Submitting data:', JSON.stringify(body, null, 2));

    try {
      const response = await client.post('/SmartBill_CreateForms', body);

      console.log(' Response:', response.data);

      const { sb_code, sb_operationids } = response.data;

      if (!sb_operationids) {
        throw new Error('ไม่ได้รับ sb_code หรือ operation_ids จาก server');
      }

      // Upload operation files
      for (let opIndex = 0; opIndex < operations.length; opIndex++) {
        const op = operations[opIndex];

        // ข้ามถ้าไม่มีไฟล์
        if (!op.files || op.files.length === 0) {
          console.log(`⚠️ Operation ${opIndex} ไม่มีไฟล์`);
          continue;
        }

        const sb_operationid = sb_operationids[opIndex];

        if (!sb_operationid) {
          console.error(`❌ Operation ${opIndex} ไม่มี ID`);
          continue;
        }

        console.log(`📤 Uploading files for operation ${opIndex} (ID: ${sb_operationid})`);
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

      // Upload SmartBill files (dataFilesCount)
      if (dataFilesCount && dataFilesCount.length > 0) {
        console.log(`📤 Uploading SmartBill files (${dataFilesCount.length} files)`);
        
        for (let i = 0; i < dataFilesCount.length; i++) {
          // Validate file data before upload
          if (!dataFilesCount[i].fileData || !(dataFilesCount[i].fileData instanceof File)) {
            throw new Error(`ไฟล์ที่ ${i + 1} ไม่ถูกต้อง กรุณาเลือกไฟล์ใหม่`);
          }

          console.log(`📤 Uploading SmartBill file ${i + 1}/${dataFilesCount.length}`);
          console.log('File data:', dataFilesCount[i].fileData);
          console.log('File type:', typeof dataFilesCount[i].fileData);
          console.log('Is File instance:', dataFilesCount[i].fileData instanceof File);

          let formData_1 = new FormData();
          formData_1.append('file', dataFilesCount[i].fileData);
          formData_1.append('sb_code', sb_code);

          try {
            const uploadRes = await client.post('/SmartBill_files', formData_1, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            console.log(` SmartBill file ${i + 1} uploaded successfully:`, uploadRes.data);
          } catch (uploadErr: any) {
            console.error(`❌ Upload error for SmartBill file ${i + 1}:`, uploadErr);
            throw new Error(`ไม่สามารถอัพโหลดไฟล์ที่ ${i + 1} ได้: ${uploadErr.message}`);
          }
        }
      }

      showAlert("สำเร็จ", 'บันทึกรายการแล้ว', 'success');

    } catch (error: any) {
      console.error('❌ Submit error:', error);
      showAlert(
        "เกิดข้อผิดพลาด",
        error.response?.data?.message || error.message || 'ไม่สามารถบันทึกข้อมูลได้'
      );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <CompanyHeader
            companyName={smartBillHeader.sb_name}
            onCompanyChange={handleCompanyChange}
          />

          {/* Form Content */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
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
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">รายการรถยนต์</h2>
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
                  onShowAlert={showAlert}
                />
              ))}
            </div>



            {/* Car Wash Status */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">สถานะการล้างรถ</label>
              <RadioGroup
                className="flex flex-col sm:flex-row gap-4 sm:gap-6"
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

            {/* <div className="h-px bg-gray-200"></div> */}

            {/* File Upload */}
            <FileUpload 
              dataFilesCount={dataFilesCount}
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
            /> 

            {/* Submit Button */}
            <div className="flex justify-center sm:justify-end pt-6 border-t border-gray-200">
              <button
                onClick={() => handleSubmit()}
                className="w-full sm:w-auto px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all text-sm sm:text-base"
              >
                {(() => {
                  const allCarsAreExisting = cars.every(car =>
                    (typeCar === '1' ? carInfoDataCompanny : carInfoData)
                      .some((existingCar) => existingCar.car_infocode === car.car_infocode)
                  );
                  if (allCarsAreExisting) {
                    return 'ส่งฟอร์ม';
                  }

                  if (operations.length > 0) {
                    return 'ส่งฟอร์ม';
                  }

                  return 'เพิ่มข้อมูลรถ';
                })()}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="max-w-md mx-4 sm:mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {alertType === 'success' ? (
                <>
                  <div className="absolute inset-0 bg-black/5 rounded-full blur-lg"></div>
                  <div className="relative w-16 h-16 bg-black rounded-full flex items-center justify-center">
                    <Check className="h-8 w-8 text-white" strokeWidth={3} />
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-red-500/10 rounded-full blur-lg"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <AlertDialogHeader className="space-y-3 text-center">
            <AlertDialogTitle className="text-xl font-semibold text-gray-900 text-center">
              {alertTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed text-center">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Footer */}
          <AlertDialogFooter className="mt-6">
            {alertType === 'success' ? (
              <AlertDialogAction
                onClick={() => {
                  setAlertOpen(false);
                  router.push('/smart/smart_car/list');
                }}
                className="w-full h-11 bg-black max-w-30 mx-auto hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all duration-200"
              >
                เรียบร้อย
              </AlertDialogAction>
            ) : (
              <AlertDialogAction className="flex-1 h-11 max-w-30 mx-auto bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all duration-200">
                ตรวจสอบ
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}