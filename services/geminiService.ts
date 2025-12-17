import { GoogleGenAI, Type } from "@google/genai";
import { SimplifiedProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });

export const simplifyWebhookData = async (data: any): Promise<SimplifiedProfile> => {
  try {
    const dataString = JSON.stringify(data).substring(0, 30000); // Increased limit for larger datasets

    const promptText = `Analyze the following raw data returned from a LinkedIn scraping/webhook service. 
      
      The user wants a table with the following specific columns if the data is available. 
      Map the raw JSON fields to these headers exactly where possible:
      1. Name
      2. LinkedIn URL
      3. Comments
      4. Current Title
      5. Current Company
      6. Personal Location
      7. Current Company LinkedIn URL
      8. Follower Count (Personal)
      9. Connection Count
      10. Company Name
      11. Website URL
      12. Industry
      13. Employee Count
      14. Follower Count (Company)
      15. Universal Name
      16. Description
      17. Company Country

      If the input is a list (array), generate a row for each item. 
      If a field is missing, leave it empty or put "-".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { text: promptText },
            { text: `Raw Data:\n${dataString}` }
          ]
        }
      ],
      config: {
        systemInstruction: "You are a professional data formatter. Your primary goal is to convert JSON data into a structured table matching specific user-requested columns. Always prefer the requested column names over generic ones.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Title for the dataset (e.g. 'Scraped Profiles')" },
            headline: { type: Type.STRING, description: "Brief status or count of items found" },
            summary: { type: Type.STRING, description: "A short summary of what this data represents (max 50 words)" },
            keySkills: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Extract 3-5 key common industries or tags from the list"
            },
            tableHeaders: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The list of column headers. Use the specific list provided in the prompt (Name, LinkedIn URL, Comments, etc) if data exists."
            },
            tableRows: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              description: "Rows of data. Ensure the order matches tableHeaders exactly."
            }
          },
          required: ["summary", "tableHeaders", "tableRows"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }
    return JSON.parse(text) as SimplifiedProfile;

  } catch (error) {
    console.error("Gemini simplification failed:", error);
    return {
      summary: "Failed to generate AI summary. Please view the raw data.",
      error: error instanceof Error ? error.message : "Unknown AI error"
    };
  }
};