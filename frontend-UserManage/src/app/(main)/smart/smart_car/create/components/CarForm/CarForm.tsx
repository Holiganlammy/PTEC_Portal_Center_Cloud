'use client';

import { Trash2, Calendar, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import client from '@/lib/axios/interceptors';
import { CarInfo, Operation } from '../../service/type/types';
import OperationForm from './OperationForm';
import { useState } from 'react';

interface CarFormProps {
  car: CarInfo;
  carIndex: number;
  typeCar: string;
  carInfoDataCompanny: CarInfo[];
  carInfoData: CarInfo[];
  operations: Operation[];
  totalCars: number;
  onCarChange: (index: number, field: keyof CarInfo, value: any) => void;
  onRemoveCar: (index: number) => void;
  onAddOperation: (carIndex: number) => void;
  onOperationChange: (index: number, field: keyof Operation, value: any) => void;
  onRemoveOperation: (index: number) => void;
  onUpdateOperationMileRates: (carIndex: number, mileRate: number) => void;
}

interface CarFormProps {
  car: CarInfo;
  carIndex: number;
  typeCar: string;
  carInfoDataCompanny: CarInfo[];
  carInfoData: CarInfo[];
  operations: Operation[];
  totalCars: number;
  onCarChange: (index: number, field: keyof CarInfo, value: any) => void;
  onCarUpdate: (index: number, updatedCarData: Partial<CarInfo>) => void; // เพิ่มบรรทัดนี้
  onRemoveCar: (index: number) => void;
  onAddOperation: (carIndex: number) => void;
  onOperationChange: (index: number, field: keyof Operation, value: any) => void;
  onRemoveOperation: (index: number) => void;
  onUpdateOperationMileRates: (carIndex: number, mileRate: number) => void;
}

export default function CarForm({ 
  car, 
  carIndex, 
  typeCar,
  carInfoDataCompanny,
  carInfoData,
  operations,
  totalCars,
  onCarChange,
  onCarUpdate, // เพิ่มบรรทัดนี้
  onRemoveCar,
  onAddOperation,
  onOperationChange,
  onRemoveOperation,
  onUpdateOperationMileRates
}: CarFormProps) {
  
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
  const carOperations = operations.filter(op => op.carIndex === carIndex);
  
  const handleCarSelect = async (selectedCarCode: string) => {
    console.log('=== START handleCarSelect ===');
    console.log('Selected car code:', selectedCarCode);
    
    // หารถที่เลือกจาก list
    const selectedCar = (typeCar === '1' ? carInfoDataCompanny : carInfoData)
      .find(c => c.car_infocode === selectedCarCode);
    
    if (!selectedCar) {
      console.error('Car not found in list');
      return;
    }
    
    console.log('Found car in list:', selectedCar);
    
    // ปิด popover ทันที
    setOpen(false);
    setSearchValue("");
    
    try {
      const body = { car_infocode: selectedCar.car_infocode };
      console.log('Calling API with:', body);
      
      const response = await client.post('/SmartBill_CarInfoSearch', body);
      
      console.log('API Response:', response.data);
      
      if (response.data && response.data.length > 0) {
        const updatedCar = response.data[0];
        console.log('Updated car from API:', updatedCar);
        
        // อัพเดทข้อมูลทั้งหมดพร้อมกัน
        const carUpdateData = {
          car_infocode: updatedCar.car_infocode || '',
          car_typeid: updatedCar.car_typeid || 0,
          car_band: updatedCar.car_band || '',
          car_tier: updatedCar.car_tier || '',
          car_color: updatedCar.car_color || '',
          car_milerate: updatedCar.car_milerate || 0,
          car_remarks: updatedCar.car_remarks || '',
          car_categaryid: updatedCar.car_categaryid || '',
        };
        
        console.log('Updating car with data:', carUpdateData);
        onCarUpdate(carIndex, carUpdateData);
        
        // อัพเดท operations mile rate
        if (updatedCar.car_milerate !== undefined) {
          onUpdateOperationMileRates(carIndex, updatedCar.car_milerate);
        }
        
        console.log('=== END handleCarSelect (Success) ===');
      } else {
        console.log('No data returned from API');
      }
    } catch (error) {
      console.error('Error fetching car data:', error);
      console.log('=== END handleCarSelect (Error) ===');
    }
  };

  const handleEndMileChange = (opIndex: number, value: string, carOps: Operation[]) => {
    onOperationChange(opIndex, 'sb_operationid_endmile', value);
    
    const currentOpCarIndex = carOps.findIndex(op => operations.indexOf(op) === opIndex);
    const nextOp = carOps[currentOpCarIndex + 1];
    
    if (nextOp) {
      const nextOpIndex = operations.indexOf(nextOp);
      onOperationChange(nextOpIndex, 'sb_operationid_startmile', parseFloat(value));
    }
  };


  return (
    <div className="border-2 border-gray-300 rounded-xl p-6 space-y-6 bg-white">
      {/* Car Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          เพิ่มรายการรถยนต์
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddOperation(carIndex)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
          >
            <Calendar className="w-4 h-4" />
            เพิ่มกิจกรรม
          </button>
          {totalCars > 1 && (
            <button
              onClick={() => onRemoveCar(carIndex)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Car Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            ทะเบียนรถ <span className="text-red-500">*</span>
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {car.car_infocode || "เลือกหรือพิมพ์ทะเบียน"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="ค้นหาทะเบียนรถ..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {(typeCar === '1' ? carInfoDataCompanny : carInfoData)
                    .filter(carData => {
                      if (!searchValue) return true;
                      const search = searchValue.toLowerCase();
                      return carData.car_infocode.toLowerCase().includes(search) ||
                             carData.car_band?.toLowerCase().includes(search) ||
                             carData.car_tier?.toLowerCase().includes(search);
                    })
                    .map((carData) => (
                      <CommandItem
                        key={carData.car_infocode}
                        value={carData.car_infocode}
                        onSelect={() => {
                          console.log('CommandItem clicked:', carData.car_infocode);
                          handleCarSelect(carData.car_infocode);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            car.car_infocode === carData.car_infocode
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{carData.car_infocode}</span>
                          <span className="text-xs text-gray-500">
                            {carData.car_band} {carData.car_tier} - {carData.car_color}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {!((typeCar === '1' ? carInfoDataCompanny : carInfoData)
            .some((c) => c.car_infocode === car.car_infocode)) && (
            <Input
              type="text"
              value={car.car_infocode}
              onChange={(e) => onCarChange(carIndex, 'car_infocode', e.target.value)}
              placeholder="พิมพ์ทะเบียนใหม่"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            ประเภทของรถ <span className="text-red-500">*</span>
          </label>
          <Select
            value={car.car_typeid && car.car_typeid > 0 ? car.car_typeid.toString() : ''}
            onValueChange={(value) => onCarChange(carIndex, 'car_typeid', parseInt(value))}
          >
            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <SelectValue placeholder="เลือกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">รถมอเตอร์ไซค์</SelectItem>
              <SelectItem value="3">รถยนต์</SelectItem>
              <SelectItem value="4">รถยนต์กระบะ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            ยี่ห้อของรถ <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={car.car_band || ''}
            onChange={(e) => onCarChange(carIndex, 'car_band', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            placeholder="ยี่ห้อ"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            รุ่น <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={car.car_tier || ''}
            onChange={(e) => onCarChange(carIndex, 'car_tier', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            placeholder="รุ่น"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            สีรถ <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={car.car_color || ''}
            onChange={(e) => onCarChange(carIndex, 'car_color', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            placeholder="สี"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            เลขไมล์ปัจจุบัน <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            value={car.car_milerate || ''}
            disabled={((typeCar === '1' ? carInfoDataCompanny : carInfoData)
              .some((c) => c.car_infocode === car.car_infocode))}
            onChange={(e) => {
              const mileRate = parseFloat(e.target.value) || 0;
              onCarChange(carIndex, 'car_milerate', mileRate);
              onUpdateOperationMileRates(carIndex, mileRate);
            }}
            className={cn(
              "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all",
              ((typeCar === '1' ? carInfoDataCompanny : carInfoData)
                .some((c) => c.car_infocode === car.car_infocode)) && "bg-gray-100 cursor-not-allowed"
            )}
            placeholder={((typeCar === '1' ? carInfoDataCompanny : carInfoData)
              .some((c) => c.car_infocode === car.car_infocode)) 
              ? "ข้อมูลจากระบบ" 
              : "กรอกเลขไมล์ปัจจุบัน"
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">หมายเหตุ</label>
        <Textarea
          value={car.car_remarks || ''}
          onChange={(e) => onCarChange(carIndex, 'car_remarks', e.target.value)}
          placeholder="หมายเหตุเพิ่มเติม"
          className="min-h-[80px]"
        />
      </div>

      {/* Operations for this car */}
      {carOperations.length > 0 && (
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">กิจกรรมการใช้งาน ({carOperations.length})</h4>
          
          {carOperations.map((operation, idx) => {
            const opGlobalIndex = operations.indexOf(operation);
            
            return (
              <OperationForm
                key={opGlobalIndex}
                operation={operation}
                operationIndex={opGlobalIndex}
                carOperationIndex={idx}
                onOperationChange={onOperationChange}
                onRemoveOperation={onRemoveOperation}
                onEndMileChange={handleEndMileChange}
                carOperations={carOperations}
              />
            );
          })}
        </div>
      )}

      {carOperations.length === 0 && (
        <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
          ยังไม่มีกิจกรรม - กดปุ่ม "เพิ่มกิจกรรม" เพื่อเพิ่มกิจกรรมสำหรับรถคันนี้
        </div>
      )}
    </div>
  );
}