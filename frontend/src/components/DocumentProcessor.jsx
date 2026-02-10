import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileText, Download, Brain, Loader2, CheckCircle, AlertCircle, Lock, Settings, Edit3, GitCompare, Package, Layers, PenTool, Trash2, Eye, Pencil, FormInput, ScanLine, History } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import AdvancedPdfManager from './pdf/AdvancedPdfManager';
import PdfPreviewModal from './pdf/PdfPreviewModal';
import VisualAnnotationEditor from './pdf/VisualAnnotationEditor';
import PdfFormFiller from './pdf/PdfFormFiller';
import OcrScanner from './pdf/OcrScanner';
import VersionHistory from './pdf/VersionHistory';
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
  
  // PDF Preview State
  const [pdfPreview, setPdfPreview] = useState({
    isOpen: false,
    fileUrl: null,
    fileName: null,
    compareUrl: null,
    compareLabel: 'After Edit',
    originalLabel: 'Original'
  });
  
  // New Enhanced Features State
  const [activeTab, setActiveTab] = useState('convert'); // 'convert', 'batch', 'compare', 'edit', 'annotate', 'pdf-tools'
  const [batchFiles, setBatchFiles] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [compareFiles, setCompareFiles] = useState({ original: null, modified: null });
  const [comparisonResult, setComparisonResult] = useState(null);
  const [documentEditor, setDocumentEditor] = useState({ content: '', format: '', isEditing: false });
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotationColor, setSelectedAnnotationColor] = useState('yellow');
  const [annotationText, setAnnotationText] = useState('');
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);
  const [integrations, setIntegrations] = useState({ clio: false, westlaw: false, lexis: false });
  
  // Visual Annotation Editor State
  const [showVisualAnnotator, setShowVisualAnnotator] = useState(false);
  
  // PDF Form Filler State
  const [showFormFiller, setShowFormFiller] = useState(false);
  
  // PDF Editing Features State
  const [pdfEditor, setPdfEditor] = useState({
    activeOperation: 'merge', // 'merge', 'split', 'encrypt', 'esign'
    selectedFiles: [],
    mergeResult: null,
    splitResult: null,
    encryptResult: null,
    esignResult: null,
    isProcessing: false
  });
  const [splitOptions, setSplitOptions] = useState({
    splitType: 'pages', // 'pages' or 'ranges'
    pageRanges: [{ start: 1, end: 1 }]
  });
  const [encryptOptions, setEncryptOptions] = useState({
    password: '',
    confirmPassword: '',
    permissions: {
      print: true,
      copy: false,
      modify: false,
      extract: false
    }
  });
  const [esignOptions, setEsignOptions] = useState({
    signerName: '',
    signerEmail: '',
    position: { page: 1, x: 100, y: 100, width: 200, height: 50 }
  });
  
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

  // Load annotations when tab is active and file is selected
  useEffect(() => {
    if (activeTab === 'annotate' && fileId) {
      loadAnnotations();
    }
  }, [activeTab, fileId]);

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
      pdf: "Portable Document Format",
      pdfa: "PDF/A Archival Format (Long-term Preservation)",
      docx: "Microsoft Word Document",
      doc: "Legacy Word Document", 
      txt: "Plain Text File",
      rtf: "Rich Text Format",
      odt: "OpenDocument Text",
      html: "Web Page Format",
      xml: "Extensible Markup Language",
      csv: "Comma Separated Values",
      xlsx: "Excel Spreadsheet",
      xls: "Legacy Excel File",
      ppt: "PowerPoint Presentation",
      pptx: "Modern PowerPoint",
      epub: "Electronic Book",
      md: "Markdown Document",
      json: "JavaScript Object Notation",
      yaml: "YAML Ain't Markup Language",
      tex: "LaTeX Document",
      docbook: "DocBook Format",
      opml: "Outline Format",
      rst: "reStructuredText",
      asciidoc: "AsciiDoc Format",
      wiki: "Wiki Markup",
      jira: "Jira Markup",
      fb2: "FictionBook Format",
      icml: "Adobe InCopy Format",
      tei: "Text Encoding Initiative",
      context: "ConTeXt Format",
      man: "Manual Page",
      ms: "Manuscript Format",
      zimwiki: "ZimWiki Format"
    };
    return descriptions[format.toLowerCase()] || format.toUpperCase();
  };

  // Annotation Functions
  const loadAnnotations = async () => {
    if (!fileId) {
      setAnnotations([]);
      return;
    }
    
    setIsLoadingAnnotations(true);
    try {
      const response = await axios.get(`${API}/annotations/${fileId}`);
      setAnnotations(response.data.annotations || []);
      if (response.data.total > 0) {
        toast({ title: "Annotations loaded", description: `${response.data.total} annotations found` });
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
      // Only show error if it's not a 404 (file not found is expected for new files)
      if (error.response?.status !== 404) {
        toast({ title: "Error", description: "Failed to load annotations", variant: "destructive" });
      }
      setAnnotations([]);
    } finally {
      setIsLoadingAnnotations(false);
    }
  };

  const saveAnnotation = async () => {
    if (!fileId || !annotationText.trim()) {
      toast({ title: "Error", description: "Please enter annotation text", variant: "destructive" });
      return;
    }
    
    setIsSavingAnnotation(true);
    try {
      await axios.post(`${API}/annotate`, {
        file_id: fileId,
        annotation: {
          type: "comment",
          text: annotationText,
          color: selectedAnnotationColor,
          page: 1,
          location: "document",
          author: user?.email || "Anonymous"
        }
      });
      
      toast({ title: "Success", description: "Annotation saved successfully" });
      setAnnotationText('');
      await loadAnnotations();
    } catch (error) {
      console.error('Error saving annotation:', error);
      toast({ title: "Error", description: "Failed to save annotation", variant: "destructive" });
    } finally {
      setIsSavingAnnotation(false);
    }
  };

  const deleteAnnotation = async (annotationId) => {
    try {
      await axios.delete(`${API}/annotations/${annotationId}`);
      toast({ title: "Success", description: "Annotation deleted" });
      await loadAnnotations();
    } catch (error) {
      console.error('Error deleting annotation:', error);
      toast({ title: "Error", description: "Failed to delete annotation", variant: "destructive" });
    }
  };

  const exportAnnotations = async () => {
    if (!fileId) return;
    try {
      const response = await axios.post(`${API}/annotations/export`, { file_id: fileId });
      const downloadUrl = `${API}/download/${response.data.export_id}`;
      window.open(downloadUrl, '_blank');
      toast({ title: "Success", description: "Annotations exported successfully" });
    } catch (error) {
      console.error('Error exporting annotations:', error);
      toast({ title: "Error", description: "Failed to export annotations", variant: "destructive" });
    }
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

  // PDF Editing Functions
  const handlePdfMerge = async (fileIds) => {
    if (!fileIds || fileIds.length < 2) {
      toast({
        title: "Insufficient files",
        description: "Please select at least 2 PDF files to merge.",
        variant: "destructive",
      });
      return;
    }

    setPdfEditor(prev => ({ ...prev, isProcessing: true }));

    try {
      const response = await axios.post(`${API}/pdf/merge`, {
        file_ids: fileIds
      });

      setPdfEditor(prev => ({ ...prev, mergeResult: response.data, isProcessing: false }));
      
      toast({
        title: "PDF merge complete",
        description: `Successfully merged ${fileIds.length} PDF files.`,
      });
    } catch (error) {
      setPdfEditor(prev => ({ ...prev, isProcessing: false }));
      toast({
        title: "PDF merge failed",
        description: error.response?.data?.detail || "Failed to merge PDF files.",
        variant: "destructive",
      });
    }
  };

  const handlePdfSplit = async (fileId, splitType, pageRanges = []) => {
    if (!fileId) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to split.",
        variant: "destructive",
      });
      return;
    }

    setPdfEditor(prev => ({ ...prev, isProcessing: true }));

    try {
      const response = await axios.post(`${API}/pdf/split`, {
        file_id: fileId,
        split_type: splitType,
        page_ranges: splitType === 'ranges' ? pageRanges : undefined
      });

      setPdfEditor(prev => ({ ...prev, splitResult: response.data, isProcessing: false }));
      
      toast({
        title: "PDF split complete",
        description: `Successfully split PDF into ${response.data.split_files.length} files.`,
      });
    } catch (error) {
      setPdfEditor(prev => ({ ...prev, isProcessing: false }));
      toast({
        title: "PDF split failed",
        description: error.response?.data?.detail || "Failed to split PDF file.",
        variant: "destructive",
      });
    }
  };

  const handlePdfEncrypt = async (fileId, password, permissions) => {
    if (!fileId || !password) {
      toast({
        title: "Missing information",
        description: "Please select a file and enter a password.",
        variant: "destructive",
      });
      return;
    }

    setPdfEditor(prev => ({ ...prev, isProcessing: true }));

    try {
      const response = await axios.post(`${API}/pdf/encrypt`, {
        file_id: fileId,
        password: password,
        permissions: permissions
      });

      setPdfEditor(prev => ({ ...prev, encryptResult: response.data, isProcessing: false }));
      
      toast({
        title: "PDF encryption complete",
        description: "PDF has been encrypted with password protection.",
      });
    } catch (error) {
      setPdfEditor(prev => ({ ...prev, isProcessing: false }));
      toast({
        title: "PDF encryption failed",
        description: error.response?.data?.detail || "Failed to encrypt PDF file.",
        variant: "destructive",
      });
    }
  };

  const handlePdfEsign = async (fileId, signerInfo, position) => {
    if (!fileId || !signerInfo.name || !signerInfo.email) {
      toast({
        title: "Missing information",
        description: "Please provide signer name and email.",
        variant: "destructive",
      });
      return;
    }

    setPdfEditor(prev => ({ ...prev, isProcessing: true }));

    try {
      const response = await axios.post(`${API}/pdf/esign`, {
        file_id: fileId,
        signer_info: signerInfo,
        position: position
      });

      setPdfEditor(prev => ({ ...prev, esignResult: response.data, isProcessing: false }));
      
      toast({
        title: "PDF signing complete",
        description: "Electronic signature has been added to the PDF.",
      });
    } catch (error) {
      setPdfEditor(prev => ({ ...prev, isProcessing: false }));
      toast({
        title: "PDF signing failed",
        description: error.response?.data?.detail || "Failed to sign PDF file.",
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
              variant={activeTab === 'annotate' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('annotate')}
              className={`${activeTab === 'annotate' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'} font-medium`}
            >
              <PenTool className="h-4 w-4 mr-2" />
              Annotate
              <span className="ml-1 px-2 py-0.5 text-xs bg-purple-500 text-white rounded-full">ENHANCED</span>
            </Button>
            <Button
              variant={activeTab === 'form-fill' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('form-fill')}
              className={`${activeTab === 'form-fill' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'} font-medium`}
            >
              <FormInput className="h-4 w-4 mr-2" />
              Form Fill
              <span className="ml-1 px-2 py-0.5 text-xs bg-teal-500 text-white rounded-full">NEW</span>
            </Button>
            <Button
              variant={activeTab === 'ocr' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('ocr')}
              className={`${activeTab === 'ocr' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'} font-medium`}
            >
              <ScanLine className="h-4 w-4 mr-2" />
              OCR
              <span className="ml-1 px-2 py-0.5 text-xs bg-indigo-500 text-white rounded-full">NEW</span>
            </Button>
            <Button
              variant={activeTab === 'pdf-tools' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('pdf-tools')}
              className={`${activeTab === 'pdf-tools' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'} font-medium`}
            >
              <Settings className="h-4 w-4 mr-2" />
              PDF Tools
              <span className="ml-1 px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">NEW</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button 
                        onClick={handleDownload}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 shadow-lg transition-all duration-300"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {conversionResult.converted_file?.toLowerCase().endsWith('.pdf') && (
                        <Button 
                          onClick={() => setPdfPreview({
                            isOpen: true,
                            fileUrl: `${API}/download/${conversionResult.conversion_id}`,
                            fileName: conversionResult.converted_file,
                            compareUrl: null
                          })}
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50 font-semibold py-2 transition-all duration-300"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview PDF
                        </Button>
                      )}
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
                <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">FREE TIER</span>
              </CardTitle>
              <CardDescription className="text-purple-100">
                Upload and convert multiple documents simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Batch Upload Area */}
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center bg-purple-50/50">
                  <Package className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Multiple Files</h3>
                  <p className="text-gray-600 mb-4">Select multiple documents to process in batch</p>
                  
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.txt,.rtf,.odt"
                    onChange={(e) => handleBatchUpload(e.target.files)}
                    className="hidden"
                    id="batch-upload"
                  />
                  <label
                    htmlFor="batch-upload"
                    className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Multiple Files
                  </label>
                </div>

                {/* Batch Processing Options */}
                {batchFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Files to Process ({batchFiles.length})</h4>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(format) => handleBatchConvert(format)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Convert all to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {supportedFormats.output.map((format) => (
                              <SelectItem key={format} value={format.toLowerCase()}>
                                Convert all to {format.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {batchFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-purple-200 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-purple-500 mr-3" />
                            <div>
                              <p className="font-medium">{file.originalFile?.name || 'Unknown file'}</p>
                              <p className="text-sm text-gray-500">Status: {file.status || 'Ready'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {file.status === 'converted' && (
                              <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                            {isBatchProcessing && (
                              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Batch Processing Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-purple-900">Bulk Conversion</h4>
                    <p className="text-sm text-purple-700">Convert dozens of files at once</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-purple-900">Progress Tracking</h4>
                    <p className="text-sm text-purple-700">Monitor each file's processing status</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-purple-900">Batch Download</h4>
                    <p className="text-sm text-purple-700">Download all converted files as ZIP</p>
                  </div>
                </div>
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
                Document Comparison & Redlining
                <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">FREE TIER</span>
              </CardTitle>
              <CardDescription className="text-orange-100">
                Compare documents side-by-side with intelligent difference detection
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* File Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original Document */}
                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center bg-orange-50/50">
                    <FileText className="h-10 w-10 text-orange-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Original Document</h3>
                    <p className="text-sm text-gray-600 mb-3">Upload the original version</p>
                    
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.rtf,.odt"
                      onChange={(e) => setCompareFiles(prev => ({...prev, original: e.target.files[0]}))}
                      className="hidden"
                      id="original-file"
                    />
                    <label
                      htmlFor="original-file"
                      className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Select Original
                    </label>
                    
                    {compareFiles.original && (
                      <div className="mt-3 p-2 bg-white rounded border border-orange-200">
                        <p className="text-sm font-medium text-orange-800">{compareFiles.original.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Modified Document */}
                  <div className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center bg-red-50/50">
                    <FileText className="h-10 w-10 text-red-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Modified Document</h3>
                    <p className="text-sm text-gray-600 mb-3">Upload the revised version</p>
                    
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.rtf,.odt"
                      onChange={(e) => setCompareFiles(prev => ({...prev, modified: e.target.files[0]}))}
                      className="hidden"
                      id="modified-file"
                    />
                    <label
                      htmlFor="modified-file"
                      className="cursor-pointer bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Select Modified
                    </label>
                    
                    {compareFiles.modified && (
                      <div className="mt-3 p-2 bg-white rounded border border-red-200">
                        <p className="text-sm font-medium text-red-800">{compareFiles.modified.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comparison Options */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Comparison Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-insertions" defaultChecked className="text-green-600" />
                      <label htmlFor="track-insertions" className="text-sm font-medium text-gray-700">Track Insertions</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-deletions" defaultChecked className="text-red-600" />
                      <label htmlFor="track-deletions" className="text-sm font-medium text-gray-700">Track Deletions</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-formatting" defaultChecked className="text-blue-600" />
                      <label htmlFor="track-formatting" className="text-sm font-medium text-gray-700">Track Formatting</label>
                    </div>
                  </div>
                </div>

                {/* Compare Button */}
                <div className="text-center">
                  <Button
                    onClick={() => handleFileComparison(compareFiles.original, compareFiles.modified)}
                    disabled={!compareFiles.original || !compareFiles.modified}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 font-semibold"
                  >
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare Documents
                  </Button>
                </div>

                {/* Comparison Results */}
                {comparisonResult && (
                  <div className="border border-orange-200 rounded-lg p-6 bg-white">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      Comparison Complete
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">12</div>
                        <div className="text-sm text-green-700">Additions</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded">
                        <div className="text-2xl font-bold text-red-600">8</div>
                        <div className="text-sm text-red-700">Deletions</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">5</div>
                        <div className="text-sm text-blue-700">Modifications</div>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                      <Download className="h-4 w-4 mr-2" />
                      Download Comparison Report
                    </Button>
                  </div>
                )}

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-orange-900">Smart Detection</h4>
                    <p className="text-sm text-orange-700">AI-powered change detection and categorization</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-orange-900">Legal Redlining</h4>
                    <p className="text-sm text-orange-700">Professional redline format for legal review</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Editor Tab */}
        {activeTab === 'annotate' && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-yellow-50/50">
            <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white">
                <PenTool className="h-5 w-5 mr-2" />
                Document Annotation & Markup Tools
                <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">FREE TIER</span>
              </CardTitle>
              <CardDescription className="text-yellow-100">
                Professional annotation tools for legal document review
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Annotation Toolbar */}
                <div className="flex flex-wrap items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Button 
                    size="sm" 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => {
                      if (!fileId) {
                        toast({ title: "Upload Required", description: "Please upload a document first to add highlights", variant: "destructive" });
                        return;
                      }
                      setAnnotationText('');
                      toast({ title: "Highlight Mode", description: "Enter your highlight note in the text area below" });
                    }}
                  >
                    <PenTool className="h-3 w-3 mr-1" />
                    Highlight
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-yellow-700 border-yellow-300"
                    onClick={() => {
                      if (!fileId) {
                        toast({ title: "Upload Required", description: "Please upload a document first to add comments", variant: "destructive" });
                        return;
                      }
                      setAnnotationText('[Comment] ');
                      toast({ title: "Comment Mode", description: "Add your comment in the text area below" });
                    }}
                  >
                    📝 Comment
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-yellow-700 border-yellow-300"
                    onClick={() => {
                      if (!fileId) {
                        toast({ title: "Upload Required", description: "Please upload a document first to add bookmarks", variant: "destructive" });
                        return;
                      }
                      setAnnotationText('[Bookmark] Page ');
                      toast({ title: "Bookmark Mode", description: "Enter the page number or section to bookmark" });
                    }}
                  >
                    🔖 Bookmark
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-yellow-700 border-yellow-300"
                    onClick={() => {
                      if (!fileId) {
                        toast({ title: "Upload Required", description: "Please upload a document first to add notes", variant: "destructive" });
                        return;
                      }
                      setAnnotationText('[Note] ');
                      toast({ title: "Note Mode", description: "Add your note in the text area below" });
                    }}
                  >
                    ✏️ Note
                  </Button>
                  <div className="border-l border-yellow-300 h-6 mx-2"></div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-yellow-700">Color:</span>
                    <div 
                      className={`w-6 h-6 bg-yellow-400 rounded cursor-pointer border-2 ${selectedAnnotationColor === 'yellow' ? 'border-yellow-700 ring-2 ring-yellow-300' : 'border-yellow-600'}`}
                      onClick={() => setSelectedAnnotationColor('yellow')}
                      title="Yellow"
                    ></div>
                    <div 
                      className={`w-6 h-6 bg-green-400 rounded cursor-pointer border-2 ${selectedAnnotationColor === 'green' ? 'border-green-700 ring-2 ring-green-300' : 'border-green-600'}`}
                      onClick={() => setSelectedAnnotationColor('green')}
                      title="Green"
                    ></div>
                    <div 
                      className={`w-6 h-6 bg-blue-400 rounded cursor-pointer border-2 ${selectedAnnotationColor === 'blue' ? 'border-blue-700 ring-2 ring-blue-300' : 'border-blue-600'}`}
                      onClick={() => setSelectedAnnotationColor('blue')}
                      title="Blue"
                    ></div>
                    <div 
                      className={`w-6 h-6 bg-red-400 rounded cursor-pointer border-2 ${selectedAnnotationColor === 'red' ? 'border-red-700 ring-2 ring-red-300' : 'border-red-600'}`}
                      onClick={() => setSelectedAnnotationColor('red')}
                      title="Red"
                    ></div>
                  </div>
                </div>

                {/* Document Viewer with Annotation */}
                <div className="border border-yellow-200 rounded-lg bg-white">
                  <div className="p-3 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between">
                    <span className="font-medium text-yellow-800">Document Annotation View</span>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-yellow-700 border-yellow-300"
                        onClick={exportAnnotations}
                        disabled={!fileId || annotations.length === 0}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export ({annotations.length})
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        onClick={saveAnnotation}
                        disabled={isSavingAnnotation || !fileId}
                      >
                        {isSavingAnnotation ? 'Saving...' : 'Save Annotation'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-6 min-h-80">
                    {fileId ? (
                      <div className="space-y-4">
                        {/* Add New Annotation */}
                        <div className="p-4 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50/50">
                          <label className="block text-sm font-medium text-yellow-900 mb-2">
                            Add Annotation
                          </label>
                          <textarea
                            value={annotationText}
                            onChange={(e) => setAnnotationText(e.target.value)}
                            placeholder="Type your annotation or comment here..."
                            className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            rows={3}
                          />
                          <p className="text-xs text-yellow-700 mt-1">
                            Selected color: <span className={`inline-block w-3 h-3 rounded bg-${selectedAnnotationColor}-400 border border-${selectedAnnotationColor}-600`}></span>
                          </p>
                        </div>

                        {/* Display Annotations */}
                        {isLoadingAnnotations ? (
                          <div className="text-center text-gray-500 py-8">
                            Loading annotations...
                          </div>
                        ) : annotations.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">Saved Annotations ({annotations.length})</h4>
                            {annotations.map((annotation) => (
                              <div 
                                key={annotation.annotation_id}
                                className={`p-4 border-l-4 border-${annotation.color}-400 bg-${annotation.color}-50 relative`}
                              >
                                <p className="text-gray-800 mb-2">{annotation.text}</p>
                                <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                                  <span>By: {annotation.author} • {new Date(annotation.created_at).toLocaleDateString()}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteAnnotation(annotation.annotation_id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            No annotations yet. Add your first annotation above!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <PenTool className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Annotating</h3>
                        <p className="text-gray-600 mb-4">Upload and convert a document first to begin annotation</p>
                        <Button
                          onClick={() => setActiveTab('convert')}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          Upload Document
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Annotations Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Annotations List */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                      <PenTool className="h-4 w-4 mr-2" />
                      Annotations (3)
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-yellow-800">Page 1, Line 15</span>
                          <span className="text-xs text-gray-500">2 min ago</span>
                        </div>
                        <p className="text-sm text-gray-700">Review jurisdiction clause for international implications</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-yellow-800">Page 2, Line 8</span>
                          <span className="text-xs text-gray-500">5 min ago</span>
                        </div>
                        <p className="text-sm text-gray-700">Standard arbitration clause - approved</p>
                      </div>
                    </div>
                  </div>

                  {/* Annotation Features */}
                  <div className="space-y-4">
                    {/* Visual Annotation Editor Button */}
                    {fileId && file?.name?.toLowerCase().endsWith('.pdf') && (
                      <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                        <Pencil className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                        <h4 className="font-semibold text-purple-900 text-lg mb-2">Visual Annotation Editor</h4>
                        <p className="text-sm text-purple-700 mb-4">Draw highlights, shapes, and add comments directly on your PDF</p>
                        <Button
                          onClick={() => setShowVisualAnnotator(true)}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Open Visual Editor
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-yellow-900">Smart Highlighting</h4>
                      <p className="text-sm text-yellow-700">AI-suggested highlights for important clauses</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-yellow-900">Collaborative Review</h4>
                      <p className="text-sm text-yellow-700">Share annotations with team members</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-yellow-900">Export Comments</h4>
                      <p className="text-sm text-yellow-700">Generate annotation reports and summaries</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PDF Form Fill Tab */}
        {activeTab === 'form-fill' && (
          fileId && file?.name?.toLowerCase().endsWith('.pdf') ? (
            <PdfFormFiller
              fileId={fileId}
              fileName={file?.name}
              onComplete={(result) => {
                toast({
                  title: "Form Filled",
                  description: `Successfully filled ${result.fields_filled} fields`
                });
              }}
            />
          ) : (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-teal-50/50">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white">
                  <FormInput className="h-5 w-5 mr-2" />
                  PDF Form Filler
                  <span className="ml-2 px-2 py-1 text-xs bg-white text-teal-600 rounded-full">NEW</span>
                </CardTitle>
                <CardDescription className="text-teal-100">
                  Fill out PDF forms directly in your browser
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center py-12">
                  <FormInput className="h-16 w-16 text-teal-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fill PDF Forms</h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    Upload a PDF with fillable form fields to detect and fill them automatically.
                    Perfect for contracts, applications, and official documents.
                  </p>
                  <Button
                    onClick={() => setActiveTab('convert')}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF Document
                  </Button>
                </div>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-teal-900">Auto-Detection</h4>
                    <p className="text-sm text-teal-700">Automatically finds all fillable fields</p>
                  </div>
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-teal-900">Multiple Field Types</h4>
                    <p className="text-sm text-teal-700">Text, checkboxes, dropdowns, and more</p>
                  </div>
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-teal-900">Instant Download</h4>
                    <p className="text-sm text-teal-700">Save your filled PDF immediately</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* OCR Tab */}
        {activeTab === 'ocr' && (
          fileId ? (
            <OcrScanner
              fileId={fileId}
              fileName={file?.name}
              onComplete={(result) => {
                toast({
                  title: "OCR Complete",
                  description: `Extracted ${result.word_count} words with ${result.confidence}% confidence`
                });
              }}
            />
          ) : (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50/50">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white">
                  <ScanLine className="h-5 w-5 mr-2" />
                  OCR Text Extraction
                  <span className="ml-2 px-2 py-1 text-xs bg-white text-indigo-600 rounded-full">NEW</span>
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Extract text from scanned documents and images
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center py-12">
                  <ScanLine className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">OCR Text Extraction</h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    Upload a scanned PDF or image to extract text using AI-powered OCR.
                    Perfect for digitizing paper documents, contracts, and historical records.
                  </p>
                  <Button
                    onClick={() => setActiveTab('convert')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-indigo-900">15+ Languages</h4>
                    <p className="text-sm text-indigo-700">Support for multiple languages</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-indigo-900">Image Enhancement</h4>
                    <p className="text-sm text-indigo-700">Auto-enhance for better accuracy</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-indigo-900">Searchable PDFs</h4>
                    <p className="text-sm text-indigo-700">Create text-searchable PDFs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Integrations Tab */}

        {/* Enhanced PDF Tools Tab */}
        {activeTab === 'pdf-tools' && (
          <div className="space-y-8">
            {/* Advanced PDF Manager */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-orange-50/50">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white">
                  <Settings className="h-5 w-5 mr-2" />
                  Professional PDF Toolkit
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-500 text-white rounded-full">ENHANCED</span>
                </CardTitle>
                <CardDescription className="text-orange-100">
                  16 professional PDF tools for comprehensive document management
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <AdvancedPdfManager 
                  onToolSelect={(toolId) => {
                    setPdfEditor(prev => ({ ...prev, activeOperation: toolId }));
                    toast({
                      title: "PDF Tool Selected",
                      description: `${toolId.charAt(0).toUpperCase() + toolId.slice(1)} tool is ready to use.`,
                    });
                  }}
                  files={batchFiles}
                />
              </CardContent>
            </Card>

            {/* Original PDF Tools Interface */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/50">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white">
                  <Settings className="h-5 w-5 mr-2" />
                  Quick PDF Operations
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Fast access to most common PDF editing tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                {/* PDF Operation Tabs */}
                <div className="flex flex-wrap justify-center gap-2 p-2 bg-orange-50 rounded-xl">
                  {['merge', 'split', 'encrypt', 'esign'].map((operation) => (
                    <Button
                      key={operation}
                      variant={pdfEditor.activeOperation === operation ? 'default' : 'ghost'}
                      onClick={() => setPdfEditor(prev => ({ ...prev, activeOperation: operation }))}
                      className={`${pdfEditor.activeOperation === operation ? 'bg-orange-600 text-white' : 'text-orange-700 hover:text-orange-800'} font-medium capitalize`}
                    >
                      {operation === 'merge' && <Package className="h-3 w-3 mr-2" />}
                      {operation === 'split' && <GitCompare className="h-3 w-3 mr-2" />}
                      {operation === 'encrypt' && <Settings className="h-3 w-3 mr-2" />}
                      {operation === 'esign' && <PenTool className="h-3 w-3 mr-2" />}
                      {operation.charAt(0).toUpperCase() + operation.slice(1)} PDF
                    </Button>
                  ))}
                </div>

                {/* PDF Merge Section */}
                {pdfEditor.activeOperation === 'merge' && (
                  <div className="space-y-6">
                    <div className="text-center p-8 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50">
                      <Package className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Merge Multiple PDFs</h3>
                      <p className="text-gray-600 mb-4">Combine multiple PDF documents into a single file</p>
                      
                      <div className="max-w-2xl mx-auto space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white border border-orange-200 rounded-lg">
                            <h4 className="font-medium text-orange-900 mb-2">Select PDFs to Merge</h4>
                            <p className="text-sm text-gray-600 mb-3">Upload PDF files in the order you want them merged</p>
                            <input
                              type="file"
                              multiple
                              accept=".pdf"
                              onChange={(e) => {
                                // Handle PDF selection for merge
                                console.log('PDFs selected for merge:', e.target.files);
                              }}
                              className="hidden"
                              id="merge-pdfs"
                            />
                            <label
                              htmlFor="merge-pdfs"
                              className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
                            >
                              <Upload className="h-3 w-3 mr-2" />
                              Select PDFs
                            </label>
                          </div>
                          
                          <div className="p-4 bg-white border border-orange-200 rounded-lg">
                            <h4 className="font-medium text-orange-900 mb-2">Merge Options</h4>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input type="checkbox" id="merge-bookmarks" defaultChecked className="mr-2" />
                                <label htmlFor="merge-bookmarks" className="text-sm text-gray-700">Preserve bookmarks</label>
                              </div>
                              <div className="flex items-center">
                                <input type="checkbox" id="merge-metadata" defaultChecked className="mr-2" />
                                <label htmlFor="merge-metadata" className="text-sm text-gray-700">Preserve metadata</label>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handlePdfMerge(['sample_id_1', 'sample_id_2'])}
                          disabled={pdfEditor.isProcessing}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                        >
                          {pdfEditor.isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Merging...
                            </>
                          ) : (
                            <>
                              <Package className="h-4 w-4 mr-2" />
                              Merge PDFs
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {pdfEditor.mergeResult && (
                      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                          <span className="font-bold text-green-800">PDF Merge Complete</span>
                        </div>
                        <p className="text-green-700 mb-4">
                          Merged {pdfEditor.mergeResult.source_files?.length} files into: {pdfEditor.mergeResult.output_file}
                        </p>
                        <div className="flex gap-3">
                          <Button className="bg-green-600 hover:bg-green-700 text-white">
                            <Download className="h-4 w-4 mr-2" />
                            Download Merged PDF
                          </Button>
                          <Button 
                            variant="outline"
                            className="border-green-500 text-green-600 hover:bg-green-50"
                            onClick={() => setPdfPreview({
                              isOpen: true,
                              fileUrl: `${API}${pdfEditor.mergeResult.download_url}`,
                              fileName: pdfEditor.mergeResult.output_file,
                              compareUrl: null
                            })}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview PDF
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PDF Split Section */}
                {pdfEditor.activeOperation === 'split' && (
                  <div className="space-y-6">
                    <div className="text-center p-8 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50">
                      <GitCompare className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Split PDF Document</h3>
                      <p className="text-gray-600 mb-6">Separate PDF into individual pages or custom ranges</p>
                      
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button
                            variant={splitOptions.splitType === 'pages' ? 'default' : 'outline'}
                            onClick={() => setSplitOptions(prev => ({ ...prev, splitType: 'pages' }))}
                            className="p-4 h-auto flex-col"
                          >
                            <FileText className="h-8 w-8 mb-2" />
                            <span className="font-medium">Split by Pages</span>
                            <span className="text-xs">Each page becomes a separate PDF</span>
                          </Button>
                          
                          <Button
                            variant={splitOptions.splitType === 'ranges' ? 'default' : 'outline'}
                            onClick={() => setSplitOptions(prev => ({ ...prev, splitType: 'ranges' }))}
                            className="p-4 h-auto flex-col"
                          >
                            <Layers className="h-8 w-8 mb-2" />
                            <span className="font-medium">Split by Ranges</span>
                            <span className="text-xs">Define custom page ranges</span>
                          </Button>
                        </div>

                        {splitOptions.splitType === 'ranges' && (
                          <div className="p-4 bg-white border border-orange-200 rounded-lg">
                            <h4 className="font-medium text-orange-900 mb-3">Define Page Ranges</h4>
                            {splitOptions.pageRanges.map((range, index) => (
                              <div key={index} className="flex items-center gap-2 mb-2">
                                <span className="text-sm">Pages</span>
                                <input
                                  type="number"
                                  value={range.start}
                                  onChange={(e) => {
                                    const newRanges = [...splitOptions.pageRanges];
                                    newRanges[index].start = parseInt(e.target.value) || 1;
                                    setSplitOptions(prev => ({ ...prev, pageRanges: newRanges }));
                                  }}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                />
                                <span>to</span>
                                <input
                                  type="number"
                                  value={range.end}
                                  onChange={(e) => {
                                    const newRanges = [...splitOptions.pageRanges];
                                    newRanges[index].end = parseInt(e.target.value) || 1;
                                    setSplitOptions(prev => ({ ...prev, pageRanges: newRanges }));
                                  }}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newRanges = splitOptions.pageRanges.filter((_, i) => i !== index);
                                    setSplitOptions(prev => ({ ...prev, pageRanges: newRanges }));
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              onClick={() => {
                                setSplitOptions(prev => ({
                                  ...prev,
                                  pageRanges: [...prev.pageRanges, { start: 1, end: 1 }]
                                }));
                              }}
                              className="mt-2"
                            >
                              Add Range
                            </Button>
                          </div>
                        )}
                        
                        <Button
                          onClick={() => handlePdfSplit('sample_pdf_id', splitOptions.splitType, splitOptions.pageRanges)}
                          disabled={pdfEditor.isProcessing}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                        >
                          {pdfEditor.isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Splitting...
                            </>
                          ) : (
                            <>
                              <GitCompare className="h-4 w-4 mr-2" />
                              Split PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {pdfEditor.splitResult && (
                      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                          <span className="font-bold text-green-800">PDF Split Complete</span>
                        </div>
                        <p className="text-green-700 mb-4">
                          Split into {pdfEditor.splitResult.split_files?.length} files
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {pdfEditor.splitResult.split_files?.map((file, index) => (
                            <Button key={index} size="sm" variant="outline" className="text-green-600 border-green-600">
                              <Download className="h-3 w-3 mr-1" />
                              {file.filename}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PDF Encrypt Section */}
                {pdfEditor.activeOperation === 'encrypt' && (
                  <div className="space-y-6">
                    <div className="text-center p-8 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50">
                      <Settings className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Password Protect PDF</h3>
                      <p className="text-gray-600 mb-6">Add password protection and set document permissions</p>
                      
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-white border border-orange-200 rounded-lg text-left">
                            <h4 className="font-medium text-orange-900 mb-3">Password Settings</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                  type="password"
                                  value={encryptOptions.password}
                                  onChange={(e) => setEncryptOptions(prev => ({ ...prev, password: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  placeholder="Enter password"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input
                                  type="password"
                                  value={encryptOptions.confirmPassword}
                                  onChange={(e) => setEncryptOptions(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  placeholder="Confirm password"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-white border border-orange-200 rounded-lg text-left">
                            <h4 className="font-medium text-orange-900 mb-3">Document Permissions</h4>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="allow-print"
                                  checked={encryptOptions.permissions.print}
                                  onChange={(e) => setEncryptOptions(prev => ({
                                    ...prev,
                                    permissions: { ...prev.permissions, print: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <label htmlFor="allow-print" className="text-sm text-gray-700">Allow printing</label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="allow-copy"
                                  checked={encryptOptions.permissions.copy}
                                  onChange={(e) => setEncryptOptions(prev => ({
                                    ...prev,
                                    permissions: { ...prev.permissions, copy: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <label htmlFor="allow-copy" className="text-sm text-gray-700">Allow copying text</label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="allow-modify"
                                  checked={encryptOptions.permissions.modify}
                                  onChange={(e) => setEncryptOptions(prev => ({
                                    ...prev,
                                    permissions: { ...prev.permissions, modify: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <label htmlFor="allow-modify" className="text-sm text-gray-700">Allow modifications</label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="allow-extract"
                                  checked={encryptOptions.permissions.extract}
                                  onChange={(e) => setEncryptOptions(prev => ({
                                    ...prev,
                                    permissions: { ...prev.permissions, extract: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <label htmlFor="allow-extract" className="text-sm text-gray-700">Allow content extraction</label>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handlePdfEncrypt('sample_pdf_id', encryptOptions.password, encryptOptions.permissions)}
                          disabled={pdfEditor.isProcessing || !encryptOptions.password || encryptOptions.password !== encryptOptions.confirmPassword}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                        >
                          {pdfEditor.isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Encrypting...
                            </>
                          ) : (
                            <>
                              <Settings className="h-4 w-4 mr-2" />
                              Encrypt PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {pdfEditor.encryptResult && (
                      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                          <span className="font-bold text-green-800">PDF Encryption Complete</span>
                        </div>
                        <p className="text-green-700 mb-4">
                          {pdfEditor.encryptResult.encrypted_file} is now password protected
                        </p>
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                          <Download className="h-4 w-4 mr-2" />
                          Download Encrypted PDF
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* PDF eSign Section */}
                {pdfEditor.activeOperation === 'esign' && (
                  <div className="space-y-6">
                    <div className="text-center p-8 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50">
                      <PenTool className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Electronic Signature</h3>
                      <p className="text-gray-600 mb-6">Add legally binding electronic signatures to PDF documents</p>
                      
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-white border border-orange-200 rounded-lg text-left">
                            <h4 className="font-medium text-orange-900 mb-3">Signer Information</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                  type="text"
                                  value={esignOptions.signerName}
                                  onChange={(e) => setEsignOptions(prev => ({ ...prev, signerName: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  placeholder="Enter signer name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                  type="email"
                                  value={esignOptions.signerEmail}
                                  onChange={(e) => setEsignOptions(prev => ({ ...prev, signerEmail: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  placeholder="Enter email address"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-white border border-orange-200 rounded-lg text-left">
                            <h4 className="font-medium text-orange-900 mb-3">Signature Placement</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Page Number</label>
                                <input
                                  type="number"
                                  value={esignOptions.position.page}
                                  onChange={(e) => setEsignOptions(prev => ({
                                    ...prev,
                                    position: { ...prev.position, page: parseInt(e.target.value) || 1 }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  min="1"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
                                  <input
                                    type="number"
                                    value={esignOptions.position.x}
                                    onChange={(e) => setEsignOptions(prev => ({
                                      ...prev,
                                      position: { ...prev.position, x: parseInt(e.target.value) || 100 }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
                                  <input
                                    type="number"
                                    value={esignOptions.position.y}
                                    onChange={(e) => setEsignOptions(prev => ({
                                      ...prev,
                                      position: { ...prev.position, y: parseInt(e.target.value) || 100 }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-white border border-orange-200 rounded-lg">
                          <h4 className="font-medium text-orange-900 mb-3">Signature Preview</h4>
                          <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                              <PenTool className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                {esignOptions.signerName || 'Your signature will appear here'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handlePdfEsign('sample_pdf_id', 
                            { name: esignOptions.signerName, email: esignOptions.signerEmail }, 
                            esignOptions.position
                          )}
                          disabled={pdfEditor.isProcessing || !esignOptions.signerName || !esignOptions.signerEmail}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                        >
                          {pdfEditor.isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Signing...
                            </>
                          ) : (
                            <>
                              <PenTool className="h-4 w-4 mr-2" />
                              Sign PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {pdfEditor.esignResult && (
                      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                          <span className="font-bold text-green-800">PDF Signing Complete</span>
                        </div>
                        <p className="text-green-700 mb-2">
                          Document signed by: {pdfEditor.esignResult.signer_info?.name}
                        </p>
                        <p className="text-green-600 text-sm mb-4">
                          Verification Hash: {pdfEditor.esignResult.signature_verification}
                        </p>
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                          <Download className="h-4 w-4 mr-2" />
                          Download Signed PDF
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* PDF Tools Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <Package className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-orange-900">Merge PDFs</h4>
                    <p className="text-sm text-orange-700">Combine multiple PDFs into one</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <GitCompare className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-orange-900">Split PDFs</h4>
                    <p className="text-sm text-orange-700">Extract pages or create ranges</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <Settings className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-orange-900">Encrypt PDFs</h4>
                    <p className="text-sm text-orange-700">Password protect documents</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <PenTool className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-orange-900">eSign PDFs</h4>
                    <p className="text-sm text-orange-700">Add electronic signatures</p>
                  </div>
                </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
      
      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={() => setPdfPreview(prev => ({ ...prev, isOpen: false }))}
        fileUrl={pdfPreview.fileUrl}
        fileName={pdfPreview.fileName}
        compareUrl={pdfPreview.compareUrl}
        compareLabel={pdfPreview.compareLabel}
        originalLabel={pdfPreview.originalLabel}
      />
      
      {/* Visual Annotation Editor */}
      {showVisualAnnotator && fileId && (
        <VisualAnnotationEditor
          fileId={fileId}
          fileUrl={`${API}/download/${fileId}`}
          fileName={file?.name || 'document.pdf'}
          onClose={() => setShowVisualAnnotator(false)}
        />
      )}
    </section>
  );
};

export default DocumentProcessor;