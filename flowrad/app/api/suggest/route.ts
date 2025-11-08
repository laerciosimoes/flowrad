
import { GoogleGenAI, Part } from "@google/genai";
import { PatientData } from "@/types";
import { NextResponse } from "next/server";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const textToHtml = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

const suggestProtocol = async (data: PatientData): Promise<string> => {
    const model = 'gemini-2.5-flash';
    // Fix: Consolidate instructions into systemInstruction and provide only data in the prompt.
    const prompt = `
        Patient Data:
        - Age: ${data.age}
        - Sex: ${data.sex}
        - Known Allergies: ${data.allergies}
    `;
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { systemInstruction: "You are a helpful radiology assistant. Based on the patient's data, suggest a specific and appropriate imaging protocol. Justify your suggestion briefly. Please provide a clear protocol suggestion." }
    });
    return response.text || "Unable to generate protocol suggestion.";
};

const suggestDiagnosis = async (data: PatientData): Promise<string> => {
    const model = 'gemini-2.5-flash';
    // Fix: Remove redundant instructions from the text part as they are already in systemInstruction.
    const textPart = { text: `
        Patient Data:
        - Age: ${data.age}
        - Sex: ${data.sex}
        - Known Allergies: ${data.allergies}
    `};
    const imageParts: Part[] = [
        ...(data.order ? [{ inlineData: { mimeType: data.order.mimeType, data: data.order.base64 } }] : []),
        ...(data.prescription ? [{ inlineData: { mimeType: data.prescription.mimeType, data: data.prescription.base64 } }] : []),
        ...data.scans.map((scan) => ({ inlineData: { mimeType: scan.mimeType, data: scan.base64 } }))
    ];

    if (imageParts.length === 0) return "No images were provided to analyze for a diagnosis.";

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [textPart, ...imageParts] },
        config: { systemInstruction: "You are an expert radiologist AI assistant. Analyze provided information and images for potential differential diagnoses with reasoning. Format your response clearly. Start with a disclaimer: 'This is an AI-generated analysis and should not be used for clinical decision-making. All findings must be verified by a qualified radiologist.'" }
    });
    return textToHtml(response.text || "Unable to generate diagnosis analysis.");
};

export async function POST(request: Request) {
    if (!API_KEY) {
        return NextResponse.json({ error: "Server is not configured with an API key." }, { status: 500 });
    }
    try {
        const patientData = await request.json() as PatientData;
        const [protocol, diagnosis] = await Promise.all([
            suggestProtocol(patientData),
            suggestDiagnosis(patientData)
        ]).catch(err => {
            console.error("Error during Gemini API calls:", err);
            throw new Error("Failed to process request with AI model.");
        });
        return NextResponse.json({ protocol, diagnosis });
    } catch (error) {
        console.error("Error in API route:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Failed to get AI suggestions.", details: errorMessage }, { status: 500 });
    }
}
