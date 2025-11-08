'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PatientData, ChatMessage, PatientFile, ExamDetails } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { ChatBubble } from './ChatBubble';

interface PatientViewProps {
  examDetails: ExamDetails;
  onComplete: (data: PatientData) => void;
}

type ChatStep = 'age' | 'sex' | 'weight' | 'indication' | 'creatinine' | 'allergies' | 'order' | 'prescription' | 'scans' | 'confirm' | 'done';

const steps: ChatStep[] = ['age', 'sex', 'weight', 'indication', 'creatinine', 'allergies', 'order', 'prescription', 'scans', 'confirm'];
const botQuestions: Record<ChatStep, string> = {
    age: "To start, could you please provide your age (in years)?",
    sex: "Thank you. What is your sex?",
    weight: "What is your weight (in kg)?",
    indication: "What is the medical indication or reason for this exam?",
    creatinine: "Do you know your creatinine level? If yes, please provide it (mg/dL). If you don't know, type 'unknown'.",
    allergies: "Do you have any known allergies? If yes, please describe them. If none, type 'none'.",
    order: "Please upload a clear photo of your doctor's order.",
    prescription: "If you have a prescription, please upload it. You can skip this step if you don't have one.",
    scans: "Please upload any previous exam photos or scans you have. You can upload multiple files. Click 'Done Uploading' when you are finished.",
    confirm: "Thank you for providing all the information. Please review everything and click below to submit for AI analysis.",
    done: "Your information has been submitted."
};

const LOCAL_STORAGE_KEY = 'flowrad-chat-session';

