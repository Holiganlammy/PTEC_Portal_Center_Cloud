"use client"

import React, { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface OtherFormDialogProps {
  open: boolean
  onSubmit: (item: any) => void
  onCancel: () => void
  costOther: CostOther[]
  existingItems?: any[]
  pendingItems?: any[]
}

export default function OtherFormDialog({ 
  open, 
  onSubmit, 
  onCancel, 
  costOther,
  existingItems = [],
  pendingItems = []
}: OtherFormDialogProps) {
  const [categoryName, setCategoryName] = useState('')
  const [amount, setAmount] = useState('')
  
  // 🔄 กรองตัวเลือกที่ยังไม่มีในรายการ
  const getAvailableCategories = () => {
    const usedCategories = new Set([
      ...existingItems.map(item => item.category_name),
      ...pendingItems.map(item => item.category_name)
    ])
    
    return costOther.filter(cat => !usedCategories.has(cat.category_name))
  }
  
  const availableCategories = getAvailableCategories()
  
  const handleSubmit = () => {
    if (!categoryName || !amount) {
      toast.error('กรุณากรอกข้อมูลให้ครบ')
      return
    }
    
    // ✅ ตรวจสอบว่ามีรายการนี้อยู่แล้วหรือไม่
    const isDuplicateInExisting = existingItems.some(item => 
      item.category_name === categoryName
    )
    
    const isDuplicateInPending = pendingItems.some(item => 
      item.category_name === categoryName
    )
    
    if (isDuplicateInExisting || isDuplicateInPending) {
      toast.error(`⚠️ มีรายการ "${categoryName}" อยู่แล้ว\nไม่สามารถเพิ่มซ้ำได้`, {
        duration: 4000
      })
      return
    }
    
    onSubmit({
      category_name: categoryName,
      amount: parseFloat(amount)
    })
    
    setCategoryName('')
    setAmount('')
  }
  
  const handleCancel = () => {
    setCategoryName('')
    setAmount('')
    onCancel()
  }
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มรายการค่าใช้จ่ายอื่นๆ</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              ประเภทค่าใช้จ่าย <span className="text-red-500">*</span>
            </Label>
            <Select value={categoryName} onValueChange={setCategoryName}>
              <SelectTrigger className='w-[50%]'>
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.length === 0 ? (
                  <div className="p-2 text-center text-sm text-slate-500">
                    ไม่มีประเภทที่สามารถเพิ่มได้
                  </div>
                ) : (
                  availableCategories.map((cat) => (
                    <SelectItem key={cat.category_name} value={cat.category_name}>
                      {cat.category_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {availableCategories.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  <span>⚠️ ประเภทค่าใช้จ่ายทั้งหมดถูกใช้แล้วในกิจกรรมนี้</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              จำนวนเงิน (บาท) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onInput={(e) => {
                const target = e.target as HTMLInputElement
                target.value = target.value.replace(/[^0-9]/g, '')
              }}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '')
                setAmount(value)
              }}
              placeholder="0"
              className="text-right font-mono text-lg"
            />
          </div>
          
          {categoryName && amount && parseFloat(amount) > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-800 space-y-1">
                <div className="flex justify-between">
                  <span>ประเภท:</span>
                  <span className="font-medium">{categoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span>จำนวนเงิน:</span>
                  <span className="font-mono font-bold">
                    {parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                  </span>
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
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700" disabled={availableCategories.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มรายการ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}