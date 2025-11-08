'use client';

import React, { useState, useEffect } from 'react';
import { CompletedWorkflow } from '../types';

interface AdminViewProps {
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBack }) => {
  const [workflows, setWorkflows] = useState<CompletedWorkflow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedWorkflows = JSON.parse(localStorage.getItem('flowrad-workflows') || '[]');
      setWorkflows(storedWorkflows.sort((a: CompletedWorkflow, b: CompletedWorkflow) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error("Failed to load workflows from local storage", error);
      setWorkflows([]);
    }
  }, []);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all workflow history? This action cannot be undone.")) {
      try {
        localStorage.removeItem('flowrad-workflows');
        setWorkflows([]);
      } catch (error) {
        console.error("Failed to clear workflows from local storage", error);
      }
    }
  };
  
  const toggleExpand = (id: string) => {
      setExpandedId(prevId => (prevId === id ? null : id));
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
            {workflows.length > 0 && (
                 <button onClick={handleClearHistory} className="text-sm bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg hover:bg-red-200 transition-colors">
                    Clear All History
                </button>
            )}
        </div>

      {workflows.length === 0 ? (
        <div className="text-center bg-white p-10 rounded-2xl shadow-md border border-gray-200">
          <p className="text-gray-500">No completed patient workflows found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <div key={wf.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleExpand(wf.id)}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                        <p className="font-bold text-lg text-gray-800">{wf.patientData.examDetails.patientName}</p>
                        <p className="text-sm text-gray-600">{wf.patientData.examDetails.examType}</p>
                    </div>
                    <div className="text-sm text-gray-500 mt-2 md:mt-0 md:text-right">
                        <p>{new Date(wf.timestamp).toLocaleString()}</p>
                        <p>Age: {wf.patientData.age}, Sex: {wf.patientData.sex}</p>
                    </div>
                     <div className="flex items-center justify-end flex-1 mt-2 md:mt-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${expandedId === wf.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
              </div>
              {expandedId === wf.id && (
                  <div className="p-6 bg-gray-50 border-t border-gray-200 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <h3 className="text-lg font-semibold text-[#0084d4] mb-2">Suggested Protocol</h3>
                                <p className="text-gray-700 whitespace-pre-wrap text-sm">{wf.protocolSuggestion}</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[#8cc63f] mb-2">Suggested Diagnosis</h3>
                                <div className="text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: wf.diagnosticSuggestion.replace(/\n/g, '<br />') }} />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                           <p><strong>Age:</strong> {wf.patientData.age} years</p>
                           <p><strong>Sex:</strong> {wf.patientData.sex}</p>
                           <p><strong>Weight:</strong> {wf.patientData.weight} kg</p>
                           <p><strong>Indication:</strong> {wf.patientData.indication}</p>
                           <p><strong>Creatinine:</strong> {wf.patientData.creatinine ? `${wf.patientData.creatinine} mg/dL` : 'Unknown'}</p>
                           <p><strong>Allergies:</strong> {wf.patientData.allergies_str || 'None'}</p>
                           <p><strong>Reason for Exam:</strong> {wf.patientData.examDetails.reasonForExam}</p>
                           <p><strong>Body Part:</strong> {wf.patientData.examDetails.bodyPart}</p>
                        </div>
                  </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};