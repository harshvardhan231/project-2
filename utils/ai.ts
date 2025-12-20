import { JournalEntry, LLMSummary, CheckIn } from "@/types";

const GEMINI_API_KEY = env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function callGemini(messages: { role: string; content: string }[]): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  const systemMessage = messages.find(m => m.role === "system");
  const otherMessages = messages.filter(m => m.role !== "system");

  const contents = otherMessages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    }
  };

  if (systemMessage) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessage.content }]
    };
  }

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API error:", error);
    throw new Error("Failed to call Gemini API");
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || "";
}

export async function generateSummary(entries: JournalEntry[]): Promise<LLMSummary> {
  if (entries.length === 0) {
    return {
      summary: "No entries to summarize yet.",
      themes: [],
      action: "Start journaling to track your emotional patterns.",
    };
  }

  const entriesText = entries
    .map(e => `${e.created_at}: Mood: ${e.mood}, Text: ${e.text}`)
    .join("\n");

  const systemPrompt = `You are a caring friend who helps people reflect on their thoughts and feelings. Summarize up to 7 journal entries in a warm, conversational way (≤200 words). Notice 2 patterns you see and suggest one small, gentle thing they could try. Be supportive and understanding, not clinical. If you're not sure about something, just say so.`;

  const userPrompt = `Please summarize these journal entries and provide insights:\n\n${entriesText}`;

  try {
    const completion = await callGemini([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const lines = completion.split("\n");
    const summary = lines[0] || "Unable to generate summary.";
    
    const themes: string[] = [];
    const themesMatch = completion.match(/themes?:(.+?)(?:action|$)/is);
    if (themesMatch) {
      const themesText = themesMatch[1];
      const themesList = themesText.split(/[,•\n]/).filter((t: any) => t.trim());
      themes.push(...themesList.slice(0, 2).map((t: any) => t.trim()));
    }

    const actionMatch = completion.match(/action:(.+?)$/is);
    const action = actionMatch 
      ? actionMatch[1].trim() 
      : "Take 5 minutes each day to reflect on one positive moment.";

    return { summary, themes, action };
  } catch (error) {
    console.error("Error calling AI API:", error);
    return {
      summary: "Unable to generate summary at this time. Please try again later.",
      themes: [],
      action: "Continue your daily journaling practice.",
    };
  }
}

export async function generateCheckinResponse(mood: string, thought: string): Promise<string> {
  const systemPrompt = `You are a warm, understanding friend who listens without judgment. Keep responses short and caring (≤150 words). Never give medical advice or diagnose anything. Just be supportive and maybe suggest one small, gentle thing they could try. Use friendly, conversational language like you're talking to a good friend.`;

  const userPrompt = `I'm feeling ${mood}. ${thought}`;

  try {
    return await callGemini([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
  } catch (error) {
    console.error("Error calling AI API:", error);
    return "Thank you for sharing how you're feeling. Remember to be gentle with yourself today. 💙";
  }
}

export async function generatePersonalizedInsight(
  entries: JournalEntry[], 
  checkins: CheckIn[], 
  question: string,
  conversationHistory: AIChatMessage[] = []
): Promise<string> {
  const recentEntries = entries.slice(0, 10);
  const recentCheckins = checkins.slice(0, 14);
  
  const entriesContext = recentEntries
    .map(e => `${e.created_at.split('T')[0]}: ${e.mood} - "${e.text.substring(0, 100)}..."`)
    .join('\n');
    
  const checkinsContext = recentCheckins
    .map(c => `${c.timestamp.split('T')[0]}: ${c.mood} - "${c.thought}"`)
    .join('\n');

  const systemPrompt = `You are a caring friend who knows this person well from their journal entries and daily check-ins. Chat with them in a warm, supportive way through natural voice conversation.

Be like a good friend who:
- Remembers everything they've shared in this conversation
- References what they told you earlier when relevant
- Notices patterns in what they share
- Celebrates their wins and supports them through tough times
- Suggests gentle, practical things they might try (like breathing exercises)
- try to Keep responses SHORT 
- Uses natural speech patterns, not formal writing
- Never gives medical advice or diagnoses or any other advice
- Admits when you're not sure about something
- tells motivational stories when relevant to motivate them

CRITICAL SAFETY RULES:
If they mention:
- Wanting to hurt themselves or others
- Suicidal thoughts
- Severe crisis symptoms

Immediately respond with care: "I'm really concerned about what you're sharing. Please reach out to the Call emergency services or a trusted person right now or family member. I'm here to listen, but you need support from someone who can help more than I can."

When someone seems to need more help:
"It sounds like you're going through a lot. Have you thought about talking to a therapist? They could offer support I can't. I'm here for everyday stress, but a professional might really help with this."

You have access to their recent journal entries and check-ins for background context.`;

  const contextMessage = `Here's some background context about me:

Recent Journal Entries:
${entriesContext || 'No recent entries'}

Recent Check-ins:
${checkinsContext || 'No recent check-ins'}`;

  try {
    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];
    
    if (entriesContext || checkinsContext) {
      messages.push({ role: "user", content: contextMessage });
      messages.push({ role: "assistant", content: "Thanks for sharing! I'll keep this in mind as we chat. What's on your mind?" });
    }
    
    const recentHistory = conversationHistory.slice(-20);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    
    messages.push({ role: "user", content: question });
    
    console.log("[AI] Sending message with", messages.length, "messages in context");
    
    return await callGemini(messages);
  } catch (error) {
    console.error("Error generating personalized insight:", error);
    return "I'm having trouble analyzing your data right now. Please try again later.";
  }
}
