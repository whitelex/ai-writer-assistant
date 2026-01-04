
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async fixGrammar(html: string): Promise<string> {
    if (!html.trim()) return html;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `TEXT_TO_EDIT: "${html}"`,
        config: {
          systemInstruction: `You are an elite, aggressive literary editor. 
          Your goal is to transform the provided HTML prose into a masterpiece.
          
          DIRECTIONS:
          1. Tighten the prose: eliminate fluff, convert passive voice to active, and fix all mechanical errors.
          2. Stylistic Upgrade: If the grammar is "fine," improve the word choice and sentence rhythm to make it more evocative.
          3. CRITICAL: You MUST strictly maintain all HTML structure (tags like <p>, <b>, <i>, <h1>, etc.).
          4. Return ONLY the resulting polished HTML. No conversational text.
          5. If the input is very short, still attempt to refine the phrasing.`,
          temperature: 0.3,
        }
      });
      const result = response.text?.trim();
      return result && result.length > 5 ? result : html;
    } catch (error) {
      console.error('Gemini Grammar Error:', error);
      throw error;
    }
  }

  async expandText(textSnippet: string, fullHtml: string): Promise<string> {
    const plainSnippet = textSnippet.replace(/<[^>]*>/g, '').trim();
    // Use last 1000 chars of plain text for context
    const context = fullHtml.replace(/<[^>]*>/g, ' ').slice(-1000);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `CONTEXT: "...${context}"\n\nEXPAND_THIS_IDEA: "${plainSnippet || 'The character pauses to reflect.'}"`,
        config: {
          systemInstruction: `You are a world-class novelist's co-writer. 
          Your task is to expand the current scene by adding vivid sensory details, internal monologue, or descriptive atmosphere.
          
          DIRECTIONS:
          1. Write 2-3 NEW sentences that flow perfectly from the provided context.
          2. Focus on "Show, Don't Tell" – use evocative imagery.
          3. Match the tone, tense, and POV of the context exactly.
          4. Return ONLY the new text to be added. Do NOT repeat the input or add commentary.
          5. If you cannot expand it creatively, provide a generic but high-quality continuation of the scene.`,
          temperature: 0.9,
        }
      });
      const result = response.text?.trim();
      return result || "";
    } catch (error) {
      console.error('Gemini Expand Error:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
