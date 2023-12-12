import React from "react";

export interface ModalProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onDismiss: () => void;
  darkenOverlay?: boolean;
  topMargin?: number;
}

export const Modal = React.lazy(() => import("./ModalInner"));
