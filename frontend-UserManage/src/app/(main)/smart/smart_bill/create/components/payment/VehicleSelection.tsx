"use client"

import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Car, Info, Building2, User as UserIcon, ChevronsUpDown, Check, X, AlertTriangle } from 'lucide-react' //  เพิ่ม X, AlertTriangle
import client from '@/lib/axios/interceptors'
import { CarInfo } from '@/app/(main)/smart/smart_car/create/service/type/types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import Swal from 'sweetalert2'

interface VehicleSelectionProps {
  smartBill_Withdraw: smartBill_Withdraw
  setSmartBill_Withdraw: (data: smartBill_Withdraw) => void
  carInfo: CarInfo
  setCarInfo: (data: CarInfo) => void
  carInfoData: CarInfo[]
  setCarInfoData: (data: CarInfo[]) => void
  carInfoDataCompany: CarInfo[]
  setCarInfoDataCompany: (data: CarInfo[]) => void
  users: UserData[]
  onClearExpenses: () => Promise<boolean>
}

export default function VehicleSelection({
  smartBill_Withdraw,
  setSmartBill_Withdraw,
  carInfo,
  setCarInfo,
  carInfoData,
  setCarInfoData,
  carInfoDataCompany,
  setCarInfoDataCompany,
  onClearExpenses,
}: VehicleSelectionProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const handleConditionChange = async (value: string) => {
    const newCondition = parseInt(value)

    if (smartBill_Withdraw.car_infocode) {
      const result = await Swal.fire({
        title: 'ยืนยันการเปลี่ยนประเภทรถ',
        html: `
          <div class="text-left">
            <p class="text-gray-600 mb-3">การเปลี่ยนประเภทรถจะทำให้:</p>
            <ul class="text-sm text-gray-700 space-y-2">
              <li class="flex items-start gap-2">
                <span class="text-red-500">•</span>
                <span>ข้อมูลทะเบียนรถถูกล้าง</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-red-500">•</span>
                <span>รายการค่าใช้จ่ายทั้งหมดถูกลบ</span>
              </li>
            </ul>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280'
      })

      if (!result.isConfirmed) {
        return
      }
    }

    const clearSuccess = await onClearExpenses()
    if (!clearSuccess) {
      return
    }

    setCarInfo({
      car_infocode: '',
      car_infostatus_companny: false,
      car_categaryid: 0,
      car_typeid: 0,
      car_band: '',
      car_tier: '',
      car_color: '',
      car_remarks: '',
      car_payname: '',
    })

    setSmartBill_Withdraw({
      ...smartBill_Withdraw,
      condition: newCondition,
      car_infocode: null,
      car_infoid: null
    })

    if (newCondition > 1) {
      setCarInfoDataCompany([])
      setCarInfoData([])
    } else {
      try {
        const body = { car_infocode: null }
        const response = await client.post('/SmartBill_CarInfoSearch', body)

        if (newCondition === 0) {
          const companyData = response.data.filter((res: any) => res.car_infostatus_companny === true)
          setCarInfoDataCompany(companyData)
          setCarInfoData([])
        } else if (newCondition === 1) {
          const personalData = response.data.filter((res: any) => res.car_infostatus_companny === false)
          setCarInfoData(personalData)
          setCarInfoDataCompany([])
        }
      } catch (error) {
        console.error('Error fetching car data:', error)
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดข้อมูลรถได้'
        })
      }
    }
  }

  // ฟังก์ชันล้างทะเบียนรถ
  const handleClearVehicle = async () => {
    const result = await Swal.fire({
      title: 'ยืนยันการล้างทะเบียนรถ',
      html: `
      <div class="text-left">
        <p class="text-gray-600 mb-3">การล้างทะเบียนรถจะทำให้:</p>
        <ul class="text-sm text-gray-700 space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-red-500">•</span>
            <span>ข้อมูลทะเบียนรถถูกล้าง</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-red-500">•</span>
            <span>รายการค่าใช้จ่ายทั้งหมดถูกลบ</span>
          </li>
        </ul>
      </div>
    `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    })

    if (!result.isConfirmed) {
      return
    }

    // ล้างรายการค่าใช้จ่าย
    const clearSuccess = await onClearExpenses()
    if (!clearSuccess) {
      return
    }

    const currentCondition = smartBill_Withdraw.condition

    // ล้างข้อมูลรถ
    setCarInfo({
      car_infocode: '',
      car_infostatus_companny: false,
      car_categaryid: 0,
      car_typeid: 0,
      car_band: '',
      car_tier: '',
      car_color: '',
      car_remarks: '',
      car_payname: '',
    })

    setSmartBill_Withdraw({
      ...smartBill_Withdraw,
      car_infocode: null,
      car_infoid: null
    })
    if (currentCondition !== null && currentCondition !== undefined && currentCondition <= 1) {
      try {
        const body = { car_infocode: null }
        const response = await client.post('/SmartBill_CarInfoSearch', body)

        if (currentCondition === 0) {
          // รถบริษัท
          const companyData = response.data.filter((res: any) => res.car_infostatus_companny === true)
          setCarInfoDataCompany(companyData)
          console.log(' โหลดรถบริษัทใหม่:', companyData.length, 'คัน')
        } else if (currentCondition === 1) {
          // รถส่วนตัว
          const personalData = response.data.filter((res: any) => res.car_infostatus_companny === false)
          setCarInfoData(personalData)
          console.log(' โหลดรถส่วนตัวใหม่:', personalData.length, 'คัน')
        }
      } catch (error) {
        console.error('❌ Error reloading car data:', error)
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดข้อมูลรถใหม่ได้'
        })
        return
      }
    }

    Swal.fire({
      icon: 'success',
      title: 'ล้างข้อมูลสำเร็จ',
      text: 'ล้างทะเบียนรถและรายการค่าใช้จ่ายเรียบร้อย',
      timer: 1500,
      showConfirmButton: false
    })
  }

  const handleCarSelect = (carCode: string) => {
    const selectedCar = [...(carInfoDataCompany || []), ...(carInfoData || [])]
      .find(c => c.car_infocode === carCode)

    if (selectedCar) {
      setCarInfo({
        car_infocode: selectedCar.car_infocode,
        car_infostatus_companny: selectedCar.car_infostatus_companny,
        car_categaryid: selectedCar.car_categaryid,
        car_typeid: selectedCar.car_typeid,
        car_band: selectedCar.car_band,
        car_tier: selectedCar.car_tier,
        car_color: selectedCar.car_color,
        car_remarks: selectedCar.car_remarks,
        car_payname: selectedCar.car_payname,
      })
      setSmartBill_Withdraw({
        ...smartBill_Withdraw,
        car_infocode: selectedCar.car_infocode
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3 px-1">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <Car className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            รายละเอียดการเดินทาง
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select vehicle type and provide details
          </p>
        </div>
      </div>

      <Separator />

      {/* Vehicle Type Selection */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          ประเภทรถ <span className="text-red-500">*</span>
        </Label>

        <RadioGroup
          value={smartBill_Withdraw.condition?.toString() || ""}
          onValueChange={handleConditionChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
          disabled={smartBill_Withdraw.lock_status}
        >
          <label className={`
            flex items-center gap-3 p-4 rounded-lg border-2 transition-all
            ${smartBill_Withdraw.lock_status
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer'
            }
            ${smartBill_Withdraw.condition === 0
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : smartBill_Withdraw.lock_status
                ? 'border-slate-200 dark:border-slate-700'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }
          `}>
            <RadioGroupItem
              value="0"
              id="company"
              className="mt-0.5"
              disabled={smartBill_Withdraw.lock_status}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  รถบริษัท
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ใช้รถบริษัทที่ลงทะเบียน
              </p>
            </div>
          </label>

          <label className={`
            flex items-center gap-3 p-4 rounded-lg border-2 transition-all
            ${smartBill_Withdraw.lock_status
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer'
            }
            ${smartBill_Withdraw.condition === 1
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : smartBill_Withdraw.lock_status
                ? 'border-slate-200 dark:border-slate-700'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }
          `}>
            <RadioGroupItem
              value="1"
              id="personal"
              className="mt-0.5"
              disabled={smartBill_Withdraw.lock_status}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  รถส่วนตัว
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ใช้รถส่วนตัวที่ลงทะเบียนผ่าน Smart Car
              </p>
            </div>
          </label>

          <label className={`
            flex items-center gap-3 p-4 rounded-lg border-2 transition-all
            ${smartBill_Withdraw.lock_status
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer'
            }
            ${smartBill_Withdraw.condition === 2
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : smartBill_Withdraw.lock_status
                ? 'border-slate-200 dark:border-slate-700'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }
          `}>
            <RadioGroupItem
              value="2"
              id="public"
              className="mt-0.5"
              disabled={smartBill_Withdraw.lock_status}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  ขนส่งสาธารณะ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                แท็กซี่, รถบัส, รถไฟ, เป็นต้น
              </p>
            </div>
          </label>

          <label className={`
            flex items-center gap-3 p-4 rounded-lg border-2 transition-all
            ${smartBill_Withdraw.lock_status
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer'
            }
            ${smartBill_Withdraw.condition === 3
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : smartBill_Withdraw.lock_status
                ? 'border-slate-200 dark:border-slate-700'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }
          `}>
            <RadioGroupItem
              value="3"
              id="other"
              className="mt-0.5"
              disabled={smartBill_Withdraw.lock_status}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  อื่นๆ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                การเดินทางทางเลือกอื่นๆ เช่น จักรยาน, เดินเท้า เป็นต้น
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {/* Vehicle Details Form */}
      {smartBill_Withdraw.condition !== null && smartBill_Withdraw.condition !== undefined && smartBill_Withdraw.condition <= 1 && (
        <>
          <Separator />

          {/*  หมายเหตุการแก้ไข */}
          {smartBill_Withdraw.car_infocode && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">
                    หมายเหตุสำหรับการแก้ไข
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    หากต้องการเปลี่ยนรถ กรุณาล้างทะเบียนรถปัจจุบันก่อน เพื่อป้องกันข้อผิดพลาดในการบันทึกข้อมูล
                    การล้างจะลบข้อมูลทะเบียนรถและรายการค่าใช้จ่ายทั้งหมด
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                รายละเอียดยานพาหนะ
              </h4>
              {/*  ปุ่มล้างทะเบียนรถ */}
              {smartBill_Withdraw.car_infocode && !smartBill_Withdraw.lock_status && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearVehicle}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800"
                >
                  <X className="h-4 w-4" />
                  ล้างทะเบียนรถ
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* License Plate */}
              <div className="space-y-2">
                <Label htmlFor="car_infocode" className="text-sm font-medium">
                  หมายเลขทะเบียนรถ <span className="text-red-500">*</span>
                </Label>
                <Popover open={open && !smartBill_Withdraw.lock_status} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                      disabled={smartBill_Withdraw.lock_status}
                    >
                      {smartBill_Withdraw.car_infocode || "เลือกหรือพิมพ์ทะเบียน"}
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
                        {(smartBill_Withdraw.condition === 0 ? carInfoDataCompany : carInfoData)
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
                                handleCarSelect(carData.car_infocode);
                                setOpen(false);
                                setSearchValue("");
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  smartBill_Withdraw.car_infocode === carData.car_infocode
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
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">ยี่ห้อ</Label>
                <div className="h-11 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center">
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    {carInfo.car_band || '-'}
                  </span>
                </div>
              </div>

              {/* Model */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">รุ่น</Label>
                <div className="h-11 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center">
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    {carInfo.car_tier || '-'}
                  </span>
                </div>
              </div>

              {/* Payment Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">การเบิกค่าใช้จ่าย</Label>
                <div className="h-11 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center">
                  <Badge
                    variant={carInfo.car_payname ? "default" : "secondary"}
                    className="text-xs font-medium"
                  >
                    {carInfo.car_payname || '-'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Public/Other Transport Info */}
      {smartBill_Withdraw.condition !== null && smartBill_Withdraw.condition !== undefined && smartBill_Withdraw.condition > 1 && (
        <>
          <Separator />

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {smartBill_Withdraw.condition === 2
                    ? 'Public Transportation'
                    : 'Alternative Transportation'}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  กรุณาระบุรายละเอียดการเดินทาง เช่น ชื่อผู้ให้บริการ, หมายเลขเที่ยวบิน, หมายเลขตั๋ว หรือข้อมูลที่เกี่ยวข้องอื่นๆ เพื่อการบันทึกข้อมูลที่ถูกต้อง
                  และการตรวจสอบในอนาคต
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}