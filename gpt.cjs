require("dotenv/config");
const OpenAI = require("openai");
const readlineSync = require("readline-sync");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const history = [
  { role: "system", content: "You are ChatGPT-5 in a terminal. Be concise and helpful." }
];

async function main() {
  console.log("GPT-5 terminal. Press Enter on an empty line to exit.\n");
  for (;;) {
    const input = readlineSync.question("You: ");
    if (!input) break;

    history.push({ role: "user", content: input });

    const res = await client.chat.completions.create({
      model: "gpt-5",
      messages: history
    });

    const reply = res.choices[0].message.content.trim();
    console.log("\nGPT:", reply, "\n");
    history.push({ role: "assistant", content: reply });
  }
}

main().catch(err => {
  console.error("Error:", err);
});
