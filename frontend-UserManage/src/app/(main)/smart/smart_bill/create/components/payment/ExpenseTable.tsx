"use client"

import React, { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Calendar } from '@/components/ui/calendar'
import { 
  Trash2, 
  Calendar as CalendarIcon, 
  MapPin, 
  FileText,
  Plus,
  Save,
  X,
  Fuel,
  Car,
  Utensils,
  Hotel,
  MoreHorizontal,
  UserPlus,
  Info,
  Check,
  ChevronsUpDown,
  Clock
} from 'lucide-react'
import dayjs from 'dayjs'
import Swal from 'sweetalert2'
import client from '@/lib/axios/interceptors'
import { Label } from '@/components/ui/label'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'


interface ExpenseTableProps {
  smartBill_WithdrawDtl: smartBill_Withdraw_Detail[]
  smartBill_Withdraw: smartBill_Withdraw
  fetchData: () => void
}

export default function ExpenseTable({
  smartBill_WithdrawDtl,
  smartBill_Withdraw,
  fetchData
}: ExpenseTableProps) {
  const { data: session } = useSession()
  const [expandedCategory, setExpandedCategory] = useState<{
    index: number
    type: string
  } | null>(null)
  const [categoryDetails, setCategoryDetails] = useState<smartBill_CategoryDetails[]>([])
  const [hotelGuestDetails, setHotelGuestDetails] = useState<smartBill_SelectHotelGroup[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  // แยก state สำหรับแต่ละ category
  const [fuelItem, setFuelItem] = useState<FuelNewItem>({})
  const [tollItem, setTollItem] = useState<TollNewItem>({})
  const [allowanceItem, setAllowanceItem] = useState<AllowanceNewItem>({})
  const [hotelItem, setHotelItem] = useState<HotelNewItem>({})
  const [otherItem, setOtherItem] = useState<OtherNewItem>({})
  const [welfareData, setWelfareData] = useState<{[key: string]: smartBill_userGetWelfare  | null}>({})
  const [openUserCombobox, setOpenUserCombobox] = useState(false)
  const [openProvinceCombobox, setOpenProvinceCombobox] = useState(false)
  const [openGuestCombobox, setOpenGuestCombobox] = useState<{[key: number]: boolean}>({})
  const [selectedRemark, setSelectedRemark] = useState<string | null>(null)
  
  // State สำหรับ allowance date/time inputs
  const [allowanceStartDateOpen, setAllowanceStartDateOpen] = useState(false)
  const [allowanceEndDateOpen, setAllowanceEndDateOpen] = useState(false)
  const [allowanceStartTimeOpen, setAllowanceStartTimeOpen] = useState(false)
  const [allowanceEndTimeOpen, setAllowanceEndTimeOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  ///////////////////////////////////////////////////////////////////////////
  const [allowanceStartDateInput, setAllowanceStartDateInput] = useState('')
  const [allowanceEndDateInput, setAllowanceEndDateInput] = useState('')
  const [allowanceStartTimeInput, setAllowanceStartTimeInput] = useState('08:00')
  const [allowanceEndTimeInput, setAllowanceEndTimeInput] = useState('17:00')
  
  // Options from API
  const [options, setOptions] = useState<{
    users?: UserHotelWelfare[]
    provinces?: Provinces[]
    costOther?: CostOther[]
  }>({})

  // ฟังก์ชันสำหรับจัดการ date/time
  const generateHourOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      options.push(hour.toString().padStart(2, '0'))
    }
    return options
  }
  
  const generateMinuteOptions = () => {
    const options = []
    for (let minute = 0; minute < 60; minute++) {
      options.push(minute.toString().padStart(2, '0'))
    }
    return options
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
    if (!input || input.length < 8) return null
    
    const parts = input.split('/')
    if (parts.length !== 3) return null
    
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10)
    
    const date = new Date(year, month, day)
    
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null
    }
    
    return date
  }

  const hourOptions = generateHourOptions()
  const minuteOptions = generateMinuteOptions()

  const handleDelete = async (index: number) => {
    if (smartBill_Withdraw.lock_status) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถแก้ไขได้',
        text: 'เอกสารนี้ถูกล็อคแล้ว ไม่สามารถลบรายการได้',
        confirmButtonText: 'รับทราบ'
      })
      return
    }
    
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบรายการนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    })

    if (result.isConfirmed) {
      try {
        await client.post('/SmartBill_WithdrawDtl_Delete', { 
          sbwdtl_id: smartBill_WithdrawDtl[index].sbwdtl_id 
        })
        Swal.fire('สำเร็จ!', 'ลบรายการเรียบร้อย', 'success')
        fetchData()
      } catch (error) {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบรายการได้', 'error')
      }
    }
  }


  const handleCategoryClick = async (index: number, type: string, sbwdtl_id: string) => {
    if (smartBill_Withdraw.lock_status) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถแก้ไขได้',
        text: 'เอกสารนี้ถูกล็อคแล้ว ไม่สามารถจัดการค่าใช้จ่ายได้',
        confirmButtonText: 'รับทราบ'
      })
      return
    }
    
    if (type === 'fuel') {
      const currentItem = smartBill_WithdrawDtl[index]
      if (currentItem?.car_infostatus_companny === false ) {
        Swal.fire({
          icon: 'warning',
          title: 'ไม่สามารถเบิกได้',
          text: 'รถคันนี้เบิกตามไมล์เท่านั้น เนื่องจากเป็นรถส่วนตัว',
          confirmButtonText: 'รับทราบ'
        })
        return
      }
    }

    if (expandedCategory?.index === index && expandedCategory?.type === type) {
      setExpandedCategory(null)
      setCategoryDetails([])
      setHotelGuestDetails([])
      setIsAddingNew(false)
      return
    }

    try {
      let response
      let categoryId: number | null = null
      
      switch (type) {
        case 'fuel':
          categoryId = 1
          break
        case 'toll':
          categoryId = 2
          break
        case 'allowance':
          categoryId = 4
          if (!options.users) {
            const usersRes = await client.get('/getsUserForAssetsControl')
            setOptions(prev => ({ ...prev, users: usersRes.data.data || [] }))
          }
          break
        case 'hotel':
          categoryId = 3
          if (!options.provinces || !options.users) {
            const [provinceRes, usersRes] = await Promise.all([
              client.get('/Provinces_List'),
              client.get('/getsUserForAssetsControl')
            ])
            setOptions(prev => ({ 
              ...prev, 
              provinces: provinceRes.data.data || provinceRes.data || [],
              users: usersRes.data.data || []
            }))
          }
          break
        case 'other':
          if (!options.costOther) {
            const costRes = await client.get('/SmartBill_Withdraw_SelectCostOther')
            setOptions(prev => ({ ...prev, costOther: costRes.data.data || costRes.data || [] }))
          }
          break
      }

      // console.log('📤 Fetching category:', { sbwdtl_id, category_id: categoryId })

      response = await client.post('/SmartBill_WithdrawDtl_SelectCategory', {
        sbwdtl_id: parseInt(sbwdtl_id),
        category_id: categoryId
      })

      // console.log('📥 Raw Response:', response)
      // console.log('📥 Response.data:', response.data)
      // console.log('📥 Response.data type:', Array.isArray(response.data) ? 'Array' : typeof response.data)
      
      let data = []
      
      if (Array.isArray(response.data)) {
        if (response.data.length > 0) {
          if (Array.isArray(response.data[0])) {
            data = response.data[0]
          } else if (typeof response.data[0] === 'object') {
            data = response.data
          }
        }
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.data)) {
          data = response.data.data
        } else if (Array.isArray(response.data[0])) {
          data = response.data[0]
        }
      }

      setCategoryDetails(Array.isArray(data) ? data : [])
      setExpandedCategory({ index, type })
      setIsAddingNew(false)
      // Reset ทุก state
      setFuelItem({})
      setTollItem({})
      setAllowanceItem({})
      setHotelItem({})
      setOtherItem({})
      setWelfareData({})
      
      // ถ้าเป็นหมวดโรงแรมและมี sbc_hotelid ให้ดึงข้อมูลผู้เข้าพัก
      if (type === 'hotel' && data.length > 0 && data[0]?.sbc_hotelid) {
        await fetchHotelGuestDetails(data[0].sbc_hotelid)
      } else {
        setHotelGuestDetails([])
      }
      
    } catch (error) {
      console.error('❌ Error fetching category details:', error)
      if (error instanceof Error && 'response' in error) {
        console.error('❌ Error response:', (error as any).response?.data)
      }
      setCategoryDetails([])
      setExpandedCategory({ index, type })
    }
  }

  const handleAddNew = () => {
    if (expandedCategory?.type === 'hotel') {
      setHotelItem({ 
        guests: [{ 
          id: Date.now(), 
          usercode: '', 
          hotel_rate: 0 
        }] 
      })
    } else if (expandedCategory?.type === 'allowance') {
      const today = dayjs()
      const startDateTime = today.hour(8).minute(0).second(0) // 08:00
      const endDateTime = today.hour(17).minute(0).second(0)   // 17:00
      
      setAllowanceItem({ 
        foodStatus: false,
        startdate: startDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        enddate: endDateTime.format('YYYY-MM-DDTHH:mm:ss')
      })
      
      // ตั้งค่า Input fields
      setAllowanceStartDateInput(today.format('DD/MM/YYYY'))
      setAllowanceEndDateInput(today.format('DD/MM/YYYY'))
      setAllowanceStartTimeInput('08:00')
      setAllowanceEndTimeInput('17:00')
    } else if (expandedCategory?.type === 'fuel') {
      setFuelItem({})
    } else if (expandedCategory?.type === 'toll') {
      setTollItem({})
    } else if (expandedCategory?.type === 'other') {
      setOtherItem({})
    }
    setIsAddingNew(true)
  }

  const recheckGuestWelfare = async (newProvince: string) => {
    const currentGuests = hotelItem.guests || []
    const updatedGuests = [...currentGuests]
    let hasChanges = false
    
    for (let i = 0; i < updatedGuests.length; i++) {
      const guest = updatedGuests[i]
      if (guest.usercode) {
        try {
          const response = await client.post('/useright_getWelfare', {
            usercode: guest.usercode,
            sbc_hotelProvince: newProvince
          })
          
          if (response.data && response.data.data && response.data.data.length > 0) {
            const welfare = response.data.data[0]
            const newRate = welfare.amount || 0
            
            if (updatedGuests[i].hotel_rate !== newRate) {
              updatedGuests[i] = {
                ...updatedGuests[i],
                hotel_rate: newRate
              }
              hasChanges = true
              
              setWelfareData(prev => ({
                ...prev,
                [`${guest.usercode}_${newProvince}`]: {
                  amount: welfare.amount || 0,
                  province: newProvince,
                  active: welfare.active,
                  usercode: welfare.usercode,
                  userid: welfare.userid,
                  welfareid: welfare.welfareid,
                  welfaretypeid: welfare.welfaretypeid
                }
              }))
            }
          } else {
            // ไม่มีสิทธิ์ในจังหวัดใหม่
            if (updatedGuests[i].hotel_rate !== 0) {
              updatedGuests[i] = {
                ...updatedGuests[i],
                hotel_rate: 0
              }
              hasChanges = true
            }
            
            setWelfareData(prev => ({
              ...prev,
              [`${guest.usercode}_${newProvince}`]: null
            }))
          }
        } catch (error) {
          console.error(`Error checking welfare for ${guest.usercode}:`, error)
        }
      }
    }
    
    if (hasChanges) {
      setHotelItem({ ...hotelItem, province: newProvince, guests: updatedGuests })
    } else {
      setHotelItem({ ...hotelItem, province: newProvince })
    }
  }

  const handleCancelNew = () => {
    setIsAddingNew(false)
    // Reset ทุก state
    setFuelItem({})
    setTollItem({})
    setAllowanceItem({})
    setHotelItem({})
    setOtherItem({})
    setWelfareData({})
    // Reset allowance date/time inputs
    setAllowanceStartDateInput('')
    setAllowanceEndDateInput('')
    setAllowanceStartTimeInput('08:00')
    setAllowanceEndTimeInput('17:00')
  }

  // ========== ALLOWANCE (เบี้ยเลี้ยง) ==========
  const handleAllowanceUserSelect = async (usercode: string) => {
    try {
      const response = await client.post('/useright_getWelfare', {
        usercode,
        welfaretypeid: 1
      })
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const welfare = response.data.data[0]
        setWelfareData({
          ...welfareData,
          [usercode]: {
            active: welfare.active,                
            amount: welfare.amount || 0,
            welfare_right: welfare.amount || 0,
            usercode: welfare.usercode,
            userid: welfare.userid,                   
            welfareid: welfare.welfareid,              
            welfaretypeid: welfare.welfaretypeid     
          }
        })
      setAllowanceItem({ 
        ...allowanceItem, 
        usercode,
        rate: welfare.amount || 0,
        welfare_right: welfare.amount || 0,
        days: allowanceItem.days || 0,
        foodStatus: allowanceItem.foodStatus || false
      })
        setOpenUserCombobox(false)
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'ไม่มีสิทธิ์',
          text: `${usercode} ไม่มีสิทธิ์เบิกค่าเบี้ยเลี้ยง`,
        })
        setWelfareData(prev => ({ ...prev, [usercode]: null }))
        setAllowanceItem({ usercode: '', rate: 0, welfare_right: 0, foodStatus: false })
      }
    } catch (error) {
      console.error('Error checking welfare:', error)
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถตรวจสอบสิทธิ์ได้', 'error')
    }
  }

  const getSelectedUserName = () => {
    if (!allowanceItem.usercode) return 'เลือกผู้เดินทาง'
    const user = options.users?.find(u => u.UserCode === allowanceItem.usercode)
    return user ? `${user.Name} (${user.UserCode})` : allowanceItem.usercode
  }

  // calculateDays ใหม่ - ใช้ชั่วโมง
  const calculateDays = () => {
    if (!allowanceItem.startdate || !allowanceItem.enddate) return 0
    
    const start = dayjs(allowanceItem.startdate)
    const end = dayjs(allowanceItem.enddate)
    const totalHours = end.diff(start, 'hour')
    
    console.log('📊 Time Calculation:', {
      startdate: start.format('DD/MM/YYYY HH:mm'),
      enddate: end.format('DD/MM/YYYY HH:mm'),
      totalHours
    })
    
    //  น้อยกว่า 12 ชม. = 0 วัน
    if (totalHours < 12) {
      console.log('❌ น้อยกว่า 12 ชม. = 0 วัน')
      return 0
    }
    
    //  12-23 ชม. = 1 วัน
    if (totalHours < 24) {
      console.log(' 12-23 ชม. = 1 วัน')
      return 1
    }
    
    //  24-35 ชม. = 1 วัน (ยังไม่ถึง 36)
    if (totalHours < 36) {
      console.log(' 24-35 ชม. = 1 วัน')
      return 1
    }
    
    //  36+ ชม. = คำนวณจำนวนวัน
    // ทุกๆ 24 ชม. = 1 วัน
    const fullDays = Math.floor(totalHours / 24)
    const remainingHours = totalHours % 24
    
    let days = fullDays
    
    // ถ้าชม.ที่เหลือ >= 12 ชม. ให้เพิ่มอีก 1 วัน
    if (remainingHours >= 12) {
      days += 1
    }
    
    console.log('📊 Result:', {
      fullDays,
      remainingHours,
      totalDays: days
    })
    
    return days
  }

  // ========== HOTEL (โรงแรม) ==========
  const handleAddHotelGuest = () => {
    const guests = hotelItem.guests || []
    const newGuest = {
      id: Date.now() + Math.random(),
      usercode: '',
      hotel_rate: 0
    }
    setHotelItem({
      ...hotelItem,
      guests: [...guests, newGuest]
    })
  }

  const handleRemoveHotelGuest = (guestIndex: number) => {
    const guests = hotelItem.guests || []
    if (guests.length < 1) {
      Swal.fire('แจ้งเตือน', 'ต้องมีอย่างน้อย 1 ผู้พัก', 'warning')
      return
    }
    setHotelItem({
      ...hotelItem,
      guests: guests.filter((_: HotelGuestItem, i: number) => i !== guestIndex)
    })
  }

  const handleHotelGuestSelect = async (usercode: string, guestIndex: number) => {
    const guests = hotelItem.guests || []
    if (!hotelItem.province) {
      Swal.fire('แจ้งเตือน', 'กรุณาเลือกจังหวัดก่อน', 'warning')
      return
    }

    try {
      const response = await client.post('/useright_getWelfare', {
        usercode,
        sbc_hotelProvince: hotelItem.province
      })
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const welfare = response.data.data[0]
        
        // เก็บข้อมูล welfare แยกต่างหาก
        setWelfareData({
          ...welfareData,
          [`${usercode}_${hotelItem.province}`]: {
            amount: welfare.amount || 0,
            province: hotelItem.province,
            active: welfare.active,
            usercode: welfare.usercode,
            userid: welfare.userid,
            welfareid: welfare.welfareid,
            welfaretypeid: welfare.welfaretypeid
          }
        })
        
        const updatedGuests = [...(hotelItem.guests || [])]
        updatedGuests[guestIndex] = {
          id: updatedGuests[guestIndex]?.id || Date.now(),
          usercode,
          hotel_rate: welfare.amount || 0
        }
        
        setHotelItem({ 
          ...hotelItem, 
          guests: updatedGuests
        })
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'ไม่มีสิทธิ์',
          text: `${usercode} ไม่มีสิทธิ์เบิกค่าที่พักในจังหวัด${hotelItem.province}`,
        })
      }
    } catch (error) {
      console.error('Error checking welfare:', error)
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถตรวจสอบสิทธิ์ได้', 'error')
    }
  }

  const calculateHotelTotal = () => {
    const guests = hotelItem.guests || []
    const nights = parseFloat((hotelItem.nights || '0').toString()) || 0
    const totalGuestRate = guests.reduce((sum: number, guest: HotelGuestItem) => sum + (parseFloat(guest.hotel_rate?.toString() || '0') || 0), 0)
    return totalGuestRate * nights
  }

  const calculateHotelMaxAllowance = () => {
    const guests = hotelItem.guests || []
    const nights = parseFloat((hotelItem.nights || '0').toString()) || 0
    const totalGuestRate = guests.reduce((sum: number, guest) => sum + (parseFloat(guest.hotel_rate?.toString() || '0') || 0), 0)
    const billAmount = parseFloat(hotelItem.amount?.toString() || '0') || 0
    
    const guestTotal = totalGuestRate * nights
    const billTotal = billAmount // ใช้ยอดบิลรวมโดยตรง ไม่คูณกับจำนวนคืน
    return Math.min(guestTotal, billTotal)
  }

  const handleSaveNew = async () => {
    if (!expandedCategory) return
    if (isSaving) return // ป้องกันการกดซ้ำ
    
    if (smartBill_Withdraw.lock_status) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถบันทึกได้',
        text: 'เอกสารนี้ถูกล็อคแล้ว ไม่สามารถบันทึกรายการใหม่ได้',
        confirmButtonText: 'รับทราบ'
      })
      return
    }

    // Validation สำหรับเบี้ยเลี้ยง
    if (expandedCategory.type === 'allowance') {
      if (!allowanceItem.usercode) {
        Swal.fire({
          icon: 'warning',
          title: 'กรุณาเลือกผู้เดินทาง',
          text: 'กรุณาเลือกผู้เดินทางก่อนบันทึก',
          confirmButtonText: 'รับทราบ'
        })
        return
      }
    }

    setIsSaving(true) // เริ่ม loading
    try {
      const sbwdtl_id = smartBill_WithdrawDtl[expandedCategory.index].sbwdtl_id
      let categoryId: number | null = null
      let payload: any
      switch (expandedCategory.type) {
        case 'fuel':
          categoryId = 1
          payload = [{
            sbwdtl_id: parseInt(sbwdtl_id),
            cost_id: null,
            id: null,
            category_id: categoryId,
            count: null,
            startdate: null,
            enddate: null,
            sbc_hotelProvince: null,
            sbc_hotelname: null,
            usercode: null,
            foodStatus: null,
            amount: parseFloat((fuelItem.amount || '0').toString()) || 0,
            category_name: null
          }]
          await client.post('/SmartBill_WithdrawDtl_SaveChangesCategory', payload)
          break

        case 'toll':
          categoryId = 2
          payload = [{
            sbwdtl_id: parseInt(sbwdtl_id),
            cost_id: null,
            category_id: categoryId,
            usercode: session?.user?.UserCode,
            amount: parseFloat((tollItem.amount || '0').toString()) || 0,
          }]
          await client.post('/SmartBill_WithdrawDtl_SaveChangesCategory', payload)
          break

        case 'allowance':
          categoryId = 4
          const calculatedDays = calculateDays()
          
          if (calculatedDays === 0) {
            Swal.fire({
              icon: 'warning',
              title: 'เวลาไม่ถึงเกณฑ์',
              text: 'การเดินทางต้องมีระยะเวลาไม่น้อยกว่า 12 ชั่วโมง',
            })
            return
          }
          
          const baseAmount = calculatedDays * (parseFloat(allowanceItem.rate?.toString() || '0') || 0)
          
          payload = [{
            sbwdtl_id: parseInt(sbwdtl_id),
            cost_id: null,
            id: null,
            category_id: categoryId,
            count: calculatedDays,
            startdate: allowanceItem.startdate ? dayjs(allowanceItem.startdate).format('YYYY-MM-DD HH:mm:ss') : null,
            enddate: allowanceItem.enddate ? dayjs(allowanceItem.enddate).format('YYYY-MM-DD HH:mm:ss') : null,
            sbc_hotelProvince: null,
            sbc_hotelname: null,
            usercode: allowanceItem.usercode || null,
            foodStatus: allowanceItem.foodStatus || false,
            amount: parseFloat(baseAmount.toString()),
            category_name: null
          }]
             
          await client.post('/SmartBill_WithdrawDtl_SaveChangesCategory', payload)
          break

        case 'hotel':
          categoryId = 3
          payload = [{
            sbwdtl_id: parseInt(sbwdtl_id),
            cost_id: null,
            id: null,
            category_id: categoryId,
            count: parseInt((hotelItem.nights || '0').toString()) || 0,
            startdate: hotelItem.startdate || null,
            enddate: hotelItem.enddate || null,
            sbc_hotelProvince: hotelItem.province || null,
            sbc_hotelname: hotelItem.hotel_name || null,
            usercode: session?.user?.UserCode,
            amount: parseFloat((hotelItem.amount || '0').toString()) || 0,
            smartBill_CostHotelGroup: (hotelItem.guests || []).map((guest: HotelGuestItem) => ({
              sbc_hotelid: null,
              sbc_hotelgroupid: "",
              usercode: guest.usercode,
              amount: guest.hotel_rate || 0
            }))
          }]
          
          const hotelResponse = await client.post('/SmartBill_WithdrawDtl_SaveChangesCategory', payload)
          if (hotelResponse.data && hotelResponse.data.length > 0) {
            const responseData = Array.isArray(hotelResponse.data[0]) ? hotelResponse.data[0] : hotelResponse.data
            
            for (let i = 0; i < responseData.length; i++) {
              const hotelData = responseData[i]
              if (payload[i].smartBill_CostHotelGroup && payload[i].smartBill_CostHotelGroup.length > 0) {
                // เตรียมข้อมูลสำหรับบันทึกผู้เข้าพัก
                const hotelGroupData = payload[i].smartBill_CostHotelGroup.map((guest: HotelGuestItem) => ({
                  sbc_hotelid: parseInt(hotelData.id),
                  sbc_hotelgroupid: guest.sbc_hotelgroupid || "",
                  usercode: guest.usercode,
                  amount: guest.amount
                }))
                
                console.log('📤 Saving hotel group data:', hotelGroupData)
                await client.post('/SmartBill_WithdrawDtl_SaveChangesHotelGroup', hotelGroupData)
              }
            }
          }
          break

        case 'other':
          payload = [{
            sbwdtl_id: parseInt(sbwdtl_id),
            amount: parseFloat((otherItem.amount || '0').toString()) || 0,
            cost_id: null,
            category_name: otherItem.category_name || null
          }]
          await client.post('/SmartBill_WithdrawDtl_SaveChangesCategory', payload)
          break
      }

      //  แสดง Success
      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'บันทึกข้อมูลเรียบร้อย',
        timer: 1500,
        showConfirmButton: false
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      await fetchData()
      
      if (expandedCategory) {
        await handleCategoryClick(expandedCategory.index, expandedCategory.type, sbwdtl_id)
      }
      
    } catch (error: any) {
      console.error('❌ Save Error:', error)
      console.error('❌ Error Response:', error.response?.data)
      Swal.fire(
        'ข้อผิดพลาด', 
        error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้', 
        'error'
      )
    } finally {
      setIsSaving(false) // หยุด loading
    }
  }

  const handleDeleteItem = async (item: smartBill_CategoryDetails) => {
    if (smartBill_Withdraw.lock_status) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถลบได้',
        text: 'เอกสารนี้ถูกล็อคแล้ว ไม่สามารถลบรายการได้',
        confirmButtonText: 'รับทราบ'
      })
      return
    }
    
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบรายการนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    })

    if (result.isConfirmed) {
      try {
        await client.post('/SmartBill_WithdrawDtl_DeleteCategory', { cost_id: item.cost_id })
        Swal.fire('สำเร็จ!', 'ลบรายการเรียบร้อย', 'success')
        
        if (expandedCategory) {
          const sbwdtl_id = smartBill_WithdrawDtl[expandedCategory.index].sbwdtl_id
          handleCategoryClick(expandedCategory.index, expandedCategory.type, sbwdtl_id)
          fetchData()
        }
      } catch (error) {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบรายการได้', 'error')
      }
    }
  }

  const calculateColumnTotal = (field: keyof smartBill_Withdraw_Detail) => {
    if (!smartBill_WithdrawDtl.length) return 0
    return smartBill_WithdrawDtl.reduce((sum, item) => {
      const value = item.sb_paystatus === false ? 0 : parseFloat(item[field] as string) || 0
      return sum + value
    }, 0)
  }

  const fetchHotelGuestDetails = async (sbc_hotelid: number) => {
    try {
      console.log('📤 Fetching hotel guests:', { sbc_hotelid })
      const response = await client.post('/SmartBill_WithdrawDtl_SelectHotelGroup', {
        sbc_hotelid: parseInt(sbc_hotelid.toString())
      })
      // console.log('📥 Hotel guests response:', response.data)
      let guestData = []
      if (Array.isArray(response.data) && response.data.length > 0) {
        if (Array.isArray(response.data[0])) {
          guestData = response.data[0]
        } else {
          guestData = response.data
        }
      }
      
      console.log('📊 Final guest data:', guestData)
      setHotelGuestDetails(guestData)
      return guestData
    } catch (error) {
      console.error('❌ Error fetching hotel guests:', error)
      setHotelGuestDetails([])
      return []
    }
  }

  const renderSubTable = (type: string) => {
    const categoryConfig = {
      fuel: {
        icon: <Fuel className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
        title: 'รายการค่าน้ำมัน',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        color: 'text-blue-600 dark:text-blue-400'
      },
      toll: {
        icon: <Car className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
        title: 'รายการค่าทางด่วน',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        color: 'text-purple-600 dark:text-purple-400'
      },
      allowance: {
        icon: <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
        title: 'รายการค่าเบี้ยเลี้ยง',
        bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        color: 'text-orange-600 dark:text-orange-400'
      },
      hotel: {
        icon: <Hotel className="h-5 w-5 text-pink-600 dark:text-pink-400" />,
        title: 'รายการค่าที่พัก',
        bgColor: 'bg-pink-50 dark:bg-pink-950/30',
        color: 'text-pink-600 dark:text-pink-400'
      },
      other: {
        icon: <MoreHorizontal className="h-5 w-5 text-green-600 dark:text-green-400" />,
        title: 'รายการค่าใช้จ่ายอื่นๆ',
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        color: 'text-green-600 dark:text-green-400'
      }
    }

    const config = categoryConfig[type as keyof typeof categoryConfig]

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.icon}
            <h4 className={`font-semibold ${config.color}`}>{config.title}</h4>
          </div>
          <Button 
            size="sm" 
            onClick={handleAddNew}
            className="gap-2"
            disabled={isAddingNew || smartBill_Withdraw.lock_status}
          >
            <Plus className="h-4 w-4" />
            เพิ่มรายการ
          </Button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className={config.bgColor}>
                {type === 'allowance' && (
                  <>
                    <TableHead className="w-32">ผู้เดินทาง</TableHead>
                    <TableHead className="text-center w-48">วันเริ่ม - วันสิ้นสุด</TableHead>
                    <TableHead className="text-center w-28">จำนวนวัน</TableHead>
                    <TableHead className="text-center w-28">ค่าอาหาร</TableHead>
                    <TableHead className="text-right w-32">สิทธิ์/วัน</TableHead>
                    <TableHead className="text-right w-32">เบิกได้ (บาท)</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </>
                )}
                {type === 'hotel' && (
                  <>
                    <TableHead>ชื่อที่พัก</TableHead>
                    <TableHead>จังหวัด</TableHead>
                    <TableHead className="text-center">จำนวนคืน</TableHead>
                    <TableHead>ผู้เข้าพัก</TableHead>
                    <TableHead className="text-right">สิทธิ์รวม</TableHead>
                    <TableHead className="text-right">ตามบิล</TableHead>
                    <TableHead className="text-right">เบิกได้</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </>
                )}
                {/* {(type === 'fuel' || type === 'other') && (
                  <>
                    <TableHead className="text-right">จำนวนเงิน (บาท)</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </>
                )} */}
                {type === 'toll' && (
                  <>
                    <TableHead className="text-right">จำนวนเงิน (บาท)</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </>
                )}
                {type === 'other' && (
                  <>
                    <TableHead>รายการ</TableHead>
                    <TableHead className="text-right">จำนวนเงิน (บาท)</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Existing Items */}
            {Array.isArray(categoryDetails) && categoryDetails.length > 0 ? (
              categoryDetails.map((item, idx) => (
                <TableRow key={idx}>
                  {type === 'allowance' && (
                    <>
                      <TableCell>
                        <div className="font-medium">{item.usercode || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {item.startdate ? dayjs(item.startdate.toString()).format('DD/MM/YY HH:mm') : '-'}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {item.enddate ? dayjs(item.enddate.toString()).format('DD/MM/YY HH:mm') : '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono font-medium">
                          {item.count || 0} วัน
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.foodStatus === true ? (
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                            รวมอาหาร
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            ไม่รวม
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-0.5">
                          <div className="font-mono text-orange-600 dark:text-orange-400 font-semibold">
                            {item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          {item.foodStatus === true && (
                            <div className="text-xs text-orange-500 dark:text-orange-400">
                              (หัก 50%)
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="font-mono font-bold text-green-600 dark:text-green-400">
                            {item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          {item.foodStatus === true && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              (จาก {((item.amount || 0) * 2).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                  {type === 'hotel' && (
                    <>
                      <TableCell>{item.sbc_hotelname || '-'}</TableCell>
                      <TableCell>{item.sbc_hotelProvince || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {item.count || 0} คืน
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {hotelGuestDetails.map((guest: smartBill_SelectHotelGroup, gIdx: number) => (
                            <Badge key={gIdx} variant="outline" className="text-xs">
                              {guest.usercode} ({guest.amount?.toLocaleString() || 0})
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-pink-600 dark:text-pink-400 font-semibold">
                        {(() => {
                          const totalGuestRate = hotelGuestDetails.reduce((sum: number, guest: smartBill_SelectHotelGroup) => sum + (guest.amount || 0), 0)
                          const nights = item.count || 0
                          return (totalGuestRate * nights).toLocaleString('en-US', { minimumFractionDigits: 2 })
                        })()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-green-600 dark:text-green-400">
                        {(() => {
                          const maxAllowance = (item.max_allowance || 0)
                          const billAmount = (item.amount || 0)
                          return (maxAllowance > 0 ? Math.min(maxAllowance, billAmount) : billAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })
                        })()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                  {(type === 'fuel' || type === 'other') && (
                    <>
                      <TableCell>
                        {type === 'other' 
                          ? item.category_name || '-'
                          : item.startdate ? dayjs(item.startdate.toString()).format('DD/MM/YYYY') : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                  {type === 'toll' && (
                    <>
                      <TableCell className="text-right font-mono">
                        {(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : null}

              {/* Add New Row - ALLOWANCE */}
              {isAddingNew && type === 'allowance' && (
                <TableRow className="bg-yellow-50 dark:bg-yellow-950/20">
                  <TableCell colSpan={7}>
                    <Card className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">ผู้เดินทาง</Label>
                          <Popover open={openUserCombobox} onOpenChange={setOpenUserCombobox}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openUserCombobox}
                                className="w-full justify-between"
                              >
                                {getSelectedUserName()}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" align="start">
                              <Command>
                                <CommandInput placeholder="ค้นหาผู้เดินทาง..." />
                                <CommandEmpty>ไม่พบผู้เดินทาง</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-auto">
                                  {options.users?.map((user) => (
                                    <CommandItem
                                      key={user.UserCode}
                                      value={`${user.Name} ${user.UserCode}`}
                                      onSelect={() => handleAllowanceUserSelect(user.UserCode)}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          allowanceItem.usercode === user.UserCode ? 'opacity-100' : 'opacity-0'
                                        }`}
                                      />
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
                          <Label className="text-sm font-medium">จำนวนวัน</Label>
                          <div className="h-10 px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 rounded-md flex items-center justify-between">
                            <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                              {calculateDays()} วัน
                            </span>
                            <Clock className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* วันที่เริ่มต้น */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-900">
                            วันที่เริ่มต้น <span className="text-red-500">*</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <Input
                                type="text"
                                value={allowanceStartDateInput}
                                onChange={(e) => {
                                  const formatted = formatDateInput(e.target.value)
                                  setAllowanceStartDateInput(formatted)
                                  
                                  if (formatted.length === 10) {
                                    const date = parseDateInput(formatted)
                                    if (date) {
                                      const newDateTime = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${allowanceStartTimeInput}`)
                                      setAllowanceItem({ ...allowanceItem, startdate: newDateTime.format('YYYY-MM-DDTHH:mm:ss') })
                                    }
                                  }
                                }}
                                placeholder="วว/ดด/ปปปป"
                                className="w-full pr-10 bg-white"
                                maxLength={10}
                              />
                              <Popover open={allowanceStartDateOpen} onOpenChange={setAllowanceStartDateOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setAllowanceStartDateOpen(true)}
                                  >
                                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={allowanceItem.startdate ? new Date(allowanceItem.startdate) : undefined}
                                    onSelect={(date) => {
                                      if (date) {
                                        const newDateTime = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${allowanceStartTimeInput}`)
                                        setAllowanceItem({ ...allowanceItem, startdate: newDateTime.format('YYYY-MM-DDTHH:mm:ss') })
                                        setAllowanceStartDateInput(dayjs(date).format('DD/MM/YYYY'))
                                        setAllowanceStartDateOpen(false)
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
                                value={allowanceStartTimeInput}
                                onChange={(e) => {
                                  const formatted = formatTimeInput(e.target.value)
                                  const validated = validateAndFixTime(formatted)
                                  setAllowanceStartTimeInput(validated)
                                  
                                  if (validated.length === 5) {
                                    const currentDate = allowanceItem.startdate ? dayjs(allowanceItem.startdate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                    const newDateTime = dayjs(`${currentDate} ${validated}`)
                                    setAllowanceItem({ ...allowanceItem, startdate: newDateTime.format('YYYY-MM-DDTHH:mm:ss') })
                                  }
                                }}
                                placeholder="HH:mm"
                                maxLength={5}
                                className="w-full pr-16 bg-white"
                              />
                              <span className="absolute left-13 top-1/2 transform -translate-y-1/2 text-md text-gray-600 pointer-events-none">
                                น.
                              </span>
                              <Popover open={allowanceStartTimeOpen} onOpenChange={setAllowanceStartTimeOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setAllowanceStartTimeOpen(true)}
                                  >
                                    <Clock className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-4" align="start">
                                  <div className="space-y-4">
                                    <h4 className="font-medium text-sm">เลือกเวลา</h4>
                                    <div className="flex items-center gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-xs text-gray-600">ชั่วโมง</Label>
                                        <div className="h-40 w-20 border rounded overflow-auto bg-white">
                                          <div className="space-y-1 p-1">
                                            {hourOptions.map((hour) => (
                                              <button
                                                key={hour}
                                                className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                                  allowanceStartTimeInput.split(':')[0] === hour ? 'bg-blue-500 text-white' : ''
                                                }`}
                                                onClick={() => {
                                                  const newTime = `${hour}:${allowanceStartTimeInput.split(':')[1] || '00'}`
                                                  setAllowanceStartTimeInput(newTime)
                                                  const currentDate = allowanceItem.startdate ? dayjs(allowanceItem.startdate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                                  const newDateTime = dayjs(`${currentDate} ${newTime}`)
                                                  setAllowanceItem({ ...allowanceItem, startdate: newDateTime.format('YYYY-MM-DDTHH:mm:ss') })
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
                                        <Label className="text-xs text-gray-600">นาที</Label>
                                        <div className="h-40 w-20 border rounded overflow-auto bg-white">
                                          <div className="space-y-1 p-1">
                                            {minuteOptions.map((minute) => (
                                              <button
                                                key={minute}
                                                className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                                  allowanceStartTimeInput.split(':')[1] === minute ? 'bg-blue-500 text-white' : ''
                                                }`}
                                                onClick={() => {
                                                  const newTime = `${allowanceStartTimeInput.split(':')[0] || '00'}:${minute}`
                                                  setAllowanceStartTimeInput(newTime)
                                                  const currentDate = allowanceItem.startdate ? dayjs(allowanceItem.startdate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                                  const newDateTime = dayjs(`${currentDate} ${newTime}`)
                                                  setAllowanceItem({ ...allowanceItem, startdate: newDateTime.format('YYYY-MM-DDTHH:mm:ss') })
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
                                      <Button size="sm" onClick={() => setAllowanceStartTimeOpen(false)}>
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
                          <Label className="text-sm font-medium text-gray-900">
                            วันที่สิ้นสุด <span className="text-red-500">*</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <Input
                                type="text"
                                value={allowanceEndDateInput}
                                onChange={(e) => {
                                  const formatted = formatDateInput(e.target.value)
                                  setAllowanceEndDateInput(formatted)
                                  
                                  if (formatted.length === 10) {
                                    const date = parseDateInput(formatted)
                                    if (date) {
                                      const newDateTime = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${allowanceEndTimeInput}`)
                                      setAllowanceItem({ ...allowanceItem, enddate: newDateTime.format('YYYY-MM-DDTHH:mm:ss') })
                                    }
                                  }
                                }}
                                placeholder="วว/ดด/ปปปป"
                                className="w-full pr-10 bg-white"
                                maxLength={10}
                              />
                              <Popover open={allowanceEndDateOpen} onOpenChange={setAllowanceEndDateOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setAllowanceEndDateOpen(true)}
                                  >
                                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={allowanceItem.enddate ? new Date(allowanceItem.enddate) : undefined}
                                    onSelect={(date) => {
                                      if (date) {
                                        const newDateTime = dayjs(`${dayjs(date).format('YYYY-MM-DD')} ${allowanceEndTimeInput}`)
                                        setAllowanceItem({ ...allowanceItem, enddate: newDateTime.format('YYYY-MM-DDTHH:mm:ss') })
                                        setAllowanceEndDateInput(dayjs(date).format('DD/MM/YYYY'))
                                        setAllowanceEndDateOpen(false)
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
                                value={allowanceEndTimeInput}
                                onChange={(e) => {
                                  const formatted = formatTimeInput(e.target.value)
                                  const validated = validateAndFixTime(formatted)
                                  setAllowanceEndTimeInput(validated)
                                  
                                  if (validated.length === 5) {
                                    const currentDate = allowanceItem.enddate ? dayjs(allowanceItem.enddate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                    const newDateTime = dayjs(`${currentDate} ${validated}`)
                                    setAllowanceItem({ ...allowanceItem, enddate: newDateTime.format('YYYY-MM-DDTHH:mm:ss') })
                                  }
                                }}
                                placeholder="HH:mm"
                                maxLength={5}
                                className="w-full pr-16 bg-white"
                              />
                              <span className="absolute left-13 top-1/2 transform -translate-y-1/2 text-md text-gray-600 pointer-events-none">
                                น.
                              </span>
                              <Popover open={allowanceEndTimeOpen} onOpenChange={setAllowanceEndTimeOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setAllowanceEndTimeOpen(true)}
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
                                                  allowanceEndTimeInput.split(':')[0] === hour ? 'bg-blue-500 text-white' : ''
                                                }`}
                                                onClick={() => {
                                                  const newTime = `${hour}:${allowanceEndTimeInput.split(':')[1] || '00'}`
                                                  setAllowanceEndTimeInput(newTime)
                                                  const currentDate = allowanceItem.enddate ? dayjs(allowanceItem.enddate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                                  const newDateTime = dayjs(`${currentDate} ${newTime}`)
                                                  setAllowanceItem({ ...allowanceItem, enddate: newDateTime.format('YYYY-MM-DDTHH:mm:ss') })
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
                                        <Label className="text-xs text-gray-600">นาที</Label>
                                        <div className="h-40 w-20 border rounded overflow-auto bg-white">
                                          <div className="space-y-1 p-1">
                                            {minuteOptions.map((minute) => (
                                              <button
                                                key={minute}
                                                className={`w-full text-center py-1 rounded text-sm hover:bg-gray-100 ${
                                                  allowanceEndTimeInput.split(':')[1] === minute ? 'bg-blue-500 text-white' : ''
                                                }`}
                                                onClick={() => {
                                                  const newTime = `${allowanceEndTimeInput.split(':')[0] || '00'}:${minute}`
                                                  setAllowanceEndTimeInput(newTime)
                                                  const currentDate = allowanceItem.enddate ? dayjs(allowanceItem.enddate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
                                                  const newDateTime = dayjs(`${currentDate} ${newTime}`)
                                                  setAllowanceItem({ ...allowanceItem, enddate: newDateTime.format('YYYY-MM-DDTHH:mm:ss') })
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
                                      <Button size="sm" onClick={() => setAllowanceEndTimeOpen(false)}>
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

                      {/*  แสดงข้อมูลระยะเวลา */}
                      {allowanceItem.startdate && allowanceItem.enddate && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mx-auto max-w-md">
                          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                            <Clock className="h-4 w-4" />
                            <span>
                              ระยะเวลา: {(() => {
                                const totalHours = dayjs(allowanceItem.enddate).diff(dayjs(allowanceItem.startdate), 'hour')
                                const days = Math.floor(totalHours / 24)
                                const hours = totalHours % 24
                                
                                if (days === 0) {
                                  return `${hours} ชั่วโมง`
                                } else if (hours === 0) {
                                  return `${days} วัน`
                                } else {
                                  return `${days} วัน ${hours} ชั่วโมง`
                                }
                              })()}
                              {calculateDays() === 0 && (
                                <span className="ml-2 text-orange-600 dark:text-orange-400 font-semibold">
                                  (ไม่ถึงเกณฑ์ 12 ชม.)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="foodStatus"
                            checked={allowanceItem.foodStatus === true}
                            onChange={(e) => setAllowanceItem({ 
                              ...allowanceItem, 
                              foodStatus: e.target.checked ? true : false 
                            })}
                            className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                          />
                          <label htmlFor="foodStatus" className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            รวมค่าอาหาร (หักครึ่งหนึ่ง)
                          </label>
                        </div>
                        {allowanceItem.foodStatus === true && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            จะได้รับ 50% ของจำนวนเต็ม
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">อัตราค่าเบี้ยเลี้ยงที่ได้รับต่อวัน ({allowanceItem.usercode}):</span>
                          {/* <Badge variant="outline" className="font-mono text-base"> */}
                            {(parseFloat(allowanceItem.rate?.toString() || '0') || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                          {/* </Badge> */}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">ยอดค่าเบี้ยเลี้ยงทั้งหมดที่ได้รับ:</span>
                          <Badge variant="outline" className="font-mono text-base">
                            {(calculateDays() * (parseFloat(allowanceItem.rate?.toString() || '0') || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                          </Badge>
                        </div>
                        {allowanceItem.foodStatus === true && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-orange-600 dark:text-orange-400">หักค่าอาหาร (50%):</span>
                            <span className="font-mono text-orange-600 dark:text-orange-400">
                              -{((calculateDays() * (parseFloat(allowanceItem.rate?.toString() || '0') || 0)) / 2).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="font-semibold text-lg">ยอดสุทธิที่จะได้รับ:</span>
                          <span className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
                            {(() => {
                              const baseAmount = calculateDays() * (parseFloat(allowanceItem.rate?.toString() || '0') || 0)
                              const finalAmount = allowanceItem.foodStatus === true ? baseAmount / 2 : baseAmount
                              return finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })
                            })()} บาท
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-4">
                        <Button variant="outline" onClick={handleCancelNew} size="lg">
                          ยกเลิก
                        </Button>
                        <Button 
                          onClick={handleSaveNew} 
                          className="bg-green-600 hover:bg-green-700" 
                          size="lg"
                          disabled={calculateDays() === 0 || !allowanceItem.usercode || isSaving}
                        >
                          {isSaving ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              กำลังบันทึก...
                            </div>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              บันทึก
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </TableCell>
                </TableRow>
              )}

              {/* Add New Row - HOTEL */}
              {isAddingNew && type === 'hotel' && (
                <TableRow className="bg-yellow-50 dark:bg-yellow-950/20">
                  <TableCell colSpan={8}>
                    <Card className="p-6 space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">ชื่อที่พัก</Label>
                          <Input
                            value={hotelItem.hotel_name || ''}
                            onChange={(e) => setHotelItem({ ...hotelItem, hotel_name: e.target.value })}
                            placeholder="ชื่อที่พัก"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">จังหวัด</Label>
                          <Popover open={openProvinceCombobox} onOpenChange={setOpenProvinceCombobox}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openProvinceCombobox}
                                className="w-full justify-between"
                              >
                                {hotelItem.province || 'เลือกจังหวัด'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="ค้นหาจังหวัด..." />
                                <CommandEmpty>ไม่พบจังหวัด</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-auto">
                                  {options.provinces?.map((prov) => (
                                    <CommandItem
                                      key={prov.id || prov.code}
                                      value={prov.name_th || prov.name_en}
                                      onSelect={() => {
                                        const newProvince = prov.name_th || prov.name_en
                                        if (hotelItem.province !== newProvince) {
                                          recheckGuestWelfare(newProvince)
                                        } else {
                                          setHotelItem({ ...hotelItem, province: newProvince })
                                        }
                                        setOpenProvinceCombobox(false)
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          hotelItem.province === (prov.name_th || prov.name_en) ? 'opacity-100' : 'opacity-0'
                                        }`}
                                      />
                                      {prov.name_th || prov.name_en}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">จำนวนคืน</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={hotelItem.nights || ''}
                            onInput={(e) => {
                              // อนุญาตเฉพาะตัวเลข
                              const target = e.target as HTMLInputElement;
                              target.value = target.value.replace(/[^0-9]/g, '');
                            }}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              setHotelItem({ ...hotelItem, nights: value });
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">ยอดบิลรวม (บาท)</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={hotelItem.amount || ''}
                            onInput={(e) => {
                              // อนุญาตเฉพาะตัวเลข
                              const target = e.target as HTMLInputElement;
                              target.value = target.value.replace(/[^0-9]/g, '');
                            }}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              setHotelItem({ ...hotelItem, amount: value });
                            }}
                            placeholder="0"
                            className="text-right font-mono"
                          />
                        </div>

                      {/* Guests */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">ผู้เข้าพัก</label>
                          <Button size="sm" variant="outline" onClick={handleAddHotelGuest}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            เพิ่มผู้พัก
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(hotelItem.guests || []).map((guest: HotelGuestItem, gIdx: number) => (
                            <div key={guest.id || `guest-${gIdx}-${Date.now()}`} className="flex gap-2 items-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
                              <Popover 
                                open={openGuestCombobox[gIdx] || false} 
                                onOpenChange={(open) => setOpenGuestCombobox(prev => ({ ...prev, [gIdx]: open }))}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openGuestCombobox[gIdx] || false}
                                    className="flex-1 justify-between"
                                  >
                                    {guest.usercode ? (
                                      (() => {
                                        const user = options.users?.find(u => u.UserCode === guest.usercode)
                                        return user ? `${user.Name} (${user.UserCode})` : guest.usercode
                                      })()
                                    ) : 'เลือกผู้พัก'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder="ค้นหาผู้พัก..." />
                                    <CommandEmpty>ไม่พบผู้พัก</CommandEmpty>
                                    <CommandGroup className="max-h-[300px] overflow-auto">
                                      {options.users?.map((user) => (
                                        <CommandItem
                                          key={user.UserCode}
                                          value={`${user.Name} ${user.UserCode}`}
                                          onSelect={() => {
                                            handleHotelGuestSelect(user.UserCode, gIdx)
                                            setOpenGuestCombobox(prev => ({ ...prev, [gIdx]: false }))
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 ${
                                              guest.usercode === user.UserCode ? 'opacity-100' : 'opacity-0'
                                            }`}
                                          />
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
                                  onClick={() => handleRemoveHotelGuest(gIdx)}
                                  className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">สิทธิ์ต่อคืน:</span>
                          <span className="font-mono font-semibold text-pink-600 dark:text-pink-400">
                            {(() => {
                              const guests = hotelItem.guests || []
                              const totalGuestRate = guests.reduce((sum: number, guest: HotelGuestItem) => sum + (parseFloat(guest.hotel_rate?.toString() || '0') || 0), 0)
                              return totalGuestRate.toLocaleString('en-US', { minimumFractionDigits: 2 })
                            })()} บาท/คืน
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">จำนวนคืน:</span>
                          <span className="font-mono font-semibold">
                            {parseFloat(hotelItem.nights?.toString() || '0') || 0} คืน
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">สิทธิ์รวมทั้งหมด:</span>
                          <span className="font-mono font-semibold text-pink-600 dark:text-pink-400">
                            {calculateHotelTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">ยอดบิลรวม:</span>
                          <span className="font-mono">
                            {(parseFloat(hotelItem.amount?.toString() || '0') || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="font-semibold text-lg">ยอดที่เบิกได้:</span>
                          <span className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
                            {calculateHotelMaxAllowance().toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                          </span>
                        </div>
                        {/* เพิ่มข้อมูลการคำนวณ */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                            <div>การคำนวณ: สิทธิ์ต่อคืน × จำนวนคืน = {(() => {
                              const guests = hotelItem.guests || []
                              const totalGuestRate = guests.reduce((sum: number, guest: HotelGuestItem) => sum + (parseFloat(guest.hotel_rate?.toString() || '0') || 0), 0)
                              return totalGuestRate.toLocaleString()
                            })()} × {parseFloat(hotelItem.nights?.toString() || '0') || 0} = {calculateHotelTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>
                            <div>ยอดบิลรวม: {(parseFloat(hotelItem.amount?.toString() || '0') || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>
                            <div>เบิกได้: ต่ำกว่าระหว่างสิทธิ์และบิลรวม = {calculateHotelMaxAllowance().toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท</div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 justify-end pt-4">
                        <Button variant="outline" onClick={handleCancelNew} size="lg">
                          ยกเลิก
                        </Button>
                        <Button 
                          onClick={handleSaveNew} 
                          className="bg-green-600 hover:bg-green-700" 
                          size="lg"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              กำลังบันทึก...
                            </div>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              บันทึก
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </TableCell>
                </TableRow>
              )}

              {/* Add New Row - FUEL/OTHER */}
              {isAddingNew && (type === 'fuel' || type === 'other') && (
                <TableRow className="bg-yellow-50 dark:bg-yellow-950/20">
                  <TableCell>
                    {type === 'other' ? (
                      <Select
                        value={otherItem.category_name || ''}
                        onValueChange={(value) => setOtherItem({ ...otherItem, category_name: value })}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="เลือกประเภท" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.costOther?.map((cat) => (
                            <SelectItem key={cat.category_name} value={cat.category_name}>
                              {cat.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type="date"
                        value={fuelItem.date || ''}
                        onChange={(e) => setFuelItem({ ...fuelItem, date: e.target.value })}
                        className="h-9"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={type === 'fuel' ? (fuelItem.amount || '') : (otherItem.amount || '')}
                      onInput={(e) => {
                        // อนุญาตเฉพาะตัวเลข
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[^0-9]/g, '');
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (type === 'fuel') {
                          setFuelItem({ ...fuelItem, amount: value })
                        } else {
                          setOtherItem({ ...otherItem, amount: value })
                        }
                      }}
                      placeholder="0"
                      className="h-9 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        onClick={handleSaveNew} 
                        className="h-8 w-8 bg-green-600 hover:bg-green-700"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleCancelNew} className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Add New Row - TOLL (Simplified) */}
              {isAddingNew && type === 'toll' && (
                <TableRow className="bg-yellow-50 dark:bg-yellow-950/20">
                  <TableCell>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={tollItem.amount || ''}
                      onInput={(e) => {
                        // อนุญาตเฉพาะตัวเลข
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[^0-9]/g, '');
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setTollItem({ ...tollItem, amount: value });
                      }}
                      placeholder="0"
                      className="h-9 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        onClick={handleSaveNew} 
                        className="h-8 w-8 bg-green-600 hover:bg-green-700"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleCancelNew} className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!categoryDetails.length && !isAddingNew && (
                <TableRow>
                  <TableCell colSpan={type === 'hotel' ? 8 : type === 'allowance' ? 7 : type === 'toll' ? 2 : 3} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    ไม่มีรายการในหมวดหมู่นี้
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (!smartBill_WithdrawDtl.length || !smartBill_WithdrawDtl[0].sbwdtl_id) {
    return (
      <>
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/30 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              ยังไม่มีรายการค่าใช้จ่าย
            </h3>
          </div>
        </div>
        {/* <CategorySelectionDialog
          open={openCategoryDialog}
          onOpenChange={setOpenCategoryDialog}
          onSelectCategory={handleSelectCategory}
        /> */}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className={`px-6 py-3 border-b border-slate-200 dark:border-slate-800 ${
            smartBill_Withdraw.lock_status 
              ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30'
              : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              <Info className={`h-4 w-4 ${
                smartBill_Withdraw.lock_status 
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`} />
              <span className="text-slate-700 dark:text-slate-300">
                {smartBill_Withdraw.lock_status 
                  ? <>🔒 <strong>เอกสารถูกล็อค</strong> ไม่สามารถแก้ไขหรือเพิ่มรายการค่าใช้จ่ายได้</>
                  : <>💡 <strong>คลิกที่จำนวนเงิน</strong> ในคอลัมน์ Actual, Allowance, Hotel, Toll, Other เพื่อเพิ่ม/แก้ไขรายการค่าใช้จ่าย</>
                }
              </span>
            </div>
          </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-600 dark:bg-slate-700 border-b border-slate-500 dark:border-slate-600">
                <TableHead className="font-semibold text-white w-40 text-xs">ช่วงเวลาเดินทาง</TableHead>
                <TableHead className="font-semibold text-white min-w-[110px] text-xs">กิจกรรม</TableHead>
                <TableHead className="text-center font-semibold text-white w-28 text-xs">เริ่มต้น (กม.)</TableHead>
                <TableHead className="text-center font-semibold text-white w-28 text-xs">สิ้นสุด (กม.)</TableHead>
                <TableHead className="text-center font-semibold text-white w-28 text-xs">ระยะทาง</TableHead>
                <TableHead className="text-center font-semibold text-white w-24 text-xs">อัตราชดเชย</TableHead>
                <TableHead className="text-right font-semibold text-white w-32 text-xs">เบิกตามไมล์เรท</TableHead>
                <TableHead className="text-right font-semibold text-white w-32 group relative text-xs">
                  <div className="flex items-center justify-end gap-1">
                    <span>เบิกตามบิล</span>
                    <Fuel className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                  </div>
                  <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap z-10">
                    คลิกเพื่อจัดการค่าน้ำมัน
                  </div>
                </TableHead>
                
                <TableHead className="text-right font-semibold text-white w-32 group relative text-xs">
                  <div className="flex items-center justify-end gap-1">
                    <span>เบี้ยเลี้ยง</span>
                    <Utensils className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                  </div>
                  <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap z-10">
                    คลิกเพื่อจัดการค่าเบี้ยเลี้ยง
                  </div>
                </TableHead>
                
                <TableHead className="text-right font-semibold text-white w-32 group relative text-xs">
                  <div className="flex items-center justify-end gap-1">
                    <span>ที่พัก</span>
                    <Hotel className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                  </div>
                  <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap z-10">
                    คลิกเพื่อจัดการค่าที่พัก
                  </div>
                </TableHead>
                
                <TableHead className="text-right font-semibold text-white w-32 group relative text-xs">
                  <div className="flex items-center justify-end gap-1">
                    <span>ทางด่วน</span>
                    <Car className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                  </div>
                  <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap z-10">
                    คลิกเพื่อจัดการค่าทางด่วน
                  </div>
                </TableHead>
                
                <TableHead className="text-right font-semibold text-white w-32 group relative text-xs">
                  <div className="flex items-center justify-end gap-1">
                    <span>อื่นๆ</span>
                    <MoreHorizontal className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                  </div>
                  <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap z-10">
                    คลิกเพื่อจัดการค่าใช้จ่ายอื่นๆ
                  </div>
                </TableHead>
                <TableHead className="text-right font-semibold text-white w-36 text-xs">ยอดรวม</TableHead>
                <TableHead className="w-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {smartBill_WithdrawDtl.map((item, index) => (
                <React.Fragment key={item.sbwdtl_id}>
                  <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="text-xs">
                      {/* <div>
                        <div className="text-slate-600 dark:text-slate-400 text-center">
                         <Label>วันที่เริ่มต้น</Label> 
                         <span className="font-medium">{dayjs(item.sbwdtl_operationid_startdate).format('DD/MM/YY')}</span>
                        </div>
                        <div className="border-l border-slate-300 dark:border-slate-700"></div>
                        <div className="text-slate-600 dark:text-slate-400 text-center">
                          <Label>วันที่สิ้นสุด</Label> 
                          <span className="font-medium">{dayjs(item.sbwdtl_operationid_enddate).format('DD/MM/YY')}</span>
                        </div>
                      </div> */}
                        <div className="space-y-1">
                          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            เริ่มต้น:
                            {dayjs(item.sbwdtl_operationid_startdate).format('DD/MM/YY')}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            สิ้นสุด:
                            {dayjs(item.sbwdtl_operationid_enddate).format('DD/MM/YY')}
                          </div>
                        </div>
                    </TableCell>
                    <>
                    <TableCell className="max-w-[200px]">
                      <div className="flex items-start gap-2 group">
                        <MapPin className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-sm text-slate-900 dark:text-slate-100 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors relative"
                            onClick={() => setSelectedRemark(item.remark || '')}
                          >
                            {item.remark}
                            {/* แสดง ... เมื่อข้อความยาวเกิน 2 บรรทัด */}
                            {item.remark && item.remark.length > 80 && (
                              <span className="text-blue-500 font-semibold"> ...</span>
                            )}
                          </p>
                          {/* Hint text */}
                          <span className="text-xs text-slate-400 dark:text-slate-500 transition-opacity">
                            คลิกเพื่อดูรายละเอียด
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <Dialog open={!!selectedRemark} onOpenChange={() => setSelectedRemark(null)}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-500" />
                            รายละเอียดกิจกรรม
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {selectedRemark}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                    </>
                    <TableCell className="text-center">
                      <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                        {item.sbwdtl_operationid_startmile?.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                        {item.sbwdtl_operationid_endmile.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono font-medium">
                        {item.sum_mile?.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {item.price_rateoil?.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                        {(item.sb_paystatus === false ? 0 : item.oilBath)?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right p-0">
                      <div
                        onClick={() => handleCategoryClick(index, 'fuel', item.sbwdtl_id)}
                        className={`
                          group cursor-pointer h-full w-full px-3 py-2 
                          transition-all duration-200 ease-in-out
                          hover:bg-blue-50 dark:hover:bg-blue-950/50
                          border-l-4 hover:border-l-blue-500
                          ${
                            expandedCategory?.index === index && expandedCategory?.type === 'fuel'
                              ? 'bg-blue-50 dark:bg-blue-900/50 border-l-blue-500'
                              : 'border-l-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex flex-col items-end">
                            <span className={`
                              text-xs font-mono font-semibold
                              ${expandedCategory?.index === index && expandedCategory?.type === 'fuel'
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-slate-900 dark:text-slate-100'
                              }
                            `}>
                              {(item.sb_paystatus === false || !item.amouthTrueOil ? 0 : item.amouthTrueOil).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              คลิกเพื่อจัดการ
                            </span>
                          </div>
                          <Fuel className={`
                            h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all
                            ${expandedCategory?.index === index && expandedCategory?.type === 'fuel'
                              ? 'opacity-100 text-blue-600 dark:text-blue-400'
                              : 'text-blue-500'
                            }
                          `} />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right p-0">
                      <div
                        onClick={() => handleCategoryClick(index, 'allowance', item.sbwdtl_id)}
                        className={`
                          group cursor-pointer h-full w-full px-3 py-2 
                          transition-all duration-200 ease-in-out
                          hover:bg-orange-50 dark:hover:bg-orange-950/50
                          border-l-4 hover:border-l-orange-500
                          ${
                            expandedCategory?.index === index && expandedCategory?.type === 'allowance'
                              ? 'bg-orange-50 dark:bg-orange-900/50 border-l-orange-500'
                              : 'border-l-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex flex-col items-end">
                            <span className={`
                              text-xs font-mono font-semibold
                              ${expandedCategory?.index === index && expandedCategory?.type === 'allowance'
                                ? 'text-orange-700 dark:text-orange-300'
                                : 'text-slate-900 dark:text-slate-100'
                              }
                            `}>
                              {(item.sb_paystatus === false || !item.amouthAllowance ? 0 : item.amouthAllowance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              คลิกเพื่อจัดการ
                            </span>
                          </div>
                          <Utensils className={`
                            h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all
                            ${expandedCategory?.index === index && expandedCategory?.type === 'allowance'
                              ? 'opacity-100 text-orange-600 dark:text-orange-400'
                              : 'text-orange-500'
                            }
                          `} />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right p-0">
                      <div
                        onClick={() => handleCategoryClick(index, 'hotel', item.sbwdtl_id)}
                        className={`
                          group cursor-pointer h-full w-full px-3 py-2 
                          transition-all duration-200 ease-in-out
                          hover:bg-pink-50 dark:hover:bg-pink-950/50
                          border-l-4 hover:border-l-pink-500
                          ${
                            expandedCategory?.index === index && expandedCategory?.type === 'hotel'
                              ? 'bg-pink-50 dark:bg-pink-900/50 border-l-pink-500'
                              : 'border-l-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex flex-col items-end">
                            <span className={`
                              text-xs font-mono font-semibold
                              ${expandedCategory?.index === index && expandedCategory?.type === 'hotel'
                                ? 'text-pink-700 dark:text-pink-300'
                                : 'text-slate-900 dark:text-slate-100'
                              }
                            `}>
                              {(item.sb_paystatus === false || !item.amouthHotel ? 0 : item.amouthHotel).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              คลิกเพื่อจัดการ
                            </span>
                          </div>
                          <Hotel className={`
                            h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all
                            ${expandedCategory?.index === index && expandedCategory?.type === 'hotel'
                              ? 'opacity-100 text-pink-600 dark:text-pink-400'
                              : 'text-pink-500'
                            }
                          `} />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right p-0">
                      <div
                        onClick={() => handleCategoryClick(index, 'toll', item.sbwdtl_id)}
                        className={`
                          group cursor-pointer h-full w-full px-3 py-2 
                          transition-all duration-200 ease-in-out
                          hover:bg-purple-50 dark:hover:bg-purple-950/50
                          border-l-4 hover:border-l-purple-500
                          ${
                            expandedCategory?.index === index && expandedCategory?.type === 'toll'
                              ? 'bg-purple-50 dark:bg-purple-900/50 border-l-purple-500'
                              : 'border-l-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex flex-col items-end">
                            <span className={`
                              text-xs font-mono font-semibold
                              ${expandedCategory?.index === index && expandedCategory?.type === 'toll'
                                ? 'text-purple-700 dark:text-purple-300'
                                : 'text-slate-900 dark:text-slate-100'
                              }
                            `}>
                              {(item.sb_paystatus === false || !item.amouthRush ? 0 : item.amouthRush).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              คลิกเพื่อจัดการ
                            </span>
                          </div>
                          <Car className={`
                            h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all
                            ${expandedCategory?.index === index && expandedCategory?.type === 'toll'
                              ? 'opacity-100 text-purple-600 dark:text-purple-400'
                              : 'text-purple-500'
                            }
                          `} />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right p-0">
                      <div
                        onClick={() => handleCategoryClick(index, 'other', item.sbwdtl_id)}
                        className={`
                          group cursor-pointer h-full w-full px-3 py-2 
                          transition-all duration-200 ease-in-out
                          hover:bg-green-50 dark:hover:bg-green-950/50
                          border-l-4 hover:border-l-green-500
                          ${
                            expandedCategory?.index === index && expandedCategory?.type === 'other'
                              ? 'bg-green-50 dark:bg-green-900/50 border-l-green-500'
                              : 'border-l-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex flex-col items-end">
                            <span className={`
                              text-xs font-mono font-semibold
                              ${expandedCategory?.index === index && expandedCategory?.type === 'other'
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-slate-900 dark:text-slate-100'
                              }
                            `}>
                              {(item.sb_paystatus === false || !item.amouthother ? 0 : item.amouthother).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              คลิกเพื่อจัดการ
                            </span>
                          </div>
                          <MoreHorizontal className={`
                            h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all
                            ${expandedCategory?.index === index && expandedCategory?.type === 'other'
                              ? 'opacity-100 text-green-600 dark:text-green-400'
                              : 'text-green-500'
                            }
                          `} />
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <Badge className="font-mono font-semibold">
                        {(item.sb_paystatus === false ? 0 : item.amouthAll)?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(index)}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedCategory?.index === index && (
                    <TableRow className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900/30 border-b-4 border-blue-500">
                      <TableCell colSpan={14} className="p-6">
                        <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                          <div className="p-6">
                            {renderSubTable(expandedCategory.type)}
                          </div>
                        </Card>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            สรุปค่าใช้จ่าย
          </h3>
          <Badge variant="outline" className="text-xs">
            {smartBill_WithdrawDtl.length} รายการ
          </Badge>
        </div>
        
        <Separator className="mb-4" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mile Rate</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotal('oilBath').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actual</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotal('amouthTrueOil').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Allowance</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotal('amouthAllowance').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hotel</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotal('amouthHotel').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Toll</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotal('amouthRush').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Other</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotal('amouthother').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1 col-span-full md:col-span-1">
            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold">Subtotal</p>
            <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {calculateColumnTotal('amouthAll').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* <CategorySelectionDialog
        open={openCategoryDialog}
        onOpenChange={setOpenCategoryDialog}
        onSelectCategory={handleSelectCategory}
      /> */}
    </div>
  )
}