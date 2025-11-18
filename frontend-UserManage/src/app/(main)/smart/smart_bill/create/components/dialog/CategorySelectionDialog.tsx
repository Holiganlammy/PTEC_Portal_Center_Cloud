"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Fuel, 
  Car, 
  Utensils, 
  Hotel, 
  MoreHorizontal,
  ChevronRight
} from 'lucide-react'

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  bgColor: string
  description: string
}

interface CategorySelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCategory: (categoryId: string) => void
}

export default function CategorySelectionDialog({
  open,
  onOpenChange,
  onSelectCategory
}: CategorySelectionDialogProps) {
  
  const categories: Category[] = [
    {
      id: 'fuel',
      name: 'ค่าน้ำมันรถ',
      icon: <Fuel className="h-6 w-6" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800',
      description: 'เบิกตามบิลจริง'
    },
    {
      id: 'toll',
      name: 'ค่าทางด่วน',
      icon: <Car className="h-6 w-6" />,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-800',
      description: 'ค่าผ่านทางด่วน'
    },
    {
      id: 'allowance',
      name: 'ค่าเบี้ยเลี้ยง',
      icon: <Utensils className="h-6 w-6" />,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-orange-200 dark:border-orange-800',
      description: 'ค่าเบี้ยเลี้ยงผู้เดินทาง'
    },
    {
      id: 'hotel',
      name: 'ค่าที่พัก',
      icon: <Hotel className="h-6 w-6" />,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 dark:hover:bg-pink-900/40 border-pink-200 dark:border-pink-800',
      description: 'ค่าห้องพักและที่พัก'
    },
    {
      id: 'other',
      name: 'ค่าใช้จ่ายอื่นๆ',
      icon: <MoreHorizontal className="h-6 w-6" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800',
      description: 'ค่าใช้จ่ายอื่นๆ เพิ่มเติม'
    }
  ]

  const handleSelectCategory = (categoryId: string) => {
    onSelectCategory(categoryId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">เลือกหมวดหมู่ค่าใช้จ่าย</DialogTitle>
          <DialogDescription className="text-base">
            เลือกประเภทค่าใช้จ่ายที่ต้องการเพิ่ม
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          {categories.map((category) => (
            <Card
              key={category.id}
              className={`p-6 cursor-pointer transition-all duration-200 border-2 ${category.bgColor} group`}
              onClick={() => handleSelectCategory(category.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl ${category.color} bg-white dark:bg-gray-900 shadow-sm`}>
                    {category.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-50">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}