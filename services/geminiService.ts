
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async fixGrammar(html: string): Promise<string> {
    if (!html.trim()) return html;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `[INPUT_HTML_START]\n${html}\n[INPUT_HTML_END]`,
        config: {
          systemInstruction: `You are an elite literary editor at a top publishing house. 
          Your task is to polish the provided HTML text to a professional standard.
          
          DIRECTIONS:
          1. Fix all grammar, spelling, and punctuation errors.
          2. Enhance the prose for better flow, vocabulary, and impact while keeping the author's original voice.
          3. MANDATORY: Strictly preserve all HTML tags (like <p>, <b>, <i>, <h1>, etc.). Do not remove them or change their nesting.
          4. Output ONLY the resulting polished HTML. Do not include any commentary or meta-talk.
          
          If the text is already good, look for subtle stylistic improvements (word choice, sentence variety).`,
          temperature: 0.2,
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
    const context = fullHtml.replace(/<[^>]*>/g, ' ').slice(-2000);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `[CHAPTER_CONTEXT]: "...${context}"\n\n[SNIPPET_TO_EXPAND]: "${plainSnippet || 'The story continues...'}"`,
        config: {
          systemInstruction: `You are a world-class creative writing assistant. 
          Your goal is to help a writer expand their story by adding vivid imagery, internal monologue, or descriptive detail.
          
          DIRECTIONS:
          1. Read the snippet and the surrounding context.
          2. Write 2-4 sentences that naturally continue or deepen the scene described in the snippet.
          3. Return ONLY the new text to be added. 
          4. Do NOT repeat the input snippet.
          5. Match the existing tone, tense, and POV perfectly.`,
          temperature: 0.85,
        }
      });
      return response.text?.trim() || "";
    } catch (error) {
      console.error('Gemini Expand Error:', error);
      return "";
    }
  }
}

export const geminiService = new GeminiService();
