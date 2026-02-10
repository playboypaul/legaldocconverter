import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { 
  ScanLine, 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Languages,
  Wand2,
  FileSearch,
  Copy,
  Eye
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OcrScanner = ({ fileId, fileName, onComplete }) => {
  const { toast } = useToast();
  
  const [languages, setLanguages] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState('eng');
  const [enhanceImage, setEnhanceImage] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatingSearchable, setIsCreatingSearchable] = useState(false);
  const [result, setResult] = useState(null);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const response = await axios.get(`${API}/ocr/languages`);
      setLanguages(response.data.available_languages || { eng: 'English' });
    } catch (error) {
      console.error('Error loading languages:', error);
      setLanguages({ eng: 'English' });
    }
  };

  const performOcr = async () => {
    if (!fileId) {
      toast({ title: "Error", description: "Please upload a file first", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const response = await axios.post(`${API}/ocr/extract`, {
        file_id: fileId,
        language: selectedLanguage,
        enhance_image: enhanceImage
      });
      
      setResult(response.data);
      toast({ 
        title: "OCR Complete", 
        description: `Extracted ${response.data.word_count} words with ${response.data.confidence}% confidence` 
      });
      
      if (onComplete) {
        onComplete(response.data);
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast({ 
        title: "OCR Failed", 
        description: error.response?.data?.detail || "Failed to extract text", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const createSearchablePdf = async () => {
    if (!fileId) {
      toast({ title: "Error", description: "Please upload a PDF first", variant: "destructive" });
      return;
    }
    
    setIsCreatingSearchable(true);
    
    try {
      const response = await axios.post(`${API}/ocr/searchable-pdf`, {
        file_id: fileId,
        language: selectedLanguage
      });
      
      toast({ 
        title: "Success", 
        description: "Searchable PDF created successfully" 
      });
      
      // Download the file
      window.open(`${API}${response.data.download_url}`, '_blank');
    } catch (error) {
      console.error('Searchable PDF error:', error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.detail || "Failed to create searchable PDF", 
        variant: "destructive" 
      });
    } finally {
      setIsCreatingSearchable(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      toast({ title: "Copied", description: "Text copied to clipboard" });
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-white">
          <ScanLine className="h-5 w-5 mr-2" />
          OCR Text Extraction
          <span className="ml-2 px-2 py-1 text-xs bg-white text-indigo-600 rounded-full">NEW</span>
        </CardTitle>
        <CardDescription className="text-indigo-100">
          Extract text from scanned documents and images using AI-powered OCR
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {/* File Info */}
        {fileId && (
          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg mb-6">
            <FileText className="h-8 w-8 text-indigo-500" />
            <div>
              <p className="font-medium text-slate-900">{fileName}</p>
              <p className="text-sm text-slate-500">Ready for OCR processing</p>
            </div>
          </div>
        )}

        {/* OCR Settings */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Languages className="h-4 w-4 inline mr-1" />
              Document Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enhanceImage}
              onChange={(e) => setEnhanceImage(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="font-medium text-gray-700">Enhance Image Quality</span>
              <p className="text-sm text-gray-500">Improves accuracy for low-quality scans</p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={performOcr}
            disabled={isProcessing || !fileId}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Extract Text
              </>
            )}
          </Button>

          <Button
            onClick={createSearchablePdf}
            disabled={isCreatingSearchable || !fileId}
            variant="outline"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          >
            {isCreatingSearchable ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileSearch className="h-4 w-4 mr-2" />
                Create Searchable PDF
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{result.pages}</p>
                <p className="text-sm text-blue-600">Pages</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{result.word_count.toLocaleString()}</p>
                <p className="text-sm text-green-600">Words</p>
              </div>
              <div className={`p-4 rounded-lg text-center ${getConfidenceColor(result.confidence)}`}>
                <p className="text-2xl font-bold">{result.confidence}%</p>
                <p className="text-sm">Confidence</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-700">{(result.full_text_length / 1000).toFixed(1)}K</p>
                <p className="text-sm text-purple-600">Characters</p>
              </div>
            </div>

            {/* Extracted Text Preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-slate-100">
                <h4 className="font-semibold text-slate-700">Extracted Text</h4>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFullText(!showFullText)}
                    className="text-slate-600"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showFullText ? 'Show Less' : 'Show More'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyToClipboard}
                    className="text-slate-600"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className={`p-4 bg-white overflow-auto ${showFullText ? 'max-h-96' : 'max-h-48'}`}>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {result.text}
                </pre>
                {result.text_truncated && !showFullText && (
                  <p className="text-sm text-slate-500 mt-2 italic">
                    Text truncated. Click "Show More" to see full text or download the file.
                  </p>
                )}
              </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => window.open(`${API}${result.download_url}`, '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Full Text
              </Button>
            </div>
          </div>
        )}

        {/* Help Text */}
        {!result && (
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-800 mb-2">Supported Documents</h4>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• Scanned PDFs - Multiple pages supported</li>
              <li>• Images - PNG, JPG, JPEG, TIFF, BMP, GIF</li>
              <li>• Supports 15+ languages including English, French, German, Spanish</li>
              <li>• Create searchable PDFs with embedded text layer</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OcrScanner;
