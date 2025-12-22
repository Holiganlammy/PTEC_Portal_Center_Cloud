"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, MapPin, Gauge, AlertCircle, Check, ChevronsUpDown, Ban } from 'lucide-react'
import { format } from 'date-fns'
import dayjs from 'dayjs'
import axios from 'axios'
import Swal from 'sweetalert2'
import client from '@/lib/axios/interceptors'
import { cn } from "@/lib/utils"

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  smartBill_Withdraw: any
  fetchData: () => void
  sbw_code: string
}

export default function AddExpenseDialog({
  open,
  onOpenChange,
  smartBill_Withdraw,
  fetchData,
  sbw_code
}: AddExpenseDialogProps) {
  const [mode, setMode] = useState<'smartcar' | 'manual'>('smartcar')
  const [operations, setOperations] = useState<any[]>([])
  const [selectedOperation, setSelectedOperation] = useState<any>(null)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  
  const [formData, setFormData] = useState({
    sbw_code: smartBill_Withdraw.sbw_code,
    sb_operationid: '',
    ownercode: smartBill_Withdraw.ownercode,
    car_infocode: smartBill_Withdraw.car_infocode,
    remark: '',
    sbwdtl_operationid_startdate: new Date(),
    sbwdtl_operationid_enddate: new Date(),
    sbwdtl_operationid_startmile: '',
    sbwdtl_operationid_endmile: ''
  })

  // ✅ ตรวจสอบว่าเป็นรถสาธารณะ/อื่นๆ หรือไม่
  const isPublicOrOther = smartBill_Withdraw.condition === 2 || smartBill_Withdraw.condition === 3
  const shouldDisableSmartCar = isPublicOrOther
  const shouldDisableMileage = isPublicOrOther

  // ✅ Auto-reset เมื่อเป็นรถสาธารณะ/อื่นๆ
  useEffect(() => {
    if (isPublicOrOther) {
      setMode('manual')
      setSelectedOperation(null)
      setFormData(prev => ({
        ...prev,
        sb_operationid: '',
        sbwdtl_operationid_startmile: '0',
        sbwdtl_operationid_endmile: '0'
      }))
    }
  }, [smartBill_Withdraw.condition, isPublicOrOther])

  useEffect(() => {
    if (open && mode === 'smartcar' && !isPublicOrOther) {
      loadOperations()
    }
  }, [open, mode, isPublicOrOther])

  const loadOperations = async () => {
    try {
      const body = { 
        car_infocode: smartBill_Withdraw.car_infocode || null 
      }
      const response = await client.post('/SmartBill_Withdraw_Addrow', body)
      setOperations(response.data || [])
    } catch (error) {
      console.error('Error loading operations:', error)
      setOperations([])
    }
  }

  const handleOperationSelect = (operation: any) => {
    setSelectedOperation(operation)
    setFormData({
      ...formData,
      sb_operationid: operation.sb_operationid,
      sbwdtl_operationid_startdate: new Date(operation.sb_operationid_startdate),
      sbwdtl_operationid_enddate: new Date(operation.sb_operationid_enddate),
      sbwdtl_operationid_startmile: operation.sb_operationid_startmile,
      sbwdtl_operationid_endmile: operation.sb_operationid_endmile,
      remark: operation.sb_operationid_location
    })
    setOpenCombobox(false)
    setSearchValue("")
  }

  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    // Validation
    if (!formData.remark) {
      Swal.fire('แจ้งเตือน', 'กรุณากรอกรายละเอียดกิจกรรม', 'warning')
      return
    }

    // ✅ ข้ามการตรวจสอบไมล์ถ้าเป็นรถสาธารณะ/อื่นๆ
    if (!isPublicOrOther && (!formData.sbwdtl_operationid_startmile || !formData.sbwdtl_operationid_endmile)) {
      Swal.fire('แจ้งเตือน', 'กรุณากรอกระยะทางเริ่มต้นและสิ้นสุด', 'warning')
      return
    }

    try {
      setIsLoading(true)
      
      console.log('🚗 Updating vehicle info...')
      
      await client.post('/SmartBill_Withdraw_updateSBW', {
        car_infocode: smartBill_Withdraw.car_infocode || '',
        condition: smartBill_Withdraw.condition,
        purecard: smartBill_Withdraw.pure_card || null,
        sbw_code: sbw_code,
        typePay: smartBill_Withdraw.typePay || '',
        usercode: smartBill_Withdraw.ownercode || smartBill_Withdraw.UserCode
      })
      
      console.log('✅ Vehicle updated')
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      console.log('📝 Adding activity...')
      
      // ✅ ส่งข้อมูลถูกต้องตามประเภทรถ
      await client.post('/SmartBill_Withdraw_AddrowDtl', {
        sbw_code: sbw_code,
        sb_operationid: (mode === 'smartcar' && !isPublicOrOther) ? formData.sb_operationid : '',
        ownercode: smartBill_Withdraw.ownercode,
        car_infocode: smartBill_Withdraw.car_infocode,
        car_infoid: smartBill_Withdraw.car_infoid || null,
        remark: formData.remark,
        sbwdtl_operationid_startdate: dayjs(formData.sbwdtl_operationid_startdate).format('YYYY-MM-DD HH:mm:ss'),
        sbwdtl_operationid_enddate: dayjs(formData.sbwdtl_operationid_enddate).format('YYYY-MM-DD HH:mm:ss'),
        sbwdtl_operationid_startmile: isPublicOrOther ? 0 : parseFloat(formData.sbwdtl_operationid_startmile),
        sbwdtl_operationid_endmile: isPublicOrOther ? 0 : parseFloat(formData.sbwdtl_operationid_endmile)
      })
      
      console.log('✅ Activity added')
      
      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'เพิ่มกิจกรรมเรียบร้อย',
        timer: 1500,
        showConfirmButton: false
      })
      
      onOpenChange(false)
      resetForm()
      await fetchData()
      
    } catch (error: any) {
      console.error('❌ Error:', error)
      
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.message || 'ไม่สามารถเพิ่มกิจกรรมได้'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      sbw_code: smartBill_Withdraw.sbw_code,
      sb_operationid: '',
      ownercode: smartBill_Withdraw.ownercode,
      car_infocode: smartBill_Withdraw.car_infocode,
      remark: '',
      sbwdtl_operationid_startdate: new Date(),
      sbwdtl_operationid_enddate: new Date(),
      sbwdtl_operationid_startmile: '',
      sbwdtl_operationid_endmile: ''
    })
    setSelectedOperation(null)
    setMode('smartcar')
    setSearchValue("")
  }

  const calculateDistance = () => {
    if (isPublicOrOther) return 0
    const start = parseFloat(formData.sbwdtl_operationid_startmile) || 0
    const end = parseFloat(formData.sbwdtl_operationid_endmile) || 0
    return Math.max(0, end - start)
  }

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const getDisplayText = () => {
    if (!selectedOperation) return "คลิกเพื่อเลือกรายการ"
    
    const code = selectedOperation.sb_code || ''
    const creator = selectedOperation.createby || ''
    const location = selectedOperation.sb_operationid_location || ''
    
    return `[${creator}] ${truncateText(location, 30)}`
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>เพิ่มรายการเดินทาง/กิจกรรม</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ✅ แสดง Warning เมื่อเป็นรถสาธารณะ/อื่นๆ */}
          {isPublicOrOther && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Ban className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    หมายเหตุสำหรับรถสาธารณะ/อื่นๆ
                  </p>
                  <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-0.5 list-disc list-inside">
                    <li>ไม่ต้องเลือกข้อมูลจาก SmartCar</li>
                    <li>ไม่ต้องระบุเลขไมล์</li>
                    <li>สามารถเบิกค่าใช้จ่ายอื่นๆ ได้ตามปกติ (ทางด่วน, เบี้ยเลี้ยง, ที่พัก, อื่นๆ)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Mode Selection - ✅ Disable เมื่อเป็นรถสาธารณะ/อื่นๆ */}
          <div className="space-y-3">
            <Label className={`text-sm font-semibold ${shouldDisableSmartCar ? 'text-gray-400' : ''}`}>
              โหมดการป้อนข้อมูล
              {shouldDisableSmartCar && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  บังคับ "สร้างใหม่"
                </Badge>
              )}
            </Label>
            <RadioGroup 
              value={mode} 
              onValueChange={(value: any) => setMode(value)}
              disabled={shouldDisableSmartCar}
            >
              <div className="grid grid-cols-2 gap-3">
                <label className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                  ${shouldDisableSmartCar 
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' 
                    : mode === 'smartcar'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 cursor-pointer' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 cursor-pointer'
                  }
                `}>
                  <RadioGroupItem value="smartcar" id="smartcar" disabled={shouldDisableSmartCar} />
                  <div className="flex-1">
                    <span className="font-medium text-sm">จาก SmartCar</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      เลือกข้อมูลที่มีอยู่
                    </p>
                  </div>
                </label>
                
                <label className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${mode === 'manual' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }
                `}>
                  <RadioGroupItem value="manual" id="manual" />
                  <div className="flex-1">
                    <span className="font-medium text-sm">สร้างใหม่</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      ป้อนรายละเอียดด้วยตนเอง
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* SmartCar Selection - ✅ ซ่อนเมื่อเป็นรถสาธารณะ/อื่นๆ */}
          {mode === 'smartcar' && !isPublicOrOther && (
            <div className="space-y-3">
              <Label>เลือกข้อมูลจาก SmartCar</Label>
              {operations.length > 0 ? (
                <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between"
                    >
                      <span className="truncate">{getDisplayText()}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="ค้นหาด้วยชื่อผู้สร้าง, รหัส, หรือสถานที่..." 
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {operations
                          .filter(op => {
                            if (!searchValue) return true
                            const search = searchValue.toLowerCase()
                            return (
                              op.createby?.toLowerCase().includes(search) ||
                              op.sb_code?.toLowerCase().includes(search) ||
                              op.sb_operationid_location?.toLowerCase().includes(search)
                            )
                          })
                          .map((op) => (
                            <CommandItem
                              key={op.sb_operationid}
                              value={op.sb_operationid}
                              onSelect={() => handleOperationSelect(op)}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  selectedOperation?.sb_operationid === op.sb_operationid
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col gap-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {op.createby}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {op.sb_code}
                                  </Badge>
                                </div>
                                <span className="text-sm font-medium truncate">
                                  {op.sb_operationid_location}
                                </span>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {format(new Date(op.sb_operationid_startdate), 'dd/MM/yyyy')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Gauge className="h-3 w-3" />
                                    {op.sb_operationid_startmile} - {op.sb_operationid_endmile} กม.
                                  </span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    ไม่มีรายการเดินทางจาก SmartCar สำหรับรถคันนี้
                  </p>
                </div>
              )}

              {selectedOperation && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        รายละเอียดที่เลือก
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {selectedOperation.sb_operationid_location}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOperation(null)
                        setFormData({
                          ...formData,
                          sb_operationid: '',
                          remark: '',
                          sbwdtl_operationid_startdate: new Date(),
                          sbwdtl_operationid_enddate: new Date(),
                          sbwdtl_operationid_startmile: '',
                          sbwdtl_operationid_endmile: ''
                        })
                      }}
                      className="h-8 text-xs shrink-0"
                    >
                      ล้าง
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>วันที่และเวลาที่เริ่มต้น</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={mode === 'smartcar' && !selectedOperation && !isPublicOrOther}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {format(formData.sbwdtl_operationid_startdate, 'dd/MM/yyyy HH:mm')}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.sbwdtl_operationid_startdate}
                    onSelect={(date) => date && setFormData({...formData, sbwdtl_operationid_startdate: date})}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>วันที่และเวลาที่สิ้นสุด</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={mode === 'smartcar' && !selectedOperation && !isPublicOrOther}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {format(formData.sbwdtl_operationid_enddate, 'dd/MM/yyyy HH:mm')}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.sbwdtl_operationid_enddate}
                    onSelect={(date) => date && setFormData({...formData, sbwdtl_operationid_enddate: date})}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* ✅ Mileage - Disable เมื่อเป็นรถสาธารณะ/อื่นๆ */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={shouldDisableMileage ? 'text-gray-400' : ''}>
                ระยะทางเริ่มต้น (กม.)
                {shouldDisableMileage && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    ไม่จำเป็น
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <Gauge className={`absolute left-3 top-3 h-4 w-4 ${shouldDisableMileage ? 'text-gray-300' : 'text-slate-400'}`} />
                <Input
                  type="number"
                  value={shouldDisableMileage ? '0' : formData.sbwdtl_operationid_startmile}
                  onChange={(e) => setFormData({...formData, sbwdtl_operationid_startmile: e.target.value})}
                  disabled={shouldDisableMileage || (mode === 'smartcar' && !selectedOperation)}
                  className={`pl-10 ${shouldDisableMileage ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                  placeholder="0"
                />
                {shouldDisableMileage && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Ban className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className={shouldDisableMileage ? 'text-gray-400' : ''}>
                ระยะทางสิ้นสุด (กม.)
                {shouldDisableMileage && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    ไม่จำเป็น
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <Gauge className={`absolute left-3 top-3 h-4 w-4 ${shouldDisableMileage ? 'text-gray-300' : 'text-slate-400'}`} />
                <Input
                  type="number"
                  value={shouldDisableMileage ? '0' : formData.sbwdtl_operationid_endmile}
                  onChange={(e) => setFormData({...formData, sbwdtl_operationid_endmile: e.target.value})}
                  disabled={shouldDisableMileage || (mode === 'smartcar' && !selectedOperation)}
                  className={`pl-10 ${shouldDisableMileage ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                  placeholder="0"
                />
                {shouldDisableMileage && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Ban className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Distance Badge - ✅ ซ่อนเมื่อเป็นรถสาธารณะ/อื่นๆ */}
          {!isPublicOrOther && (formData.sbwdtl_operationid_startmile && formData.sbwdtl_operationid_endmile) && (
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-base px-4 py-2">
                ระยะทาง: {calculateDistance().toLocaleString()} กม.
              </Badge>
            </div>
          )}

          {/* Activity Description */}
          {mode === 'manual' && (
            <div className="space-y-2">
              <Label>รายละเอียดกิจกรรม *</Label>
              <Textarea
                value={formData.remark}
                onChange={(e) => setFormData({...formData, remark: e.target.value})}
                placeholder="ระบุรายละเอียดการเดินทางและกิจกรรมที่ทำ"
                rows={4}
                className="resize-none"
              />
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-2">หมายเหตุสำคัญ:</p>
                <ul className="space-y-1 text-xs">
                  {!isPublicOrOther && (
                    <li>• ป้อนระยะทางเริ่มต้นและสิ้นสุดอย่างถูกต้องเพื่อการคำนวณที่ถูกต้อง</li>
                  )}
                  <li>• วันที่ควรตรงกับช่วงเวลาการเดินทางจริงของคุณ</li>
                  <li>• รายละเอียดกิจกรรมจะแสดงในรายงานค่าใช้จ่าย</li>
                  {isPublicOrOther && (
                    <li>• สำหรับรถสาธารณะ/อื่นๆ สามารถเบิกค่าใช้จ่ายอื่นๆ เช่น ทางด่วน, เบี้ยเลี้ยง, ที่พัก</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSave}
            disabled={(mode === 'smartcar' && !selectedOperation && !isPublicOrOther) || isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">กำลังบันทึก</span>
                <span className="animate-spin">⏳</span>
              </>
            ) : (
              'เพิ่มรายการ'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}