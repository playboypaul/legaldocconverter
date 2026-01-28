import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  X,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  RotateCw,
  Maximize,
  Type,
  Trash2,
  Lock,
  Unlock,
  Layers,
  ArrowUpDown,
  FileSearch
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TOOL_CONFIG = {
  rotate: {
    title: 'Rotate PDF Pages',
    description: 'Rotate pages in your PDF document',
    icon: RotateCw,
    color: 'purple',
    endpoint: '/pdf/rotate'
  },
  compress: {
    title: 'Compress PDF',
    description: 'Reduce file size without losing quality',
    icon: Maximize,
    color: 'amber',
    endpoint: '/pdf/compress'
  },
  watermark: {
    title: 'Add Watermark',
    description: 'Add text watermark to your PDF',
    icon: Type,
    color: 'indigo',
    endpoint: '/pdf/watermark'
  },
  'remove-pages': {
    title: 'Remove Pages',
    description: 'Remove specific pages from your PDF',
    icon: Trash2,
    color: 'red',
    endpoint: '/pdf/remove-pages'
  },
  'headers-footers': {
    title: 'Add Headers & Footers',
    description: 'Add page numbers, dates, or custom text',
    icon: Layers,
    color: 'teal',
    endpoint: '/pdf/headers-footers'
  },
  reorder: {
    title: 'Reorder Pages',
    description: 'Change the order of pages in your PDF',
    icon: ArrowUpDown,
    color: 'blue',
    endpoint: '/pdf/reorder'
  },
  'extract-text': {
    title: 'Extract Text',
    description: 'Extract all text from your PDF',
    icon: FileSearch,
    color: 'emerald',
    endpoint: '/pdf/extract-text'
  },
  encrypt: {
    title: 'Encrypt PDF',
    description: 'Add password protection to your PDF',
    icon: Lock,
    color: 'red',
    endpoint: '/pdf/encrypt'
  },
  decrypt: {
    title: 'Remove Protection',
    description: 'Remove password from your PDF',
    icon: Unlock,
    color: 'orange',
    endpoint: '/pdf/decrypt'
  }
};

