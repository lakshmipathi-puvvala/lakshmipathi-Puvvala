import React, { useState } from 'react';
import { SimplifiedProfile, WebhookResponse } from '../types';
import { Bot, User, FileText, Table as TableIcon, ExternalLink, LayoutGrid } from 'lucide-react';

interface ResponseViewProps {
  webhookData: WebhookResponse | null;
  aiSummary: SimplifiedProfile | null;
}

export const ResponseView: React.FC<ResponseViewProps> = ({ webhookData, aiSummary }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'table'>('profile'); // Default to profile view

  if (!webhookData && !aiSummary) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <Bot className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Ready to Display Data</p>
        <p className="text-sm text-center max-w-xs mt-2">Enter the LinkedIn URL and your Apify API Key on the left to fetch and format your data.</p>
      </div>
    );
  }

  // Determine if table data is available
  const hasTableData = aiSummary?.tableHeaders && aiSummary.tableHeaders.length > 0 && aiSummary?.tableRows && aiSummary.tableRows.length > 0;

  // Helper to render cell content with links
  const renderCellContent = (content: string) => {
    if (!content) return <span className="text-slate-300">-</span>;
    
    // Check if content looks like a URL
    if (typeof content === 'string' && (content.startsWith('http://') || content.startsWith('https://'))) {
      return (
        <a 
          href={content} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 group"
          title={content}
        >
          <span className="truncate max-w-[150px] inline-block font-medium">Open Link</span>
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      );
    }
    return content;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col animate-fade-in">
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Profile View
        </button>
        
        {hasTableData && (
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'table'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            Data Table
          </button>
        )}
      </div>

      <div className="p-0 overflow-hidden flex-1 relative flex flex-col">
        {activeTab === 'profile' && aiSummary ? (
          <div className="p-6 overflow-auto h-full custom-scrollbar">
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Header Section */}
              {aiSummary.name && (
                <div className="flex items-start gap-5 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 rounded-xl border border-blue-100 shadow-sm">
                    <div className="bg-white p-3 rounded-full text-blue-600 shadow-md border border-blue-50">
                      <User className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-900">{aiSummary.name}</h2>
                      {aiSummary.headline && <p className="text-blue-700 font-medium text-lg mt-1">{aiSummary.headline}</p>}
                      {aiSummary.summary && <p className="text-slate-600 mt-3 leading-relaxed max-w-3xl">{aiSummary.summary}</p>}
                    </div>
                </div>
              )}

              {/* Skills / Tags Section */}
              {aiSummary.keySkills && aiSummary.keySkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {aiSummary.keySkills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-full text-xs font-semibold shadow-sm uppercase tracking-wide">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Detailed Grid View */}
              {hasTableData && aiSummary.tableRows && aiSummary.tableRows.length > 0 && (
                 <div className="animate-fade-in-up">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Detailed Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* We iterate over the first row for the profile view */}
                      {aiSummary.tableHeaders?.map((header, idx) => {
                         const value = aiSummary.tableRows![0][idx];
                         // Skip empty values if desired, or show them.
                         if (!value || value === '-') return null; 
                         if (header.toLowerCase() === 'name') return null; // Name is already in header

                         return (
                           <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group duration-200">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 group-hover:text-blue-600 transition-colors">
                                {header}
                              </label>
                              <div className="text-sm font-medium text-slate-900 break-words">
                                {renderCellContent(value)}
                              </div>
                           </div>
                         );
                      })}
                    </div>
                    {aiSummary.tableRows.length > 1 && (
                      <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200 flex items-center gap-3">
                        <TableIcon className="w-5 h-5 opacity-70" />
                        <span>
                          <strong>Multiple profiles detected ({aiSummary.tableRows.length}).</strong> 
                          <button onClick={() => setActiveTab('table')} className="ml-1 underline hover:text-yellow-900 font-semibold">
                            Switch to Data Table view
                          </button> 
                          to see all of them.
                        </span>
                      </div>
                    )}
                 </div>
              )}
            </div>
          </div>
        ) : activeTab === 'table' && aiSummary && hasTableData ? (
          <div className="flex-1 overflow-auto w-full">
            <table className="min-w-full divide-y divide-slate-200 border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-4 bg-slate-50 border-b border-slate-200 w-12 text-center text-xs font-semibold text-slate-500">#</th>
                  {aiSummary.tableHeaders?.map((header, idx) => (
                    <th key={idx} scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-slate-50 border-b border-slate-200">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {aiSummary.tableRows?.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-4 py-3 text-center text-xs text-slate-400 font-mono">{rowIdx + 1}</td>
                    {row.map((cell, cellIdx) => {
                      // Check if this column is Description or Comments to give it more width
                      const headerName = aiSummary.tableHeaders?.[cellIdx]?.toLowerCase() || '';
                      const isLongText = headerName.includes('description') || headerName.includes('comment') || headerName.includes('summary');
                      
                      return (
                        <td key={cellIdx} className="px-6 py-3 text-sm text-slate-700 align-top">
                          <div className={`overflow-y-auto custom-scrollbar ${isLongText ? 'min-w-[300px] max-h-40' : 'max-h-20 whitespace-nowrap'}`}>
                             {renderCellContent(cell)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
             <div className="flex items-center justify-center h-40 text-slate-400">
               No data available for this view.
             </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};