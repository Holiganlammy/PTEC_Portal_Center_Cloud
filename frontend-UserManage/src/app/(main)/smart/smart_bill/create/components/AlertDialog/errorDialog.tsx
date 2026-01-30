"use client"

import React from "react"
import { AlertCircleIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface ErrorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onConfirm?: () => void
}

export default function ErrorDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: ErrorDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false)
    onConfirm?.()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent forceMount>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <AlertCircleIcon className="h-10 w-10 text-red-600" />
            </div>

            <div className="flex-1">
              <AlertDialogTitle className="text-red-600">
                {title}
              </AlertDialogTitle>

              {description && (
                <AlertDialogDescription className="mt-2 text-red-700/80">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            ปิด
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