const PdfToolModal = ({ 
  isOpen, 
  onClose, 
  toolId,
  existingFileId = null,
  existingFileName = null,
  onOperationComplete 
}) => {
  const [file, setFile] = useState(existingFileId ? { id: existingFileId, name: existingFileName } : null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Tool-specific options
  const [rotation, setRotation] = useState('90');
  const [quality, setQuality] = useState('medium');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkPosition, setWatermarkPosition] = useState('center');
  const [pagesToRemove, setPagesToRemove] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [extractFormat, setExtractFormat] = useState('txt');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const toolConfig = TOOL_CONFIG[toolId] || {
    title: 'PDF Tool',
    description: 'Process your PDF',
    icon: FileText,
    color: 'gray',
    endpoint: null
  };

  const IconComponent = toolConfig.icon;
  const colorClass = `from-${toolConfig.color}-500 to-${toolConfig.color}-600`;

  const handleFileSelect = useCallback(async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file is PDF
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setFile({
        id: data.file_id,
        name: selectedFile.name,
        size: selectedFile.size,
        type: data.file_type
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleProcess = useCallback(async () => {
    if (!file?.id || !toolConfig.endpoint) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      let requestBody = { file_id: file.id };

      // Build request body based on tool type
      switch (toolId) {
        case 'rotate':
          requestBody.rotation = parseInt(rotation);
          requestBody.pages = 'all';
          break;
        case 'compress':
          requestBody.quality = quality;
          break;
        case 'watermark':
          requestBody.text = watermarkText;
          requestBody.position = watermarkPosition;
          requestBody.opacity = 0.3;
          requestBody.font_size = 50;
          break;
        case 'remove-pages':
          requestBody.pages = pagesToRemove.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
          break;
        case 'reorder':
          requestBody.new_order = newOrder.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
          break;
        case 'extract-text':
          requestBody.format = extractFormat;
          break;
        case 'encrypt':
          if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsProcessing(false);
            return;
          }
          requestBody.password = password;
          requestBody.permissions = { print: true, copy: false, modify: false, extract: false };
          break;
        case 'decrypt':
          requestBody.password = password;
          break;
        default:
          break;
      }

      const response = await fetch(`${API}${toolConfig.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `${toolConfig.title} failed`);
      }

      const data = await response.json();
      setResult(data);

      if (onOperationComplete) {
        onOperationComplete(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [file, toolId, toolConfig, rotation, quality, watermarkText, watermarkPosition, pagesToRemove, newOrder, extractFormat, password, confirmPassword, onOperationComplete]);

  const handleDownload = useCallback(async () => {
    if (!result?.download_url) return;

    try {
      const downloadId = result.download_url.split('/').pop();
      const response = await fetch(`${API}/download/${downloadId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.rotated_file || result.compressed_file || result.watermarked_file || 
                   result.output_file || result.encrypted_file || result.filename || 'processed.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [result]);

  const handleClose = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const renderToolOptions = () => {
    switch (toolId) {
      case 'rotate':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Rotation Angle</label>
            <Select value={rotation} onValueChange={setRotation}>
              <SelectTrigger data-testid="rotation-select">
                <SelectValue placeholder="Select rotation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">90° Clockwise</SelectItem>
                <SelectItem value="180">180°</SelectItem>
                <SelectItem value="270">270° (90° Counter-clockwise)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'compress':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Compression Quality</label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger data-testid="quality-select">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Maximum compression)</SelectItem>
                <SelectItem value="medium">Medium (Balanced)</SelectItem>
                <SelectItem value="high">High (Best quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'watermark':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Watermark Text</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter watermark text"
                data-testid="watermark-text-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <Select value={watermarkPosition} onValueChange={setWatermarkPosition}>
                <SelectTrigger data-testid="watermark-position-select">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'remove-pages':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Pages to Remove</label>
            <input
              type="text"
              value={pagesToRemove}
              onChange={(e) => setPagesToRemove(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="e.g., 1, 3, 5"
              data-testid="pages-to-remove-input"
            />
            <p className="text-xs text-gray-500">Enter page numbers separated by commas</p>
          </div>
        );

      case 'reorder':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">New Page Order</label>
            <input
              type="text"
              value={newOrder}
              onChange={(e) => setNewOrder(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 3, 1, 2, 4"
              data-testid="reorder-input"
            />
            <p className="text-xs text-gray-500">Enter new page order separated by commas</p>
          </div>
        );

      case 'extract-text':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Output Format</label>
            <Select value={extractFormat} onValueChange={setExtractFormat}>
              <SelectTrigger data-testid="extract-format-select">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                <SelectItem value="json">JSON (.json)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'encrypt':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Enter password"
                data-testid="encrypt-password-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Confirm password"
                data-testid="encrypt-confirm-password-input"
              />
            </div>
          </div>
        );

      case 'decrypt':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">PDF Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Enter current password"
              data-testid="decrypt-password-input"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderResultInfo = () => {
    if (!result) return null;

    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center mb-3">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="font-semibold text-green-800">Operation Complete!</span>
        </div>
        <div className="space-y-1 text-sm text-green-700">
          {result.original_file && <p>Original: {result.original_file}</p>}
          {result.reduction_percent !== undefined && (
            <p>Size reduced by: {result.reduction_percent}%</p>
          )}
          {result.pages_rotated !== undefined && (
            <p>Pages rotated: {result.pages_rotated}</p>
          )}
          {result.pages_removed !== undefined && (
            <p>Pages removed: {result.pages_removed}</p>
          )}
          {result.total_words !== undefined && (
            <p>Words extracted: {result.total_words}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="pdf-tool-modal">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className={`bg-gradient-to-r ${colorClass} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <IconComponent className="h-6 w-6 mr-3" />
              <div>
                <CardTitle className="text-white">{toolConfig.title}</CardTitle>
                <CardDescription className="text-white/80">
                  {toolConfig.description}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="text-white hover:bg-white/20"
              data-testid="pdf-tool-modal-close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6 space-y-6">
          {/* File Upload/Selection */}
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-tool-file-input"
                disabled={isUploading}
              />
              <label htmlFor="pdf-tool-file-input" className="cursor-pointer block">
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 text-gray-500 animate-spin mb-3" />
                    <p className="text-gray-600 font-medium">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-gray-900 font-semibold">Select a PDF file</p>
                    <p className="text-gray-500 text-sm mt-1">Click to upload</p>
                  </div>
                )}
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center min-w-0">
                <FileText className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-blue-900 truncate">{file.name}</p>
                  {file.size && (
                    <p className="text-xs text-blue-600">{(file.size / 1024).toFixed(1)} KB</p>
                  )}
                </div>
              </div>
              {!result && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Change
                </Button>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tool Options */}
          {file && !result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Options</h3>
              {renderToolOptions()}
            </div>
          )}

          {/* Result Display */}
          {renderResultInfo()}
        </CardContent>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {result ? (
            <Button
              onClick={handleDownload}
              className={`bg-gradient-to-r ${colorClass} text-white`}
              data-testid="pdf-tool-download-btn"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Result
            </Button>
          ) : (
            <Button
              onClick={handleProcess}
              disabled={isProcessing || !file}
              className={`bg-gradient-to-r ${colorClass} text-white`}
              data-testid="pdf-tool-process-btn"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconComponent className="h-4 w-4 mr-2" />
                  Process PDF
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PdfToolModal;
