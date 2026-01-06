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
import { Check, ChevronsUpDown, UserPlus, Plus, X } from 'lucide-react'
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

interface HotelFormDialogProps {
  open: boolean,
  onOpenChange: (open: boolean) => void
  onSubmit: (item: any) => void
  onCancel: () => void
  users: UserHotelWelfare[]
  provinces: Provinces[]
}

export default function HotelFormDialog({ 
  open, 
  onOpenChange,
  onSubmit, 
  onCancel, 
  users,
  provinces
}: HotelFormDialogProps) {
  const [hotelName, setHotelName] = useState('')
  const [province, setProvince] = useState('')
  const [nights, setNights] = useState('')
  const [amount, setAmount] = useState('')
  const [guests, setGuests] = useState<HotelGuestItem[]>([{ id: Date.now(), usercode: '', hotel_rate: 0 }])
  
  const [openProvinceCombobox, setOpenProvinceCombobox] = useState(false)
  const [openGuestCombobox, setOpenGuestCombobox] = useState<{[key: number]: boolean}>({})
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorTitle, setErrorTitle] = useState('')
  const [errorDescription, setErrorDescription] = useState('')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  
  useEffect(() => {
    if (!open) {
      setHotelName('')
      setProvince('')
      setNights('')
      setAmount('')
      setGuests([{ id: Date.now(), usercode: '', hotel_rate: 0 }])
      setShowErrorDialog(false)
      setShowSuccessDialog(false)
      setErrorTitle('')
      setErrorDescription('')
    }
  }, [open])
  
  const handleAddGuest = () => {
    setGuests([...guests, { id: Date.now(), usercode: '', hotel_rate: 0 }])
  }
  
  const handleRemoveGuest = (index: number) => {
    if (guests.length <= 1) {
      setErrorTitle('ไม่สามารถลบผู้พักได้')
      setErrorDescription('ต้องมีอย่างน้อย 1 ผู้พัก')
      setShowErrorDialog(true)
      return
    }
    setGuests(guests.filter((_, i) => i !== index))
  }
  
  const handleGuestSelect = async (usercode: string, guestIndex: number) => {
    if (!province) {
      setErrorTitle('กรุณาเลือกจังหวัดก่อน')
      setErrorDescription('โปรดเลือกจังหวัดก่อนเลือกผู้เข้าพัก')
      setShowErrorDialog(true)
      return
    }
    
    try {
      const response = await client.post('/useright_getWelfare', {
        usercode,
        sbc_hotelProvince: province
      })
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const welfare = response.data.data[0]
        const updatedGuests = [...guests]
        updatedGuests[guestIndex] = {
          id: updatedGuests[guestIndex].id,
          usercode,
          hotel_rate: welfare.amount || 0
        }
        setGuests(updatedGuests)
      } else {
        const user = users.find(u => u.UserCode === usercode)
        const userName = user ? user.Name : usercode
        setErrorTitle('ไม่มีสิทธิ์เบิกค่าที่พัก')
        setErrorDescription(`${userName} (${usercode}) ไม่มีสิทธิ์เบิกค่าที่พักในจังหวัด${province}`)
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error checking welfare:', error)
      setErrorTitle('ไม่สามารถตรวจสอบสิทธิ์ได้')
      setErrorDescription('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ โปรดลองอีกครั้ง')
      setShowErrorDialog(true)
    }
  }
  
  const handleProvinceChange = async (newProvince: string) => {
    setProvince(newProvince)
    
    // Recheck all guests
    const updatedGuests = [...guests]
    for (let i = 0; i < updatedGuests.length; i++) {
      const guest = updatedGuests[i]
      if (guest.usercode) {
        try {
          const response = await client.post('/useright_getWelfare', {
            usercode: guest.usercode,
            sbc_hotelProvince: newProvince
          })
          
          if (response.data && response.data.data && response.data.data.length > 0) {
            updatedGuests[i].hotel_rate = response.data.data[0].amount || 0
          } else {
            updatedGuests[i].hotel_rate = 0
          }
        } catch (error) {
          console.error('Error rechecking welfare:', error)
        }
      }
    }
    setGuests(updatedGuests)
  }
  
  const calculateHotelTotal = () => {
    const totalGuestRate = guests.reduce((sum, guest) => sum + (guest.hotel_rate || 0), 0)
    return totalGuestRate * (parseFloat(nights) || 0)
  }
  
  const calculateMaxAllowance = () => {
    const totalGuestRate = guests.reduce((sum, guest) => sum + (guest.hotel_rate || 0), 0)
    const guestTotal = totalGuestRate * (parseFloat(nights) || 0)
    const billTotal = parseFloat(amount) || 0
    return Math.min(guestTotal, billTotal)
  }
  
  const handleSubmit = () => {
    if (!hotelName || !province || !nights || !amount) {
      setErrorTitle('กรุณากรอกข้อมูลให้ครบ')
      setErrorDescription('โปรดกรอกชื่อที่พัก จังหวัด จำนวนคืน และยอดบิลรวม')
      setShowErrorDialog(true)
      return
    }
    
    const selectedGuests = guests.filter(g => !!g.usercode)
    if (selectedGuests.length === 0) {
      setErrorTitle('กรุณาเพิ่มผู้เข้าพัก')
      setErrorDescription('โปรดเพิ่มผู้เข้าพักอย่างน้อย 1 คน')
      setShowErrorDialog(true)
      return
    }

    if (selectedGuests.length !== guests.length) {
      setErrorTitle('กรุณาเลือกผู้เข้าพักให้ครบ')
      setErrorDescription('มีแถวผู้เข้าพักที่ยังไม่ได้เลือกผู้พัก กรุณาลบแถวที่ไม่ใช้ หรือเลือกผู้พักให้ครบ')
      setShowErrorDialog(true)
      return
    }

    const dupUsercode = selectedGuests
      .map(g => g.usercode)
      .find((code, idx, arr) => arr.indexOf(code) !== idx)
    if (dupUsercode) {
      setErrorTitle('ผู้เข้าพักซ้ำ')
      setErrorDescription(`มีผู้เข้าพักรหัส ${dupUsercode} ซ้ำกันในห้องเดียว กรุณาเลือกใหม่`) 
      setShowErrorDialog(true)
      return
    }
    
    onSubmit({
      hotel_name: hotelName,
      province,
      nights: parseInt(nights),
      amount: parseFloat(amount),
      guests: selectedGuests,
      max_allowance: calculateMaxAllowance()
    })
  }
  
  const handleCancel = () => {
    onCancel()
  }
  
  return (
    <>
    <Dialog
      open={open}   
      onOpenChange={(nextOpen) => {
        if (showErrorDialog) return 
        onOpenChange(nextOpen)
      }} 
      modal={true}
    >
      <DialogContent className="max-w-4xl! max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มรายการค่าที่พัก</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>ชื่อที่พัก <span className="text-red-500">*</span></Label>
              <Input
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="ชื่อที่พัก"
              />
            </div>
            <div className="space-y-2">
              <Label>จังหวัด <span className="text-red-500">*</span></Label>
              <Popover open={openProvinceCombobox} onOpenChange={setOpenProvinceCombobox} modal={true}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {province || 'เลือกจังหวัด'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ค้นหา..." />
                    <CommandEmpty>ไม่พบจังหวัด</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-auto">
                      {provinces.map((prov) => (
                        <CommandItem
                          key={prov.id || prov.code}
                          value={prov.name_th || prov.name_en}
                          onSelect={() => {
                            handleProvinceChange(prov.name_th || prov.name_en)
                            setOpenProvinceCombobox(false)
                          }}
                          className="cursor-pointer"
                        >
                          <Check className={`mr-2 h-4 w-4 ${province === (prov.name_th || prov.name_en) ? 'opacity-100' : 'opacity-0'}`} />
                          {prov.name_th || prov.name_en}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>จำนวนคืน <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={nights}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement
                  target.value = target.value.replace(/[^0-9]/g, '')
                }}
                onChange={(e) => setNights(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>ยอดบิลรวม (บาท) <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onInput={(e) => {
                const target = e.target as HTMLInputElement
                target.value = target.value.replace(/[^0-9]/g, '')
              }}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="text-right font-mono"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>ผู้เข้าพัก <span className="text-red-500">*</span></Label>
              <Button size="sm" variant="outline" onClick={handleAddGuest}>
                <UserPlus className="h-4 w-4 mr-1" />
                เพิ่มผู้พัก
              </Button>
            </div>
            <div className="space-y-2">
              {guests.map((guest, gIdx) => (
                <div key={guest.id} className="flex gap-2 items-center p-3 bg-white rounded-lg border">
                  <Popover 
                    open={openGuestCombobox[gIdx] || false} 
                    onOpenChange={(open) => setOpenGuestCombobox(prev => ({ ...prev, [gIdx]: open }))}
                    modal={true}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-between">
                        {guest.usercode ? (
                          (() => {
                            const user = users.find(u => u.UserCode === guest.usercode)
                            return user ? `${user.Name} (${user.UserCode})` : guest.usercode
                          })()
                        ) : 'เลือกผู้พัก'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput placeholder="ค้นหา..." />
                        <CommandEmpty>ไม่พบผู้พัก</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {users.map((user) => (
                            <CommandItem
                              key={user.UserCode}
                              value={`${user.Name} ${user.UserCode}`}
                              onSelect={() => {
                                handleGuestSelect(user.UserCode, gIdx)
                                setOpenGuestCombobox(prev => ({ ...prev, [gIdx]: false }))
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={`mr-2 h-4 w-4 ${guest.usercode === user.UserCode ? 'opacity-100' : 'opacity-0'}`} />
                              <div className="flex flex-col">
                                <span className="font-medium">{user.Name}</span>
                                <span className="text-xs">{user.UserCode}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono whitespace-nowrap">
                      สิทธิ์: {(guest.hotel_rate || 0).toLocaleString()} บาท/คืน
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveGuest(gIdx)}
                      className="h-9 w-9 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {hotelName && province && nights && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">สิทธิ์ต่อคืน:</span>
                <span className="font-mono font-semibold text-pink-600">
                  {guests.reduce((sum, g) => sum + (g.hotel_rate || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท/คืน
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">จำนวนคืน:</span>
                <span className="font-mono font-semibold">{nights} คืน</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">สิทธิ์รวมทั้งหมด:</span>
                <span className="font-mono font-semibold text-pink-600">
                  {calculateHotelTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">ยอดบิลรวม:</span>
                <span className="font-mono">
                  {(parseFloat(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-semibold text-lg">ยอดที่เบิกได้:</span>
                <span className="text-2xl font-bold font-mono text-green-600">
                  {calculateMaxAllowance().toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-800 space-y-1">
                  <div>การคำนวณ: สิทธิ์ต่อคืน × จำนวนคืน = {guests.reduce((sum, g) => sum + (g.hotel_rate || 0), 0).toLocaleString()} × {nights} = {calculateHotelTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>
                  <div>ยอดบิลรวม: {(parseFloat(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>
                  <div>เบิกได้: ต่ำกว่าระหว่างสิทธิ์และบิลรวม = {calculateMaxAllowance().toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>
                </div>
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
    
    <AlertDialog 
      open={showErrorDialog} 
      onOpenChange={setShowErrorDialog}
    >
      <AlertDialogContent
        forceMount
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">{errorTitle}</AlertDialogTitle>
          <AlertDialogDescription>{errorDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => {
              setShowErrorDialog(false)
            }} 
            className='cursor-pointer'
          >
            ตกลง
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    
    <SuccessDialog
      open={showSuccessDialog}
      onOpenChange={setShowSuccessDialog}
      title="เพิ่มค่าที่พักสำเร็จ!"
      description={`เพิ่มรายการค่าที่พัก ${hotelName} ที่ ${province} ${nights} คืน เรียบร้อยแล้ว`}
    />
    </>
  )
}