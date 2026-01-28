import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  FileText, 
  Package, 
  GitCompare, 
  Settings, 
  PenTool, 
  Eye, 
  Download, 
  Trash2, 
  Copy,
  RotateCw,
  Crop,
  Image as ImageIcon,
  Type,
  Bookmark,
  Lock,
  Unlock,
  Search,
  FileSearch,
  Zap,
  Layers,
  Grid3X3,
  Maximize
} from 'lucide-react';

const AdvancedPdfManager = ({ onToolSelect, files = [] }) => {
  const [activeCategory, setActiveCategory] = useState('basic');

  const toolCategories = {
    basic: {
      name: 'Basic Operations',
      icon: <FileText className="h-4 w-4" />,
      tools: [
        {
          id: 'merge',
          name: 'Merge PDFs',
          description: 'Combine multiple PDF documents into one',
          icon: <Package className="h-8 w-8" />,
          color: 'bg-blue-500',
          features: ['Multiple file support', 'Custom page order', 'Bookmark preservation']
        },
        {
          id: 'split',
          name: 'Split PDF',
          description: 'Extract pages or create page ranges',
          icon: <GitCompare className="h-8 w-8" />,
          color: 'bg-green-500',
          features: ['Page ranges', 'Individual pages', 'Batch splitting']
        },
        {
          id: 'encrypt',
          name: 'Encrypt PDF',
          description: 'Add password protection and permissions',
          icon: <Lock className="h-8 w-8" />,
          color: 'bg-red-500',
          features: ['Password protection', 'Permission settings', '256-bit encryption']
        },
        {
          id: 'decrypt',
          name: 'Remove Protection',
          description: 'Remove passwords and restrictions',
          icon: <Unlock className="h-8 w-8" />,
          color: 'bg-orange-500',
          features: ['Password removal', 'Unlock restrictions', 'Batch processing']
        }
      ]
    },
    editing: {
      name: 'PDF Editing',
      icon: <PenTool className="h-4 w-4" />,
      tools: [
        {
          id: 'rotate',
          name: 'Rotate Pages',
          description: 'Rotate pages in 90-degree increments',
          icon: <RotateCw className="h-8 w-8" />,
          color: 'bg-purple-500',
          features: ['Batch rotation', 'Custom angles', 'Page selection']
        },
        {
          id: 'crop',
          name: 'Crop Pages',
          description: 'Remove margins and crop content',
          icon: <Crop className="h-8 w-8" />,
          color: 'bg-yellow-500',
          features: ['Margin removal', 'Custom crop areas', 'Batch cropping']
        },
        {
          id: 'watermark',
          name: 'Add Watermark',
          description: 'Add text or image watermarks',
          icon: <Type className="h-8 w-8" />,
          color: 'bg-indigo-500',
          features: ['Text watermarks', 'Image watermarks', 'Position control']
        },
        {
          id: 'headers-footers',
          name: 'Headers & Footers',
          description: 'Add page headers and footers',
          icon: <Layers className="h-8 w-8" />,
          color: 'bg-teal-500',
          features: ['Page numbers', 'Date/time stamps', 'Custom text']
        }
      ]
    },
    analysis: {
      name: 'Analysis & Search',
      icon: <Search className="h-4 w-4" />,
      tools: [
        {
          id: 'ocr',
          name: 'OCR Text Recognition',
          description: 'Convert scanned PDFs to searchable text',
          icon: <FileSearch className="h-8 w-8" />,
          color: 'bg-emerald-500',
          features: ['Multi-language OCR', 'Text extraction', 'Search indexing']
        },
        {
          id: 'search-replace',
          name: 'Search & Replace',
          description: 'Find and replace text throughout PDF',
          icon: <Search className="h-8 w-8" />,
          color: 'bg-cyan-500',
          features: ['Regex support', 'Case sensitivity', 'Batch operations']
        },
        {
          id: 'metadata',
          name: 'Metadata Editor',
          description: 'View and edit PDF properties',
          icon: <Settings className="h-8 w-8" />,
          color: 'bg-slate-500',
          features: ['Title/author editing', 'Custom properties', 'Bulk updates']
        },
        {
          id: 'bookmarks',
          name: 'Bookmark Manager',
          description: 'Create and organize PDF bookmarks',
          icon: <Bookmark className="h-8 w-8" />,
          color: 'bg-rose-500',
          features: ['Auto-generation', 'Nested bookmarks', 'Import/export']
        }
      ]
    },
    optimization: {
      name: 'Optimization',
      icon: <Zap className="h-4 w-4" />,
      tools: [
        {
          id: 'compress',
          name: 'Compress PDF',
          description: 'Reduce file size without quality loss',
          icon: <Maximize className="h-8 w-8" />,
          color: 'bg-amber-500',
          features: ['Smart compression', 'Quality control', 'Batch processing']
        },
        {
          id: 'optimize-images',
          name: 'Optimize Images',
          description: 'Compress images within PDF files',
          icon: <ImageIcon className="h-8 w-8" />,
          color: 'bg-pink-500',
          features: ['Lossless compression', 'Format conversion', 'Resolution control']
        },
        {
          id: 'linearize',
          name: 'Web Optimize',
          description: 'Optimize for web viewing and download',
          icon: <Grid3X3 className="h-8 w-8" />,
          color: 'bg-violet-500',
          features: ['Fast web view', 'Progressive loading', 'Mobile optimization']
        },
        {
          id: 'repair',
          name: 'Repair PDF',
          description: 'Fix corrupted or damaged PDF files',
          icon: <Settings className="h-8 w-8" />,
          color: 'bg-gray-500',
          features: ['Error recovery', 'Structure repair', 'Content restoration']
        }
      ]
    }
  };

  return (
    <div className="space-y-8">
      {/* Category Navigation */}
      <div className="flex flex-wrap justify-center gap-2 p-3 bg-white rounded-xl shadow-md">
        {Object.entries(toolCategories).map(([key, category]) => (
          <Button
            key={key}
            variant={activeCategory === key ? 'default' : 'ghost'}
            onClick={() => setActiveCategory(key)}
            className={`${
              activeCategory === key 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-700 hover:text-orange-600'
            } font-medium flex items-center gap-2`}
          >
            {category.icon}
            {category.name}
          </Button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {toolCategories[activeCategory].tools.map((tool) => (
          <Card 
            key={tool.id}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => onToolSelect(tool.id)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg ${tool.color} text-white`}>
                  {tool.icon}
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Use Tool
                </Button>
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {tool.name}
              </CardTitle>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
                  Features
                </h4>
                {tool.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* File Management Panel */}
      {files.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Uploaded Files ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">Batch Processing</h3>
            <p className="text-sm text-blue-700 mb-4">Process multiple PDFs simultaneously</p>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                alert('To use Batch Processing:\n\n1. Go to the "Batch Process" tab above\n2. Upload multiple files\n3. Select your output format\n4. Click "Start Batch Conversion"');
              }}
            >
              Start Batch Job
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6 text-center">
            <Zap className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-green-900 mb-2">Smart Optimization</h3>
            <p className="text-sm text-green-700 mb-4">Compress and optimize PDF files</p>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                if (onToolSelect) {
                  onToolSelect('compress');
                } else {
                  alert('To optimize a PDF:\n\n1. First upload a PDF file in the "Convert" tab\n2. Then select "Compress" from the PDF tools\n3. Click to reduce file size');
                }
              }}
            >
              Optimize Now
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6 text-center">
            <Settings className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-purple-900 mb-2">Custom Workflows</h3>
            <p className="text-sm text-purple-700 mb-4">Combine multiple PDF operations</p>
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                alert('Custom Workflows let you:\n\n• Merge → Compress → Add Watermark\n• Split → Encrypt → Download\n• Convert → Annotate → Export\n\nUpload a PDF first, then chain operations together!');
              }}
            >
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedPdfManager;