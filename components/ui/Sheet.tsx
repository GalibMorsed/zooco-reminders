"use client";
import { ReactNode } from "react";

interface SheetProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ isOpen, onClose, children }: SheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 mx-auto w-full max-w-md overflow-y-auto bg-background p-4 flex flex-col animate-slide-up">
      {children}
    </div>
  );
}
