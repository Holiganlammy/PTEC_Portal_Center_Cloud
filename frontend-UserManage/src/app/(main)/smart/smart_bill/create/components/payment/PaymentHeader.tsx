"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building2, FileText, Calendar, User } from 'lucide-react'
import Picture1 from "@/image/Picture1.png";
import Picture2 from "@/image/Picture2.png";
import LogoSMPlus from "@/image/LogoSMPlus.png";
import Image from 'next/image'
import dayjs from 'dayjs'

interface PaymentHeaderProps {
  smartBill_Withdraw: smartBill_Withdraw
  setSmartBill_Withdraw: (data: smartBill_Withdraw) => void
  sbw_code: string | null
}

export default function PaymentHeader({ 
  smartBill_Withdraw, 
  setSmartBill_Withdraw,
  sbw_code 
}: PaymentHeaderProps) {
  // console.log('Rendering PaymentHeader with smartBill_Withdraw:', smartBill_Withdraw)
  return (
    <div className="space-y-1">
      {/* Professional Header */}
      <div className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
        <div className="px-8 py-6">
          <div className="flex items-start justify-between">
            {/* Company Logo & Info */}
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-white rounded-sm flex items-center justify-center">
                <Image 
                  src={
                    smartBill_Withdraw.typePay === "PTEC" ? Picture1 :
                    smartBill_Withdraw.typePay === "SCT" ? Picture2 :
                    LogoSMPlus
                  } 
                  alt="Company Logo" 
                  width={smartBill_Withdraw.typePay === "SMPlus" ? 100 : 80} 
                  height={80} 
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {smartBill_Withdraw.typePay === "PTEC" 
                    ? 'PURE THAI ENERGY CO., LTD.' 
                    : smartBill_Withdraw.typePay === "SMPlus"
                    ? 'SMPlus CO., LTD.'
                    : 'SCT SAHAPAN COMPANY LIMITED'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  รายงานค่าใช้จ่ายพนักงานและการใช้งานยานพาหนะ
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className="font-normal">
                    <FileText className="h-3 w-3 mr-1" />
                      แบบฟอร์มเบิกค่าใช้จ่าย
                  </Badge>
                  {sbw_code && (
                    <Badge variant="outline" className="font-mono">
                      {sbw_code}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Document Info */}
            {sbw_code && (
              <div className="text-right">
                <div className="inline-flex flex-col items-end gap-2 bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>วันที่เอกสาร</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {dayjs(smartBill_Withdraw.createdate).format('DD MMMM YYYY')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Company Type Selection */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Entity:
              </Label>
              <RadioGroup
                value={smartBill_Withdraw.typePay}
                onValueChange={(value) => 
                  setSmartBill_Withdraw({ ...smartBill_Withdraw, typePay: value })
                }
                className="flex gap-6"
                disabled={smartBill_Withdraw.lock_status}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="PTEC" 
                    id="ptec" 
                    className="border-slate-400" 
                    disabled={smartBill_Withdraw.lock_status}
                  />
                  <Label 
                    htmlFor="ptec" 
                    className={`text-sm font-medium cursor-pointer ${
                      smartBill_Withdraw.lock_status 
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    PTEC
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="SCT" 
                    id="sct" 
                    className="border-slate-400" 
                    disabled={smartBill_Withdraw.lock_status}
                  />
                  <Label 
                    htmlFor="sct" 
                    className={`text-sm font-medium cursor-pointer ${
                      smartBill_Withdraw.lock_status 
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    SCT
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="SMPlus" 
                    id="smplus" 
                    className="border-slate-400" 
                    disabled={smartBill_Withdraw.lock_status}
                  />
                  <Label 
                    htmlFor="smplus" 
                    className={`text-sm font-medium cursor-pointer ${
                      smartBill_Withdraw.lock_status 
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    SMPlus
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Information Section */}
      {sbw_code && (
        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              รายละเอียดพนักงาน
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Initial
              </Label>
              <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {smartBill_Withdraw.ownercode}
              </p>
            </div>
            
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                ชื่อพนักงาน
              </Label>
              <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {smartBill_Withdraw.Name}
              </p>
            </div>
            
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                แผนก
              </Label>
              <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {smartBill_Withdraw.depcode}
              </p>
            </div>

            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                สถานะเอกสาร
              </Label>
              <div className="mt-1.5">
                <Badge 
                  variant={smartBill_Withdraw.lock_status ? "default" : "secondary"}
                  className="font-medium"
                >
                  {smartBill_Withdraw.lock_status ? 'ล็อคเอกสาร' : 'ร่างเอกสาร'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    {sbw_code &&
      <Separator className="!mt-0" />
    }
    </div>
  )
}