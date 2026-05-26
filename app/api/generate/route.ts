import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    projectName,
    role,
    problem,
    process,
    keyDecisions,
    outcomes,
    tools,
    duration,
  } = body;

  const prompt = `You are an expert portfolio writer helping professionals craft compelling case studies. Write a portfolio case study based on the following project details.

Project Name: ${projectName}
Role: ${role}
Problem/Challenge: ${problem}
Process/Approach: ${process}
Key Decisions: ${keyDecisions}
Outcomes/Results: ${outcomes}
Tools Used: ${tools}
Duration: ${duration}

Write a professional, engaging portfolio case study with EXACTLY these five sections in order:

## Opening Hook
A compelling 2-3 sentence hook that grabs attention and highlights the most impressive outcome or challenge.

## The Challenge
A clear description of the problem, context, constraints, and why it mattered. Be specific about the stakes.

## My Approach
A detailed walkthrough of the process, methodology, and how you tackled the problem. Show your thinking.

## Key Decisions
The critical decisions made, trade-offs considered, and the reasoning behind each. This shows strategic thinking.

## Outcomes
Concrete results, metrics, and impact. Include both quantitative and qualitative outcomes. End with a brief reflection on what you learned.

Write in first person, professional yet conversational tone. Be specific and avoid vague buzzwords. Make it sound authentic and human.`;

  const stream = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    stream: true,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
