import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ScannedCardData {
  name: string;
  gameId: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  edition: string;
}

export async function scanCardImage(base64Image: string): Promise<ScannedCardData | null> {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: "Analyze this Trading Card Game (TCG) card and extract its details. Return the information in JSON format. Identify the game (yugioh, pokemon, magic, or other), card name, set name, card number/id, rarity, and edition if applicable.",
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the card" },
            gameId: { 
              type: Type.STRING, 
              description: "The TCG category (yugioh, pokemon, magic, or other)" 
            },
            setName: { type: Type.STRING, description: "The name of the set the card belongs to" },
            cardNumber: { type: Type.STRING, description: "The card number or ID within the set" },
            rarity: { type: Type.STRING, description: "The rarity of the card" },
            edition: { type: Type.STRING, description: "The edition of the card (e.g., 1st Edition, Limited)" },
          },
          required: ["name", "gameId"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ScannedCardData;
    }
    return null;
  } catch (error) {
    console.error("Error scanning card with Gemini:", error);
    return null;
  }
}
