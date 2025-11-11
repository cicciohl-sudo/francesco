
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash-image';

const prompt = `Analizza l'immagine fornita. Rileva l'insegna principale (che può essere un logo, una scritta, o un pannello luminoso).
Il tuo compito è di modificare l'immagine come segue:
1. Mantieni l'insegna rilevata con i suoi colori originali, preservando perfettamente saturazione, luminosità e dettagli.
2. Converti tutto il resto dell'immagine (lo sfondo e gli altri elementi) in una scala di grigi neutra (bianco e nero).
3. Assicurati che i bordi tra l'insegna a colori e lo sfondo in bianco e nero siano estremamente precisi, nitidi e senza aloni o sfumature.
4. Lo sfondo in bianco e nero deve avere un contrasto bilanciato, con neri profondi.
5. L'insegna a colori deve risaltare vividamente, come se fosse l'unico elemento a fuoco.
6. Conserva le proporzioni, la prospettiva e le condizioni di luce originali dell'intera foto.
Il risultato finale deve essere una singola immagine. Non rispondere con testo, solo con l'immagine modificata.`;


export async function processImage(base64Data: string, mimeType: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
    }
    
    return null;

  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}
