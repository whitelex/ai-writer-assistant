
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Fix: Initialize GoogleGenAI using process.env.API_KEY directly as per the strict @google/genai guidelines.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async fixGrammar(text: string): Promise<string> {
    if (!text.trim()) return text;
    
    try {
      // Fix: Always use ai.models.generateContent with both the model name and prompt together.
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Fix the grammar, spelling, and punctuation of the following text while strictly preserving the author's original style, tone, and voice. Do not add new sentences or significantly rewrite the prose. Return ONLY the corrected text.\n\nText: "${text}"`,
        config: {
          temperature: 0.2,
        }
      });
      // Fix: Access the .text property directly (not a method).
      return response.text || text;
    } catch (error) {
      console.error('Gemini Grammar Error:', error);
      return text;
    }
  }

  async expandText(text: string, context: string): Promise<string> {
    if (!text.trim()) return "Please select some text to expand.";
    
    try {
      // Fix: Always use ai.models.generateContent with both the model name and prompt together.
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a creative writing assistant. Expand the following text snippet by adding 2-3 sentences of descriptive detail or character inner-thought that matches the existing style. 
        
        Context of the chapter so far: "${context.slice(-1000)}"
        Snippet to expand: "${text}"
        
        Return ONLY the expanded version (including the original text joined seamlessly with the new content).`,
        config: {
          temperature: 0.8,
        }
      });
      // Fix: Access the .text property directly (not a method).
      return response.text || text;
    } catch (error) {
      console.error('Gemini Expand Error:', error);
      return text;
    }
  }
}

export const geminiService = new GeminiService();
