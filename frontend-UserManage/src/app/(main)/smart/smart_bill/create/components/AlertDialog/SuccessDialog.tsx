"use client"

import React from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { CheckCircle2 } from 'lucide-react'

interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onConfirm?: () => void
}

export default function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm
}: SuccessDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false)
    
    if (onConfirm) {
      onConfirm()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        forceMount
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-green-600">
                {title}
              </AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-2">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700 cursor-pointer"
          >
            รับทราบ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}