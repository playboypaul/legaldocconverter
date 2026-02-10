import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  PenTool, 
  Highlighter, 
  Type, 
  Square, 
  Circle, 
  ArrowRight,
  MessageSquare,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Undo,
  Redo,
  Save,
  Loader2,
  MousePointer,
  Minus
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Annotation tools configuration
const ANNOTATION_TOOLS = {
  select: { id: 'select', name: 'Select', icon: MousePointer, cursor: 'default' },
  highlight: { id: 'highlight', name: 'Highlight', icon: Highlighter, cursor: 'text' },
  underline: { id: 'underline', name: 'Underline', icon: Minus, cursor: 'text' },
  strikethrough: { id: 'strikethrough', name: 'Strikethrough', icon: Type, cursor: 'text' },
  textBox: { id: 'textBox', name: 'Text Box', icon: Type, cursor: 'crosshair' },
  freehand: { id: 'freehand', name: 'Draw', icon: PenTool, cursor: 'crosshair' },
  rectangle: { id: 'rectangle', name: 'Rectangle', icon: Square, cursor: 'crosshair' },
  circle: { id: 'circle', name: 'Circle', icon: Circle, cursor: 'crosshair' },
  arrow: { id: 'arrow', name: 'Arrow', icon: ArrowRight, cursor: 'crosshair' },
  comment: { id: 'comment', name: 'Comment', icon: MessageSquare, cursor: 'crosshair' }
};

