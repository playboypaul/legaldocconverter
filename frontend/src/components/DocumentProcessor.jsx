import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileText, Download, Brain, Loader2, CheckCircle, AlertCircle, Lock, Settings, Edit3, GitCompare, Package, Layers, PenTool } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DocumentProcessor = () => {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [supportedFormats, setSupportedFormats] = useState({ input: [], output: [] });
  const [outputFormat, setOutputFormat] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // New Enhanced Features State
  const [activeTab, setActiveTab] = useState('convert'); // 'convert', 'batch', 'compare', 'edit', 'annotate'
  const [batchFiles, setBatchFiles] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [compareFiles, setCompareFiles] = useState({ original: null, modified: null });
  const [comparisonResult, setComparisonResult] = useState(null);
  const [documentEditor, setDocumentEditor] = useState({ content: '', format: '', isEditing: false });
  const [annotations, setAnnotations] = useState([]);
  const [integrations, setIntegrations] = useState({ clio: false, westlaw: false, lexis: false });
  
  const { toast } = useToast();
  const { user, canUpload, canAnalyze, updateUserUsage, setIsSignInOpen } = useAuth();

  // Load supported formats on component mount
  useEffect(() => {
    const loadSupportedFormats = async () => {
      try {
        const response = await axios.get(`${API}/formats`);
        setSupportedFormats(response.data);
      } catch (error) {
        console.error('Error loading supported formats:', error);
        // Fallback to default formats
        setSupportedFormats({
          input: ['PDF', 'DOCX', 'DOC', 'TXT', 'RTF', 'ODT'],
          output: ['PDF', 'DOCX', 'DOC', 'TXT', 'RTF', 'ODT', 'HTML']
        });
      }
    };
    loadSupportedFormats();
  }, []);

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    // Check authentication and usage limits
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upload documents.",
        variant: "destructive",
      });
      setIsSignInOpen(true);
      return;
    }

    if (!canUpload()) {
      toast({
        title: "Upload limit reached",
        description: "You've reached your upload limit. Upgrade to Professional for unlimited uploads.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (uploadedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `File size must be under ${MAX_FILE_SIZE / (1024*1024)}MB. Please compress your file and try again.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['pdf', 'docx', 'doc', 'txt', 'rtf', 'odt'];
    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Unsupported file type",
        description: `Please upload one of these file types: ${allowedTypes.join(', ').toUpperCase()}`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    // Create FormData with proper encoding
    const formData = new FormData();
    formData.append('file', uploadedFile);

    // Multiple retry attempts for reliability
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const response = await axios.post(`${API}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 second timeout
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // You could add a progress indicator here
            console.log(`Upload progress: ${percentCompleted}%`);
          },
        });

        // Success
        setFile(uploadedFile);
        setFileId(response.data.file_id);
        setIsUploading(false);
        
        // Update usage for free users
        updateUserUsage(1, 0);
        
        toast({
          title: "File uploaded successfully",
          description: `${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB) is ready for processing.`,
        });
        
        return; // Exit retry loop on success
        
      } catch (error) {
        attempt++;
        
        if (attempt >= maxRetries) {
          // Final attempt failed
          setIsUploading(false);
          
          let errorMessage = "Failed to upload file. Please try again.";
          
          if (error.code === 'ECONNABORTED') {
            errorMessage = "Upload timeout. Please check your connection and try again.";
          } else if (error.response?.status === 413) {
            errorMessage = "File too large for upload.";
          } else if (error.response?.status === 400) {
            errorMessage = error.response.data?.detail || "Invalid file format.";
          } else if (error.response?.status >= 500) {
            errorMessage = "Server error. Please try again in a few moments.";
          }
          
          toast({
            title: "Upload failed",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          console.log(`Upload attempt ${attempt} failed, retrying...`);
        }
      }
    }
  };

  const handleConvert = async () => {
    if (!fileId || !outputFormat) {
      toast({
        title: "Missing information",
        description: "Please upload a file and select an output format.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    try {
      const response = await axios.post(`${API}/convert`, {
        file_id: fileId,
        target_format: outputFormat,
      });

      setConversionResult(response.data);
      setIsConverting(false);
      
      toast({
        title: "Conversion completed",
        description: "Your document has been successfully converted.",
      });
    } catch (error) {
      setIsConverting(false);
      toast({
        title: "Conversion failed",
        description: error.response?.data?.detail || "Failed to convert file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to analyze documents.",
        variant: "destructive",
      });
      setIsSignInOpen(true);
      return;
    }

    if (!canAnalyze()) {
      toast({
        title: "Analysis limit reached",
        description: "You've used your free analysis. Upgrade to Professional for unlimited AI analysis.",
        variant: "destructive",
      });
      return;
    }

    if (!fileId) {
      toast({
        title: "No file uploaded",
        description: "Please upload a file first to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await axios.post(`${API}/analyze`, {
        file_id: fileId,
      });

      setAnalysisResult(response.data);
      setIsAnalyzing(false);
      
      // Update usage for free users
      updateUserUsage(0, 1);
      
      toast({
        title: "Analysis completed",
        description: "Legal document analysis is ready for review.",
      });
    } catch (error) {
      setIsAnalyzing(false);
      toast({
        title: "Analysis failed",
        description: error.response?.data?.detail || "Failed to analyze document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!conversionResult?.conversion_id) return;
    
    try {
      const response = await axios.get(`${API}/download/${conversionResult.conversion_id}`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', conversionResult.converted_file);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Download started",
        description: "Your converted file is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download converted file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get format descriptions
  const getFormatDescription = (format) => {
    const descriptions = {
      pdf: 'Portable Document Format',
      docx: 'Microsoft Word Document',
      doc: 'Legacy Word Document',
      txt: 'Plain Text File',
      rtf: 'Rich Text Format',
      odt: 'OpenDocument Text',
      html: 'Web Page Format'
    };
    return descriptions[format.toLowerCase()] || 'Document Format';
  };

  // Helper function to load file for editing
  const loadFileForEditing = (result) => {
    setDocumentEditor({
      content: result.converted_file,
      format: result.target_format,
      isEditing: true
    });
  };

  // Batch Processing Functions
  const handleBatchUpload = async (files) => {
    setBatchFiles(files);
    setIsBatchProcessing(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        return {
          originalFile: file,
          fileId: response.data.file_id,
          status: 'uploaded'
        };
      });
      
      const results = await Promise.all(uploadPromises);
      setBatchFiles(results);
      
      toast({
        title: "Batch upload complete",
        description: `Successfully uploaded ${files.length} files for processing.`,
      });
    } catch (error) {
      toast({
        title: "Batch upload failed",
        description: "Some files failed to upload. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchConvert = async (targetFormat) => {
    if (batchFiles.length === 0) {
      toast({
        title: "No files to convert",
        description: "Please upload files first.",
        variant: "destructive",
      });
      return;
    }

    setIsBatchProcessing(true);
    
    try {
      const conversionPromises = batchFiles.map(async (file) => {
        const response = await axios.post(`${API}/convert`, {
          file_id: file.fileId,
          target_format: targetFormat,
        });
        return {
          ...file,
          conversionResult: response.data,
          status: 'converted'
        };
      });
      
      const results = await Promise.all(conversionPromises);
      setBatchFiles(results);
      
      toast({
        title: "Batch conversion complete",
        description: `Successfully converted ${results.length} files.`,
      });
    } catch (error) {
      toast({
        title: "Batch conversion failed",
        description: "Some conversions failed. Please check individual files.",
        variant: "destructive",
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Document Comparison Functions
  const handleFileComparison = async (originalFile, modifiedFile) => {
    if (!originalFile || !modifiedFile) {
      toast({
        title: "Missing files",
        description: "Please upload both original and modified files for comparison.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post(`${API}/compare`, {
        original_file_id: originalFile.fileId,
        modified_file_id: modifiedFile.fileId,
      });
      
      setComparisonResult(response.data);
      
      toast({
        title: "Comparison complete",
        description: "Document comparison analysis is ready for review.",
      });
    } catch (error) {
      toast({
        title: "Comparison failed",
        description: error.response?.data?.detail || "Failed to compare documents.",
        variant: "destructive",
      });
    }
  };

  // Document Editor Functions
  const handleDocumentSave = async (content, format) => {
    try {
      const response = await axios.post(`${API}/save-document`, {
        content: content,
        format: format,
      });
      
      toast({
        title: "Document saved",
        description: "Your changes have been saved successfully.",
      });
      
      return response.data;
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save document changes.",
        variant: "destructive",
      });
    }
  };

  // Integration Functions
  const handleIntegrationConnect = async (platform) => {
    try {
      // In a real implementation, this would handle OAuth flow
      setIntegrations(prev => ({ ...prev, [platform]: true }));
      
      toast({
        title: "Integration connected",
        description: `Successfully connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)}.`,
      });
    } catch (error) {
      toast({
        title: "Integration failed",
        description: `Failed to connect to ${platform}.`,
        variant: "destructive",
      });
    }
  };

  return (
    <section id="processor" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Process Your Legal Documents
          </h2>
          <p className="text-lg text-slate-600">
            Upload your document and choose to convert formats or get AI analysis
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/50">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center text-white">
              <Upload className="h-5 w-5 mr-2" />
              Document Upload
            </CardTitle>
            <CardDescription className="text-blue-100">
              Supported formats: {supportedFormats.input.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.rtf,.odt"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
                    <p className="text-blue-700 font-medium">Uploading...</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <p className="text-slate-900 font-bold text-lg">{file.name}</p>
                    <p className="text-slate-600 text-sm mt-2">Click to upload a different file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText className="h-16 w-16 text-blue-400 mb-4" />
                    <p className="text-slate-900 font-bold text-lg">Click to upload your legal document</p>
                    <p className="text-slate-600 text-sm mt-2">or drag and drop it here</p>
                  </div>
                )}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Feature Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 mb-6 p-2 bg-white rounded-xl shadow-lg">
            <Button
              variant={activeTab === 'convert' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('convert')}
              className={`${activeTab === 'convert' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'} font-medium`}
            >
              <Download className="h-4 w-4 mr-2" />
              Convert
            </Button>
            <Button
              variant={activeTab === 'batch' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('batch')}
              className={`${activeTab === 'batch' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'} font-medium`}
            >
              <Package className="h-4 w-4 mr-2" />
              Batch Process
              <span className="ml-1 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">FREE</span>
            </Button>
            <Button
              variant={activeTab === 'compare' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('compare')}
              className={`${activeTab === 'compare' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'} font-medium`}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare
              <span className="ml-1 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">FREE</span>
            </Button>
            <Button
              variant={activeTab === 'edit' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('edit')}
              className={`${activeTab === 'edit' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'} font-medium`}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant={activeTab === 'annotate' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('annotate')}
              className={`${activeTab === 'annotate' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'} font-medium`}
            >
              <PenTool className="h-4 w-4 mr-2" />
              Annotate
              <span className="ml-1 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">FREE</span>
            </Button>
            <Button
              variant={activeTab === 'integrations' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('integrations')}
              className={`${activeTab === 'integrations' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'} font-medium`}
            >
              <Layers className="h-4 w-4 mr-2" />
              Integrations
              <span className="ml-1 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">FREE</span>
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'convert' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Enhanced Convert Section */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white">
                  <Download className="h-5 w-5 mr-2" />
                  Enhanced Format Conversion
                </CardTitle>
                <CardDescription className="text-green-100">
                  Convert to any format with professional quality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Output Format
                  </label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger className="border-2 border-green-200 focus:border-green-400">
                      <SelectValue placeholder="Select output format (PDF, DOCX, TXT, etc.)" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedFormats.output.map((format) => (
                        <SelectItem key={format} value={format.toLowerCase()}>
                          {format.toUpperCase()} - {getFormatDescription(format)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleConvert}
                  disabled={!fileId || !outputFormat || isConverting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Convert Document
                    </>
                  )}
                </Button>

                {conversionResult && (
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      <span className="font-bold text-green-800 text-lg">Conversion Complete</span>
                    </div>
                    <p className="text-green-700 mb-4">
                      {conversionResult.original_file} → {conversionResult.converted_file}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        onClick={handleDownload}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 shadow-lg transition-all duration-300"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        onClick={() => {setActiveTab('edit'); loadFileForEditing(conversionResult);}}
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold py-2 transition-all duration-300"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit File
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analyze Section */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-violet-50/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white">
                <Brain className="h-5 w-5 mr-2" />
                AI Legal Analysis
              </CardTitle>
              <CardDescription className="text-violet-100">
                Get detailed insights and legal analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="p-6 bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-violet-200 rounded-xl">
                <p className="text-violet-800 font-medium mb-3">
                  Our AI will analyze your document for:
                </p>
                <ul className="text-violet-700 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-violet-600" />
                    Key legal provisions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-violet-600" />
                    Risk assessments
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-violet-600" />
                    Compliance checks
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-violet-600" />
                    Recommendations
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={handleAnalyze}
                disabled={!fileId || isAnalyzing}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Batch Processing Tab */}
        {activeTab === 'batch' && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/50">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white">
                <Package className="h-5 w-5 mr-2" />
                Batch Document Processing
              </CardTitle>
              <CardDescription className="text-purple-100">
                Process multiple documents simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Batch Processing</h3>
                <p className="text-gray-600 mb-4">Upload multiple files and convert them all at once</p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Package className="h-4 w-4 mr-2" />
                  Start Batch Process
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Comparison Tab */}
        {activeTab === 'compare' && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-orange-50/50">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white">
                <GitCompare className="h-5 w-5 mr-2" />
                Document Comparison
              </CardTitle>
              <CardDescription className="text-orange-100">
                Compare two documents side by side
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <GitCompare className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Comparison</h3>
                <p className="text-gray-600 mb-4">Upload two documents to see differences highlighted</p>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Editor Tab */}
        {activeTab === 'edit' && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-teal-50/50">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white">
                <Edit3 className="h-5 w-5 mr-2" />
                Document Editor
              </CardTitle>
              <CardDescription className="text-teal-100">
                Edit your documents directly in the browser
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Edit3 className="h-16 w-16 text-teal-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Editor</h3>
                <p className="text-gray-600 mb-4">Edit text, formatting, and structure of your documents</p>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Open Editor
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Annotation Tab */}
        {activeTab === 'annotate' && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-yellow-50/50">
            <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white">
                <PenTool className="h-5 w-5 mr-2" />
                Document Annotation
              </CardTitle>
              <CardDescription className="text-yellow-100">
                Add notes, highlights, and comments to documents
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <PenTool className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Annotation</h3>
                <p className="text-gray-600 mb-4">Add highlights, comments, and annotations to your documents</p>
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  <PenTool className="h-4 w-4 mr-2" />
                  Start Annotating
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50/50">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white">
                <Layers className="h-5 w-5 mr-2" />
                Legal Software Integrations
              </CardTitle>
              <CardDescription className="text-indigo-100">
                Connect with popular legal software platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 transition-colors">
                  <Layers className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Clio Integration</h4>
                  <p className="text-gray-600 text-sm mb-4">Sync documents with Clio practice management</p>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Connect Clio
                  </Button>
                </div>
                <div className="text-center p-6 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 transition-colors">
                  <Layers className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Westlaw Integration</h4>
                  <p className="text-gray-600 text-sm mb-4">Import research directly from Westlaw</p>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Connect Westlaw
                  </Button>
                </div>
                <div className="text-center p-6 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 transition-colors">
                  <Layers className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">LexisNexis Integration</h4>
                  <p className="text-gray-600 text-sm mb-4">Access LexisNexis research tools</p>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Connect LexisNexis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white text-xl">
                <Brain className="h-6 w-6 mr-2" />
                Legal Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              {/* Summary */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-900 mb-3 text-lg">Executive Summary</h4>
                <p className="text-blue-800 leading-relaxed">{analysisResult.summary}</p>
              </div>

              {/* Key Findings */}
              <div>
                <h4 className="font-bold text-slate-900 mb-4 text-lg">Key Findings</h4>
                <ul className="space-y-3">
                  {analysisResult.key_findings.map((finding, index) => (
                    <li key={index} className="flex items-start p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-800 font-medium">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Assessment */}
              <div>
                <h4 className="font-bold text-slate-900 mb-4 text-lg">Risk Assessment</h4>
                <div className="space-y-4">
                  {analysisResult.risk_assessment.map((risk, index) => (
                    <div key={index} className="p-6 border-2 rounded-xl bg-gradient-to-r from-white to-slate-50">
                      <div className="flex items-center mb-3">
                        <AlertCircle className={`h-5 w-5 mr-3 ${
                          risk.level === 'High' ? 'text-red-500' : 
                          risk.level === 'Medium' ? 'text-amber-500' : 'text-green-500'
                        }`} />
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          risk.level === 'High' ? 'bg-red-100 text-red-800 border border-red-200' : 
                          risk.level === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {risk.level} Risk
                        </span>
                      </div>
                      <p className="text-slate-800 mb-3 font-medium">{risk.issue}</p>
                      <p className="text-slate-600 bg-slate-100 p-3 rounded-lg">
                        <strong className="text-slate-800">Recommendation:</strong> {risk.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Score */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <h4 className="font-bold text-green-900 mb-4 text-lg">Compliance Score</h4>
                <div className="flex items-center mb-4">
                  <div className="text-4xl font-bold text-green-800 mr-4">
                    {analysisResult.compliance.score}%
                  </div>
                  <div className="flex-1 bg-green-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${analysisResult.compliance.score}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-green-800 font-medium">{analysisResult.compliance.details}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default DocumentProcessor;