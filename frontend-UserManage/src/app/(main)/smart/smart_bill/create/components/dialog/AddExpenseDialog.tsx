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
import { CalendarIcon, MapPin, Gauge, AlertCircle, Check, ChevronsUpDown, Ban, Clock } from 'lucide-react'
import { format, set } from 'date-fns'
import dayjs from 'dayjs'
import client from '@/lib/axios/interceptors'
import { cn } from "@/lib/utils"
import WarningDialog from '../AlertDialog/wanningdialog'
import SuccessDialog from '../AlertDialog/SuccessDialog'
import ErrorDialog from '../AlertDialog/errorDialog'

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  smartBill_Withdraw: any
  onSaveSuccess?: () => void
  sbw_code: string
}

export default function AddExpenseDialog({
  open,
  onOpenChange,
  smartBill_Withdraw,
  onSaveSuccess,
  sbw_code
}: AddExpenseDialogProps) {
  const [mode, setMode] = useState<'smartcar' | 'manual'>('smartcar')
  const [operations, setOperations] = useState<any[]>([])
  const [selectedOperation, setSelectedOperation] = useState<any>(null)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [openWarningDialog, setOpenWarningDialog] = useState(false)
  const [warningTitle, setWarningTitle] = useState('')
  const [warningDescription, setWarningDescription] = useState('')
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [successDialogTitle, setSuccessDialogTitle] = useState('')
  const [successDialogDescription, setSuccessDialogDescription] = useState('')
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorDialogTitle, setErrorDialogTitle] = useState('')
  const [errorDialogDescription, setErrorDialogDescription] = useState('')
  
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

  // Date/Time inputs (รูปแบบเดียวกับ AllowanceForm)
  const [startDateInput, setStartDateInput] = useState(dayjs().format('DD/MM/YYYY'))
  const [endDateInput, setEndDateInput] = useState(dayjs().format('DD/MM/YYYY'))
  const [startTimeInput, setStartTimeInput] = useState(dayjs().format('HH:mm'))
  const [endTimeInput, setEndTimeInput] = useState(dayjs().format('HH:mm'))

  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [startTimeOpen, setStartTimeOpen] = useState(false)
  const [endTimeOpen, setEndTimeOpen] = useState(false)

  //  ตรวจสอบว่าเป็นรถสาธารณะ/อื่นๆ หรือไม่
  const isPublicOrOther = smartBill_Withdraw.condition === 2 || smartBill_Withdraw.condition === 3
  const shouldDisableSmartCar = isPublicOrOther
  const shouldDisableMileage = isPublicOrOther

  //  Auto-reset เมื่อเป็นรถสาธารณะ/อื่นๆ
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
    const startDate = new Date(operation.sb_operationid_startdate)
    const endDate = new Date(operation.sb_operationid_enddate)

    setSelectedOperation(operation)
    setFormData({
      ...formData,
      sb_operationid: operation.sb_operationid,
      sbwdtl_operationid_startdate: startDate,
      sbwdtl_operationid_enddate: endDate,
      sbwdtl_operationid_startmile: operation.sb_operationid_startmile,
      sbwdtl_operationid_endmile: operation.sb_operationid_endmile,
      remark: operation.sb_operationid_location
    })

    setStartDateInput(dayjs(startDate).format('DD/MM/YYYY'))
    setStartTimeInput(dayjs(startDate).format('HH:mm'))
    setEndDateInput(dayjs(endDate).format('DD/MM/YYYY'))
    setEndTimeInput(dayjs(endDate).format('HH:mm'))

    setOpenCombobox(false)
    setSearchValue("")
  }

  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    // Validation
    if (!formData.remark) {
      setWarningTitle('กรุณากรอกรายละเอียดกิจกรรม')
      setWarningDescription('กรุณากรอกรายละเอียดกิจกรรมก่อนบันทึก')
      setOpenWarningDialog(true)
      return
    }

    //  ข้ามการตรวจสอบไมล์ถ้าเป็นรถสาธารณะ/อื่นๆ
    if (!isPublicOrOther && (!formData.sbwdtl_operationid_startmile || !formData.sbwdtl_operationid_endmile)) {
      setWarningTitle('กรุณากรอกระยะทาง')
      setWarningDescription('กรุณากรอกระยะทางเริ่มต้นและสิ้นสุดก่อนบันทึก')
      setOpenWarningDialog(true)
      return
    }

    try {
      setIsLoading(true)
      
      // console.log('🚗 Updating vehicle info...')
      
      await client.post('/SmartBill_Withdraw_updateSBW', {
        car_infocode: smartBill_Withdraw.car_infocode || '',
        condition: smartBill_Withdraw.condition,
        purecard: smartBill_Withdraw.pure_card || null,
        sbw_code: sbw_code,
        typePay: smartBill_Withdraw.typePay || '',
        usercode: smartBill_Withdraw.ownercode || smartBill_Withdraw.UserCode
      })
      
      // console.log(' Vehicle updated')
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // console.log('📝 Adding activity...')
      
      //  ส่งข้อมูลถูกต้องตามประเภทรถ
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

      // รีเฟรชข้อมูลลง ExpenseTable ทันที
      onSaveSuccess?.()
      
      // console.log(' Activity added')
      
      setSuccessDialogTitle('การทำรายการสำเร็จ')
      setSuccessDialogDescription('เพิ่มกิจกรรมเรียบร้อย')
      setSuccessDialogOpen(true)

      
    } catch (error: any) {
      console.error('❌ Error:', error)
      
      setErrorDialogTitle('เกิดข้อผิดพลาด')
      setErrorDialogDescription(error.response?.data?.message || 'ไม่สามารถเพิ่มกิจกรรมได้')
      setErrorDialogOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    const now = new Date()

    setFormData({
      sbw_code: smartBill_Withdraw.sbw_code,
      sb_operationid: '',
      ownercode: smartBill_Withdraw.ownercode,
      car_infocode: smartBill_Withdraw.car_infocode,
      remark: '',
      sbwdtl_operationid_startdate: now,
      sbwdtl_operationid_enddate: now,
      sbwdtl_operationid_startmile: '',
      sbwdtl_operationid_endmile: ''
    })

    setStartDateInput(dayjs(now).format('DD/MM/YYYY'))
    setStartTimeInput(dayjs(now).format('HH:mm'))
    setEndDateInput(dayjs(now).format('DD/MM/YYYY'))
    setEndTimeInput(dayjs(now).format('HH:mm'))

    setSelectedOperation(null)
    setMode('smartcar')
    setSearchValue("")
  }

  const formatDateInput = (dateStr: string) => {
    let cleaned = dateStr.replace(/[^0-9]/g, '')
    if (cleaned.length > 8) cleaned = cleaned.substr(0, 8)
    if (cleaned.length >= 2) {
      cleaned = cleaned.substr(0, 2) + '/' + cleaned.substr(2)
    }
    if (cleaned.length >= 5) {
      cleaned = cleaned.substr(0, 5) + '/' + cleaned.substr(5)
    }
    return cleaned
  }

  const parseDateInput = (input: string) => {
    if (!input || input.length < 10) return null
    const parts = input.split('/')
    if (parts.length !== 3) return null
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    let year = parseInt(parts[2], 10)

    // รองรับปี พ.ศ. (25xx) -> แปลงเป็น ค.ศ. โดยลบ 543
    if (year >= 2400) {
      year = year - 543
    }

    const date = new Date(year, month, day)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null
    }
    return date
  }

  const formatTimeInput = (timeStr: string) => {
    let cleaned = timeStr.replace(/[^0-9]/g, '')
    if (cleaned.length > 4) cleaned = cleaned.substr(0, 4)
    if (cleaned.length >= 2) {
      cleaned = cleaned.substr(0, 2) + ':' + cleaned.substr(2)
    }
    return cleaned
  }

  const validateAndFixTime = (input: string) => {
    if (!input || input.length < 5) return input
    const parts = input.split(':')
    if (parts.length !== 2) return input
    let hour = parseInt(parts[0], 10)
    let minute = parseInt(parts[1], 10)
    if (hour > 23) hour = 23
    if (hour < 0) hour = 0
    if (minute > 59) minute = 59
    if (minute < 0) minute = 0
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  const applyStartDateTime = (datePart: Date, timePart: string) => {
    const [hh, mm] = (timePart || '00:00').split(':')
    const next = new Date(datePart)
    next.setHours(parseInt(hh || '0', 10), parseInt(mm || '0', 10), 0, 0)

    // Enforce: start <= end
    const currentEnd = formData.sbwdtl_operationid_enddate
    if (next.getTime() > currentEnd.getTime()) {
      setEndDateInput(dayjs(next).format('DD/MM/YYYY'))
      setEndTimeInput(dayjs(next).format('HH:mm'))
      setFormData(prev => ({
        ...prev,
        sbwdtl_operationid_startdate: next,
        sbwdtl_operationid_enddate: next
      }))
      return
    }

    setFormData(prev => ({ ...prev, sbwdtl_operationid_startdate: next }))
  }

  const applyEndDateTime = (datePart: Date, timePart: string) => {
    const [hh, mm] = (timePart || '00:00').split(':')
    const next = new Date(datePart)
    next.setHours(parseInt(hh || '0', 10), parseInt(mm || '0', 10), 0, 0)

    // Enforce: end >= start
    const currentStart = formData.sbwdtl_operationid_startdate
    if (next.getTime() < currentStart.getTime()) {
      setStartDateInput(dayjs(next).format('DD/MM/YYYY'))
      setStartTimeInput(dayjs(next).format('HH:mm'))
      setFormData(prev => ({
        ...prev,
        sbwdtl_operationid_startdate: next,
        sbwdtl_operationid_enddate: next
      }))
      return
    }

    setFormData(prev => ({ ...prev, sbwdtl_operationid_enddate: next }))
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
    <>
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogContent className="max-w-2xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>เพิ่มรายการเดินทาง/กิจกรรม</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/*  แสดง Warning เมื่อเป็นรถสาธารณะ/อื่นๆ */}
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

          {/* Mode Selection -  Disable เมื่อเป็นรถสาธารณะ/อื่นๆ */}
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

          {/* SmartCar Selection -  ซ่อนเมื่อเป็นรถสาธารณะ/อื่นๆ */}
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
                        const now = new Date()
                        setSelectedOperation(null)
                        setFormData({
                          ...formData,
                          sb_operationid: '',
                          remark: '',
                          sbwdtl_operationid_startdate: now,
                          sbwdtl_operationid_enddate: now,
                          sbwdtl_operationid_startmile: '',
                          sbwdtl_operationid_endmile: ''
                        })

                        setStartDateInput(dayjs(now).format('DD/MM/YYYY'))
                        setStartTimeInput(dayjs(now).format('HH:mm'))
                        setEndDateInput(dayjs(now).format('DD/MM/YYYY'))
                        setEndTimeInput(dayjs(now).format('HH:mm'))
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
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input
                    type="text"
                    value={startDateInput}
                    onChange={(e) => {
                      const formatted = formatDateInput(e.target.value)
                      setStartDateInput(formatted)
                      if (formatted.length === 10) {
                        const parsed = parseDateInput(formatted)
                        if (parsed) {
                          applyStartDateTime(parsed, startTimeInput)
                          // normalize input (รองรับปี พ.ศ. -> ค.ศ.)
                          setStartDateInput(dayjs(parsed).format('DD/MM/YYYY'))
                        }
                      }
                    }}
                    placeholder="วว/ดด/ปปปป"
                    className="pr-10"
                    maxLength={10}
                    disabled={mode === 'smartcar' && !selectedOperation && !isPublicOrOther}
                  />
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        disabled={mode === 'smartcar' && !selectedOperation && !isPublicOrOther}
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.sbwdtl_operationid_startdate}
                        defaultMonth={formData.sbwdtl_operationid_startdate}
                        disabled={(date) => {
                          const endDate = new Date(formData.sbwdtl_operationid_enddate)
                          endDate.setHours(0, 0, 0, 0)
                          const check = new Date(date)
                          check.setHours(0, 0, 0, 0)
                          return check.getTime() > endDate.getTime()
                        }}
                        onSelect={(date) => {
                          if (!date) return
                          const nextDate = new Date(date)
                          applyStartDateTime(nextDate, startTimeInput)
                          setStartDateInput(dayjs(nextDate).format('DD/MM/YYYY'))
                          setStartDateOpen(false)
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
                      const formatted = formatTimeInput(e.target.value)
                      const validated = validateAndFixTime(formatted)
                      setStartTimeInput(validated)
                      if (validated.length === 5) {
                        applyStartDateTime(formData.sbwdtl_operationid_startdate, validated)
                      }
                    }}
                    placeholder="HH:mm"
                    maxLength={5}
                    className="pr-10"
                    disabled={mode === 'smartcar' && !selectedOperation && !isPublicOrOther}
                  />
                  <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        disabled={mode === 'smartcar' && !selectedOperation && !isPublicOrOther}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">เลือกเวลา</h4>
                        <div className="flex items-center gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">ชั่วโมง</Label>
                            <div className="h-40 w-20 border rounded overflow-auto">
                              <div className="space-y-1 p-1">
                                {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((hour) => (
                                  <button
                                    key={hour}
                                    className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                      startTimeInput.split(':')[0] === hour ? 'bg-blue-500 text-white' : ''
                                    }`}
                                    onClick={() => {
                                      const next = `${hour}:${startTimeInput.split(':')[1] || '00'}`
                                      setStartTimeInput(next)
                                      applyStartDateTime(formData.sbwdtl_operationid_startdate, next)
                                    }}
                                    type="button"
                                  >
                                    {hour}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-bold">:</div>
                          <div className="space-y-2">
                            <Label className="text-xs">นาที</Label>
                            <div className="h-40 w-20 border rounded overflow-auto">
                              <div className="space-y-1 p-1">
                                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((minute) => (
                                  <button
                                    key={minute}
                                    className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                      startTimeInput.split(':')[1] === minute ? 'bg-blue-500 text-white' : ''
                                    }`}
                                    onClick={() => {
                                      const next = `${startTimeInput.split(':')[0] || '00'}:${minute}`
                                      setStartTimeInput(next)
                                      applyStartDateTime(formData.sbwdtl_operationid_startdate, next)
                                    }}
                                    type="button"
                                  >
                                    {minute}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setStartTimeOpen(false)} className="w-full" type="button">
                          ตกลง
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>วันที่และเวลาที่สิ้นสุด</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input
                    type="text"
                    value={endDateInput}
                    onChange={(e) => {
                      const formatted = formatDateInput(e.target.value)
                      setEndDateInput(formatted)
                      if (formatted.length === 10) {
                        const parsed = parseDateInput(formatted)
                        if (parsed) {
                          applyEndDateTime(parsed, endTimeInput)
                          // normalize input (รองรับปี พ.ศ. -> ค.ศ.)
                          setEndDateInput(dayjs(parsed).format('DD/MM/YYYY'))
                        }
                      }
                    }}
                    placeholder="วว/ดด/ปปปป"
                    className="pr-10"
                    maxLength={10}
                    disabled={mode === 'smartcar' && !selectedOperation && !isPublicOrOther}
                  />
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        disabled={mode === 'smartcar' && !selectedOperation && !isPublicOrOther}
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.sbwdtl_operationid_enddate}
                        defaultMonth={formData.sbwdtl_operationid_enddate}
                        disabled={(date) => {
                          const startDate = new Date(formData.sbwdtl_operationid_startdate)
                          startDate.setHours(0, 0, 0, 0)
                          const check = new Date(date)
                          check.setHours(0, 0, 0, 0)
                          return check.getTime() < startDate.getTime()
                        }}
                        onSelect={(date) => {
                          if (!date) return
                          const nextDate = new Date(date)
                          applyEndDateTime(nextDate, endTimeInput)
                          setEndDateInput(dayjs(nextDate).format('DD/MM/YYYY'))
                          setEndDateOpen(false)
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
                      const formatted = formatTimeInput(e.target.value)
                      const validated = validateAndFixTime(formatted)
                      setEndTimeInput(validated)
                      if (validated.length === 5) {
                        applyEndDateTime(formData.sbwdtl_operationid_enddate, validated)
                      }
                    }}
                    placeholder="HH:mm"
                    maxLength={5}
                    className="pr-10"
                    disabled={mode === 'smartcar' && !selectedOperation && !isPublicOrOther}
                  />
                  <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        disabled={mode === 'smartcar' && !selectedOperation && !isPublicOrOther}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">เลือกเวลา</h4>
                        <div className="flex items-center gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">ชั่วโมง</Label>
                            <div className="h-40 w-20 border rounded overflow-auto">
                              <div className="space-y-1 p-1">
                                {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((hour) => (
                                  <button
                                    key={hour}
                                    className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                      endTimeInput.split(':')[0] === hour ? 'bg-blue-500 text-white' : ''
                                    }`}
                                    onClick={() => {
                                      const next = `${hour}:${endTimeInput.split(':')[1] || '00'}`
                                      setEndTimeInput(next)
                                      applyEndDateTime(formData.sbwdtl_operationid_enddate, next)
                                    }}
                                    type="button"
                                  >
                                    {hour}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-bold">:</div>
                          <div className="space-y-2">
                            <Label className="text-xs">นาที</Label>
                            <div className="h-40 w-20 border rounded overflow-auto">
                              <div className="space-y-1 p-1">
                                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((minute) => (
                                  <button
                                    key={minute}
                                    className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                      endTimeInput.split(':')[1] === minute ? 'bg-blue-500 text-white' : ''
                                    }`}
                                    onClick={() => {
                                      const next = `${endTimeInput.split(':')[0] || '00'}:${minute}`
                                      setEndTimeInput(next)
                                      applyEndDateTime(formData.sbwdtl_operationid_enddate, next)
                                    }}
                                    type="button"
                                  >
                                    {minute}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setEndTimeOpen(false)} className="w-full" type="button">
                          ตกลง
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/*  Mileage - Disable เมื่อเป็นรถสาธารณะ/อื่นๆ */}
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

          {/* Distance Badge -  ซ่อนเมื่อเป็นรถสาธารณะ/อื่นๆ */}
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

    {/* Sub-dialogs อยู่นอก Dialog หลักเพื่อป้องกัน Radix UI scroll-lock ติดค้าง */}
    <WarningDialog
      open={openWarningDialog}
      onOpenChange={setOpenWarningDialog}
      title={warningTitle}
      description={warningDescription}
    />
    <SuccessDialog
      open={successDialogOpen}
      onOpenChange={setSuccessDialogOpen}
      title={successDialogTitle}
      description={successDialogDescription}
      onConfirm={() => {
        onOpenChange(false)
      }}
    />
    <ErrorDialog
      open={errorDialogOpen}
      onOpenChange={setErrorDialogOpen}
      title={errorDialogTitle}
      description={errorDialogDescription}
    />
    </>
  )
}