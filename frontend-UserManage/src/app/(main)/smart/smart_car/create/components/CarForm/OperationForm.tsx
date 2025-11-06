'use client';

import dayjs from 'dayjs';
import { X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { Operation } from '../../service/type/types';

interface OperationFormProps {
  operation: Operation;
  operationIndex: number;
  carOperationIndex: number;
  onOperationChange: (index: number, field: keyof Operation, value: any) => void;
  onRemoveOperation: (index: number) => void;
  onEndMileChange: (index: number, value: string, carOperations: Operation[]) => void;
  carOperations: Operation[];
}

const oil_persent = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export default function OperationForm({ 
  operation, 
  operationIndex, 
  carOperationIndex,
  onOperationChange,
  onRemoveOperation,
  onEndMileChange,
  carOperations
}: OperationFormProps) {
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-300 bg-white text-gray-700">
          กิจกรรมที่ {carOperationIndex + 1}
        </span>
        <button
          onClick={() => onRemoveOperation(operationIndex)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-900">
          เบิก/ไม่เบิก <span className="text-red-500">*</span>
        </label>
        <RadioGroup 
          value={operation.sb_paystatus}
          onValueChange={(value) => onOperationChange(operationIndex, 'sb_paystatus', value)}
          className="flex gap-6"
        >
          {[
            { value: '1', label: 'เบิก' },
            { value: '0', label: 'ไม่เบิก' }
          ].map((option) => (
            <Label key={option.value} className="flex items-center gap-2 cursor-pointer group">
              <RadioGroupItem 
                value={option.value}
                className="w-4 h-4 text-black border-gray-300 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{option.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          บันทึกกิจกรรมการใช้งาน <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={operation.sb_operationid_location}
          onChange={(e) => onOperationChange(operationIndex, 'sb_operationid_location', e.target.value)}
          placeholder="ระบุกิจกรรมที่ทำ..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            วันที่ออกเดินทาง <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={operation.sb_operationid_startdate ? dayjs(operation.sb_operationid_startdate).format('YYYY-MM-DDTHH:mm') : ''}
            onChange={(e) => {
              onOperationChange(operationIndex, 'sb_operationid_startdate', dayjs(e.target.value));
              onOperationChange(operationIndex, 'sb_operationid_enddate', dayjs(e.target.value));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            วันที่สิ้นสุด <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={operation.sb_operationid_enddate ? dayjs(operation.sb_operationid_enddate).format('YYYY-MM-DDTHH:mm') : ''}
            onChange={(e) => onOperationChange(operationIndex, 'sb_operationid_enddate', dayjs(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">
            ไมล์เริ่มต้น <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={operation.sb_operationid_startmile}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">
            น้ำมันเริ่มต้น <span className="text-red-500">*</span>
          </Label>
          <Select
            value={operation.sb_operationid_startoil}
            onValueChange={(value) => onOperationChange(operationIndex, 'sb_operationid_startoil', value)}
          >
            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <SelectValue placeholder="เลือก" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {oil_persent.map((val) => (
                  <SelectItem key={val} value={val.toString()}>{val}%</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">
            ไมล์สิ้นสุด <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={operation.sb_operationid_endmile}
            onChange={(e) => onEndMileChange(operationIndex, e.target.value, carOperations)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">
            น้ำมันสิ้นสุด <span className="text-red-500">*</span>
          </Label>
          <Select
            value={operation.sb_operationid_endoil}
            onValueChange={(value) => onOperationChange(operationIndex, 'sb_operationid_endoil', value)}
          >
            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <SelectValue placeholder="เลือก" />
            </SelectTrigger>
            <SelectContent>
              {oil_persent.map((val) => (
                <SelectItem key={val} value={val.toString()}>
                  {val}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}