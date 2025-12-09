import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const analyzeSalesWithGemini = async (transactions: Transaction[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare a summary of the data to avoid token limits with large datasets
    const last10Transactions = transactions.slice(0, 50);
    const dataSummary = JSON.stringify(last10Transactions.map(t => ({
      date: t.date,
      total: t.total,
      items: t.items.map(i => i.name).join(', ')
    })));

    const prompt = `
      Act as a business analyst. Analyze the following JSON sales data (last 50 transactions):
      ${dataSummary}
      
      Provide a concise 3-bullet point summary of trends, popular items, and a recommendation for increasing revenue.
      Keep the tone professional and encouraging. Response in Spanish.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating analysis. Please check your API key environment configuration.";
  }
};