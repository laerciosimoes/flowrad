export interface PatientFile {
  name: string;
  base64: string;
  mimeType: string;
}

export interface ExamDetails {
    patientName: string;
    examType: string;
    bodyPart: string;
    reasonForExam: string;
}

export interface PatientData {
  examDetails: ExamDetails;
  age: number;
  sex: string;
  weight: number;
  indication: string;
  creatinine?: number;
  allergies_str?: string;
  order: PatientFile | null;
  prescription: PatientFile | null;
  scans: PatientFile[];
}

export interface ChatMessage {
    sender: 'bot' | 'user' | 'system';
    text?: string;
    file?: { name: string };
}

export interface CompletedWorkflow {
  id: string;
  timestamp: string;
  patientData: PatientData;
  protocolSuggestion: string;
  diagnosticSuggestion: string;
}