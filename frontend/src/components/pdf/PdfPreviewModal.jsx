import React from 'react';
import PdfPreview from './PdfPreview';
import { X } from 'lucide-react';

const PdfPreviewModal = ({ 
  isOpen, 
  onClose, 
  fileUrl, 
  fileName,
  compareUrl,
  compareLabel,
  originalLabel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-6xl max-h-[95vh] m-4 overflow-hidden rounded-2xl shadow-2xl">
        <PdfPreview
          fileUrl={fileUrl}
          fileName={fileName}
          onClose={onClose}
          compareUrl={compareUrl}
          compareLabel={compareLabel}
          originalLabel={originalLabel}
        />
      </div>
    </div>
  );
};

export default PdfPreviewModal;
