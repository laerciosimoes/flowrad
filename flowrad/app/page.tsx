'use client';

import React, { useState } from 'react';
import { ClinicianView } from '../components/ClinicianView';
import { PatientView } from '../components/PatientView';
import { AdminView } from '../components/AdminView';
import { Logo } from '../components/Logo';
import { PatientData, ExamDetails, CompletedWorkflow } from '../types';
import { getAiSuggestions } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';

type View = 'clinician' | 'patient' | 'summary' | 'admin';

export default function HomePage() {
  const [view, setView] = useState<View>('clinician');
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [protocolSuggestion, setProtocolSuggestion] = useState<string | null>(null);
  const [diagnosticSuggestion, setDiagnosticSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSchedule = (details: ExamDetails) => {
    setExamDetails(details);
    setView('patient');
  };

  const handlePatientDataSubmit = async (data: PatientData) => {
    setPatientData(data);
    setView('summary');
    setIsLoading(true);
    setError(null);
    try {
      const { protocol, diagnosis } = await getAiSuggestions(data);
      setProtocolSuggestion(protocol);
      setDiagnosticSuggestion(diagnosis);

      // Persist completed workflow to local storage
      const completedWorkflow: CompletedWorkflow = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          patientData: data,
          protocolSuggestion: protocol,
          diagnosticSuggestion: diagnosis,
      };
      const existingWorkflows = JSON.parse(localStorage.getItem('flowrad-workflows') || '[]');
      localStorage.setItem('flowrad-workflows', JSON.stringify([...existingWorkflows, completedWorkflow]));

    } catch (e) {
      console.error(e);
      setError('An error occurred while communicating with the AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setView('clinician');
    setPatientData(null);
    setExamDetails(null);
    setProtocolSuggestion(null);
    setDiagnosticSuggestion(null);
    setIsLoading(false);
    setError(null);
  }
  
  const renderNav = () => (
      <div className="w-full max-w-5xl mx-auto flex justify-end mb-4">
          {view !== 'admin' ? (
             <button onClick={() => setView('admin')} className="text-sm bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                Admin Dashboard
            </button>
          ) : (
             <button onClick={() => setView('clinician')} className="text-sm bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                Clinician View
            </button>
          )}
      </div>
  )

  const renderView = () => {
    switch (view) {
      case 'clinician':
        return <ClinicianView onSchedule={handleSchedule} />;
      case 'patient':
        return <PatientView examDetails={examDetails!} onComplete={handlePatientDataSubmit} />;
       case 'admin':
        return <AdminView onBack={() => setView('clinician')} />;
      case 'summary':
        return (
          <div className="w-full max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">AI Analysis Complete</h2>
            <p className="text-center text-gray-600 mb-8">Review the AI-generated suggestions below.</p>
            {isLoading && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <LoadingSpinner />
                <p className="text-gray-600">Analyzing data and images...</p>
              </div>
            )}
            {error && <p className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
            {!isLoading && !error && (
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold text-[#0084d4] mb-3">Suggested Protocol</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{protocolSuggestion}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold text-[#8cc63f] mb-3">Suggested Diagnosis</h3>
                  <div className="text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: diagnosticSuggestion?.replace(/\n/g, '<br />') || "" }} />
                </div>
                 <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mt-8 rounded-r-lg" role="alert">
                    <p className="font-bold">Disclaimer</p>
                    <p>The information provided is AI-generated and for demonstration purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.</p>
                </div>
              </div>
            )}
             <div className="mt-8 text-center">
                <button
                    onClick={handleStartOver}
                    className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
                >
                    Start New Workflow
                </button>
            </div>
          </div>
        );
      default:
        return <ClinicianView onSchedule={handleSchedule} />;
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen text-gray-800 flex flex-col items-center p-4 sm:p-6 lg:p-8">
       <div className="w-48 mb-4">
          <Logo />
       </div>
       {renderNav()}
       <div className="w-full flex justify-center">
        {renderView()}
       </div>
    </main>
  );
};