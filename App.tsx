import React, { useState, useEffect } from 'react';
import { LoadingState, WebhookResponse, SimplifiedProfile, UserProfile, AdminUserView } from './types';
import { ResponseView } from './components/ResponseView';
import { AdminView } from './components/AdminView';
import { AuthView } from './components/AuthView';
import { simplifyWebhookData } from './services/geminiService';
import { Link2, Send, Database, KeyRound, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, User as UserIcon, LayoutDashboard, ShieldCheck, LogOut } from 'lucide-react';

// Default Webhook URL (Internal/Backend)
const DEFAULT_WEBHOOK_URL = 'https://n8n.srv898896.hstgr.cloud/webhook-test/6985e04a-cf39-4fd0-8248-92064764a230';

// Default filters to send to backend
const DEFAULT_FILTERS = [
  "name",
  "linkedinurl",
  "comments",
  "current title",
  "current company",
  "personal loaction",
  "current company linkedin url",
  "follower count",
  "connection count",
  "company Name",
  "Website Url",
  "Industry",
  "Employee count",
  "Follower count",
  "Universal Name",
  "Description",
  "Company Country"
];

// Initial Seed Data (if local storage is empty)
const INITIAL_USERS: AdminUserView[] = [
  { id: '1', name: 'System Administrator', email: 'Admin@gmail.com', role: 'admin', status: 'offline', lastLogin: 'Never', profilesProcessed: 1450, password: 'Admin2025@!' },
  { id: '2', name: 'Sarah Connor', email: 'sarah.c@skynet.net', role: 'user', status: 'offline', lastLogin: '2 mins ago', profilesProcessed: 124, password: 'password123' },
];

