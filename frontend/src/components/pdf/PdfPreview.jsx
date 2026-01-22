import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfPreview = ({ 
  fileUrl, 
  fileName = "Document",
  onClose,
  showControls = true,
  initialPage = 1,
  compareUrl = null,  // URL for comparison (after edit)
  compareLabel = "After Edit",
  originalLabel = "Original"
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComparison, setShowComparison] = useState(!!compareUrl);
  const [compareNumPages, setCompareNumPages] = useState(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    setIsLoading(false);
  }, []);

  const onCompareDocumentLoadSuccess = useCallback(({ numPages }) => {
    setCompareNumPages(numPages);
  }, []);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setScale(1.0);
    setRotation(0);
    setPageNumber(1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const downloadPdf = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load PDF</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const PreviewContainer = ({ children, label, isCompare = false }) => (
    <div className={`flex-1 ${showComparison ? 'max-w-[50%]' : 'w-full'}`}>
      {showComparison && (
        <div className={`text-center py-2 font-semibold text-sm ${isCompare ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} rounded-t-lg`}>
          {label}
        </div>
      )}
      <div className="overflow-auto bg-gray-100 rounded-lg p-4 flex justify-center items-start" style={{ maxHeight: isFullscreen ? '80vh' : '500px' }}>
        {children}
      </div>
    </div>
  );

  return (
    <Card className={`border-0 shadow-xl ${isFullscreen ? 'fixed inset-4 z-50 bg-white' : ''}`}>
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            <div>
              <CardTitle className="text-white text-lg">{fileName}</CardTitle>
              <CardDescription className="text-blue-100">
                {isLoading ? 'Loading...' : `${numPages} page${numPages !== 1 ? 's' : ''}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {compareUrl && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowComparison(prev => !prev)}
                className="text-white hover:bg-white/20"
              >
                {showComparison ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showComparison ? 'Hide Compare' : 'Compare'}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Controls */}
        {showControls && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPrevPage} 
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                Page {pageNumber} of {numPages || '...'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextPage} 
                disabled={pageNumber >= (numPages || 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom & Rotate */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-gray-300 mx-2" />
              <Button variant="outline" size="sm" onClick={rotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetView}>
                Reset
              </Button>
              <Button 
                size="sm" 
                onClick={downloadPdf}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}

        {/* PDF Preview Area */}
        <div className={`flex gap-4 ${showComparison ? 'flex-row' : 'flex-col'}`}>
          {/* Original Document */}
          <PreviewContainer label={originalLabel}>
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading PDF...</span>
              </div>
            )}
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              className="flex justify-center"
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-lg"
              />
            </Document>
          </PreviewContainer>

          {/* Comparison Document (After Edit) */}
          {showComparison && compareUrl && (
            <PreviewContainer label={compareLabel} isCompare>
              <Document
                file={compareUrl}
                onLoadSuccess={onCompareDocumentLoadSuccess}
                onLoadError={(e) => console.error('Compare PDF error:', e)}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  </div>
                }
                className="flex justify-center"
              >
                <Page 
                  pageNumber={Math.min(pageNumber, compareNumPages || pageNumber)} 
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg"
                />
              </Document>
            </PreviewContainer>
          )}
        </div>

        {/* Page Thumbnails (optional for multi-page documents) */}
        {numPages && numPages > 1 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Page Navigation</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: Math.min(numPages, 10) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setPageNumber(page)}
                  className={`flex-shrink-0 w-12 h-16 rounded border-2 transition-all ${
                    pageNumber === page 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-xs font-medium">{page}</span>
                </button>
              ))}
              {numPages > 10 && (
                <div className="flex items-center px-2 text-gray-500 text-sm">
                  +{numPages - 10} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PdfPreview;
