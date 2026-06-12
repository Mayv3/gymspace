"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  loading?: boolean
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText = "Confirmar",
  cancelText,
  onConfirm,
  loading = false,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border border-border/60 bg-card shadow-floating">
        <DialogHeader>
          <DialogTitle className="font-bold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="font-medium text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && <div className="py-4 text-sm font-medium">{children}</div>}

        <DialogFooter>
          {cancelText ? (
            <Button
              variant="outline"
              className="rounded-xl border-border bg-card font-bold hover:bg-muted"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelText}
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <Button
            variant={destructive ? "destructive" : "default"}
            className={
              destructive
                ? "rounded-xl font-bold btn-press"
                : "rounded-xl bg-brand-500 font-bold text-white shadow-brand-btn btn-press hover:bg-brand-600"
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
