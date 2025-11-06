'use client';

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import client from '@/lib/axios/interceptors';
import { CarInfo } from '../../service/type/types';

interface CarTypeSelectionProps {
  typeCar: string;
  onTypeCarChange: (value: string) => void;
  onCarInfoDataChange: (companyData: CarInfo[], personalData: CarInfo[]) => void;
}

export default function CarTypeSelection({ 
  typeCar, 
  onTypeCarChange, 
  onCarInfoDataChange 
}: CarTypeSelectionProps) {
  
  const handleTypeChange = async (value: string) => {
    const body = { car_infocode: null };
    await client.post('/SmartBill_CarInfoSearch', body)
      .then((response) => {
        if (value === '1') {
          const companyData = response.data.filter((res: CarInfo) => res.car_infostatus_companny === true);
          const personalData = response.data.filter((res: CarInfo) => res.car_infostatus_companny === false);
          onCarInfoDataChange(companyData, personalData);
        } else {
          const companyData = response.data.filter((res: CarInfo) => res.car_infostatus_companny === true);
          const personalData = response.data.filter((res: CarInfo) => res.car_infostatus_companny === false);
          onCarInfoDataChange(companyData, personalData);
        }
        onTypeCarChange(value);
      });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-gray-900">
        ประเภทการใช้งานรถยนต์ <span className="text-red-500">*</span>
      </Label>
      <RadioGroup 
        value={typeCar} 
        onValueChange={handleTypeChange}
        className="flex gap-6"
      >
        {[
          { value: '1', label: 'รถบริษัท' },
          { value: '0', label: 'รถส่วนตัว' }
        ].map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`carType-${option.value}`} />
            <Label htmlFor={`carType-${option.value}`} className="text-sm font-medium text-gray-700 cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}