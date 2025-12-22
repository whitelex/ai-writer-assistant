
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  // Lazily initialize the client to prevent blocking app load if the key is missing.
  private getClient(): GoogleGenAI {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Gemini API_KEY is missing from environment variables.");
      // We return a dummy key to satisfy the constructor, 
      // the actual API call will fail gracefully in the catch block.
      return new GoogleGenAI({ apiKey: "MISSING_KEY" });
    }
    return new GoogleGenAI({ apiKey });
  }

  async fixGrammar(text: string): Promise<string> {
    if (!text.trim()) return text;
    
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Fix the grammar, spelling, and punctuation of the following text while strictly preserving the author's original style, tone, and voice. Do not add new sentences or significantly rewrite the prose. Return ONLY the corrected text.\n\nText: "${text}"`,
        config: {
          temperature: 0.2,
        }
      });
      return response.text || text;
    } catch (error) {
      console.error('Gemini Grammar Error:', error);
      return text;
    }
  }

  async expandText(text: string, context: string): Promise<string> {
    if (!text.trim()) return "Please select some text to expand.";
    
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a creative writing assistant. Expand the following text snippet by adding 2-3 sentences of descriptive detail or character inner-thought that matches the existing style. 
        
        Context of the chapter so far: "${context.slice(-1000)}"
        Snippet to expand: "${text}"
        
        Return ONLY the expanded version (including the original text joined seamlessly with the new content).`,
        config: {
          temperature: 0.8,
        }
      });
      return response.text || text;
    } catch (error) {
      console.error('Gemini Expand Error:', error);
      return text;
    }
  }
}

export const geminiService = new GeminiService();
