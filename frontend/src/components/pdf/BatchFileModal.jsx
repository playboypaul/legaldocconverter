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
  Trash2,
  Package
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BatchFileModal = ({ 
  isOpen, 
  onClose, 
  supportedFormats = { input: [], output: [] },
  onBatchComplete 
}) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [targetFormat, setTargetFormat] = useState('');
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);
    
    const uploadedFiles = [];

    for (const file of selectedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        uploadedFiles.push({
          id: data.file_id,
          name: file.name,
          size: file.size,
          type: data.file_type,
          status: 'uploaded',
          conversionResult: null
        });
      } catch (err) {
        uploadedFiles.push({
          id: null,
          name: file.name,
          size: file.size,
          type: 'unknown',
          status: 'error',
          error: err.message
        });
      }
    }

    setFiles(prev => [...prev, ...uploadedFiles]);
    setIsUploading(false);
  }, []);

  const handleRemoveFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const handleBatchConvert = useCallback(async () => {
    if (!targetFormat || files.length === 0) return;

    setIsConverting(true);
    setError(null);

    const fileIds = files.filter(f => f.status === 'uploaded' && f.id).map(f => f.id);

    try {
      const response = await fetch(`${API}/batch-convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: fileIds,
          target_format: targetFormat
        })
      });

      if (!response.ok) {
        throw new Error('Batch conversion failed');
      }

      const data = await response.json();

      // Update file statuses with conversion results
      setFiles(prev => prev.map(file => {
        const result = data.results.find(r => r.file_id === file.id);
        if (result) {
          return {
            ...file,
            status: result.status === 'success' ? 'converted' : 'error',
            conversionResult: result.status === 'success' ? result : null,
            error: result.status === 'error' ? result.error : null
          };
        }
        return file;
      }));

      if (onBatchComplete) {
        onBatchComplete(data.results);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  }, [files, targetFormat, onBatchComplete]);

  const handleDownload = useCallback(async (conversionId, filename) => {
    try {
      const response = await fetch(`${API}/download/${conversionId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const convertedFiles = files.filter(f => f.status === 'converted' && f.conversionResult);
    for (const file of convertedFiles) {
      await handleDownload(file.conversionResult.conversion_id, file.conversionResult.converted_file);
    }
  }, [files, handleDownload]);

  const resetModal = useCallback(() => {
    setFiles([]);
    setTargetFormat('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [onClose, resetModal]);

  if (!isOpen) return null;

  const uploadedCount = files.filter(f => f.status === 'uploaded').length;
  const convertedCount = files.filter(f => f.status === 'converted').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="batch-file-modal">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-6 w-6 mr-3" />
              <div>
                <CardTitle className="text-white">Batch Document Processing</CardTitle>
                <CardDescription className="text-purple-100">
                  Upload multiple files and convert them all at once
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="text-white hover:bg-white/20"
              data-testid="batch-modal-close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6 space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center bg-purple-50/50 hover:bg-purple-100/50 transition-colors">
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.html,.xml,.csv,.xlsx,.xls,.ppt,.pptx,.epub,.md"
              onChange={handleFileSelect}
              className="hidden"
              id="batch-file-input"
              disabled={isUploading}
            />
            <label htmlFor="batch-file-input" className="cursor-pointer block">
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-3" />
                  <p className="text-purple-700 font-medium">Uploading files...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-purple-400 mb-3" />
                  <p className="text-purple-900 font-semibold text-lg">Click to select multiple files</p>
                  <p className="text-purple-600 text-sm mt-1">PDF, DOCX, TXT, HTML, and more</p>
                </div>
              )}
            </label>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Files ({files.length})
                </h3>
                <div className="flex items-center gap-3 text-sm">
                  {uploadedCount > 0 && (
                    <span className="text-blue-600">{uploadedCount} ready</span>
                  )}
                  {convertedCount > 0 && (
                    <span className="text-green-600">{convertedCount} converted</span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-600">{errorCount} failed</span>
                  )}
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {files.map((file, index) => (
                  <div 
                    key={file.id || index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      file.status === 'converted' ? 'bg-green-50 border border-green-200' :
                      file.status === 'error' ? 'bg-red-50 border border-red-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <FileText className={`h-5 w-5 mr-3 flex-shrink-0 ${
                        file.status === 'converted' ? 'text-green-600' :
                        file.status === 'error' ? 'text-red-500' :
                        'text-purple-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                          {file.status === 'converted' && file.conversionResult && (
                            <span className="text-green-600 ml-2">
                              → {file.conversionResult.converted_file}
                            </span>
                          )}
                          {file.status === 'error' && file.error && (
                            <span className="text-red-600 ml-2">{file.error}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {file.status === 'converted' && file.conversionResult && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(file.conversionResult.conversion_id, file.conversionResult.converted_file)}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                      {file.status === 'uploaded' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFile(file.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {file.status === 'converted' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversion Options */}
          {uploadedCount > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Conversion Settings</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Convert all files to:
                  </label>
                  <Select value={targetFormat} onValueChange={setTargetFormat}>
                    <SelectTrigger className="w-full" data-testid="batch-format-select">
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedFormats.output.map((format) => (
                        <SelectItem key={format} value={format.toLowerCase()}>
                          {format.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isConverting}
          >
            Close
          </Button>
          <div className="flex items-center gap-3">
            {convertedCount > 0 && (
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                className="text-green-600 border-green-300 hover:bg-green-50"
                data-testid="batch-download-all"
              >
                <Download className="h-4 w-4 mr-2" />
                Download All ({convertedCount})
              </Button>
            )}
            <Button
              onClick={handleBatchConvert}
              disabled={isConverting || uploadedCount === 0 || !targetFormat}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="batch-convert-btn"
            >
              {isConverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Convert {uploadedCount} Files
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BatchFileModal;
