"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import THBText from 'thai-baht-text'
import { CreditCard, Receipt, DollarSign, AlertCircle, FileText } from 'lucide-react'

interface SummarySectionProps {
  smartBill_Withdraw: smartBill_Withdraw
  setSmartBill_Withdraw: (data: smartBill_Withdraw) => void
  totalAmount: number
}

export default function SummarySection({
  smartBill_Withdraw,
  setSmartBill_Withdraw,
  totalAmount
}: SummarySectionProps) {
  
  const handlePureCardChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setSmartBill_Withdraw({ ...smartBill_Withdraw, pure_card: numValue })
  }

  const netAmount = totalAmount - (smartBill_Withdraw.pure_card || 0)
  const amountInWords = netAmount > 0 
    ? THBText(netAmount) 
    : netAmount === 0 
    ? 'ศูนย์บาทถ้วน' 
    : `ลบ${THBText(Math.abs(netAmount))}`

  return (
    <div className="space-y-6">
      {/* Important Notes */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                ข้อกำหนดที่สำคัญ
              </h3>
              <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">1.</span>
                  <span>ส่งคำขอเบิกค่าใช้จ่ายหรือเคลียร์เงินล่วงหน้าภายใน 3 วันหลังจากวันที่กลับ</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">2.</span>
                  <span>ให้แนบใบเสร็จค่าใช้จ่าย (ถ้ามี) , Report การปฏิบัติงาน, Payment Request , Petty Cash ตามจำนวนเงินที่เบิก</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">3.</span>
                  <span>ค่าน้ำมันคิดที่ : ตามประกาศบริษัท ที่ 10/2548</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">4.</span>
                  <span>ค่าที่พักจ่ายตามระเบียบบริษัทฯ หรือเงื่อนไขที่กำหนดในสัญญาจ้าง</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">5.</span>
                  <span>
                    ค่าเบี้ยเลี้ยงเดินทางปฏิบัติงานต่างจังหวัดวันแรก หรือ วันที่เดินทางกลับ ไม่น้อยกว่า 12 ช.ม. (คิดเป็น 1 วัน) วันอื่น ๆ จำนวน 24 ช.ม.
                    (เท่ากับ 1 วัน) จำนวนเงินที่เบิกตามระบียบบริษัทฯ หรือ เงื่อนไขที่กำหนดในสัญญาจ้าง
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">6.</span>
                  <span>
                    ค่าใช้จ่ายเดินทาง ทั้งในกรุงเทพฯ , ปริมณฑล และต่างจังหวัด แต่ไม่รวมการเดินทางไป - กลับบริษัทฯ ปกติ
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-[20px]">7.</span>
                  <span>
                    การเดินทางโดยรถประจำทาง (โปรดแนบตั๋วรถโดยสาร) Taxi ให้ระบุจำนวนเงินในช่องอื่นๆ
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <Separator />

      {/* Financial Summary */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <DollarSign className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              สรุปผลทางการเงิน
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              รวมค่าใช้จ่ายและยอดเงินสุทธิที่ต้องชำระ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pure Card Advance */}
          <Card className="border-2 border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Pure Card Advance
                  </Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Cash advance received
                  </p>
                </div>
              </div>
              <Input
                type="number"
                value={smartBill_Withdraw.pure_card || ''}
                onChange={(e) => handlePureCardChange(e.target.value)}
                disabled={smartBill_Withdraw.lock_status}
                className={`text-right font-mono text-xl font-bold h-14 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 ${
                  smartBill_Withdraw.lock_status ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                placeholder="0.00"
                step="0.01"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 text-right mt-2">
                THB
              </p>
            </div>
          </Card>

          {/* Total Expenses */}
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wider font-semibold">
                    Total Expenses
                  </Label>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Sum of all claims
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold font-mono text-blue-900 dark:text-blue-100">
                  {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  THB
                </p>
              </div>
            </div>
          </Card>

          {/* Net Amount Payable */}
          <Card className={`border-2 ${
            netAmount >= 0 
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20' 
              : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
          }`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  netAmount >= 0 
                    ? 'bg-green-100 dark:bg-green-900/40' 
                    : 'bg-red-100 dark:bg-red-900/40'
                }`}>
                  <FileText className={`h-5 w-5 ${
                    netAmount >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <Label className={`text-xs uppercase tracking-wider font-semibold ${
                    netAmount >= 0 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    Net Amount {netAmount >= 0 ? 'Payable' : 'Refundable'}
                  </Label>
                  <p className={`text-xs mt-0.5 ${
                    netAmount >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {netAmount >= 0 ? 'Amount to be paid' : 'Amount to refund'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold font-mono ${
                  netAmount >= 0 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {Math.abs(netAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-xs mt-2 ${
                  netAmount >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  THB
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Amount in Words */}
      <Card className="border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">
            Amount in Words
          </Label>
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
            {amountInWords}
          </p>
        </div>
      </Card>

      {/* Status Badge */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Document Status
        </span>
        <Badge 
          variant={smartBill_Withdraw.lock_status ? "default" : "secondary"}
          className="text-sm px-4 py-1.5"
        >
          {smartBill_Withdraw.lock_status ? '🔒 Locked' : '📝 Draft'}
        </Badge>
      </div>
    </div>
  )
}