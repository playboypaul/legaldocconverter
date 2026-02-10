import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { 
  User, 
  FileText, 
  BarChart3, 
  Settings, 
  CreditCard,
  Download,
  Trash2,
  Clock,
  Upload,
  Brain,
  Crown,
  ChevronRight,
  Loader2,
  Calendar,
  TrendingUp,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header';
import Footer from '../Footer';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulated user ID (in production, this would come from auth)
  const userId = user?.id || 1;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load all dashboard data in parallel
      const [statsRes, historyRes, subscriptionRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats/${userId}`).catch(() => ({ data: null })),
        axios.get(`${API}/dashboard/history/${userId}?limit=10`).catch(() => ({ data: { history: [] } })),
        axios.get(`${API}/dashboard/subscription/${userId}`).catch(() => ({ data: null }))
      ]);
      
      setStats(statsRes.data || getDefaultStats());
      setHistory(historyRes.data?.history || []);
      setSubscription(subscriptionRes.data || getDefaultSubscription());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Use default data on error
      setStats(getDefaultStats());
      setSubscription(getDefaultSubscription());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultStats = () => ({
    total_uploads: 0,
    total_conversions: 0,
    total_analyses: 0,
    storage_used_mb: 0,
    subscription_tier: 'free',
    subscription_status: 'active',
    member_since: new Date().toISOString()
  });

  const getDefaultSubscription = () => ({
    tier: 'free',
    status: 'active',
    price: '$0/month',
    features: [
      '5 document uploads per day',
      'Basic format conversion',
      '1 AI analysis per day',
      'Community support'
    ],
    limits: {
      uploads_per_day: 5,
      analyses_per_day: 1,
      max_file_size_mb: 10
    }
  });

  const deleteFile = async (fileId) => {
    try {
      await axios.delete(`${API}/dashboard/file/${fileId}?user_id=${userId}`);
      toast({ title: "Success", description: "File deleted successfully" });
      loadDashboardData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete file", variant: "destructive" });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'subscription', name: 'Subscription', icon: CreditCard },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-1">
                Welcome back, {user?.email || 'User'}
              </p>
            </div>
            <Button
              onClick={loadDashboardData}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    {tabs.map(tab => {
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <IconComponent className="h-5 w-5 mr-3" />
                          {tab.name}
                          {activeTab === tab.id && (
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card className="border-0 shadow-lg mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Crown className={`h-5 w-5 ${
                      subscription?.tier === 'professional' ? 'text-yellow-500' : 'text-slate-400'
                    }`} />
                    <span className="font-semibold text-slate-900 capitalize">
                      {subscription?.tier || 'Free'}
                    </span>
                  </div>
                  {subscription?.tier === 'free' && (
                    <Button className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600">
                      Upgrade to Pro
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-100 text-sm">Total Uploads</p>
                                <p className="text-3xl font-bold mt-1">{stats?.total_uploads || 0}</p>
                              </div>
                              <Upload className="h-10 w-10 text-blue-200" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-green-100 text-sm">Conversions</p>
                                <p className="text-3xl font-bold mt-1">{stats?.total_conversions || 0}</p>
                              </div>
                              <FileText className="h-10 w-10 text-green-200" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-purple-100 text-sm">AI Analyses</p>
                                <p className="text-3xl font-bold mt-1">{stats?.total_analyses || 0}</p>
                              </div>
                              <Brain className="h-10 w-10 text-purple-200" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-orange-100 text-sm">Storage Used</p>
                                <p className="text-3xl font-bold mt-1">{stats?.storage_used_mb?.toFixed(1) || 0} MB</p>
                              </div>
                              <HardDrive className="h-10 w-10 text-orange-200" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Recent Activity */}
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-blue-600" />
                            Recent Activity
                          </CardTitle>
                          <CardDescription>Your latest document processing activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {history.length > 0 ? (
                            <div className="space-y-4">
                              {history.slice(0, 5).map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                  <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-lg ${
                                      item.action === 'upload' ? 'bg-blue-100' :
                                      item.action === 'convert' ? 'bg-green-100' : 'bg-purple-100'
                                    }`}>
                                      {item.action === 'upload' ? (
                                        <Upload className="h-5 w-5 text-blue-600" />
                                      ) : item.action === 'convert' ? (
                                        <FileText className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <Brain className="h-5 w-5 text-purple-600" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-900">{item.filename}</p>
                                      <p className="text-sm text-slate-500">
                                        {formatFileSize(item.file_size)} • {formatDate(item.timestamp)}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                    item.action === 'upload' ? 'bg-blue-100 text-blue-700' :
                                    item.action === 'convert' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {item.action}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-slate-500">
                              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                              <p>No recent activity</p>
                              <p className="text-sm">Start by uploading a document</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Member Info */}
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                <User className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{user?.email || 'User'}</p>
                                <p className="text-sm text-slate-500">
                                  Member since {formatDate(stats?.member_since)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Account Status</p>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                Active
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Documents Tab */}
                  {activeTab === 'documents' && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle>Document History</CardTitle>
                        <CardDescription>All your processed documents</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {history.length > 0 ? (
                          <div className="space-y-3">
                            {history.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                  <div className="p-2 rounded-lg bg-slate-100">
                                    <FileText className="h-5 w-5 text-slate-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">{item.filename}</p>
                                    <div className="flex items-center space-x-3 text-sm text-slate-500">
                                      <span>{item.file_type?.toUpperCase()}</span>
                                      <span>•</span>
                                      <span>{formatFileSize(item.file_size)}</span>
                                      <span>•</span>
                                      <span>{formatDate(item.timestamp)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(`${API}/download/${item.file_id}`, '_blank')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => deleteFile(item.file_id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-slate-500">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-lg font-medium">No documents yet</p>
                            <p className="text-sm">Upload your first document to get started</p>
                            <Button className="mt-4" onClick={() => window.location.href = '/#processor'}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Document
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Subscription Tab */}
                  {activeTab === 'subscription' && (
                    <div className="space-y-6">
                      {/* Current Plan */}
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle>Current Subscription</CardTitle>
                          <CardDescription>Manage your plan and billing</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Crown className={`h-6 w-6 ${
                                  subscription?.tier === 'professional' ? 'text-yellow-500' : 'text-slate-400'
                                }`} />
                                <h3 className="text-2xl font-bold text-slate-900 capitalize">
                                  {subscription?.tier || 'Free'} Plan
                                </h3>
                              </div>
                              <p className="text-slate-600 mt-1">{subscription?.price || '$0/month'}</p>
                            </div>
                            <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
                              {subscription?.status || 'Active'}
                            </span>
                          </div>

                          <div className="mt-6">
                            <h4 className="font-semibold text-slate-900 mb-3">Plan Features</h4>
                            <ul className="space-y-2">
                              {(subscription?.features || []).map((feature, index) => (
                                <li key={index} className="flex items-center text-slate-600">
                                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 text-xs">✓</span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {subscription?.tier === 'free' && (
                            <div className="mt-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
                              <h4 className="font-semibold mb-2">Upgrade to Professional</h4>
                              <p className="text-blue-100 text-sm mb-4">
                                Unlock unlimited uploads, AI analysis, and advanced PDF tools
                              </p>
                              <Button className="bg-white text-blue-600 hover:bg-blue-50">
                                Upgrade Now - $29/month
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Usage Limits */}
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle>Usage This Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">Uploads</span>
                                <span className="font-medium">
                                  {stats?.total_uploads || 0} / {subscription?.limits?.uploads_per_day === -1 ? '∞' : (subscription?.limits?.uploads_per_day || 5) * 30}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, ((stats?.total_uploads || 0) / ((subscription?.limits?.uploads_per_day || 5) * 30)) * 100)}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">AI Analyses</span>
                                <span className="font-medium">
                                  {stats?.total_analyses || 0} / {subscription?.limits?.analyses_per_day === -1 ? '∞' : (subscription?.limits?.analyses_per_day || 1) * 30}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, ((stats?.total_analyses || 0) / ((subscription?.limits?.analyses_per_day || 1) * 30)) * 100)}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">Storage</span>
                                <span className="font-medium">
                                  {stats?.storage_used_mb?.toFixed(1) || 0} MB / {subscription?.limits?.max_file_size_mb || 10} MB max per file
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, ((stats?.storage_used_mb || 0) / 100) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                        <CardDescription>Manage your account preferences</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={user?.email || ''}
                              disabled
                              className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-slate-600"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              placeholder="Enter your full name"
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="border-t pt-6">
                            <h4 className="font-semibold text-slate-900 mb-4">Notification Preferences</h4>
                            <div className="space-y-3">
                              <label className="flex items-center">
                                <input type="checkbox" defaultChecked className="rounded text-blue-600 mr-3" />
                                <span className="text-slate-700">Email notifications for completed conversions</span>
                              </label>
                              <label className="flex items-center">
                                <input type="checkbox" defaultChecked className="rounded text-blue-600 mr-3" />
                                <span className="text-slate-700">Weekly usage summary</span>
                              </label>
                              <label className="flex items-center">
                                <input type="checkbox" className="rounded text-blue-600 mr-3" />
                                <span className="text-slate-700">Product updates and news</span>
                              </label>
                            </div>
                          </div>

                          <div className="border-t pt-6">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              Save Changes
                            </Button>
                          </div>

                          <div className="border-t pt-6">
                            <h4 className="font-semibold text-red-600 mb-2">Danger Zone</h4>
                            <p className="text-sm text-slate-600 mb-4">
                              Once you delete your account, there is no going back.
                            </p>
                            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DashboardPage;
