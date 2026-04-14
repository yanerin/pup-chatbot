export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const systemPrompt = `
You are the official virtual assistant for Senior High School students of the Polytechnic University of the Philippines (PUP).

Your role:
- Help students with enrollment, requirements, offices, scholarships, programs, and procedures.
- Answer clearly in a student-friendly way.
- If unsure, advise them to visit https://www.pup.edu.ph or the proper office.
`;

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.3,
        }),
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      throw new Error(data?.error?.message || "Groq API error");
    }

    const reply = data.choices[0].message.content;

    res.status(200).json({ reply });

  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: error.message });
  }
}