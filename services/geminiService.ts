
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async fixGrammar(html: string): Promise<string> {
    if (!html.trim() || html === '<p><br></p>') return html;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `[TARGET_PROSE_START]\n${html}\n[TARGET_PROSE_END]`,
        config: {
          systemInstruction: `You are a ruthless, world-class literary editor. 
          Your mission is to polish the author's prose into high-art literature.
          
          DIRECTIONS:
          1. NEVER say "everything looks good." You must always find a way to improve the flow, impact, or vocabulary.
          2. Tighten the prose: remove filler words, eliminate passive voice, and fix all mechanical errors.
          3. Stylistic Polish: Elevate the word choice. Replace mundane verbs with evocative ones.
          4. CRITICAL: You MUST keep all HTML tags exactly as they are. Do not remove <p>, <b>, <i>, or <h1> tags.
          5. Return ONLY the transformed HTML. No explanations or meta-commentary.`,
          temperature: 0.4,
        }
      });
      const result = response.text?.trim();
      // Only return if it's substantial and different
      return (result && result.length > 2) ? result : html;
    } catch (error) {
      console.error('Gemini Polish Error:', error);
      throw error;
    }
  }

  async expandText(textSnippet: string, fullHtml: string): Promise<string> {
    const plainSnippet = textSnippet.replace(/<[^>]*>/g, '').trim();
    const context = fullHtml.replace(/<[^>]*>/g, ' ').slice(-1200);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `CONTEXT: "...${context}"\n\nSEED_IDEA: "${plainSnippet || 'The narrative continues.'}"`,
        config: {
          systemInstruction: `You are a ghostwriter for a bestselling novelist. 
          Your job is to expand a small idea into 2-3 sentences of vivid, atmospheric prose.
          
          DIRECTIONS:
          1. Provide a direct continuation of the scene.
          2. Use sensory details (smell, sound, texture) and internal monologue.
          3. MATCH the tone and tense of the context exactly.
          4. Return ONLY the new text. Do NOT include the seed or context.
          5. If the seed is empty, invent a compelling next beat for the story.`,
          temperature: 0.9,
        }
      });
      return response.text?.trim() || "";
    } catch (error) {
      console.error('Gemini Expand Error:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
