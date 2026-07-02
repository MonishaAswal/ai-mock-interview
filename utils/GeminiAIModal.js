const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

function normalizeJsonResponse(text) {
  try {
    const trimmed = text.trim();
    // Parse the JSON text
    const parsed = JSON.parse(trimmed);
    
    // If it is an object but not an array, search for any property that contains an array
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed);
      for (const key of keys) {
        if (Array.isArray(parsed[key])) {
          return JSON.stringify(parsed[key]);
        }
      }
    }
  } catch (error) {
    // If it's not valid JSON, we just return the original text
  }
  return text;
}

export const chatSession = {
  sendMessage: async (message) => {
    try {
      if (!apiKey || apiKey === "your_groq_api_key_here") {
        throw new Error("Groq API Key is not configured. Please set NEXT_PUBLIC_GROQ_API_KEY in your .env.local file.");
      }

      // Check if the prompt requests JSON format
      const isJsonRequest = message.toLowerCase().includes("json");

      const requestBody = {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      };

      if (isJsonRequest) {
        requestBody.response_format = { type: "json_object" };
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let text = data.choices[0]?.message?.content || "";

      if (isJsonRequest) {
        text = normalizeJsonResponse(text);
      }

      // Mock the structure returned by Google Generative AI: { response: { text: () => string } }
      return {
        response: {
          text: () => text
        }
      };
    } catch (error) {
      console.error("Error in Groq chatSession.sendMessage:", error);
      throw error;
    }
  }
};