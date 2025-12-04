"use client"

import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  loading?: boolean
  confirmDisabled?: boolean
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  confirmDisabled = false,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">{children}</div>
        {(onConfirm || onCancel) && (
          <DialogFooter className="gap-2 sm:gap-0">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={loading} type="button">
                {cancelText}
              </Button>
            )}
            {onConfirm && (
              <Button onClick={onConfirm} disabled={loading || confirmDisabled} type="button">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {confirmText}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
