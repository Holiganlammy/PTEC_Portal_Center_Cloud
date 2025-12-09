'use client';

import dayjs from 'dayjs';
import { X, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { debounce } from 'lodash';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { Operation } from '../../service/type/types';
import OperationFileUpload from '../FormSubmit/OperationFileUpload';

interface OperationFormProps {
  operation: Operation;
  operationIndex: number;
  carOperationIndex: number;
  onOperationChange: (index: number, field: keyof Operation, value: any) => void;
  onRemoveOperation: (index: number) => void;
  onEndMileChange: (index: number, value: string, carOperations: Operation[]) => void;
  carOperations: Operation[];
  isUpdateMode?: boolean;
  onValidationChange?: (operationIndex: number, isValid: boolean) => void;
  onShowAlert?: (title: string, message: string, type: 'error' | 'success') => void;
}

export interface OperationFormRef {
  validateAll: () => boolean;
}

const oil_persent = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export default function OperationForm({ 
  operation, 
  operationIndex, 
  carOperationIndex,
  onOperationChange,
  onRemoveOperation,
  onEndMileChange,
  carOperations,
  isUpdateMode = false,
  onShowAlert,
  onValidationChange
}: OperationFormProps) {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [startTimeInput, setStartTimeInput] = useState('08:00');
  const [endTimeInput, setEndTimeInput] = useState('17:00');
  const [localEndMile, setLocalEndMile] = useState(operation.sb_operationid_endmile);
  
  useEffect(() => {
    const today = dayjs();
    
    // ตั้งค่าวันที่ออกเดินทางเป็นวันปัจจุบัน
    if (!operation.sb_operationid_startdate) {
      const startDateTime = today.hour(8).minute(0).second(0);
      console.log('Setting start date to:', startDateTime.format());
      onOperationChange(operationIndex, 'sb_operationid_startdate', startDateTime);
    }
    
    // ตั้งค่าวันที่สิ้นสุดเป็นวันปัจจุบัน
    if (!operation.sb_operationid_enddate) {
      const endDateTime = today.hour(17).minute(0).second(0);
      console.log('Setting end date to:', endDateTime.format());
      onOperationChange(operationIndex, 'sb_operationid_enddate', endDateTime);
    }
  }, [operationIndex, onOperationChange]);
  // เช็คว่าเป็นกิจกรรมแรกหรือไม่
  const isFirstOperation = carOperationIndex === 0;
  const previousOperation = carOperationIndex > 0 ? carOperations[carOperationIndex - 1] : null;
  const minStartMile = previousOperation 
    ? parseFloat(previousOperation.sb_operationid_endmile || '0') 
    : 0;
  const [startMileError, setStartMileError] = useState('');
  const [endMileError, setEndMileError] = useState('');
  const [dateTimeError, setDateTimeError] = useState('');
  
  const generateHourOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      options.push(hour.toString().padStart(2, '0'));
    }
    return options;
  };
  
  const generateMinuteOptions = () => {
    const options = [];
    for (let minute = 0; minute < 60; minute++) {
      options.push(minute.toString().padStart(2, '0'));
    }
    return options;
  };
  
  const debouncedEndMileChange = useMemo(
    () => debounce((opIndex: number, value: string, carOps: Operation[]) => {
      console.log('🔧 Debounced End Mile Change:', {
        operationIndex: opIndex,
        value
      });
      onEndMileChange(opIndex, value, carOps);
    }, 500),
    [onEndMileChange]
  );

  useEffect(() => {
    return () => {
      debouncedEndMileChange.cancel();
    };
  }, [debouncedEndMileChange]);

  useEffect(() => {
  setLocalEndMile(operation.sb_operationid_endmile);
}, [operation.sb_operationid_endmile]);

  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();
  
  // ฟังก์ชั่นสำหรับ format time input (HH:mm)
  const formatTimeInput = (timeStr: string) => {
    let cleaned = timeStr.replace(/[^0-9]/g, '');
    if (cleaned.length > 4) cleaned = cleaned.substr(0, 4);
    if (cleaned.length >= 2) {
      cleaned = cleaned.substr(0, 2) + ':' + cleaned.substr(2);
    }
    return cleaned;
  };
  
  // ตรวจสอบและแก้ไขเวลา
  const validateAndFixTime = (input: string) => {
    if (!input || input.length < 5) return input;
    
    const parts = input.split(':');
    if (parts.length !== 2) return input;
    
    let hour = parseInt(parts[0], 10);
    let minute = parseInt(parts[1], 10);
    
    if (hour > 23) hour = 23;
    if (hour < 0) hour = 0;
    if (minute > 59) minute = 59;
    if (minute < 0) minute = 0;
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };
  
  // ฟังก์ชั่นสำหรับ format วันที่ dd/mm/yyyy
  const formatDateInput = (dateStr: string) => {
    let cleaned = dateStr.replace(/[^0-9]/g, '');
    if (cleaned.length > 8) cleaned = cleaned.substr(0, 8);
    
    if (cleaned.length >= 2) {
      cleaned = cleaned.substr(0, 2) + '/' + cleaned.substr(2);
    }
    if (cleaned.length >= 5) {
      cleaned = cleaned.substr(0, 5) + '/' + cleaned.substr(5);
    }
    
    return cleaned;
  };
  
  // แปลง dd/mm/yyyy เป็น Date object
  const parseDateInput = (input: string) => {
    if (!input || input.length < 8) return null;
    
    const parts = input.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  };
  
  //Validate ไมล์เริ่มต้น
  const validateStartMile = (value: string) => {
    const startMile = parseFloat(value);
    
    if (isNaN(startMile)) {
      setStartMileError('กรุณาระบุไมล์เริ่มต้น');
      return false;
    }
    
    // ถ้าไม่ใช่กิจกรรมแรก ต้องมากกว่าเท่ากับไมล์สิ้นสุดของกิจกรรมก่อนหน้า
    if (!isFirstOperation && startMile < minStartMile) {
      setStartMileError(`ไมล์เริ่มต้นต้องมากกว่าหรือเท่ากับ ${minStartMile.toFixed(1)}`);
      return false;
    }
    
    // ต้องไม่มากกว่าไมล์สิ้นสุด
    const endMile = parseFloat(operation.sb_operationid_endmile || '0');
    if (endMile > 0 && startMile > endMile) {
      setStartMileError('ไมล์เริ่มต้นต้องไม่มากกว่าไมล์สิ้นสุด');
      return false;
    }
    
    setStartMileError('');
    return true;
  };
  
  //  Validate ไมล์สิ้นสุด
  const validateEndMile = (value: string) => {
    const endMile = parseFloat(value);
    
    if (isNaN(endMile)) {
      setEndMileError('กรุณาระบุไมล์สิ้นสุด');
      return false;
    }
    
    const startMile = parseFloat(operation.sb_operationid_startmile?.toString() || '0');
    
    if (endMile < startMile) {
      setEndMileError('ไมล์สิ้นสุดต้องมากกว่าหรือเท่ากับไมล์เริ่มต้น');
      return false;
    }
    
    setEndMileError('');
    return true;
  };

  //  Validate วันที่และเวลา
  const validateDateTime = (startDate?: any, endDate?: any) => {
    if (!startDate || !endDate) {
      setDateTimeError('');
      onValidationChange?.(operationIndex, true);
      return true;
    }

    const startDateTime = dayjs(startDate);
    const endDateTime = dayjs(endDate);

    if (startDateTime.isAfter(endDateTime)) {
      setDateTimeError('วันที่ออกเดินทางต้องไม่มากกว่าวันที่สิ้นสุด');
      onValidationChange?.(operationIndex, false);
      return false;
    }

    if (endDateTime.isBefore(startDateTime)) {
      setDateTimeError('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่ออกเดินทาง');
      onValidationChange?.(operationIndex, false);
      return false;
    }

    setDateTimeError('');
    onValidationChange?.(operationIndex, true);
    return true;
  };

  //  ตรวจสอบ validation ทั้งหมด
  const validateAll = () => {
    const isDateTimeValid = validateDateTime(operation.sb_operationid_startdate, operation.sb_operationid_enddate);
    const isStartMileValid = validateStartMile(operation.sb_operationid_startmile?.toString() || '0');
    const isEndMileValid = validateEndMile(operation.sb_operationid_endmile || '0');
    const isPayStatusValid = operation.sb_paystatus !== '' && operation.sb_paystatus !== null && operation.sb_paystatus !== undefined;
    
    const allValid = isDateTimeValid && isStartMileValid && isEndMileValid && isPayStatusValid;
    return allValid;
  };

  // ตรวจสอบ validation เมื่อมีการเปลี่ยนแปลงข้อมูล
  useEffect(() => {
    const isValid = validateAll();
    onValidationChange?.(operationIndex, isValid);
  }, [operation.sb_operationid_startdate, operation.sb_operationid_enddate, operation.sb_operationid_startmile, operation.sb_operationid_endmile, operation.sb_paystatus, startMileError, endMileError, dateTimeError]);
  
  // Handle ไมล์เริ่มต้นเปลี่ยน (สำหรับกิจกรรมที่ 2+)
  const handleStartMileChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    onOperationChange(operationIndex, 'sb_operationid_startmile', parseFloat(cleaned) || 0);
    validateStartMile(cleaned);
  };
  
  // อัปเดต input values เมื่อ operation data เปลี่ยน
  useEffect(() => {
  
    if (operation.sb_operationid_startdate) {
      const startFormatted = dayjs(operation.sb_operationid_startdate).format('DD/MM/YYYY');
      const startTimeFormatted = dayjs(operation.sb_operationid_startdate).format('HH:mm');
      console.log('Setting start date input:', startFormatted, startTimeFormatted);
      setStartDateInput(startFormatted);
      setStartTimeInput(startTimeFormatted);
    } else {
      setStartDateInput('');
      setStartTimeInput('08:00');
    }
    
    if (operation.sb_operationid_enddate) {
      const endFormatted = dayjs(operation.sb_operationid_enddate).format('DD/MM/YYYY');
      const endTimeFormatted = dayjs(operation.sb_operationid_enddate).format('HH:mm');
      console.log('Setting end date input:', endFormatted, endTimeFormatted);
      setEndDateInput(endFormatted);
      setEndTimeInput(endTimeFormatted);
    } else {
      setEndDateInput('');
      setEndTimeInput('17:00');
    }

    validateDateTime(operation.sb_operationid_startdate, operation.sb_operationid_enddate);
  }, [operation.sb_operationid_startdate, operation.sb_operationid_enddate, operationIndex]);
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-300 bg-white text-gray-700">
          กิจกรรมที่ {carOperationIndex + 1}
        </span>
        <button
          onClick={() => onRemoveOperation(operationIndex)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          disabled={isFirstOperation}
        >
          <X className={cn("w-4 h-4", isFirstOperation && "opacity-50 cursor-not-allowed")} />
        </button>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-900">
          เบิก/ไม่เบิก <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
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
          {(!operation.sb_paystatus || operation.sb_paystatus === '') && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              กรุณาเลือกสถานะการเบิก
            </p>
          )}
        </div>
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
        {/* วันที่ออกเดินทาง */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            วันที่ออกเดินทาง <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Input
                type="text"
                value={startDateInput}
                onChange={(e) => {
                  const formatted = formatDateInput(e.target.value);
                  setStartDateInput(formatted);
                  
                  if (formatted.length === 10) {
                    const date = parseDateInput(formatted);
                    if (date) {
                      const newDateTime = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${startTimeInput}`);
                      onOperationChange(operationIndex, 'sb_operationid_startdate', newDateTime);
                      // ตรวจสอบวันที่และเวลา
                      setTimeout(() => validateDateTime(newDateTime, operation.sb_operationid_enddate), 0);
                    }
                  }
                }}
                placeholder="วว/ดด/ปปปป"
                className="w-full pr-10"
                maxLength={10}
              />
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setStartDateOpen(true)}
                  >
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={operation.sb_operationid_startdate ? new Date(operation.sb_operationid_startdate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const newDateTime = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${startTimeInput}`);
                        onOperationChange(operationIndex, 'sb_operationid_startdate', newDateTime);
                        setStartDateInput(dayjs(date).format('DD/MM/YYYY'));
                        setStartDateOpen(false);
                        // ตรวจสอบวันที่และเวลา
                        setTimeout(() => validateDateTime(newDateTime, operation.sb_operationid_enddate), 0);
                      }
                    }}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="relative">
              <Input
                type="text"
                value={startTimeInput}
                onChange={(e) => {
                  const formatted = formatTimeInput(e.target.value);
                  const validated = validateAndFixTime(formatted);
                  setStartTimeInput(validated);
                  
                  if (validated.length === 5) {
                    const currentDate = operation.sb_operationid_startdate ? dayjs(operation.sb_operationid_startdate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
                    const newDateTime = dayjs(`${currentDate} ${validated}`);
                    onOperationChange(operationIndex, 'sb_operationid_startdate', newDateTime);
                    // ตรวจสอบวันที่และเวลา
                    setTimeout(() => validateDateTime(newDateTime, operation.sb_operationid_enddate), 0);
                  }
                }}
                placeholder="HH:mm"
                maxLength={5}
                className="w-full pr-16"
              />
              <span className="absolute left-13 top-1/2 transform -translate-y-1/2 text-md text-gray-600 pointer-events-none">
                น.
              </span>
              <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setStartTimeOpen(true)}
                  >
                    <Clock className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">เลือกเวลา</h4>
                    <div className="flex items-center gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-600">ชั่วโมง</label>
                        <div className="h-40 w-20 border rounded overflow-auto">
                          <div className="space-y-1 p-1">
                            {hourOptions.map((hour) => (
                              <button
                                key={hour}
                                className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                  startTimeInput.split(':')[0] === hour ? 'bg-blue-500 text-white' : ''
                                }`}
                                onClick={() => {
                                  const currentMinute = startTimeInput.split(':')[1] || '00';
                                  const newTime = `${hour}:${currentMinute}`;
                                  setStartTimeInput(newTime);
                                  const currentDate = operation.sb_operationid_startdate ? dayjs(operation.sb_operationid_startdate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
                                  const newDateTime = dayjs(`${currentDate} ${newTime}`);
                                  onOperationChange(operationIndex, 'sb_operationid_startdate', newDateTime);
                                  // ตรวจสอบวันที่และเวลา
                                  setTimeout(() => validateDateTime(newDateTime, operation.sb_operationid_enddate), 0);
                                }}
                              >
                                {hour}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold">:</div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-600">นาที</label>
                        <div className="h-40 w-20 border rounded overflow-auto">
                          <div className="space-y-1 p-1">
                            {minuteOptions.map((minute) => (
                              <button
                                key={minute}
                                className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                  startTimeInput.split(':')[1] === minute ? 'bg-blue-500 text-white' : ''
                                }`}
                                onClick={() => {
                                  const currentHour = startTimeInput.split(':')[0] || '00';
                                  const newTime = `${currentHour}:${minute}`;
                                  setStartTimeInput(newTime);
                                  const currentDate = operation.sb_operationid_startdate ? dayjs(operation.sb_operationid_startdate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
                                  const newDateTime = dayjs(`${currentDate} ${newTime}`);
                                  onOperationChange(operationIndex, 'sb_operationid_startdate', newDateTime);
                                  // ตรวจสอบวันที่และเวลา
                                  setTimeout(() => validateDateTime(newDateTime, operation.sb_operationid_enddate), 0);
                                }}
                              >
                                {minute}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => setStartTimeOpen(false)}>
                        ตกลง
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* วันที่สิ้นสุด */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            วันที่สิ้นสุด <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Input
                type="text"
                value={endDateInput}
                onChange={(e) => {
                  const formatted = formatDateInput(e.target.value);
                  setEndDateInput(formatted);
                  
                  if (formatted.length === 10) {
                    const date = parseDateInput(formatted);
                    if (date) {
                      const newDateTime = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${endTimeInput}`);
                      onOperationChange(operationIndex, 'sb_operationid_enddate', newDateTime);
                      // ตรวจสอบวันที่และเวลา
                      setTimeout(() => validateDateTime(operation.sb_operationid_startdate, newDateTime), 0);
                    }
                  }
                }}
                placeholder="วว/ดด/ปปปป"
                className="w-full pr-10"
                maxLength={10}
              />
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setEndDateOpen(true)}
                  >
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={operation.sb_operationid_enddate ? new Date(operation.sb_operationid_enddate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const newDateTime = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${endTimeInput}`);
                        onOperationChange(operationIndex, 'sb_operationid_enddate', newDateTime);
                        setEndDateInput(dayjs(date).format('DD/MM/YYYY'));
                        setEndDateOpen(false);
                        // ตรวจสอบวันที่และเวลา
                        setTimeout(() => validateDateTime(operation.sb_operationid_startdate, newDateTime), 0);
                      }
                    }}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="relative">
              <Input
                type="text"
                value={endTimeInput}
                onChange={(e) => {
                  const formatted = formatTimeInput(e.target.value);
                  const validated = validateAndFixTime(formatted);
                  setEndTimeInput(validated);
                  
                  if (validated.length === 5) {
                    const currentDate = operation.sb_operationid_enddate ? dayjs(operation.sb_operationid_enddate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
                    const newDateTime = dayjs(`${currentDate} ${validated}`);
                    onOperationChange(operationIndex, 'sb_operationid_enddate', newDateTime);
                    // ตรวจสอบวันที่และเวลา
                    setTimeout(() => validateDateTime(operation.sb_operationid_startdate, newDateTime), 0);
                  }
                }}
                placeholder="HH:mm"
                maxLength={5}
                className="w-full pr-16"
              />
              <span className="absolute left-13 top-1/2 transform -translate-y-1/2 text-md text-gray-600 pointer-events-none">
                น.
              </span>
              <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setEndTimeOpen(true)}
                  >
                    <Clock className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">เลือกเวลา</h4>
                    <div className="flex items-center gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-600">ชั่วโมง</label>
                        <div className="h-40 w-20 border rounded overflow-auto">
                          <div className="space-y-1 p-1">
                            {hourOptions.map((hour) => (
                              <button
                                key={hour}
                                className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                  endTimeInput.split(':')[0] === hour ? 'bg-blue-500 text-white' : ''
                                }`}
                                onClick={() => {
                                  const currentMinute = endTimeInput.split(':')[1] || '00';
                                  const newTime = `${hour}:${currentMinute}`;
                                  setEndTimeInput(newTime);
                                  const currentDate = operation.sb_operationid_enddate ? dayjs(operation.sb_operationid_enddate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
                                  const newDateTime = dayjs(`${currentDate} ${newTime}`);
                                  onOperationChange(operationIndex, 'sb_operationid_enddate', newDateTime);
                                  // ตรวจสอบวันที่และเวลา
                                  setTimeout(() => validateDateTime(operation.sb_operationid_startdate, newDateTime), 0);
                                }}
                              >
                                {hour}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold">:</div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-600">นาที</label>
                        <div className="h-40 w-20 border rounded overflow-auto">
                          <div className="space-y-1 p-1">
                            {minuteOptions.map((minute) => (
                              <button
                                key={minute}
                                className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                  endTimeInput.split(':')[1] === minute ? 'bg-blue-500 text-white' : ''
                                }`}
                                onClick={() => {
                                  const currentHour = endTimeInput.split(':')[0] || '00';
                                  const newTime = `${currentHour}:${minute}`;
                                  setEndTimeInput(newTime);
                                  const currentDate = operation.sb_operationid_enddate ? dayjs(operation.sb_operationid_enddate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
                                  const newDateTime = dayjs(`${currentDate} ${newTime}`);
                                  onOperationChange(operationIndex, 'sb_operationid_enddate', newDateTime);
                                  // ตรวจสอบวันที่และเวลา
                                  setTimeout(() => validateDateTime(operation.sb_operationid_startdate, newDateTime), 0);
                                }}
                              >
                                {minute}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => setEndTimeOpen(false)}>
                        ตกลง
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      <OperationFileUpload
        files={operation.files || []}
        onFilesChange={(files) => onOperationChange(operationIndex, 'files', files)}
        isUpdateMode={isUpdateMode}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/*  ไมล์เริ่มต้น */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">
            ไมล์เริ่มต้น <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-1">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              value={operation.sb_operationid_startmile}
              disabled={isFirstOperation} //  กิจกรรมแรก disable
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9.]/g, '');
              }}
              onChange={(e) => {
                if (!isFirstOperation) {
                  handleStartMileChange(e.target.value);
                }
              }}
              className={cn(
                "w-full px-3 py-2 border rounded-lg transition-all",
                isFirstOperation 
                  ? "bg-gray-100 cursor-not-allowed" 
                  : "focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent",
                startMileError && "border-red-500"
              )}
              placeholder="0"
            />
            {startMileError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {startMileError}
              </p>
            )}
            {!isFirstOperation && !startMileError && minStartMile > 0 && (
              <p className="text-xs text-gray-500">
                ต้องมากกว่าหรือเท่ากับ {minStartMile.toFixed(1)}
              </p>
            )}
          </div>
        </div>

        {/* น้ำมันเริ่มต้น */}
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

        {/*  ไมล์สิ้นสุด */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">
            ไมล์สิ้นสุด <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-1">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              value={localEndMile}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                setLocalEndMile(value);  
                debouncedEndMileChange(operationIndex, value, carOperations);
                validateEndMile(value);
              }}
              onBlur={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                
                //  Cancel debounce และอัปเดตทันที
                debouncedEndMileChange.cancel();
                onEndMileChange(operationIndex, value, carOperations);
                validateEndMile(value);
              }}
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all",
                endMileError && "border-red-500"
              )}
              placeholder="0"
            />
            {endMileError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {endMileError}
              </p>
            )}
          </div>
        </div>

        {/* น้ำมันสิ้นสุด */}
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
      
      {/* แสดง error message สำหรับวันที่และเวลา */}
      {dateTimeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {dateTimeError}
          </p>
        </div>
      )}
    </div>
  );
}