// Color palette
const COLOR_PALETTE = [
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Blue', value: '#00BFFF' },
  { name: 'Pink', value: '#FF69B4' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Purple', value: '#9370DB' }
];

const VisualAnnotationEditor = ({ fileId, fileUrl, fileName, onClose }) => {
  const { toast } = useToast();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // PDF state
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  
  // Tool state
  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState('#FFFF00');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(0.5);
  
  // Annotation state
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPath, setDrawingPath] = useState([]);
  
  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Comment input state
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentPosition, setCommentPosition] = useState(null);

  // Load existing annotations
  useEffect(() => {
    loadAnnotations();
  }, [fileId]);

  const loadAnnotations = async () => {
    try {
      const response = await axios.get(`${API}/annotations/${fileId}`);
      if (response.data.annotations) {
        setAnnotations(response.data.annotations);
        addToHistory(response.data.annotations);
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
    }
  };

  const addToHistory = (newAnnotations) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newAnnotations]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations([...history[historyIndex + 1]]);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onPageLoadSuccess = (page) => {
    setPdfDimensions({
      width: page.width,
      height: page.height
    });
  };

  // Get mouse position relative to canvas
  const getMousePosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  // Handle mouse events for drawing
  const handleMouseDown = (e) => {
    if (activeTool === 'select') {
      // Check if clicking on an existing annotation
      const pos = getMousePosition(e);
      const clicked = findAnnotationAtPosition(pos);
      setSelectedAnnotation(clicked);
      return;
    }
    
    const pos = getMousePosition(e);
    setIsDrawing(true);
    
    if (activeTool === 'freehand') {
      setDrawingPath([pos]);
    } else if (activeTool === 'comment') {
      setCommentPosition(pos);
      setShowCommentInput(true);
    } else {
      setCurrentAnnotation({
        type: activeTool,
        startX: pos.x,
        startY: pos.y,
        endX: pos.x,
        endY: pos.y,
        color: activeColor,
        opacity: opacity,
        strokeWidth: strokeWidth,
        page: currentPage
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    
    const pos = getMousePosition(e);
    
    if (activeTool === 'freehand') {
      setDrawingPath(prev => [...prev, pos]);
    } else if (currentAnnotation) {
      setCurrentAnnotation(prev => ({
        ...prev,
        endX: pos.x,
        endY: pos.y
      }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (activeTool === 'freehand' && drawingPath.length > 1) {
      const newAnnotation = {
        annotation_id: `temp_${Date.now()}`,
        type: 'drawing',
        path: drawingPath,
        color: activeColor,
        opacity: opacity,
        strokeWidth: strokeWidth,
        page: currentPage,
        position: { page: currentPage }
      };
      
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
      setDrawingPath([]);
    } else if (currentAnnotation && 
               (Math.abs(currentAnnotation.endX - currentAnnotation.startX) > 5 ||
                Math.abs(currentAnnotation.endY - currentAnnotation.startY) > 5)) {
      const newAnnotation = {
        annotation_id: `temp_${Date.now()}`,
        ...currentAnnotation,
        position: {
          page: currentPage,
          x: Math.min(currentAnnotation.startX, currentAnnotation.endX),
          y: Math.min(currentAnnotation.startY, currentAnnotation.endY),
          width: Math.abs(currentAnnotation.endX - currentAnnotation.startX),
          height: Math.abs(currentAnnotation.endY - currentAnnotation.startY)
        }
      };
      
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
    }
    
    setCurrentAnnotation(null);
  };

  const findAnnotationAtPosition = (pos) => {
    return annotations.find(ann => {
      if (ann.page !== currentPage && ann.position?.page !== currentPage) return false;
      
      const position = ann.position || {};
      const x = position.x || ann.startX || 0;
      const y = position.y || ann.startY || 0;
      const width = position.width || Math.abs((ann.endX || 0) - (ann.startX || 0)) || 50;
      const height = position.height || Math.abs((ann.endY || 0) - (ann.startY || 0)) || 20;
      
      return pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height;
    });
  };

  const handleCommentSubmit = () => {
    if (!commentText.trim() || !commentPosition) return;
    
    const newAnnotation = {
      annotation_id: `temp_${Date.now()}`,
      type: 'comment',
      text: commentText,
      color: activeColor,
      page: currentPage,
      position: {
        page: currentPage,
        x: commentPosition.x,
        y: commentPosition.y
      }
    };
    
    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
    
    setShowCommentInput(false);
    setCommentText('');
    setCommentPosition(null);
  };

  const deleteAnnotation = (annotationId) => {
    const newAnnotations = annotations.filter(ann => ann.annotation_id !== annotationId);
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
    setSelectedAnnotation(null);
  };

  const saveAnnotations = async () => {
    setIsSaving(true);
    try {
      // Save each new annotation to the backend
      for (const ann of annotations) {
        if (ann.annotation_id.startsWith('temp_')) {
          await axios.post(`${API}/annotations/visual`, {
            file_id: fileId,
            type: ann.type,
            text: ann.text || '',
            position: ann.position || { page: ann.page, x: ann.startX, y: ann.startY },
            color: ann.color,
            opacity: ann.opacity || 0.5,
            drawing_path: ann.path ? { points: ann.path, stroke_width: ann.strokeWidth, stroke_color: ann.color } : null,
            shape_type: ['rectangle', 'circle', 'arrow'].includes(ann.type) ? ann.type : null,
            author: 'User'
          });
        }
      }
      
      toast({ title: "Success", description: "Annotations saved successfully" });
      
      // Reload to get server-generated IDs
      await loadAnnotations();
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast({ title: "Error", description: "Failed to save annotations", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const exportAnnotations = async () => {
    try {
      const response = await axios.post(`${API}/annotations/export`, { 
        file_id: fileId,
        format: 'json'
      });
      
      // Download the file
      window.open(`${API}/download/${response.data.export_id}`, '_blank');
      toast({ title: "Success", description: "Annotations exported" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export annotations", variant: "destructive" });
    }
  };

  // Render annotations on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfDimensions.width) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = pdfDimensions.width;
    canvas.height = pdfDimensions.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw existing annotations for current page
    const pageAnnotations = annotations.filter(ann => 
      (ann.page === currentPage) || (ann.position?.page === currentPage)
    );
    
    pageAnnotations.forEach(ann => {
      ctx.save();
      ctx.globalAlpha = ann.opacity || 0.5;
      ctx.strokeStyle = ann.color || '#FFFF00';
      ctx.fillStyle = ann.color || '#FFFF00';
      ctx.lineWidth = ann.strokeWidth || 2;
      
      const pos = ann.position || {};
      
      switch (ann.type) {
        case 'highlight':
        case 'rectangle':
          ctx.fillRect(
            pos.x || ann.startX || 0,
            pos.y || ann.startY || 0,
            pos.width || Math.abs((ann.endX || 0) - (ann.startX || 0)),
            pos.height || Math.abs((ann.endY || 0) - (ann.startY || 0))
          );
          break;
          
        case 'underline':
          ctx.beginPath();
          ctx.moveTo(pos.x || ann.startX || 0, (pos.y || ann.startY || 0) + (pos.height || 20));
          ctx.lineTo(
            (pos.x || ann.startX || 0) + (pos.width || Math.abs((ann.endX || 0) - (ann.startX || 0))),
            (pos.y || ann.startY || 0) + (pos.height || 20)
          );
          ctx.stroke();
          break;
          
        case 'strikethrough':
          ctx.beginPath();
          const midY = (pos.y || ann.startY || 0) + ((pos.height || 20) / 2);
          ctx.moveTo(pos.x || ann.startX || 0, midY);
          ctx.lineTo(
            (pos.x || ann.startX || 0) + (pos.width || Math.abs((ann.endX || 0) - (ann.startX || 0))),
            midY
          );
          ctx.stroke();
          break;
          
        case 'circle':
          const centerX = (pos.x || ann.startX || 0) + ((pos.width || Math.abs((ann.endX || 0) - (ann.startX || 0))) / 2);
          const centerY = (pos.y || ann.startY || 0) + ((pos.height || Math.abs((ann.endY || 0) - (ann.startY || 0))) / 2);
          const radiusX = (pos.width || Math.abs((ann.endX || 0) - (ann.startX || 0))) / 2;
          const radiusY = (pos.height || Math.abs((ann.endY || 0) - (ann.startY || 0))) / 2;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.stroke();
          break;
          
        case 'arrow':
          const startX = ann.startX || pos.x || 0;
          const startY = ann.startY || pos.y || 0;
          const endX = ann.endX || (pos.x + pos.width) || 100;
          const endY = ann.endY || (pos.y + pos.height) || 100;
          
          // Draw line
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          
          // Draw arrowhead
          const angle = Math.atan2(endY - startY, endX - startX);
          const headLength = 15;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
          break;
          
        case 'drawing':
          if (ann.path && ann.path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(ann.path[0].x, ann.path[0].y);
            for (let i = 1; i < ann.path.length; i++) {
              ctx.lineTo(ann.path[i].x, ann.path[i].y);
            }
            ctx.stroke();
          }
          break;
          
        case 'comment':
          // Draw comment marker
          ctx.globalAlpha = 1;
          ctx.fillStyle = ann.color || '#FFA500';
          ctx.beginPath();
          ctx.arc(pos.x || 0, pos.y || 0, 12, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('!', pos.x || 0, pos.y || 0);
          break;
          
        case 'textBox':
          if (ann.text) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(pos.x || 0, pos.y || 0, pos.width || 150, pos.height || 30);
            ctx.strokeRect(pos.x || 0, pos.y || 0, pos.width || 150, pos.height || 30);
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.fillText(ann.text, (pos.x || 0) + 5, (pos.y || 0) + 18);
          }
          break;
          
        default:
          break;
      }
      
      ctx.restore();
      
      // Draw selection indicator
      if (selectedAnnotation?.annotation_id === ann.annotation_id) {
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          (pos.x || ann.startX || 0) - 5,
          (pos.y || ann.startY || 0) - 5,
          (pos.width || Math.abs((ann.endX || 0) - (ann.startX || 0)) || 50) + 10,
          (pos.height || Math.abs((ann.endY || 0) - (ann.startY || 0)) || 20) + 10
        );
        ctx.setLineDash([]);
      }
    });
    
    // Draw current annotation being created
    if (currentAnnotation) {
      ctx.save();
      ctx.globalAlpha = currentAnnotation.opacity || 0.5;
      ctx.strokeStyle = currentAnnotation.color;
      ctx.fillStyle = currentAnnotation.color;
      ctx.lineWidth = currentAnnotation.strokeWidth || 2;
      
      const x = Math.min(currentAnnotation.startX, currentAnnotation.endX);
      const y = Math.min(currentAnnotation.startY, currentAnnotation.endY);
      const width = Math.abs(currentAnnotation.endX - currentAnnotation.startX);
      const height = Math.abs(currentAnnotation.endY - currentAnnotation.startY);
      
      if (['highlight', 'rectangle'].includes(currentAnnotation.type)) {
        ctx.fillRect(x, y, width, height);
      } else if (currentAnnotation.type === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (currentAnnotation.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(currentAnnotation.startX, currentAnnotation.startY);
        ctx.lineTo(currentAnnotation.endX, currentAnnotation.endY);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Draw freehand path being drawn
    if (drawingPath.length > 1) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(drawingPath[0].x, drawingPath[0].y);
      for (let i = 1; i < drawingPath.length; i++) {
        ctx.lineTo(drawingPath[i].x, drawingPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
    
  }, [annotations, currentAnnotation, drawingPath, currentPage, selectedAnnotation, pdfDimensions]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header Toolbar */}
      <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="font-semibold">{fileName || 'PDF Annotation'}</h2>
          <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setScale(Math.max(0.5, scale - 0.25))}
              className="text-white hover:bg-slate-700"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setScale(Math.min(3, scale + 0.25))}
              className="text-white hover:bg-slate-700"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="text-white hover:bg-slate-700"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="text-white hover:bg-slate-700"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-slate-700" />
          <Button
            size="sm"
            onClick={saveAnnotations}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
          <Button
            size="sm"
            onClick={exportAnnotations}
            variant="outline"
            className="text-white border-slate-600 hover:bg-slate-700"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={onClose}
            variant="ghost"
            className="text-white hover:bg-slate-700"
          >
            Close
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 bg-slate-800 p-2 flex flex-col space-y-1">
          {Object.values(ANNOTATION_TOOLS).map(tool => {
            const IconComponent = tool.icon;
            return (
              <Button
                key={tool.id}
                size="sm"
                variant={activeTool === tool.id ? "default" : "ghost"}
                onClick={() => setActiveTool(tool.id)}
                className={`w-full h-12 flex flex-col items-center justify-center text-xs ${
                  activeTool === tool.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
                title={tool.name}
              >
                <IconComponent className="h-5 w-5 mb-1" />
                <span className="text-[10px]">{tool.name}</span>
              </Button>
            );
          })}
          
          <div className="border-t border-slate-700 pt-2 mt-2">
            <p className="text-[10px] text-slate-400 text-center mb-2">Colors</p>
            <div className="grid grid-cols-2 gap-1">
              {COLOR_PALETTE.map(color => (
                <button
                  key={color.value}
                  onClick={() => setActiveColor(color.value)}
                  className={`w-6 h-6 rounded border-2 ${
                    activeColor === color.value ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-2">
            <p className="text-[10px] text-slate-400 text-center mb-1">Opacity</p>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Main Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-slate-600 p-4"
        >
          <div 
            className="relative mx-auto bg-white shadow-2xl"
            style={{ 
              width: pdfDimensions.width * scale,
              height: pdfDimensions.height * scale,
              cursor: ANNOTATION_TOOLS[activeTool]?.cursor || 'default'
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
            
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={null}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            
            {/* Annotation Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0"
              style={{
                width: pdfDimensions.width * scale,
                height: pdfDimensions.height * scale,
                pointerEvents: activeTool === 'select' && !selectedAnnotation ? 'none' : 'auto'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            
            {/* Comment Input Popup */}
            {showCommentInput && commentPosition && (
              <div
                className="absolute bg-white rounded-lg shadow-xl p-3 border"
                style={{
                  left: commentPosition.x * scale,
                  top: commentPosition.y * scale,
                  zIndex: 100
                }}
              >
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter comment..."
                  className="w-48 h-24 border rounded p-2 text-sm resize-none"
                  autoFocus
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCommentInput(false);
                      setCommentText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCommentSubmit}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Panel - Annotations List */}
        <div className="w-64 bg-slate-800 p-3 overflow-y-auto">
          <h3 className="text-white font-semibold mb-3">Annotations ({annotations.filter(a => a.page === currentPage || a.position?.page === currentPage).length})</h3>
          
          <div className="space-y-2">
            {annotations
              .filter(ann => (ann.page === currentPage) || (ann.position?.page === currentPage))
              .map((ann, index) => (
                <div
                  key={ann.annotation_id}
                  className={`p-2 rounded-lg cursor-pointer ${
                    selectedAnnotation?.annotation_id === ann.annotation_id
                      ? 'bg-blue-600'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  onClick={() => setSelectedAnnotation(ann)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: ann.color }}
                      />
                      <span className="text-white text-sm capitalize">{ann.type}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation(ann.annotation_id);
                      }}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {ann.text && (
                    <p className="text-slate-300 text-xs mt-1 truncate">{ann.text}</p>
                  )}
                </div>
              ))}
          </div>
          
          {annotations.filter(a => a.page === currentPage || a.position?.page === currentPage).length === 0 && (
            <p className="text-slate-400 text-sm text-center mt-4">
              No annotations on this page
            </p>
          )}
        </div>
      </div>
      
      {/* Page Navigation */}
      <div className="bg-slate-900 p-3 flex items-center justify-center space-x-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="text-white hover:bg-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-white">
          Page {currentPage} of {numPages || '?'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setCurrentPage(Math.min(numPages || 1, currentPage + 1))}
          disabled={currentPage >= (numPages || 1)}
          className="text-white hover:bg-slate-700"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default VisualAnnotationEditor;
