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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '@/lib/axios/interceptors'
import { useSession } from 'next-auth/react'
import SuccessDialog from '../AlertDialog/SuccessDialog'

interface TollFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sbwdtl_id: string
  onSaveSuccess?: () => void
}

export default function TollFormDialog({
  open,
  onOpenChange,
  sbwdtl_id,
  onSaveSuccess
}: TollFormDialogProps) {
  const { data: session } = useSession()
  const [amount, setAmount] = useState('')
  const [costId, setCostId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  useEffect(() => {
    if (open && sbwdtl_id) {
      loadExistingData()
    } else {
      setAmount('')
      setCostId(null)
    }
  }, [open, sbwdtl_id])

  const loadExistingData = async () => {
    setIsLoading(true)
    try {
      const response = await client.post('/SmartBill_WithdrawDtl_SelectCategory', {
        sbwdtl_id: parseInt(sbwdtl_id),
        category_id: 2
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

      if (data && data.length > 0) {
        const existingItem = data[0]
        setAmount(existingItem.amount?.toString() || '')
        setCostId(existingItem.cost_id || null)
      }
    } catch (error) {
      console.error('Error loading toll data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('กรุณาระบุจำนวนเงิน')
      return
    }

    setIsSaving(true)
    const scrollY = window.scrollY

    try {
      await client.post('/SmartBill_WithdrawDtl_SaveChangesCategory', [{
        sbwdtl_id: parseInt(sbwdtl_id),
        cost_id: costId,
        category_id: 2,
        usercode: session?.user?.UserCode,
        amount: parseFloat(amount),
        create_by_usercode: session?.user?.UserCode
      }])

      onOpenChange(false)

      setTimeout(() => {
        setShowSuccessDialog(true)          // แสดง Success Dialog
        window.scrollTo({ top: scrollY, behavior: 'instant' })  // Restore scroll
        if (onSaveSuccess) {
          onSaveSuccess()                    // เรียก fetchData()
        }
      }, 300)
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error('❌ ไม่สามารถบันทึกได้')
      
      // Restore scroll ถึงแม้ error
      setTimeout(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' })
      }, 0)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              ค่าทางด่วน
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">จำนวนเงิน (บาท) *</Label>
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value
                    // อนุญาตเฉพาะตัวเลข, จุดทศนิยม และการลบ
                    if (/^\d*\.?\d*$/.test(value) || value === '') {
                      setAmount(value)
                    }
                  }}
                  onKeyDown={(e) => {
                    // ป้องกันการกด Enter, Tab, Backspace, Delete, Arrow keys
                    if (['Enter', 'Tab', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                      if (e.key === 'Enter' && !isSaving) {
                        handleSubmit()
                      }
                      return
                    }
                    
                    // ป้องกันการป้อนตัวอักษรที่ไม่ใช่ตัวเลข
                    if (!/[\d.]/.test(e.key)) {
                      e.preventDefault()
                    }
                    
                    // ป้องกันการใส่จุดทศนิยมซ้ำ
                    if (e.key === '.' && amount.includes('.')) {
                      e.preventDefault()
                    }
                  }}
                  onPaste={(e) => {
                    const paste = e.clipboardData.getData('text')
                    // ตรวจสอบว่าข้อมูลที่ paste เป็นตัวเลขเท่านั้น
                    if (!/^\d*\.?\d*$/.test(paste)) {
                      e.preventDefault()
                    }
                  }}
                  className="text-right font-mono text-lg"
                  autoFocus
                  disabled={isSaving}
                />
              </div>

              <div className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-900 p-3 rounded">
                💡 ระบุจำนวนเงินค่าทางด่วนที่เบิกตามใบเสร็จ
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึก'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="บันทึกค่าทางด่วนสำเร็จ!"
        description={`บันทึกค่าทางด่วน ${amount} บาท เรียบร้อยแล้ว`}
      />
    </>
  )
}