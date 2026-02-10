import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { 
  History, 
  Download, 
  RotateCcw, 
  Trash2, 
  GitCompare,
  Clock,
  User,
  FileText,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  HardDrive
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VersionHistory = ({ fileId, fileName, onVersionChange }) => {
  const { toast } = useToast();
  
  const [versions, setVersions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [compareVersions, setCompareVersions] = useState({ v1: null, v2: null });
  const [changeDescription, setChangeDescription] = useState('');

  useEffect(() => {
    if (fileId) {
      loadVersionHistory();
    }
  }, [fileId]);

  const loadVersionHistory = async () => {
    setIsLoading(true);
    try {
      const [historyRes, statsRes] = await Promise.all([
        axios.get(`${API}/versions/${fileId}`).catch(() => ({ data: { versions: [] } })),
        axios.get(`${API}/versions/stats/${fileId}`).catch(() => ({ data: null }))
      ]);
      
      setVersions(historyRes.data.versions || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading version history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createVersion = async () => {
    if (!changeDescription.trim()) {
      toast({ title: "Error", description: "Please enter a description for this version", variant: "destructive" });
      return;
    }
    
    setIsCreating(true);
    try {
      const response = await axios.post(`${API}/versions/create`, {
        file_id: fileId,
        change_description: changeDescription,
        created_by: "User"
      });
      
      if (response.data.message?.includes("No changes detected")) {
        toast({ title: "Info", description: response.data.message });
      } else {
        toast({ title: "Success", description: `Version ${response.data.version_number} created` });
        setChangeDescription('');
        loadVersionHistory();
        
        if (onVersionChange) {
          onVersionChange(response.data);
        }
      }
    } catch (error) {
      console.error('Create version error:', error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.detail || "Failed to create version", 
        variant: "destructive" 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const revertToVersion = async (versionId, versionNumber) => {
    if (!window.confirm(`Are you sure you want to revert to version ${versionNumber}? A backup of the current state will be created.`)) {
      return;
    }
    
    setIsReverting(true);
    try {
      const response = await axios.post(`${API}/versions/revert`, {
        file_id: fileId,
        version_id: versionId,
        created_by: "User"
      });
      
      toast({ 
        title: "Success", 
        description: response.data.message 
      });
      
      loadVersionHistory();
      
      if (onVersionChange) {
        onVersionChange(response.data);
      }
    } catch (error) {
      console.error('Revert error:', error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.detail || "Failed to revert", 
        variant: "destructive" 
      });
    } finally {
      setIsReverting(false);
    }
  };

  const deleteVersion = async (versionId, versionNumber) => {
    if (!window.confirm(`Are you sure you want to delete version ${versionNumber}? This cannot be undone.`)) {
      return;
    }
    
    try {
      await axios.delete(`${API}/versions/${fileId}/${versionId}`);
      toast({ title: "Success", description: `Version ${versionNumber} deleted` });
      loadVersionHistory();
    } catch (error) {
      console.error('Delete version error:', error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.detail || "Failed to delete version", 
        variant: "destructive" 
      });
    }
  };

  const downloadVersion = (versionId) => {
    window.open(`${API}/versions/download/${fileId}/${versionId}`, '_blank');
  };

  const compareSelectedVersions = async () => {
    if (!compareVersions.v1 || !compareVersions.v2) {
      toast({ title: "Error", description: "Please select two versions to compare", variant: "destructive" });
      return;
    }
    
    try {
      const response = await axios.post(`${API}/versions/compare`, {
        file_id: fileId,
        version_id_1: compareVersions.v1,
        version_id_2: compareVersions.v2
      });
      
      // Show comparison results
      const result = response.data;
      const message = result.files_identical 
        ? "The files are identical"
        : `Size difference: ${result.size_difference > 0 ? '+' : ''}${result.size_difference} bytes`;
      
      toast({ title: "Comparison Result", description: message });
    } catch (error) {
      console.error('Compare error:', error);
      toast({ title: "Error", description: "Failed to compare versions", variant: "destructive" });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600">Loading version history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-white">
          <History className="h-5 w-5 mr-2" />
          Version History
          <span className="ml-2 px-2 py-1 text-xs bg-white text-amber-600 rounded-full">NEW</span>
        </CardTitle>
        <CardDescription className="text-amber-100">
          Track changes, view history, and revert to previous versions
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {/* File Info */}
        <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg mb-6">
          <FileText className="h-8 w-8 text-amber-500" />
          <div className="flex-1">
            <p className="font-medium text-slate-900">{fileName}</p>
            <p className="text-sm text-slate-500">
              {stats?.total_versions || 0} versions • {stats?.total_storage_mb || 0} MB total
            </p>
          </div>
          {stats?.current_version > 0 && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              v{stats.current_version}
            </span>
          )}
        </div>

        {/* Create Version */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Create New Version
          </h4>
          <div className="flex space-x-3">
            <input
              type="text"
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              placeholder="Describe changes (e.g., 'Updated clause 5')"
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              onClick={createVersion}
              disabled={isCreating || !changeDescription.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Save Version
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Compare Mode Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-semibold text-slate-800">Version Timeline</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompare(!showCompare)}
            className={showCompare ? 'bg-purple-100 border-purple-300' : ''}
          >
            <GitCompare className="h-4 w-4 mr-1" />
            {showCompare ? 'Exit Compare' : 'Compare Versions'}
          </Button>
        </div>

        {/* Compare Selection */}
        {showCompare && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 mb-3">Select two versions to compare:</p>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <select
                  value={compareVersions.v1 || ''}
                  onChange={(e) => setCompareVersions(prev => ({ ...prev, v1: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select first version</option>
                  {versions.map(v => (
                    <option key={v.version_id} value={v.version_id}>
                      v{v.version_number} - {v.change_description}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-purple-600 font-medium">vs</span>
              <div className="flex-1">
                <select
                  value={compareVersions.v2 || ''}
                  onChange={(e) => setCompareVersions(prev => ({ ...prev, v2: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select second version</option>
                  {versions.map(v => (
                    <option key={v.version_id} value={v.version_id}>
                      v{v.version_number} - {v.change_description}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={compareSelectedVersions} className="bg-purple-600 hover:bg-purple-700">
                Compare
              </Button>
            </div>
          </div>
        )}

        {/* Version List */}
        {versions.length > 0 ? (
          <div className="space-y-3">
            {versions.slice().reverse().map((version, index) => (
              <div 
                key={version.version_id}
                className={`border rounded-lg overflow-hidden transition-all ${
                  version.is_current 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedVersion(expandedVersion === version.version_id ? null : version.version_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        version.is_current ? 'bg-green-500' : 'bg-slate-400'
                      } text-white font-bold`}>
                        v{version.version_number}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 flex items-center">
                          {version.change_description}
                          {version.is_current && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
                              Current
                            </span>
                          )}
                          {version.reverted_from && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                              Reverted
                            </span>
                          )}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(version.created_at)}
                          </span>
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {version.created_by}
                          </span>
                          <span className="flex items-center">
                            <HardDrive className="h-3 w-3 mr-1" />
                            {formatFileSize(version.file_size)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {expandedVersion === version.version_id ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Actions */}
                {expandedVersion === version.version_id && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 bg-slate-50">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadVersion(version.version_id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      
                      {!version.is_current && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => revertToVersion(version.version_id, version.version_number)}
                            disabled={isReverting}
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            {isReverting ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <RotateCcw className="h-4 w-4 mr-1" />
                            )}
                            Revert to This
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => deleteVersion(version.version_id, version.version_number)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-3 text-xs text-slate-500">
                      <p>Hash: {version.file_hash}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <History className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">No Version History</p>
            <p className="text-sm mt-1">Create your first version to start tracking changes</p>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <h4 className="font-medium text-amber-800 mb-2">About Version History</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Create versions to save snapshots of your document</li>
            <li>• Revert to any previous version if needed</li>
            <li>• Compare versions to see what changed</li>
            <li>• A backup is automatically created before reverting</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VersionHistory;
