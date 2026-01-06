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
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarIcon, Clock, Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import dayjs from 'dayjs'
import client from '@/lib/axios/interceptors'
import SuccessDialog from './SuccessDialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface AllowanceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (item: any) => void
  onCancel: () => void
  users: UserHotelWelfare[]
  initialStartDate?: string
  initialEndDate?: string
}

export default function AllowanceFormDialog({ 
  open, 
  onOpenChange,
  onSubmit, 
  onCancel, 
  users,
  initialStartDate,
  initialEndDate
}: AllowanceFormDialogProps) {
  const [usercode, setUsercode] = useState('')
  const [rate, setRate] = useState(0)
  const [foodStatus, setFoodStatus] = useState(false)
  const [startdate, setStartdate] = useState(dayjs().hour(8).minute(0).format('YYYY-MM-DDTHH:mm:ss'))
  const [enddate, setEnddate] = useState(dayjs().hour(17).minute(0).format('YYYY-MM-DDTHH:mm:ss'))
  
  const [startDateInput, setStartDateInput] = useState(dayjs().format('DD/MM/YYYY'))
  const [endDateInput, setEndDateInput] = useState(dayjs().format('DD/MM/YYYY'))
  const [startTimeInput, setStartTimeInput] = useState('08:00')
  const [endTimeInput, setEndTimeInput] = useState('17:00')
  
  const [openUserCombobox, setOpenUserCombobox] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [startTimeOpen, setStartTimeOpen] = useState(false)
  const [endTimeOpen, setEndTimeOpen] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorTitle, setErrorTitle] = useState('')
  const [errorDescription, setErrorDescription] = useState('')
  

  useEffect(() => {
    if (open && initialStartDate) {
      const start = dayjs(initialStartDate).add(7, 'hour')
      setStartDateInput(start.format('DD/MM/YYYY'))
      setStartTimeInput(start.format('HH:mm'))
      setStartdate(start.format('YYYY-MM-DDTHH:mm:ss'))
    }
    if (open && initialEndDate) {
      const end = dayjs(initialEndDate).add(7, 'hour')
      setEndDateInput(end.format('DD/MM/YYYY'))
      setEndTimeInput(end.format('HH:mm'))
      setEnddate(end.format('YYYY-MM-DDTHH:mm:ss'))
    }
  }, [open, initialStartDate, initialEndDate])

  useEffect(() => {
    if (!open) {
      // Reset form states
      setUsercode('')
      setRate(0)
      setFoodStatus(false)
      setStartdate(dayjs().hour(8).minute(0).format('YYYY-MM-DDTHH:mm:ss'))
      setEnddate(dayjs().hour(17).minute(0).format('YYYY-MM-DDTHH:mm:ss'))
      setStartDateInput(dayjs().format('DD/MM/YYYY'))
      setEndDateInput(dayjs().format('DD/MM/YYYY'))
      setStartTimeInput('08:00')
      setEndTimeInput('17:00')
      
      // Reset AlertDialog และ SuccessDialog states
      setShowErrorDialog(false)
      setShowSuccessDialog(false)
      setErrorTitle('')
      setErrorDescription('')
    }
  }, [open])
  
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
  
  const calculateDays = () => {
    if (!startdate || !enddate) return 0
    const start = dayjs(startdate)
    const end = dayjs(enddate)
    const totalHours = end.diff(start, 'hour')
    if (totalHours < 12) return 0
    if (totalHours < 24) return 1
    if (totalHours < 36) return 1
    const fullDays = Math.floor(totalHours / 24)
    const remainingHours = totalHours % 24
    return remainingHours >= 12 ? fullDays + 1 : fullDays
  }
  
  const handleUserSelect = async (selectedUsercode: string) => {
    try {
      const response = await client.post('/useright_getWelfare', {
        usercode: selectedUsercode,
        welfaretypeid: 1
      })
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const welfare = response.data.data[0]
        setUsercode(selectedUsercode)
        setRate(welfare.amount || 0)
        setOpenUserCombobox(false)
      } else {
        // ค้นหาชื่อผู้ใช้
        const user = users.find(u => u.UserCode === selectedUsercode)
        const userName = user ? user.Name : selectedUsercode
        setErrorTitle('ไม่มีสิทธิ์เบิกค่าเบี้ยเลี้ยง')
        setErrorDescription(`${userName} (${selectedUsercode}) ไม่มีสิทธิ์เบิกค่าเบี้ยเลี้ยง`)
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error checking welfare:', error)
      const user = users.find(u => u.UserCode === selectedUsercode)
      const userName = user ? user.Name : selectedUsercode
      setErrorTitle('ไม่สามารถตรวจสอบสิทธิ์ได้')
      setErrorDescription(`ไม่สามารถตรวจสอบสิทธิ์ของ ${userName} (${selectedUsercode}) ได้`)
      setShowErrorDialog(true)
    }
  }
  
  const handleSubmit = () => {
    if (!usercode) {
      setErrorTitle('กรุณาเลือกผู้เดินทาง')
      setErrorDescription('โปรดเลือกผู้เดินทางก่อนดำเนินการต่อ')
      setShowErrorDialog(true)
      return
    }
    
    const days = calculateDays()
    if (days === 0) {
      setErrorTitle('ระยะเวลาไม่เพียงพอ')
      setErrorDescription('การเดินทางต้องมีระยะเวลาไม่น้อยกว่า 12 ชั่วโมง')
      setShowErrorDialog(true)
      return
    }
    
    const baseAmount = days * rate
    const finalAmount = foodStatus ? baseAmount / 2 : baseAmount
    
    // เรียก onSubmit และแสดง SuccessDialog
    onSubmit({
      usercode,
      rate,
      days,
      foodStatus,
      startdate,
      enddate,
      amount: finalAmount
    })
    
    // แสดง SuccessDialog แทนการปิด dialog ทันที
    // setTimeout(() => {
    //   setShowSuccessDialog(true)
    // }, 300)
  }
  
  const handleCancel = () => {
    onCancel()
  }

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false)
  }
  
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
  const days = calculateDays()
  const baseAmount = days * rate
  const finalAmount = foodStatus ? baseAmount / 2 : baseAmount
  
  const getSelectedUserName = () => {
    if (!usercode) return 'เลือกผู้เดินทาง'
    const user = users.find(u => u.UserCode === usercode)
    return user ? `${user.Name} (${user.UserCode})` : usercode
  }
  
  return (
    <>
    <Dialog 
      open={open} 
      onOpenChange={(next) => {
          if (!next && (showErrorDialog || showSuccessDialog)) {
            return
          }
          onOpenChange(next)
        }}
      modal={true}
    >
      <DialogContent className="max-w-3xl! w-full! max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มรายการค่าเบี้ยเลี้ยง</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* User Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ผู้เดินทาง <span className="text-red-500">*</span></Label>
              <Popover open={openUserCombobox} onOpenChange={setOpenUserCombobox} modal={true}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {getSelectedUserName()}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ค้นหา..." />
                    <CommandEmpty>ไม่พบผู้เดินทาง</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-auto">
                      {users.map((user) => (
                        <CommandItem
                          key={user.UserCode}
                          value={`${user.Name} ${user.UserCode}`}
                          onSelect={() => handleUserSelect(user.UserCode)}
                          className="cursor-pointer"
                        >
                          <Check className={`mr-2 h-4 w-4 ${usercode === user.UserCode ? 'opacity-100' : 'opacity-0'}`} />
                          <div className="flex flex-col">
                            <span className="font-medium">{user.Name}</span>
                            <span className="text-xs text-gray-500">{user.UserCode}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>จำนวนวัน</Label>
              <div className="h-10 px-3 py-2 bg-slate-100 rounded-md flex items-center justify-between">
                <span className="text-sm font-mono">{days} วัน</span>
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
          
          {/* Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>วันที่เริ่มต้น <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input
                    type="text"
                    value={startDateInput}
                    onChange={(e) => {
                      const formatted = formatDateInput(e.target.value)
                      setStartDateInput(formatted)
                      if (formatted.length === 10) {
                        const date = parseDateInput(formatted)
                        if (date) {
                          // normalize input (รองรับปี พ.ศ. -> ค.ศ.)
                          setStartDateInput(dayjs(date).format('DD/MM/YYYY'))
                          setStartdate(dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${startTimeInput}`).format('YYYY-MM-DDTHH:mm:ss'))
                        }
                      }
                    }}
                    placeholder="วว/ดด/ปปปป"
                    className="pr-10"
                    maxLength={10}
                  />
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3">
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startdate ? new Date(startdate) : undefined}
                        defaultMonth={startdate ? new Date(startdate) : new Date()}
                        disabled={(date) => {
                          // ไม่ให้เลือกวันที่ในอนาคตเกินไป (มากกว่า 1 ปี)
                          const oneYearFromNow = new Date()
                          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
                          if (date > oneYearFromNow) return true
                          
                          // ไม่ให้เลือกวันที่ในอดีตเกินไป (มากกว่า 2 ปี)
                          const twoYearsAgo = new Date()
                          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
                          if (date < twoYearsAgo) return true
                          
                          // ไม่ให้เลือกวันที่เริ่มมากกว่าวันที่สิ้นสุด
                          if (enddate) {
                            const endDate = new Date(enddate)
                            endDate.setHours(0, 0, 0, 0)
                            const checkDate = new Date(date)
                            checkDate.setHours(0, 0, 0, 0)
                            return checkDate > endDate
                          }
                          
                          return false
                        }}
                        onSelect={(date) => {
                          if (date) {
                            setStartdate(dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${startTimeInput}`).format('YYYY-MM-DDTHH:mm:ss'))
                            setStartDateInput(dayjs(date).format('DD/MM/YYYY'))
                            setStartDateOpen(false)
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
                      const formatted = formatTimeInput(e.target.value)
                      const validated = validateAndFixTime(formatted)
                      setStartTimeInput(validated)
                      if (validated.length === 5) {
                        const currentDate = startdate ? dayjs(startdate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                        setStartdate(dayjs(`${currentDate} ${validated}`).format('YYYY-MM-DDTHH:mm:ss'))
                      }
                    }}
                    placeholder="HH:mm"
                    maxLength={5}
                    className="pr-16"
                  />
                  <span className="absolute left-13 top-1/2 transform -translate-y-1/2 text-md text-gray-600 pointer-events-none">น.</span>
                  <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3">
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
                                {hourOptions.map((hour) => (
                                  <button
                                    key={hour}
                                    className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                      startTimeInput.split(':')[0] === hour ? 'bg-blue-500 text-white' : ''
                                    }`}
                                    onClick={() => {
                                      const newTime = `${hour}:${startTimeInput.split(':')[1] || '00'}`
                                      setStartTimeInput(newTime)
                                      const currentDate = startdate ? dayjs(startdate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                      setStartdate(dayjs(`${currentDate} ${newTime}`).format('YYYY-MM-DDTHH:mm:ss'))
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
                            <Label className="text-xs">นาที</Label>
                            <div className="h-40 w-20 border rounded overflow-auto">
                              <div className="space-y-1 p-1">
                                {minuteOptions.map((minute) => (
                                  <button
                                    key={minute}
                                    className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                      startTimeInput.split(':')[1] === minute ? 'bg-blue-500 text-white' : ''
                                    }`}
                                    onClick={() => {
                                      const newTime = `${startTimeInput.split(':')[0] || '00'}:${minute}`
                                      setStartTimeInput(newTime)
                                      const currentDate = startdate ? dayjs(startdate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                      setStartdate(dayjs(`${currentDate} ${newTime}`).format('YYYY-MM-DDTHH:mm:ss'))
                                    }}
                                  >
                                    {minute}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setStartTimeOpen(false)} className="w-full">ตกลง</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>วันที่สิ้นสุด <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input
                    type="text"
                    value={endDateInput}
                    onChange={(e) => {
                      const formatted = formatDateInput(e.target.value)
                      setEndDateInput(formatted)
                      if (formatted.length === 10) {
                        const date = parseDateInput(formatted)
                        if (date) {
                          // normalize input (รองรับปี พ.ศ. -> ค.ศ.)
                          setEndDateInput(dayjs(date).format('DD/MM/YYYY'))
                          setEnddate(dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${endTimeInput}`).format('YYYY-MM-DDTHH:mm:ss'))
                        }
                      }
                    }}
                    placeholder="วว/ดด/ปปปป"
                    className="pr-10"
                    maxLength={10}
                  />
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3">
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={enddate ? new Date(enddate) : undefined}
                        defaultMonth={enddate ? new Date(enddate) : new Date()}
                        disabled={(date) => {
                          // ไม่ให้เลือกวันที่ในอนาคตเกินไป (มากกว่า 1 ปี)
                          const oneYearFromNow = new Date()
                          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
                          if (date > oneYearFromNow) return true
                          
                          // ไม่ให้เลือกวันที่ในอดีตเกินไป (มากกว่า 2 ปี)
                          const twoYearsAgo = new Date() 
                          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
                          if (date < twoYearsAgo) return true
                          
                          // ไม่ให้เลือกวันที่สิ้นสุดน้อยกว่าวันที่เริ่ม
                          if (startdate) {
                            const startDate = new Date(startdate)
                            startDate.setHours(0, 0, 0, 0)
                            const checkDate = new Date(date)
                            checkDate.setHours(0, 0, 0, 0)
                            return checkDate < startDate
                          }
                          
                          return false
                        }}
                        onSelect={(date) => {
                          if (date) {
                            setEnddate(dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${endTimeInput}`).format('YYYY-MM-DDTHH:mm:ss'))
                            setEndDateInput(dayjs(date).format('DD/MM/YYYY'))
                            setEndDateOpen(false)
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
                      const formatted = formatTimeInput(e.target.value)
                      const validated = validateAndFixTime(formatted)
                      setEndTimeInput(validated)
                      if (validated.length === 5) {
                        const currentDate = enddate ? dayjs(enddate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                        setEnddate(dayjs(`${currentDate} ${validated}`).format('YYYY-MM-DDTHH:mm:ss'))
                      }
                    }}
                    placeholder="HH:mm"
                    maxLength={5}
                    className="pr-16"
                  />
                  <span className="absolute left-13 top-1/2 transform -translate-y-1/2 text-md text-gray-600 pointer-events-none">น.</span>
                  <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3">
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
                                {hourOptions.map((hour) => (
                                  <button
                                    key={hour}
                                    className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                      endTimeInput.split(':')[0] === hour ? 'bg-blue-500 text-white' : ''
                                    }`}
                                    onClick={() => {
                                      const newTime = `${hour}:${endTimeInput.split(':')[1] || '00'}`
                                      setEndTimeInput(newTime)
                                      const currentDate = enddate ? dayjs(enddate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                      setEnddate(dayjs(`${currentDate} ${newTime}`).format('YYYY-MM-DDTHH:mm:ss'))
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
                            <Label className="text-xs">นาที</Label>
                            <div className="h-40 w-20 border rounded overflow-auto">
                              <div className="space-y-1 p-1">
                                {minuteOptions.map((minute) => (
                                  <button
                                    key={minute}
                                    className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                      endTimeInput.split(':')[1] === minute ? 'bg-blue-500 text-white' : ''
                                    }`}
                                    onClick={() => {
                                      const newTime = `${endTimeInput.split(':')[0] || '00'}:${minute}`
                                      setEndTimeInput(newTime)
                                      const currentDate = enddate ? dayjs(enddate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                      setEnddate(dayjs(`${currentDate} ${newTime}`).format('YYYY-MM-DDTHH:mm:ss'))
                                    }}
                                  >
                                    {minute}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setEndTimeOpen(false)} className="w-full">ตกลง</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
          
          {/* Duration */}
          {startdate && enddate && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Clock className="h-4 w-4" />
                <span>
                  ระยะเวลา: {(() => {
                    const totalHours = dayjs(enddate).diff(dayjs(startdate), 'hour')
                    const d = Math.floor(totalHours / 24)
                    const h = totalHours % 24
                    if (d === 0) return `${h} ชั่วโมง`
                    if (h === 0) return `${d} วัน`
                    return `${d} วัน ${h} ชั่วโมง`
                  })()}
                  {days === 0 && <span className="ml-2 text-orange-600 font-semibold">(ไม่ถึงเกณฑ์ 12 ชม.)</span>}
                </span>
              </div>
            </div>
          )}
          
          {/* Food Status */}
          <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="foodStatus"
                checked={foodStatus}
                onChange={(e) => setFoodStatus(e.target.checked)}
                className="rounded text-orange-600"
              />
              <label htmlFor="foodStatus" className="text-sm font-medium text-orange-800">
                รวมค่าอาหาร (หักครึ่งหนึ่ง)
              </label>
            </div>
            {foodStatus && (
              <Badge variant="outline" className="text-orange-600">
                จะได้รับ 50% ของจำนวนเต็ม
              </Badge>
            )}
          </div>
          
          {/* Summary */}
          {usercode && days > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">อัตราค่าเบี้ยเลี้ยงต่อวัน ({usercode}):</span>
                <span className="font-mono">{rate.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">จำนวนวัน:</span>
                <Badge variant="outline" className="font-mono">{days} วัน</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">ยอดค่าเบี้ยเลี้ยงทั้งหมด:</span>
                <Badge variant="outline" className="font-mono">{baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</Badge>
              </div>
              {foodStatus && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600">หักค่าอาหาร (50%):</span>
                  <span className="font-mono text-orange-600">-{(baseAmount / 2).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-semibold text-lg">ยอดสุทธิที่จะได้รับ:</span>
                <span className="text-2xl font-bold font-mono text-green-600">
                  {finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                </span>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มรายการ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
      <AlertDialogContent
        forceMount
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">{errorTitle}</AlertDialogTitle>
          <AlertDialogDescription>{errorDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleCloseErrorDialog} className='cursor-pointer'>
            ตกลง
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    
    <SuccessDialog
      open={showSuccessDialog}
      onOpenChange={setShowSuccessDialog}
      title="เพิ่มค่าเบี้ยเลี้ยงสำเร็จ!"
      description={`เพิ่มรายการค่าเบี้ยเลี้ยง ${getSelectedUserName()} ${days} วัน เรียบร้อยแล้ว`}
    />
    </>
  )
}