export const PatientView: React.FC<PatientViewProps> = ({ examDetails, onComplete }) => {
    
    const loadState = () => {
        try {
            const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (serializedState === null) return undefined;
            
            const parsedState = JSON.parse(serializedState);
            // Don't load a session that is already on the confirmation step
            if (parsedState.currentStepIndex >= steps.indexOf('confirm')) {
                 localStorage.removeItem(LOCAL_STORAGE_KEY);
                 return undefined;
            }
            // Check if loaded data belongs to the same patient
            if (parsedState.patientData.examDetails.patientName !== examDetails.patientName) {
                return undefined;
            }

            return parsedState;
        } catch (error) {
            console.warn("Could not load chat state from local storage", error);
            return undefined;
        }
    };
    
    const initialSavedState = loadState();

    const [messages, setMessages] = useState<ChatMessage[]>(initialSavedState?.messages ?? [
        { sender: 'bot', text: `Welcome, ${examDetails.patientName}! I'm here to help you prepare for your exam. I'll ask a few questions to get started.` },
        { sender: 'bot', text: botQuestions.age },
    ]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(initialSavedState?.currentStepIndex ?? 0);
    const [userInput, setUserInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [patientData, setPatientData] = useState<PatientData>(initialSavedState?.patientData ?? {
        examDetails, 
        age: 0, 
        sex: '', 
        weight: 0, 
        indication: '', 
        creatinine: undefined, 
        allergies_str: undefined, 
        order: null, 
        prescription: null, 
        scans: []
    });
    
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        try {
            const stateToSave = JSON.stringify({ messages, currentStepIndex, patientData });
            localStorage.setItem(LOCAL_STORAGE_KEY, stateToSave);
        } catch (error) {
            console.warn("Could not save chat state to local storage", error);
        }
    }, [messages, currentStepIndex, patientData]);


    const handleNextStep = (data: Partial<PatientData>, userMessage: ChatMessage) => {
        setMessages(prev => [...prev, userMessage]);
        setPatientData(prev => ({ ...prev, ...data }));
        
        const nextStepIndex = currentStepIndex + 1;
        if (nextStepIndex < steps.length) {
            setCurrentStepIndex(nextStepIndex);
            const nextStep = steps[nextStepIndex];
            setTimeout(() => {
                 setMessages(prev => [...prev, { sender: 'bot', text: botQuestions[nextStep] }]);
            }, 500);
        }
    };
    
    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        const currentStep = steps[currentStepIndex];
        const newData: Partial<PatientData> = {};
        
        if(currentStep === 'age') {
            const age = Number.parseInt(userInput, 10);
            if (Number.isNaN(age) || age <= 0) {
                alert('Please enter a valid age (positive number)');
                return;
            }
            newData.age = age;
        }
        else if(currentStep === 'sex') newData.sex = userInput;
        else if(currentStep === 'weight') {
            const weight = Number.parseFloat(userInput);
            if (Number.isNaN(weight) || weight <= 0) {
                alert('Please enter a valid weight (positive number)');
                return;
            }
            newData.weight = weight;
        }
        else if(currentStep === 'indication') newData.indication = userInput;
        else if(currentStep === 'creatinine') {
            if (userInput.toLowerCase() === 'unknown' || userInput.toLowerCase() === 'no') {
                newData.creatinine = undefined;
            } else {
                const creatinine = Number.parseFloat(userInput);
                if (Number.isNaN(creatinine) || creatinine <= 0) {
                    alert('Please enter a valid creatinine level or "unknown"');
                    return;
                }
                newData.creatinine = creatinine;
            }
        }
        else if(currentStep === 'allergies') {
            if (userInput.toLowerCase() === 'none' || userInput.toLowerCase() === 'no') {
                newData.allergies_str = undefined;
            } else {
                newData.allergies_str = userInput;
            }
        }
        
        handleNextStep(newData, { sender: 'user', text: userInput });
        setUserInput('');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof Omit<PatientData, 'scans' | 'age' | 'sex' | 'allergies' | 'examDetails'>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const file = files[0];
        const { base64, mimeType } = await fileToBase64(file);
        const patientFile: PatientFile = { name: file.name, base64, mimeType };
        setIsUploading(false);
        handleNextStep({ [field]: patientFile }, { sender: 'user', file: { name: file.name } });
    };
    
    const handleMultiFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setIsUploading(true);
        for (const file of Array.from(files)) {
            const { base64, mimeType } = await fileToBase64(file);
            const patientFile: PatientFile = { name: file.name, base64, mimeType };
            setPatientData(prev => ({ ...prev, scans: [...prev.scans, patientFile] }));
            setMessages(prev => [...prev, { sender: 'user', file: { name: file.name } }]);
        }
        setIsUploading(false);
    };

    const handleScansDone = () => {
        handleNextStep({}, { sender: 'system', text: "Finished uploading scans." });
    }

    const handleSubmitForAnalysis = () => {
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
            console.warn("Could not clear chat state from local storage", error);
        }
        onComplete(patientData);
    };

    const renderFileInput = (onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, multiple = false) => (
        isUploading ? (
            <div className="flex items-center justify-center w-full text-gray-500 py-2">
                <div className="w-5 h-5 border-2 border-[#0084d4] border-t-transparent border-solid rounded-full animate-spin mr-2"></div>
                Processing...
            </div>
        ) : (
            <input 
                type="file" 
                multiple={multiple} 
                accept="image/*,.pdf,.txt,.doc,.docx,text/*,application/pdf" 
                onChange={onChange} 
                disabled={isUploading} 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0084d4] file:text-white hover:file:bg-[#0073b6] cursor-pointer"
            />
        )
    );

    const currentStep = steps[currentStepIndex];
    const isTextStep = ['age', 'sex', 'weight', 'indication', 'creatinine', 'allergies'].includes(currentStep);

    return (
        <div className="w-full max-w-2xl h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-center text-gray-800">FlowRad Patient Questionnaire</h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg, index) => <ChatBubble key={index} message={msg} />)}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                {isTextStep && (
                    <form onSubmit={handleTextSubmit} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className="flex-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0084d4] focus:border-[#0084d4] sm:text-sm"
                            placeholder="Type your answer..."
                        />
                        <button type="submit" className="bg-[#0084d4] text-white p-3 rounded-full hover:bg-[#0073b6] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </form>
                )}
                 {currentStep === 'order' && renderFileInput((e) => handleFileChange(e, 'order'))}
                 {currentStep === 'prescription' && (
                    <div className="flex gap-2">
                        {renderFileInput((e) => handleFileChange(e, 'prescription'))}
                        <button onClick={() => handleNextStep({ prescription: null }, { sender: 'system', text: "Skipped prescription." })} className="py-2 px-4 rounded-full border border-gray-300 bg-white text-sm font-semibold hover:bg-gray-100" disabled={isUploading}>Skip</button>
                    </div>
                )}
                {currentStep === 'scans' && (
                    <div className="flex gap-2">
                        {renderFileInput(handleMultiFileChange, true)}
                        <button onClick={handleScansDone} className="py-2 px-4 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700" disabled={isUploading}>Done</button>
                    </div>
                )}
                 {currentStep === 'confirm' && (
                    <button onClick={handleSubmitForAnalysis} className="w-full bg-gradient-to-r from-[#8cc63f] to-[#7cb518] hover:from-[#81b538] hover:to-[#6c9f15] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300">
                        Submit for AI Analysis
                    </button>
                )}
            </div>
        </div>
    );
};