export default function App() {
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<AdminUserView[]>([]);
  
  // View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard');

  // App State
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [serviceApiKey, setServiceApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [webhookResponse, setWebhookResponse] = useState<WebhookResponse | null>(null);
  const [aiSummary, setAiSummary] = useState<SimplifiedProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usingProxy, setUsingProxy] = useState(false);

  // Initialize Data on Mount
  useEffect(() => {
    // 1. Load User Session
    const savedUserJSON = localStorage.getItem('linkindata_user');
    if (savedUserJSON) {
      try {
        const savedUser = JSON.parse(savedUserJSON);
        setUser(savedUser);
      } catch (e) {
        localStorage.removeItem('linkindata_user');
      }
    }

    // 2. Load User Database (for Admin & Login checks)
    const savedDbJSON = localStorage.getItem('linkindata_db');
    if (savedDbJSON) {
      try {
        setAllUsers(JSON.parse(savedDbJSON));
      } catch (e) {
        setAllUsers(INITIAL_USERS);
        localStorage.setItem('linkindata_db', JSON.stringify(INITIAL_USERS));
      }
    } else {
      setAllUsers(INITIAL_USERS);
      localStorage.setItem('linkindata_db', JSON.stringify(INITIAL_USERS));
    }
  }, []);

  const handleLogin = (loggedInUser: UserProfile, rememberMe: boolean) => {
    setUser(loggedInUser);
    setCurrentView('dashboard');
    
    // Update status in DB to active using functional update to ensure latest state
    setAllUsers(prevUsers => {
      const updatedUsers = prevUsers.map(u => 
        u.email === loggedInUser.email 
          ? { ...u, status: 'active' as const, lastLogin: 'Just now' } 
          : u
      );
      localStorage.setItem('linkindata_db', JSON.stringify(updatedUsers));
      return updatedUsers;
    });

    if (rememberMe) {
      localStorage.setItem('linkindata_user', JSON.stringify(loggedInUser));
    } else {
      localStorage.removeItem('linkindata_user');
    }
  };

  const handleRegister = (newUser: AdminUserView, rememberMe: boolean) => {
    // prepare the user object with 'active' status immediately
    const userWithActiveStatus: AdminUserView = {
        ...newUser,
        status: 'active',
        lastLogin: 'Just now'
    };

    // Update DB (State + LocalStorage)
    // We strictly add the new user here.
    const updatedUsers = [...allUsers, userWithActiveStatus];
    setAllUsers(updatedUsers);
    localStorage.setItem('linkindata_db', JSON.stringify(updatedUsers));

    // Create session profile
    const userProfile: UserProfile = {
      firstName: newUser.name.split(' ')[0],
      lastName: newUser.name.split(' ').slice(1).join(' '),
      email: newUser.email,
      role: newUser.role
    };

    // Set Session directly (Bypassing handleLogin to avoid race condition with state updates)
    setUser(userProfile);
    setCurrentView('dashboard');

    if (rememberMe) {
      localStorage.setItem('linkindata_user', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('linkindata_user');
    }
  };

  const handleLogout = () => {
    if (user) {
      // Set status to offline
      setAllUsers(prevUsers => {
        const updatedUsers = prevUsers.map(u => 
          u.email === user.email 
            ? { ...u, status: 'offline' as const } 
            : u
        );
        localStorage.setItem('linkindata_db', JSON.stringify(updatedUsers));
        return updatedUsers;
      });
    }

    setUser(null);
    setWebhookResponse(null);
    setAiSummary(null);
    setLinkedinUrl('');
    localStorage.removeItem('linkindata_user');
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl) {
      setErrorMsg("Please provide the LinkedIn URL.");
      return;
    }
    
    const cleanWebhookUrl = DEFAULT_WEBHOOK_URL.trim();

    setErrorMsg(null);
    setLoadingState(LoadingState.SENDING_WEBHOOK);
    setWebhookResponse(null);
    setAiSummary(null);
    setUsingProxy(false);

    // Update usage stats for current user
    if (user) {
        setAllUsers(prevUsers => {
          const updatedUsers = prevUsers.map(u => 
              u.email === user.email 
                ? { ...u, profilesProcessed: u.profilesProcessed + 1 } 
                : u
          );
          localStorage.setItem('linkindata_db', JSON.stringify(updatedUsers));
          return updatedUsers;
        });
    }

    try {
      const payload = {
        linkedin_url: linkedinUrl,
        api_key: serviceApiKey,
        filters: DEFAULT_FILTERS
      };

      console.log(`Sending to webhook: ${cleanWebhookUrl}`, payload);

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      };

      let response: Response;

      try {
        response = await fetch(cleanWebhookUrl, fetchOptions);
      } catch (networkErr) {
        console.warn('Direct fetch failed, retrying with proxy...', networkErr);
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(cleanWebhookUrl)}`;
        setUsingProxy(true);
        response = await fetch(proxyUrl, fetchOptions);
      }

      const data = await response.json().catch(() => ({ message: "Non-JSON response received", rawText: response.statusText }));
      
      const responseData: WebhookResponse = {
        ok: response.ok,
        status: response.status,
        raw: data
      };

      setWebhookResponse(responseData);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Webhook endpoint not found (404).");
        }
        throw new Error(`Webhook failed with status: ${response.status}`);
      }

      setLoadingState(LoadingState.PROCESSING_AI);
      const simplified = await simplifyWebhookData(data);
      setAiSummary(simplified);
      
      setLoadingState(LoadingState.COMPLETE);

    } catch (err) {
      console.error(err);
      setLoadingState(LoadingState.ERROR);
      setUsingProxy(false);
      
      let message = err instanceof Error ? err.message : "An unexpected error occurred.";
      if (message === 'Failed to fetch' || message.toLowerCase().includes('network')) {
         if (cleanWebhookUrl.includes('webhook-test')) {
             message = "Network Error: Could not connect to n8n. 'webhook-test' URLs require the workflow to be actively executing in the n8n editor.";
         } else {
             message = "Network Error: The server could not be reached. Check CORS or server status.";
         }
      }
      setErrorMsg(message);
    }
  };

  // Login/Signup Screen
  if (!user) {
    return (
        <AuthView 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
            userDatabase={allUsers} 
        />
    );
  }

  // Main App Screen
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
               <Database className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">LinkedinData <span className="text-blue-600">Formatter</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Admin Portal Toggle */}
            {user.role === 'admin' && (
              <button 
                onClick={() => setCurrentView(currentView === 'dashboard' ? 'admin' : 'dashboard')}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                  currentView === 'admin' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Switch View"
              >
                {currentView === 'dashboard' ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin Portal</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </>
                )}
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-md"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {currentView === 'admin' && user.role === 'admin' ? (
          <AdminView users={allUsers} />
        ) : (
          /* Adjusted grid to gives more space to the table (col-span-3 vs col-span-9) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
            
            {/* Left Column: Configuration (Narrower) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[calc(100vh-10rem)]">
                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Configuration</h2>
                  <p className="text-xs text-slate-500 mb-5">Configure your data source.</p>
                  
                  <form onSubmit={handleProcess} className="space-y-4">
                    
                    {/* LinkedIn URL Input */}
                    <div>
                      <label htmlFor="linkedin" className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                        LinkedIn Post URL
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Link2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="url"
                          id="linkedin"
                          required
                          placeholder="https://linkedin.com/posts/..."
                          className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Apify API Key Input */}
                    <div>
                      <label htmlFor="apikey" className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Apify API Key
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <KeyRound className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type={showApiKey ? "text" : "password"}
                          id="apikey"
                          placeholder="Enter your Apify API key..."
                          className="block w-full pl-9 pr-9 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          value={serviceApiKey}
                          onChange={(e) => setServiceApiKey(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loadingState === LoadingState.SENDING_WEBHOOK || loadingState === LoadingState.PROCESSING_AI}
                      className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all mt-2"
                    >
                      {loadingState === LoadingState.SENDING_WEBHOOK || loadingState === LoadingState.PROCESSING_AI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send and Process
                        </>
                      )}
                    </button>
                  </form>

                  {/* Status Messages */}
                  {errorMsg && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Error</p>
                        <p>{errorMsg}</p>
                      </div>
                    </div>
                  )}
                  
                  {loadingState === LoadingState.SENDING_WEBHOOK && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs flex items-center gap-2 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {usingProxy ? 'Retrying via proxy...' : 'Sending to webhook...'}
                    </div>
                  )}
                  
                  {loadingState === LoadingState.PROCESSING_AI && (
                    <div className="mt-4">
                       <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>Sent successfully</span>
                       </div>
                    </div>
                  )}
                </div>

                {/* User Profile Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2.5 rounded-full shrink-0 relative">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                        {user.role === 'admin' && (
                          <div className="absolute -top-1 -right-1 bg-purple-600 rounded-full p-0.5 border border-white" title="Admin">
                             <ShieldCheck className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.email}
                        </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">
                      Powered by <span className="text-blue-600 font-semibold">magicteams.ai</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Results (Wider) */}
            <div className="lg:col-span-9 h-full">
              <ResponseView webhookData={webhookResponse} aiSummary={aiSummary} loadingState={loadingState} />
            </div>

          </div>
        )}
      </main>
    </div>
  );
}