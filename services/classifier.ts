
import { GoogleGenAI, Type } from "@google/genai";
import { LearningType } from "../types";

/**
 * Internally classifies a learning entry.
 * Actionable: Clear external behavior in 'Action' + concrete practical result in 'Outcome'.
 * Reflective: Internal insights, feelings, or realizations without a behavioral loop.
 */
export const classifyLearning = async (whatIDid: string, whatResulted: string): Promise<LearningType> => {
  if (!whatIDid.trim() || !whatResulted.trim()) return "Reflective";

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Internal Classification Task:
      
      User Behavior (عملت إيه): "${whatIDid}"
      User Outcome (وده سبّب إيه): "${whatResulted}"
      
      Classification Rules:
      - 'Actionable': The 'Behavior' is a clear, specific, and external action/step. The 'Outcome' is a concrete, observable, or practical result of that specific action.
      - 'Reflective': The inputs describe internal feelings, thoughts, realizations, or abstract observations without a clear external cause-and-effect behavioral loop.
      
      Return JSON: { "type": "Actionable" | "Reflective" }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ["Actionable", "Reflective"]
            }
          },
          required: ["type"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"type": "Reflective"}');
    return result.type as LearningType;
  } catch (error) {
    console.error("Internal classification error:", error);
    return "Reflective"; 
  }
};
