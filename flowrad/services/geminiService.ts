import { PatientData } from "../types";

export const getAiSuggestions = async (data: PatientData): Promise<{ protocol: string, diagnosis: string }> => {
    try {
        const response = await fetch('/api/suggest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching AI suggestions:", error);
        throw error;
    }
};
