'use client';

import React, { useState } from 'react';
import { ExamDetails } from '../types';

interface ClinicianViewProps {
  onSchedule: (details: ExamDetails) => void;
}

export const ClinicianView: React.FC<ClinicianViewProps> = ({ onSchedule }) => {
    const [patientName, setPatientName] = useState('');
    const [examType, setExamType] = useState('');
    const [bodyPart, setBodyPart] = useState('');
    const [reasonForExam, setReasonForExam] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(patientName.trim() && examType.trim() && bodyPart.trim() && reasonForExam.trim()) {
            setIsScheduled(true);
        }
    };
    
    const handleSimulate = () => {
        onSchedule({ patientName, examType, bodyPart, reasonForExam });
    }

    if (isScheduled) {
        return (
            <div className="w-full max-w-md text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-200 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Exam Scheduled Successfully!</h2>
                <p className="text-gray-600 mb-6">A secure link has been sent to {patientName} to complete the pre-exam questionnaire.</p>
                <p className="bg-gray-100 p-3 rounded-lg text-sm text-gray-700 break-words mb-8">
                    <code>https://flowrad.app/exam/p_a7b3c8d9e0f1</code>
                </p>
                <button
                    onClick={handleSimulate}
                    className="w-full bg-gradient-to-r from-[#0084d4] to-[#006cb4] hover:from-[#0073b6] hover:to-[#005a9e] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                    Simulate Patient Journey
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200 animate-fade-in">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Schedule New Exam</h2>
            <p className="text-center text-gray-500 mb-8">Enter patient details to begin the workflow.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                        Patient Name
                    </label>
                    <input
                        type="text"
                        id="patientName"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0084d4] focus:border-[#0084d4] sm:text-sm"
                        placeholder="e.g., Jane Doe"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="examType" className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Type
                    </label>
                    <input
                        type="text"
                        id="examType"
                        value={examType}
                        onChange={(e) => setExamType(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0084d4] focus:border-[#0084d4] sm:text-sm"
                        placeholder="e.g., MRI Brain with Contrast"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="bodyPart" className="block text-sm font-medium text-gray-700 mb-1">
                        Body Part
                    </label>
                    <input
                        type="text"
                        id="bodyPart"
                        value={bodyPart}
                        onChange={(e) => setBodyPart(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0084d4] focus:border-[#0084d4] sm:text-sm"
                        placeholder="e.g., Head, Left Knee"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="reasonForExam" className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Exam
                    </label>
                    <textarea
                        id="reasonForExam"
                        rows={3}
                        value={reasonForExam}
                        onChange={(e) => setReasonForExam(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0084d4] focus:border-[#0084d4] sm:text-sm"
                        placeholder="e.g., Chronic headaches, suspected ligament tear"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#8cc63f] to-[#7cb518] hover:from-[#81b538] hover:to-[#6c9f15] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                    Schedule & Send Link
                </button>
            </form>
        </div>
    );
};