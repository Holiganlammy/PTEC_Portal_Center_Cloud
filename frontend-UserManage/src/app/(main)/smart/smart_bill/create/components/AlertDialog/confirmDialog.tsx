"use client"

import React, { useEffect } from 'react'
import { InfoIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onConfirm?: () => void
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: ConfirmDialogProps) {
  // ✅ Force cleanup body attributes เมื่อปิด dialog (production fix)
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = ''
        document.body.removeAttribute('aria-hidden')
        document.body.removeAttribute('data-scroll-locked')
      }, 150)
      
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleConfirm = () => {
    // ✅ ปิด dialog ก่อน
    onOpenChange(false)
    
    // ✅ รอให้ animation และ cleanup เสร็จก่อนเรียก callback
    setTimeout(() => {
      if (onConfirm) {
        onConfirm()
      }
    }, 100)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex gap-3">
            <InfoIcon className="h-6 w-6 text-red-600" />
            <div className="flex-1">
              <AlertDialogTitle className="text-red-600">
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
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
          >
            ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            ตกลง
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}