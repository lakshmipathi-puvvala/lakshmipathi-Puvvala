import React, { useState } from 'react';
import { UserProfile, AdminUserView } from '../types';
import { Database, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: UserProfile, rememberMe: boolean) => void;
  onRegister: (user: AdminUserView, rememberMe: boolean) => void;
  userDatabase: AdminUserView[];
}

type AuthMode = 'signin' | 'signup';

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister, userDatabase }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. SIGN UP LOGIC (Users Only)
    if (authMode === 'signup') {
      if (email && password && firstName && lastName) {
        if (email.toLowerCase() === 'admin@gmail.com') {
          setErrorMsg("This email is reserved. Please sign in.");
          return;
        }

        const existingUser = userDatabase.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
          setErrorMsg("User already exists with this email. Please sign in.");
          return;
        }

        const newUser: AdminUserView = { 
            id: Date.now().toString(),
            name: `${firstName} ${lastName}`, 
            email, 
            role: 'user',
            password: password,
            status: 'active',
            lastLogin: 'Just now',
            profilesProcessed: 0
        };
        
        onRegister(newUser, rememberMe);
      }
    } 
    // 2. SIGN IN LOGIC (User & Admin)
    else {
      if (email && password) {
        const foundUser = userDatabase.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!foundUser) {
            setErrorMsg("Incorrect email. Account not found.");
            return;
        }

        if (foundUser.password !== password) {
            setErrorMsg("Incorrect password. Please try again.");
            return;
        }

        const fName = foundUser.name.split(' ')[0] || 'User';
        const lName = foundUser.name.split(' ').slice(1).join(' ') || '';
        
        const profile: UserProfile = { 
          firstName: fName, 
          lastName: lName, 
          email: foundUser.email, 
          role: foundUser.role 
        };
        
        // App.tsx handles the redirection logic based on role
        onLogin(profile, rememberMe);
      }
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMsg(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in relative overflow-hidden">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
         <div className="flex justify-center">
            <div className="p-3 rounded-xl shadow-lg transition-colors duration-500 bg-blue-600">
              <Database className="w-8 h-8 text-white" />
            </div>
         </div>
         <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
           LinkedinData <span className="text-blue-600">Formatter</span>
         </h2>
         <p className="mt-2 text-center text-sm text-slate-600">
           {authMode === 'signin' ? 'Sign in to access your dashboard' : 'Create a new account'}
         </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl border sm:rounded-xl sm:px-10 transition-all duration-300 border-slate-100 shadow-slate-200/50">
          <form className="space-y-6" onSubmit={handleAuthSubmit}>
            
            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-slate-900"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-slate-900"
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5 border bg-white text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showAuthPassword ? "text" : "password"}
                  autoComplete={authMode === 'signup' ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 sm:text-sm border-slate-300 rounded-lg p-2.5 border bg-white text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowAuthPassword(!showAuthPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showAuthPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 border-slate-300 rounded cursor-pointer text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 cursor-pointer">
                  Remember me
                </label>
              </div>
            </div>

            {/* Error Message for Login */}
            {errorMsg && (
              <div className="rounded-md bg-red-50 p-4 animate-fade-in border border-red-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Authentication Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{errorMsg}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              >
                {authMode === 'signin' ? 'Sign in' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 justify-center items-center">
                 <button
                   type="button"
                   onClick={() => switchMode(authMode === 'signin' ? 'signup' : 'signin')}
                   className="text-blue-600 hover:text-blue-500 font-medium text-sm flex items-center gap-1"
                 >
                   {authMode === 'signin' ? 'Create a new account' : 'Sign in to existing account'}
                 </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};