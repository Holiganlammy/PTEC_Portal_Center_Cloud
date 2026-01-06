"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Save, Trash2, X, Loader2, CheckCircle2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import dayjs from 'dayjs'
import client from '@/lib/axios/interceptors'
import { useSession } from 'next-auth/react'
import SuccessDialog from './SuccessDialog'

// Import Form Components
// import FuelFormDialog from './FuelForm'
// import TollFormDialog from './TollForm'
import AllowanceFormDialog from './AllowanceForm'
import HotelFormDialog from './HotelForm'
import OtherFormDialog from './OtherForm'

interface ExpenseDialogsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryType: 'fuel' | 'toll' | 'allowance' | 'hotel' | 'other'
  sbwdtl_id: string
  onSaveSuccess: () => void
  withdrawDetail: smartBill_Withdraw_Detail
}

export default function ExpenseDialogs({
  open,
  onOpenChange,
  categoryType,
  sbwdtl_id,
  onSaveSuccess,
  withdrawDetail
}: ExpenseDialogsProps) {
  const { data: session } = useSession()
  const [showListDialog, setShowListDialog] = useState(true)
  const [showFormDialog, setShowFormDialog] = useState(false)

  //  localStorage key สำหรับ pending items
  const getStorageKey = () => `expense_pending_${categoryType}_${sbwdtl_id}`

  // Helper functions สำหรับ localStorage
  const savePendingToStorage = (items: any[]) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(items))
    } catch (error) {
      console.warn('Failed to save pending items:', error)
    }
  }

  const loadPendingFromStorage = (): any[] => {
    try {
      const stored = localStorage.getItem(getStorageKey())
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to load pending items:', error)
      return []
    }
  }

  const clearPendingFromStorage = () => {
    try {
      localStorage.removeItem(getStorageKey())
    } catch (error) {
      console.warn('Failed to clear pending items:', error)
    }
  }

  // Data States
  const [existingItems, setExistingItems] = useState<any[]>([])
  const [pendingItems, setPendingItems] = useState<any[]>(() => {
    // โหลดจาก localStorage เมื่อเริ่มต้น
    if (typeof window !== 'undefined') {
      return loadPendingFromStorage()
    }
    return []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteItem, setDeleteItem] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successTitle, setSuccessTitle] = useState('')
  const [successDescription, setSuccessDescription] = useState('')
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorTitle, setErrorTitle] = useState('')
  const [errorDescription, setErrorDescription] = useState('')
  // Options
  const [users, setUsers] = useState<UserHotelWelfare[]>([])
  const [provinces, setProvinces] = useState<Provinces[]>([])
  const [costOther, setCostOther] = useState<CostOther[]>([])

  // Hotel Guests (loaded per hotel id on-demand)
  const [hotelGuestsByHotelId, setHotelGuestsByHotelId] = useState<Record<number, smartBill_SelectHotelGroup[]>>({})
  const [hotelGuestsLoadingByHotelId, setHotelGuestsLoadingByHotelId] = useState<Record<number, boolean>>({})

  //  Sync pendingItems กับ localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && pendingItems.length > 0) {
      savePendingToStorage(pendingItems)
    }
  }, [pendingItems])

  // Reset เมื่อเปิด/ปิด Dialog
  useEffect(() => {
    if (open) {
      setShowListDialog(true)
      setShowFormDialog(false)
      loadExistingItems()
      loadOptions()
      //  โหลด pending items จาก localStorage เมื่อเปิด dialog
      const storedPending = loadPendingFromStorage()
      setPendingItems(storedPending)
    } else {
      // Reset ทุกอย่างเมื่อปิด (แต่ไม่ลบ localStorage)
      setExistingItems([])
      setHotelGuestsByHotelId({})
      setHotelGuestsLoadingByHotelId({})
    }
  }, [open, categoryType, sbwdtl_id])

  // Load Existing Items
  const loadExistingItems = async () => {
    setIsLoading(true)
    try {
      const categoryId = getCategoryId(categoryType)
      const response = await client.post('/SmartBill_WithdrawDtl_SelectCategory', {
        sbwdtl_id: parseInt(sbwdtl_id),
        category_id: categoryId
      })

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

      setExistingItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading items:', error)
      setErrorTitle('ไม่สามารถโหลดข้อมูลได้')
      setErrorDescription('เกิดข้อผิดพลาดในการโหลดรายการค่าใช้จ่าย กรุณาลองอีกครั้ง')
      setShowErrorDialog(true)
      setExistingItems([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load Options
  const loadOptions = async () => {
    try {
      if (categoryType === 'allowance' || categoryType === 'hotel') {
        const usersRes = await client.get('/getsUserForAssetsControl')
        setUsers(usersRes.data.data || [])
      }

      if (categoryType === 'hotel') {
        const provincesRes = await client.get('/Provinces_List')
        setProvinces(provincesRes.data.data || provincesRes.data || [])
      }

      if (categoryType === 'other') {
        const costRes = await client.get('/SmartBill_Withdraw_SelectCostOther')
        setCostOther(costRes.data.data || costRes.data || [])
      }
    } catch (error) {
      console.error('Error loading options:', error)
      setErrorTitle('ไม่สามารถโหลดตัวเลือกได้')
      setErrorDescription('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้และจังหวัด กรุณาลองอีกครั้ง')
      setShowErrorDialog(true)
    }
  }

  // Load Hotel Guests (by hotel id)
  const loadHotelGuests = async (sbc_hotelid: number) => {
    const hotelId = parseInt(String(sbc_hotelid))
    if (!Number.isFinite(hotelId)) return

    setHotelGuestsLoadingByHotelId(prev => ({ ...prev, [hotelId]: true }))
    try {
      const response = await client.post('/SmartBill_WithdrawDtl_SelectHotelGroup', {
        sbc_hotelid: hotelId
      })
      let guestData = []
      if (Array.isArray(response.data) && response.data.length > 0) {
        if (Array.isArray(response.data[0])) {
          guestData = response.data[0]
        } else {
          guestData = response.data
        }
      }
      setHotelGuestsByHotelId(prev => ({ ...prev, [hotelId]: guestData }))
    } catch (error) {
      console.error('Error loading hotel guests:', error)
      setHotelGuestsByHotelId(prev => ({ ...prev, [hotelId]: [] }))
    }
    finally {
      setHotelGuestsLoadingByHotelId(prev => ({ ...prev, [hotelId]: false }))
    }
  }

  const ensureHotelGuestsLoaded = async (hotelId: number) => {
    if (!Number.isFinite(hotelId)) return
    if (Object.prototype.hasOwnProperty.call(hotelGuestsByHotelId, hotelId)) return
    if (hotelGuestsLoadingByHotelId[hotelId]) return
    await loadHotelGuests(hotelId)
  }

  // Prefetch all hotel guest groups when opening the hotel list.
  useEffect(() => {
    if (!open || !showListDialog) return
    if (categoryType !== 'hotel') return
    if (!Array.isArray(existingItems) || existingItems.length === 0) return

    const hotelIds = Array.from(
      new Set(
        existingItems
          .map((item) => Number(item?.sbc_hotelid ?? item?.id))
          .filter((id) => Number.isFinite(id))
      )
    ) as number[]

    hotelIds.forEach((id) => {
      void ensureHotelGuestsLoaded(id)
    })
  }, [open, showListDialog, categoryType, existingItems, hotelGuestsByHotelId, hotelGuestsLoadingByHotelId])

  // Helper
  const getCategoryId = (type: string) => {
    const map: Record<string, number> = {
      fuel: 1,
      toll: 2,
      hotel: 3,
      allowance: 4
    }
    return map[type] || null
  }

  const getCategoryConfig = () => {
    const configs: Record<string, any> = {
      fuel: { title: 'รายการค่าน้ำมัน', color: 'blue' },
      toll: { title: 'รายการค่าทางด่วน', color: 'purple' },
      allowance: { title: 'รายการค่าเบี้ยเลี้ยง', color: 'orange' },
      hotel: { title: 'รายการค่าที่พัก', color: 'pink' },
      other: { title: 'รายการค่าใช้จ่ายอื่นๆ', color: 'green' }
    }
    return configs[categoryType]
  }

  // Handle Add Button (ปิด List → เปิด Form)
  const handleOpenForm = () => {
    setShowListDialog(false)
    setShowFormDialog(true)
  }

  // Handle Form Submit (เพิ่มใน pending → ปิด Form → เปิด List)
  const handleFormSubmit = (newItem: any) => {
    setPendingItems([...pendingItems, { ...newItem, id: Date.now(), isNew: true }])
    setShowFormDialog(false)
    setShowListDialog(true)
  }

  // Handle Form Cancel (ปิด Form → เปิด List)
  const handleFormCancel = () => {
    setShowFormDialog(false)
    setShowListDialog(true)
  }


  // Remove Pending Item
  const handleRemovePending = (itemId: number) => {
    const updatedItems = pendingItems.filter(item => item.id !== itemId)
    setPendingItems(updatedItems)

    // 🔄 Update localStorage
    if (updatedItems.length === 0) {
      clearPendingFromStorage()
    } else {
      savePendingToStorage(updatedItems)
    }
  }

  // Delete Existing Item
  const handleDeleteExisting = async (item: any) => {
    setIsDeleting(true)
    const scrollY = window.scrollY
    try {
      await client.post('/SmartBill_WithdrawDtl_DeleteCategory', {
        cost_id: item.cost_id,
        id: Number(item.id),
        category_id: getCategoryId(categoryType)
      })

      setExistingItems(prev =>
        prev.filter(i => i.id !== item.id)
      )

      setTimeout(() => {
        setSuccessTitle('ลบรายการสำเร็จ!')
        setSuccessDescription('รายการถูกลบเรียบร้อยแล้ว')
        setShowSuccessDialog(true)
        setIsDeleting(false)
        window.scrollTo({ top: scrollY, behavior: 'instant' })
        if (onSaveSuccess) {
          onSaveSuccess()
        }
      }, 500)
    } catch (error) {
      console.error('Delete error:', error)
      setErrorTitle('ไม่สามารถลบรายการได้')
      setErrorDescription('เกิดข้อผิดพลาดในการลบรายการ กรุณาลองอีกครั้ง')
      setShowErrorDialog(true)
    } finally {
      // setIsDeleting(false)
    }
  }

  // Save All Pending Items
  const handleSaveAll = async () => {
    if (pendingItems.length === 0) {
      return
    }

    setIsSaving(true)
    const scrollY = window.scrollY

    try {
      const categoryId = getCategoryId(categoryType)

      const buildPayload = (item: any) => {
        switch (categoryType) {
          case 'allowance':
            return {
              sbwdtl_id: parseInt(sbwdtl_id),
              cost_id: null,
              category_id: categoryId,
              count: item.days,
              startdate: dayjs(item.startdate).format('YYYY-MM-DD HH:mm:ss'),
              enddate: dayjs(item.enddate).format('YYYY-MM-DD HH:mm:ss'),
              usercode: item.usercode,
              foodStatus: item.foodStatus,
              amount: item.amount,
              create_by_usercode: session?.user?.UserCode
            }

          case 'hotel':
            return {
              sbwdtl_id: parseInt(sbwdtl_id),
              cost_id: null,
              category_id: categoryId,
              count: parseInt(item.nights.toString()),
              sbc_hotelProvince: item.province,
              sbc_hotelname: item.hotel_name,
              usercode: session?.user?.UserCode,
              amount: item.amount,
              max_allowance: item.max_allowance,
              create_by_usercode: session?.user?.UserCode,
              smartBill_CostHotelGroup: (item.guests || [])
                .filter((g: any) => !!g?.usercode)
                .map((g: any) => ({
                sbc_hotelid: null,
                // Make group id stable/unique per guest to avoid backend overwriting when blank.
                sbc_hotelgroupid: g.sbc_hotelgroupid || String(g.id),
                usercode: g.usercode,
                amount: g.hotel_rate || 0
              }))
            }

          case 'other':
            return {
              sbwdtl_id: parseInt(sbwdtl_id),
              cost_id: null,
              amount: item.amount,
              category_name: item.category_name,
              create_by_usercode: session?.user?.UserCode
            }

          default:
            return null
        }
      }
      const normalizeRows = (raw: any): any[] => {
        if (raw == null) return []
        if (Array.isArray(raw)) {
          if (raw.length > 0 && Array.isArray(raw[0])) return raw[0]
          return raw
        }
        if (typeof raw === 'object') {
          if (Array.isArray((raw as any).data)) return (raw as any).data
          if (Array.isArray((raw as any)[0])) return (raw as any)[0]
          return [raw]
        }
        return []
      }

      const pickSavedHotelRow = (rows: any[], payload: any) => {
        if (!Array.isArray(rows) || rows.length === 0) return null

        const toNumber = (v: any) => {
          const n = typeof v === 'number' ? v : parseFloat(String(v))
          return Number.isFinite(n) ? n : NaN
        }

        // Prefer exact match on key hotel fields (name+province+amount+count)
        const matches = rows.filter((r) => {
          if (!r || typeof r !== 'object') return false
          return (
            r.sbc_hotelname === payload?.sbc_hotelname &&
            r.sbc_hotelProvince === payload?.sbc_hotelProvince &&
            toNumber(r.amount) === toNumber(payload?.amount) &&
            toNumber(r.count) === toNumber(payload?.count)
          )
        })

        const candidates = matches.length > 0 ? matches : rows

        // If we still have multiple candidates, choose the largest numeric id (latest insert)
        const numericIdCandidates = candidates.filter((r) => r?.id != null && !Number.isNaN(toNumber(r.id)))
        if (numericIdCandidates.length > 0) {
          return numericIdCandidates.reduce(
            (max, cur) => (toNumber(cur.id) > toNumber(max.id) ? cur : max),
            numericIdCandidates[0]
          )
        }

        return candidates[candidates.length - 1]
      }

      const payloads = pendingItems.map((item) => buildPayload(item)).filter(Boolean)

      const savedItems: any[] = []

      for (let i = 0; i < payloads.length; i++) {
        const payload = payloads[i]
        const originalItem = pendingItems[i]
        
        const response = await client.post(
          '/SmartBill_WithdrawDtl_SaveChangesCategory',
          [payload]
        )

        let responseData: any = Array.isArray(response.data[0])
          ? response.data[0]
          : response.data

        if (categoryType === 'hotel') {
          const rows = normalizeRows(response.data)
          responseData = pickSavedHotelRow(rows, payload) || {}
        } else {
          if (Array.isArray(responseData) && responseData.length > 0) {
            responseData = responseData[0]
          }
        }

        const savedItem = {
          ...originalItem,
          id: responseData.id || Date.now() + i,
          cost_id: responseData.cost_id || null,
          isNew: false
        }

        if (categoryType === 'hotel' && payload?.smartBill_CostHotelGroup) {
          if (responseData?.id) {
            const hotelGroupData = payload.smartBill_CostHotelGroup.map((guest: any) => ({
              sbc_hotelid: parseInt(String(responseData.id)),
              sbc_hotelgroupid: guest.sbc_hotelgroupid || "",
              usercode: guest.usercode,
              amount: guest.amount
            }))

            try {
              await client.post(
                '/SmartBill_WithdrawDtl_SaveChangesHotelGroup',
                hotelGroupData
              )
            } catch (groupError) {
              // Best-effort rollback: avoid leaving a hotel record without guests.
              try {
                if (responseData?.cost_id && responseData?.id) {
                  await client.post('/SmartBill_WithdrawDtl_DeleteCategory', {
                    cost_id: responseData.cost_id,
                    id: Number(responseData.id),
                    category_id: categoryId
                  })
                }
              } catch {
                // ignore rollback errors
              }
              throw groupError
            }
            
            savedItem.sbc_hotelid = responseData.id
            savedItem.sbc_hotelname = originalItem.hotel_name
            savedItem.sbc_hotelProvince = originalItem.province
            savedItem.count = originalItem.nights
          }
        }

        savedItems.push(savedItem)
      }
      setExistingItems(prev => [...prev, ...savedItems])
      setPendingItems([])
      
      //  clear localStorage
      clearPendingFromStorage()

      //  แสดง Success Dialog
      setTimeout(() => {
        setSuccessTitle(`บันทึก ${payloads.length} รายการสำเร็จ!`)
        setSuccessDescription(`บันทึกรายการทั้งหมดเรียบร้อยแล้ว`)
        setShowSuccessDialog(true)
        window.scrollTo({ top: scrollY, behavior: 'instant' })
        
        if (onSaveSuccess) {
          onSaveSuccess()
        }
      }, 300)

    } catch (error: any) {
      console.error('Save error:', error)
      setErrorTitle('เกิดข้อผิดพลาด')
      setErrorDescription('ไม่สามารถบันทึกรายการได้ กรุณาลองอีกครั้ง')
      setShowErrorDialog(true)
      
      setTimeout(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' })
      }, 0)

    } finally {
      setIsSaving(false)
    }
  }

  // Render Item Preview
  const renderItemPreview = (item: any) => {
    switch (categoryType) {
      // case 'fuel':
      //   return (
      //     <div className="flex items-center justify-between">
      //       <div>
      //         <div className="font-medium">{dayjs(item.date || item.startdate).format('DD/MM/YYYY')}</div>
      //         <div className="text-sm text-slate-600">{item.amount?.toLocaleString()} บาท</div>
      //       </div>
      //     </div>
      //   )

      case 'allowance':
        return (
          <div className="space-y-1">
            <div className="font-medium flex items-center gap-2">
              {item.usercode}
              {item.foodStatus && <Badge variant="outline" className="text-orange-600">รวมอาหาร</Badge>}
            </div>
            <div className="text-sm text-slate-600">
              {item.days || item.count} วัน • {item.amount?.toLocaleString()} บาท
            </div>
          </div>
        )

      case 'hotel':
        {
          const nights = Number(item.nights ?? item.count ?? 0) || 0

          const pendingGuests = Array.isArray(item?.guests)
            ? item.guests.filter((g: any) => !!g?.usercode)
            : []

          const hotelId = Number(item?.sbc_hotelid ?? item?.id)
          const savedGuests = Number.isFinite(hotelId) ? (hotelGuestsByHotelId[hotelId] || []) : []
          const isLoadingGuests = Number.isFinite(hotelId) ? !!hotelGuestsLoadingByHotelId[hotelId] : false
          const hasLoadedSavedGuests = Number.isFinite(hotelId)
            ? Object.prototype.hasOwnProperty.call(hotelGuestsByHotelId, hotelId)
            : false

          const guestsToShow = pendingGuests.length > 0
            ? pendingGuests.map((g: any) => ({ usercode: g.usercode, perNight: Number(g.hotel_rate || 0) }))
            : savedGuests.map((g) => ({ usercode: g.usercode, perNight: Number(g.amount || 0) }))

          return (
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="font-medium">{item.hotel_name || item.sbc_hotelname}</div>
                <div className="text-sm text-slate-600">
                  {item.province || item.sbc_hotelProvince} • {nights} คืน • {item.amount?.toLocaleString()} บาท
                </div>
              </div>

              <Accordion
                type="single"
                collapsible
                onValueChange={(v) => {
                  if (v === 'guests' && pendingGuests.length === 0 && Number.isFinite(hotelId)) {
                    void ensureHotelGuestsLoaded(hotelId)
                  }
                }}
              >
                <AccordionItem value="guests" className="border rounded-md px-3">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm">
                      ผู้เข้าพัก (
                      {pendingGuests.length > 0
                        ? pendingGuests.length
                        : hasLoadedSavedGuests
                          ? guestsToShow.length
                          : isLoadingGuests
                            ? 'กำลังโหลด...'
                            : '...'}
                      )
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {pendingGuests.length === 0 && isLoadingGuests ? (
                      <div className="text-xs text-slate-500">กำลังโหลดรายการผู้เข้าพัก...</div>
                    ) : guestsToShow.length === 0 ? (
                      <div className="text-xs text-slate-500">ไม่มีข้อมูลผู้เข้าพัก</div>
                    ) : (
                      <div className="space-y-2">
                        {guestsToShow.map((g: any, idx: number) => {
                          const perNight = Number(g.perNight || 0)
                          const total = perNight * (nights || 0)
                          return (
                            <div key={`${g.usercode}_${idx}`} className="flex items-center justify-between gap-3">
                              <div className="text-sm font-medium text-slate-900">{g.usercode}</div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono whitespace-nowrap">
                                  {perNight.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท/คืน
                                </Badge>
                                <Badge variant="outline" className="font-mono whitespace-nowrap">
                                  รวม {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )
        }

      // case 'toll':
      case 'other':
        return (
          <div>
            {item.category_name && <div className="font-medium">{item.category_name}</div>}
            <div className="text-sm text-slate-600">{item.amount?.toLocaleString()} บาท</div>
          </div>
        )

      default:
        return <div>{item.amount?.toLocaleString()} บาท</div>
    }
  }

  const config = getCategoryConfig()

  const handleFormDialogOpenChange = (nextOpen: boolean) => {
    setShowFormDialog(nextOpen)
    if (!nextOpen) {
      setShowListDialog(true)
    }
  }

  return (
    <>
      {/* List Dialog */}
      <Dialog open={open && showListDialog}   
        onOpenChange={(next) => {
          if (showSuccessDialog) return
          onOpenChange(next)
        }} 
        modal={true} 
      >
        <DialogContent className="max-w-3xl! w-full overflow-y-auto" onInteractOutside={(e) => {
          if (deleteItem) {
            e.preventDefault()
          }
        }}>
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className={`h-8 w-8 animate-spin mx-auto mb-3 text-${config.color}-600`} />
                <p className="text-sm text-slate-600">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* แจ้งเตือนเมื่อมีข้อมูลจาก localStorage */}
              {pendingItems.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span>พบรายการที่ยังไม่ได้บันทึกจากครั้งก่อน</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  รายการที่มีอยู่: <strong>{existingItems.length}</strong> |
                  รายการใหม่: <strong className="text-orange-600">{pendingItems.length}</strong>
                </div>
                <Button onClick={handleOpenForm} className="gap-2">
                  <Plus className="h-4 w-4" />
                  เพิ่มรายการ
                </Button>
              </div>

              {/* Existing Items */}
              {existingItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Badge className="bg-green-600">บันทึกแล้ว</Badge>
                    รายการที่บันทึกแล้ว
                  </h4>
                  {existingItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex-1">
                        {renderItemPreview(item)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteItem(item)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Items */}
              {pendingItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                      ยังไม่บันทึก
                    </Badge>
                    รายการใหม่
                  </h4>
                  {pendingItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border-2 border-dashed rounded-lg bg-yellow-50 border-yellow-300">
                      <div className="flex-1">
                        {renderItemPreview(item)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePending(item.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {existingItems.length === 0 && pendingItems.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-sm">ยังไม่มีรายการ</p>
                  <p className="text-xs mt-1">คลิก "เพิ่มรายการ" เพื่อเริ่มต้น</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              ปิด
            </Button>
            {pendingItems.length > 0 && (
              <Button
                onClick={handleSaveAll}
                disabled={isSaving || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    บันทึกทั้งหมด ({pendingItems.length})
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialogs - แยกตาม Type */}
      {/* {categoryType === 'fuel' && (
        <FuelFormDialog
          open={showFormDialog}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
      
      {categoryType === 'toll' && (
        <TollFormDialog
          open={showFormDialog}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )} */}

      {categoryType === 'allowance' && (
        <AllowanceFormDialog
          open={showFormDialog}
          onOpenChange={handleFormDialogOpenChange}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          users={users}
          initialStartDate={withdrawDetail?.sbwdtl_operationid_startdate}
          initialEndDate={withdrawDetail?.sbwdtl_operationid_enddate}
        />
      )}

      {categoryType === 'hotel' && (
        <HotelFormDialog
          open={showFormDialog}
          onOpenChange={handleFormDialogOpenChange}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          users={users}
          provinces={provinces}
        />
      )}

      {categoryType === 'other' && (
        <OtherFormDialog
          open={showFormDialog}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          costOther={costOther}
          existingItems={existingItems}
          pendingItems={pendingItems}
        />
      )}

      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null)
        }}
      >
        <AlertDialogContent forceMount>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ยืนยันการลบรายการ
            </AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบรายการนี้หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              ยกเลิก
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleteItem) return
                await handleDeleteExisting(deleteItem)
                setDeleteItem(null)
              }}
            >
              {isDeleting ? 'กำลังลบ...' : 'ลบ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent
          forceMount
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">{errorTitle}</AlertDialogTitle>
            <AlertDialogDescription>{errorDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowErrorDialog(false)} 
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
        title={successTitle}
        description={successDescription}
      />
      {/* <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent
          onEscapeKeyDown={(e) => e.preventDefault()}
          forceMount
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div className="flex-1">
                <AlertDialogTitle className="text-green-600">
                  {successTitle}
                </AlertDialogTitle>
                {successDescription && (
                  <AlertDialogDescription className="mt-2">
                    {successDescription}
                  </AlertDialogDescription>
                )}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700 cursor-pointer"
            >
              รับทราบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
    </>
  )
}