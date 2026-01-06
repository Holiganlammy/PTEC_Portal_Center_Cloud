"use client"

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
import { Separator } from '@/components/ui/separator'
import {
  Trash2, 
  Calendar as CalendarIcon, 
  MapPin, 
  FileText,
  Plus,
  Fuel,
  Car,
  Utensils,
  Hotel,
  MoreHorizontal,
  Info,
} from 'lucide-react'
import dayjs from 'dayjs'
import Swal from 'sweetalert2'
import client from '@/lib/axios/interceptors'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import React, { useState, useRef } from 'react'

//  Import ExpenseDialogs
import ExpenseDialogs from '../dialog/ExpenseDialog'
import TollFormDialog from '../dialog/TollForm'
import FuelFormDialog from '../dialog/FuelForm'

interface ExpenseTableProps {
  smartBill_WithdrawDtl: smartBill_Withdraw_Detail[]
  smartBill_WithdrawHeader: smartBill_Withdraw_Header[]
  smartBill_Withdraw: smartBill_Withdraw
  fetchData: () => void
  onSaveSuccess: () => void
}

export default function ExpenseTable({
  smartBill_WithdrawDtl,
  smartBill_WithdrawHeader,
  smartBill_Withdraw,
  fetchData,
  onSaveSuccess
}: ExpenseTableProps) {
  const [selectedRemark, setSelectedRemark] = useState<string | null>(null)
  const [fuelDialogOpen, setFuelDialogOpen] = useState(false)
  const [tollDialogOpen, setTollDialogOpen] = useState(false)
  const [fuelDialogSbwdtlId, setFuelDialogSbwdtlId] = useState<string>('')
  const [tollDialogSbwdtlId, setTollDialogSbwdtlId] = useState<string>('')
  
  //  State สำหรับ ExpenseDialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogCategory, setDialogCategory] = useState<{
    type: 'allowance' | 'hotel' | 'other'
    sbwdtl_id: string
    index: number
  } | null>(null)


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
    
    const scrollY = window.scrollY
    
    if (result.isConfirmed) {
      try {
        await client.post('/SmartBill_WithdrawDtl_Delete', { 
          sbwdtl_id: smartBill_WithdrawDtl[index].sbwdtl_id 
        })
        Swal.fire('สำเร็จ!', 'ลบรายการเรียบร้อย', 'success')
        setTimeout(() => {
          window.scrollTo({ top: scrollY, behavior: 'instant' })
        }, 0)
        fetchData()
      } catch (error) {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบรายการได้', 'error')
      }
    }
  }

  //  handleCategoryClick เปิด ExpenseDialogs
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
      const isDistrictCompanyCar =
        currentItem?.car_infostatus_companny === true && smartBill_WithdrawHeader?.[0]?.car_paytype === 0
      const isPrivateCar = currentItem?.car_infostatus_companny === false

      // เงื่อนไขห้ามเพิ่มเบิกตามบิล: รถเขต หรือ รถส่วนตัว
      if (isDistrictCompanyCar || isPrivateCar) {
        Swal.fire({
          icon: 'warning',
          title: 'ไม่สามารถเบิกได้',
          text: 'รายการนี้ไม่สามารถเพิ่มเบิกตามบิลได้ (รถเขต/รถส่วนตัว)',
          confirmButtonText: 'รับทราบ'
        })
        return
      }
    }

    // เปิด ExpenseDialogs
    setDialogCategory({ 
      type: type as 'allowance' | 'hotel' | 'other', 
      sbwdtl_id,
      index 
    })
    setDialogOpen(true)
  }

  const calculateActualTotalLocal = () => {
    if (!smartBill_WithdrawDtl.length) return 0

    return smartBill_WithdrawDtl.reduce((sum, item) => {
      if (item.sb_paystatus === false) return sum

      let amouthActual = 0

      if (item.car_infostatus_companny === true) {
        // รถบริษัท
        if (smartBill_WithdrawHeader?.[0]?.car_paytype === 0) {
          // รถบริษัท + เบิกตามไมล์เรท (รถเขต)
          const itemTotal = parseFloat(item.amouthAll?.toString() || '0') || 0
          return sum + itemTotal
        } else {
          // รถบริษัท + เบิกตามจริง
          amouthActual = parseFloat(item.amouthTrueOil?.toString() || '0') || 0
        }
      }
      else if (item.car_infostatus_companny === false) {
        // รถส่วนตัว
        const itemTotal = parseFloat(item.amouthAll?.toString() || '0') || 0
        return sum + itemTotal
      }
      
      // ค่าใช้จ่ายอื่นๆ
      const allowance = parseFloat(item.amouthAllowance?.toString() || '0') || 0
      const hotel = parseFloat(item.amouthHotel?.toString() || '0') || 0
      const toll = parseFloat(item.amouthRush?.toString() || '0') || 0
      const other = parseFloat(item.amouthother?.toString() || '0') || 0

      return sum + amouthActual + allowance + hotel + toll + other
    }, 0)
  }
  
  const calculateColumnTotalLocal = (field: keyof smartBill_Withdraw_Detail) => {
    if (!smartBill_WithdrawDtl.length) return 0

    return smartBill_WithdrawDtl.reduce((sum, item) => {
      if (item.sb_paystatus === false) return 0
      
      const value = parseFloat(item[field] as string) || 0
      return sum + value
    }, 0)
  }

  if (!smartBill_WithdrawDtl.length || !smartBill_WithdrawDtl[0].sbwdtl_id) {
    return (
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
                ? <><strong>เอกสารถูกล็อค</strong> ไม่สามารถแก้ไขหรือเพิ่มรายการค่าใช้จ่ายได้</>
                : <>💡 
                <strong>คลิกที่จำนวนเงิน</strong> ในคอลัมน์ เบิกตามบิล, เบี้ยเลี้ยง, ที่พัก, ทางด่วน, อื่นๆ เพื่อเพิ่ม/แก้ไขรายการค่าใช้จ่าย <br />
                <strong className='text-red-500'>หมายเหตุ:</strong> การเบิกค่าใช้จ่าย รถบริษัทจะไม่คำนวนเบิกตามไมล์เรทรวมอยู่ในสรุปยอดรวมค่าใช้จ่าย (นอกจากรถประจำเขต ที่จะเบิกตามไมล์เรทได้)
                </>
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
                <TableRow 
                  key={item.sbwdtl_id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  {/* ช่วงเวลาเดินทาง */}
                  <TableCell className="text-xs">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        เริ่มต้น: {dayjs(item.sbwdtl_operationid_startdate).add(7, 'hour').format('DD/MM/YY')}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        สิ้นสุด: {dayjs(item.sbwdtl_operationid_enddate).add(7, 'hour').format('DD/MM/YY')}
                      </div>
                    </div>
                  </TableCell>

                  {/* กิจกรรม */}
                  <TableCell className="max-w-[200px]">
                    <div className="flex items-start gap-2 group">
                      <MapPin className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-sm text-slate-900 dark:text-slate-100 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors relative"
                          onClick={() => setSelectedRemark(item.remark || '')}
                        >
                          {item.remark}
                          {item.remark && item.remark.length > 80 && (
                            <span className="text-blue-500 font-semibold"> ...</span>
                          )}
                        </p>
                        <span className="text-xs text-slate-400 dark:text-slate-500 transition-opacity">
                          คลิกเพื่อดูรายละเอียด
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* เริ่มต้น (กม.) */}
                  <TableCell className="text-center">
                    <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                      {item.sbwdtl_operationid_startmile?.toLocaleString()}
                    </span>
                  </TableCell>

                  {/* สิ้นสุด (กม.) */}
                  <TableCell className="text-center">
                    <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                      {item.sbwdtl_operationid_endmile.toLocaleString()}
                    </span>
                  </TableCell>

                  {/* ระยะทาง */}
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono font-medium">
                      {item.sum_mile?.toLocaleString()}
                    </Badge>
                  </TableCell>

                  {/* อัตราชดเชย */}
                  <TableCell className="text-center">
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {item.price_rateoil?.toFixed(2)}
                    </span>
                  </TableCell>

                  {/* เบิกตามไมล์เรท */}
                  <TableCell className="text-right">
                    <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                      {(item.sb_paystatus === false ? 0 : item.oilBath)?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  
                  {/* 1. เบิกตามบิล (Fuel) */}
                  <TableCell className="text-right p-0">
                    <div
                      onClick={() => {
                        if (smartBill_Withdraw.lock_status) {
                          Swal.fire({
                            icon: 'warning',
                            title: 'ไม่สามารถแก้ไขได้',
                            text: 'เอกสารนี้ถูกล็อคแล้ว ไม่สามารถจัดการค่าใช้จ่ายได้',
                            confirmButtonText: 'รับทราบ'
                          })
                          return
                        }

                        const isDistrictCompanyCar =
                          item?.car_infostatus_companny === true && smartBill_WithdrawHeader?.[0]?.car_paytype === 0
                        const isPrivateCar = item?.car_infostatus_companny === false

                        // เงื่อนไขห้ามเพิ่มเบิกตามบิล: รถเขต หรือ รถส่วนตัว
                        if (isDistrictCompanyCar || isPrivateCar) {
                          Swal.fire({
                            icon: 'warning',
                            title: 'ไม่สามารถเบิกได้',
                            text: 'รายการนี้ไม่สามารถเพิ่มเบิกตามบิลได้ (รถเขต/รถส่วนตัว)',
                            confirmButtonText: 'รับทราบ'
                          })
                          return
                        }

                        setFuelDialogSbwdtlId(item.sbwdtl_id)
                        setFuelDialogOpen(true)
                      }}
                      className={`
                        group cursor-pointer h-full w-full px-3 py-2.5
                        transition-all duration-200 ease-in-out
                        hover:bg-red-50 dark:hover:bg-red-950/50
                        ${
                          (item.sb_paystatus === false || !item.amouthTrueOil || item.amouthTrueOil === 0)
                            ? 'border-l-red-300 dark:border-l-red-700 bg-red-50/20 dark:bg-blue-950/10'
                            : 'border-l-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex flex-col items-end">
                          <span className={`
                            text-sm font-mono font-semibold
                            ${(item.sb_paystatus === false || !item.amouthTrueOil || item.amouthTrueOil === 0)
                              ? 'text-slate-600 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                            }
                          `}>
                            {(item.sb_paystatus === false || !item.amouthTrueOil ? 0 : item.amouthTrueOil).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          
                          {(item.sb_paystatus === false || !item.amouthTrueOil || item.amouthTrueOil === 0) ? (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                              <Plus className="h-3 w-3" />
                              คลิกเพื่อเพิ่ม
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              คลิกเพื่อแก้ไข
                            </span>
                          )}
                        </div>
                        <Fuel className="h-4 w-4 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  </TableCell>

                  {/* 2. เบี้ยเลี้ยง (Allowance) */}
                  <TableCell className="text-right p-0">
                    <div
                      onClick={() => handleCategoryClick(index, 'allowance', item.sbwdtl_id)}
                      className={`
                        group cursor-pointer h-full w-full px-3 py-2.5
                        transition-all duration-200 ease-in-out
                        hover:bg-orange-50 dark:hover:bg-orange-950/50
                        ${
                          (item.sb_paystatus === false || !item.amouthAllowance || item.amouthAllowance === 0)
                            ? 'border-l-orange-300 dark:border-l-orange-700 bg-orange-50/20 dark:bg-orange-950/10'
                            : 'border-l-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex flex-col items-end">
                          <span className={`
                            text-sm font-mono font-semibold
                            ${(item.sb_paystatus === false || !item.amouthAllowance || item.amouthAllowance === 0)
                              ? 'text-slate-600 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                            }
                          `}>
                            {(item.sb_paystatus === false || !item.amouthAllowance ? 0 : item.amouthAllowance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          
                          {(item.sb_paystatus === false || !item.amouthAllowance || item.amouthAllowance === 0) ? (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                              <Plus className="h-3 w-3" />
                              คลิกเพื่อเพิ่ม
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              คลิกเพื่อแก้ไข
                            </span>
                          )}
                        </div>
                        <Utensils className="h-4 w-4 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  </TableCell>

                  {/* 3. ที่พัก (Hotel) */}
                  <TableCell className="text-right p-0">
                    <div
                      onClick={() => handleCategoryClick(index, 'hotel', item.sbwdtl_id)}
                      className={`
                        group cursor-pointer h-full w-full px-3 py-2.5
                        transition-all duration-200 ease-in-out
                        hover:bg-pink-50 dark:hover:bg-pink-950/50
                        ${
                          (item.sb_paystatus === false || !item.amouthHotel || item.amouthHotel === 0)
                            ? 'border-l-pink-300 dark:border-l-pink-700 bg-pink-50/20 dark:bg-pink-950/10'
                            : 'border-l-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex flex-col items-end">
                          <span className={`
                            text-sm font-mono font-semibold
                            ${(item.sb_paystatus === false || !item.amouthHotel || item.amouthHotel === 0)
                              ? 'text-slate-600 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                            }
                          `}>
                            {(item.sb_paystatus === false || !item.amouthHotel ? 0 : item.amouthHotel).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          
                          {(item.sb_paystatus === false || !item.amouthHotel || item.amouthHotel === 0) ? (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                              <Plus className="h-3 w-3" />
                              คลิกเพื่อเพิ่ม
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              คลิกเพื่อแก้ไข
                            </span>
                          )}
                        </div>
                        <Hotel className="h-4 w-4 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  </TableCell>

                  {/* 4. ทางด่วน (Toll) */}
                  <TableCell className="text-right p-0">
                    <div
                      onClick={() => {
                        setTollDialogSbwdtlId(item.sbwdtl_id)
                        setTollDialogOpen(true)
                      }}
                      className={`
                        group cursor-pointer h-full w-full px-3 py-2.5
                        transition-all duration-200 ease-in-out
                        hover:bg-purple-50 dark:hover:bg-purple-950/50
                        ${
                          (item.sb_paystatus === false || !item.amouthRush || item.amouthRush === 0)
                            ? 'border-l-purple-300 dark:border-l-purple-700 bg-purple-50/20 dark:bg-purple-950/10'
                            : 'border-l-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex flex-col items-end">
                          <span className={`
                            text-sm font-mono font-semibold
                            ${(item.sb_paystatus === false || !item.amouthRush || item.amouthRush === 0)
                              ? 'text-slate-600 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                            }
                          `}>
                            {(item.sb_paystatus === false || !item.amouthRush ? 0 : item.amouthRush).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          
                          {(item.sb_paystatus === false || !item.amouthRush || item.amouthRush === 0) ? (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                              <Plus className="h-3 w-3" />
                              คลิกเพื่อเพิ่ม
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              คลิกเพื่อแก้ไข
                            </span>
                          )}
                        </div>
                        <Car className="h-4 w-4 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  </TableCell>

                  {/* 5. อื่นๆ (Other) */}
                  <TableCell className="text-right p-0">
                    <div
                      onClick={() => handleCategoryClick(index, 'other', item.sbwdtl_id)}
                      className={`
                        group cursor-pointer h-full w-full px-3 py-2.5
                        transition-all duration-200 ease-in-out
                        hover:bg-green-50 dark:hover:bg-green-950/50
                        ${
                          (item.sb_paystatus === false || !item.amouthother || item.amouthother === 0)
                            ? 'border-l-green-300 dark:border-l-green-700 bg-green-50/20 dark:bg-green-950/10'
                            : 'border-l-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex flex-col items-end">
                          <span className={`
                            text-sm font-mono font-semibold
                            ${(item.sb_paystatus === false || !item.amouthother || item.amouthother === 0)
                              ? 'text-slate-600 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                            }
                          `}>
                            {(item.sb_paystatus === false || !item.amouthother ? 0 : item.amouthother).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          
                          {(item.sb_paystatus === false || !item.amouthother || item.amouthother === 0) ? (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                              <Plus className="h-3 w-3" />
                              คลิกเพื่อเพิ่ม
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              คลิกเพื่อแก้ไข
                            </span>
                          )}
                        </div>
                        <MoreHorizontal className="h-4 w-4 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* ยอดรวม */}
                  <TableCell className="text-right">
                    <Badge className="font-mono font-semibold">
                      {(item.sb_paystatus === false ? 0 : item.amouthAll)?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
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
        
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">ไมล์เรท</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotalLocal('oilBath').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">เบิกตามบิล</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotalLocal('amouthTrueOil').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">เบี้ยเลี้ยง</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotalLocal('amouthAllowance').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">ที่พัก</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotalLocal('amouthHotel').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">ค่าทางด่วน</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotalLocal('amouthRush').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">อื่นๆ</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {calculateColumnTotalLocal('amouthother').toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="space-y-1 col-span-full md:col-span-1">
            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold">ยอดรวม</p>
            <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {calculateActualTotalLocal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Remark Detail Dialog */}
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

      {/*  ExpenseDialogs Component */}
      {dialogCategory && (
        <ExpenseDialogs
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          categoryType={dialogCategory.type}
          sbwdtl_id={dialogCategory.sbwdtl_id}
          withdrawDetail={smartBill_WithdrawDtl[dialogCategory.index]}
          onSaveSuccess={onSaveSuccess}
        />
      )}

      <TollFormDialog
        open={tollDialogOpen}
        onOpenChange={setTollDialogOpen}
        sbwdtl_id={tollDialogSbwdtlId}
        onSaveSuccess={onSaveSuccess}
      />
      <FuelFormDialog
        open={fuelDialogOpen}
        onOpenChange={setFuelDialogOpen}
        sbwdtl_id={fuelDialogSbwdtlId}
        onSaveSuccess={onSaveSuccess}
      />
    </div>
  )
}