"use client"

import React, { useEffect, useRef } from 'react'
import { AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface WarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onConfirm?: () => void
}

export default function WarningDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: WarningDialogProps) {
  // ✅ Force cleanup body attributes เมื่อปิด dialog (production fix)
  // ใช้ wasOpenRef เพื่อกัน useEffect ไม่ให้ fire ตอน initial mount (open=false)
  // ซึ่งจะไป remove body attributes ของ parent dialog ที่ยังเปิดอยู่
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      return
    }

    if (!wasOpenRef.current) return // ยังไม่เคยเปิด — ข้ามการ cleanup

    wasOpenRef.current = false
    const timer = setTimeout(() => {
      document.body.style.pointerEvents = ''
      document.body.removeAttribute('aria-hidden')
      document.body.removeAttribute('data-scroll-locked')
    }, 300)

    return () => clearTimeout(timer)
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
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>

            <div className="flex-1">
              <AlertDialogTitle className="text-amber-600">
                {title}
              </AlertDialogTitle>

              {description && (
                <AlertDialogDescription className="mt-2 text-amber-700/80">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            รับทราบ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}