
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Gemini API_KEY is missing from environment variables.");
      return new GoogleGenAI({ apiKey: "MISSING_KEY" });
    }
    return new GoogleGenAI({ apiKey });
  }

  async fixGrammar(html: string): Promise<string> {
    if (!html.trim()) return html;
    
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Fix the grammar, spelling, and punctuation of the following HTML-formatted text.
        
        RULES:
        1. Strictly preserve all HTML tags (like <p>, <b>, <i>, <ul>, <li>, <h1>).
        2. Preserve the author's original style, tone, and voice.
        3. Return ONLY the corrected HTML string.
        
        HTML: "${html}"`,
        config: {
          temperature: 0.1,
        }
      });
      return response.text?.trim() || html;
    } catch (error) {
      console.error('Gemini Grammar Error:', error);
      return html;
    }
  }

  async expandText(textSnippet: string, fullHtml: string): Promise<string> {
    const plainSnippet = textSnippet.replace(/<[^>]*>/g, '').trim();
    if (!plainSnippet) return "Please select some text to expand.";
    
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a creative writing assistant. Expand the following text snippet by adding 2-3 sentences of descriptive detail or character inner-thought that matches the existing style. 
        
        Context of the chapter (in HTML): "${fullHtml.slice(-1500)}"
        Snippet to expand: "${plainSnippet}"
        
        Return ONLY the expanded version. Do NOT include HTML tags in your output unless they are bold or italics for emphasis.`,
        config: {
          temperature: 0.8,
        }
      });
      return response.text?.trim() || textSnippet;
    } catch (error) {
      console.error('Gemini Expand Error:', error);
      return textSnippet;
    }
  }
}

export const geminiService = new GeminiService();
