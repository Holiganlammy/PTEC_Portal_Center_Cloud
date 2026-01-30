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
  const handleConfirm = () => {
    onOpenChange(false)
    if (onConfirm) {
      onConfirm()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent forceMount>
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
