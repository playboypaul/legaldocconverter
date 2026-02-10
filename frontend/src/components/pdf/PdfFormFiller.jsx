import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Save,
  Edit,
  Lock,
  Unlock
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PdfFormFiller = ({ fileId, fileName, onComplete }) => {
  const { toast } = useToast();
  
  const [formFields, setFormFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [hasForm, setHasForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilling, setIsFilling] = useState(false);
  const [isFlattening, setIsFlattening] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (fileId) {
      loadFormFields();
    }
  }, [fileId]);

  const loadFormFields = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/pdf/form-fields/${fileId}`);
      
      setHasForm(response.data.has_forms);
      setFormFields(response.data.fields || []);
      
      // Initialize field values
      const initialValues = {};
      (response.data.fields || []).forEach(field => {
        initialValues[field.name] = field.value || '';
      });
      setFieldValues(initialValues);
      
      if (!response.data.has_forms) {
        toast({
          title: "No Form Fields",
          description: response.data.message || "This PDF doesn't contain fillable form fields.",
        });
      }
    } catch (error) {
      console.error('Error loading form fields:', error);
      toast({
        title: "Error",
        description: "Failed to detect form fields in this PDF",
        variant: "destructive"
      });
      setHasForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const fillForm = async () => {
    setIsFilling(true);
    try {
      const response = await axios.post(`${API}/pdf/fill-form`, {
        file_id: fileId,
        fields: fieldValues
      });
      
      setResult(response.data);
      toast({
        title: "Success",
        description: `Form filled successfully. ${response.data.fields_filled} fields updated.`
      });
      
      if (onComplete) {
        onComplete(response.data);
      }
    } catch (error) {
      console.error('Error filling form:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to fill form",
        variant: "destructive"
      });
    } finally {
      setIsFilling(false);
    }
  };

  const flattenForm = async () => {
    setIsFlattening(true);
    try {
      const response = await axios.post(`${API}/pdf/flatten-form`, {
        file_id: fileId
      });
      
      toast({
        title: "Success",
        description: "Form flattened successfully. Fields are now non-editable."
      });
      
      // Trigger download
      window.open(`${API}${response.data.download_url}`, '_blank');
    } catch (error) {
      console.error('Error flattening form:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to flatten form",
        variant: "destructive"
      });
    } finally {
      setIsFlattening(false);
    }
  };

  const renderFieldInput = (field) => {
    const value = fieldValues[field.name] || '';
    
    switch (field.type) {
      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === 'Yes' || value === true}
              onChange={(e) => handleFieldChange(field.name, e.target.checked ? 'Yes' : 'Off')}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Check if applicable</span>
          </label>
        );
        
      case 'radio':
        return (
          <div className="space-y-2">
            {(field.options || ['Option 1', 'Option 2']).map((option, idx) => (
              <label key={idx} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
        
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            {(field.options || []).map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );
        
      case 'signature':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
            <p className="text-sm text-gray-500">Signature field</p>
            <p className="text-xs text-gray-400 mt-1">Use the eSign tool for signatures</p>
          </div>
        );
        
      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600">Detecting form fields...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasForm) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Fillable Form Fields</h3>
            <p className="text-slate-600 mb-4">
              This PDF doesn't contain any fillable form fields.
            </p>
            <p className="text-sm text-slate-500 max-w-md">
              Fillable PDFs are created with special form fields. If you need to add 
              text or annotations, try using the Annotation tool instead.
            </p>
            <Button
              variant="outline"
              onClick={loadFormFields}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Detection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-white">
          <Edit className="h-5 w-5 mr-2" />
          PDF Form Filler
        </CardTitle>
        <CardDescription className="text-teal-100">
          Fill out the form fields below and save the completed PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {/* File Info */}
        <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg mb-6">
          <FileText className="h-8 w-8 text-teal-500" />
          <div>
            <p className="font-medium text-slate-900">{fileName}</p>
            <p className="text-sm text-slate-500">{formFields.length} fillable fields detected</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {formFields.map((field, index) => (
            <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <span className={`text-xs px-2 py-1 rounded ${
                  field.type === 'text' ? 'bg-blue-100 text-blue-700' :
                  field.type === 'checkbox' ? 'bg-green-100 text-green-700' :
                  field.type === 'dropdown' ? 'bg-purple-100 text-purple-700' :
                  field.type === 'signature' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {field.type}
                </span>
              </div>
              {renderFieldInput(field)}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t">
          <Button
            onClick={fillForm}
            disabled={isFilling}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
          >
            {isFilling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Filling Form...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Fill & Save PDF
              </>
            )}
          </Button>

          <Button
            onClick={flattenForm}
            disabled={isFlattening}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {isFlattening ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Flattening...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Flatten Form (Make Non-Editable)
              </>
            )}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-800">Form Filled Successfully</h4>
                <p className="text-sm text-green-700 mt-1">
                  {result.fields_filled} fields have been filled.
                </p>
                <Button
                  size="sm"
                  className="mt-3 bg-green-600 hover:bg-green-700"
                  onClick={() => window.open(`${API}${result.download_url}`, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Filled PDF
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Tips for Form Filling</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Required fields are marked with a red asterisk (*)</li>
            <li>• Click "Fill & Save PDF" to create a new PDF with your entries</li>
            <li>• Use "Flatten Form" to make fields permanent and non-editable</li>
            <li>• For digital signatures, use the dedicated eSign tool</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PdfFormFiller;
