export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { system, user } = req.body;

  if (!system || !user) {
    res.status(400).json({ error: "Missing system or user field" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });
    return;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: "Anthropic API error: " + errText });
      return;
    }

    const data = await response.json();
    const blocks = data.content || [];
    let text = "";
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].type === "text") text += blocks[i].text;
    }

    res.status(200).json({ text: text.trim() });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + (err.message || String(err)) });
  }
}
