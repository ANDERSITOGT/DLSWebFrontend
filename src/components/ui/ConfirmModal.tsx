import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false,
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ${isDestructive ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
            <AlertTriangle size={28} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate-500">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-lg transition active:scale-95 ${
                isDestructive
                  ? "bg-rose-600 shadow-rose-200 hover:bg-rose-700"
                  : "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}