'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface PrintPreviewProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export function PrintPreview({ open, onClose, children, title }: PrintPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // Set the document title for the print
    const originalTitle = document.title;
    document.title = `Print - ${title}`;

    // Add print-visible class to the content
    if (contentRef.current) {
      contentRef.current.classList.add('print-visible');
    }

    // Trigger print
    window.print();

    // Cleanup after print
    document.title = originalTitle;
    if (contentRef.current) {
      contentRef.current.classList.remove('print-visible');
    }
  };

  useEffect(() => {
    // Handle print dialog close
    const handleAfterPrint = () => {
    if (open) {
        onClose();
      }
    };

    window.addEventListener('afterprint', handleAfterPrint);
      return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      };
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Print Preview: {title}</DialogTitle>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4 mr-2" /> Close
              </Button>
              <Button size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4">
          <div ref={contentRef} className="railway-id-card">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
