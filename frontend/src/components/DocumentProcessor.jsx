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

        {/* Action Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Convert Section */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white">
                <Download className="h-5 w-5 mr-2" />
                Format Conversion
              </CardTitle>
              <CardDescription className="text-green-100">
                Convert your document to any supported format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="border-2 border-green-200 focus:border-green-400">
                  <SelectValue placeholder="Select output format" />
                </SelectTrigger>
                <SelectContent>
                  {supportedFormats.output.map((format) => (
                    <SelectItem key={format} value={format.toLowerCase()}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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
                  <p className="text-green-700 mb-4 font-medium">
                    {conversionResult.original_file} → {conversionResult.converted_file}
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Converted File
                  </Button>
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