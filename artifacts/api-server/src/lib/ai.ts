import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const CONTRACT_EXTRACTION_PROMPT = `You are a legal and commercial contract analyst specializing in influencer and creator sponsorship agreements.

You will receive raw text extracted from a sponsorship contract PDF. Your task is to extract all structured information and return ONLY a valid JSON object. Do not include any explanation, markdown fences, or commentary — only the raw JSON.

Extract the following fields. If a field is not present in the contract, return null for that field or an empty array for array fields.

Return this exact JSON structure:
{
  "contract_title": string,
  "brand_name": string,
  "creator_name": string,
  "campaign_name": string,
  "total_payment": number,
  "currency": string,
  "payment_schedule": [
    { "milestone": string, "amount": number, "due_trigger": string }
  ],
  "deliverables": [
    {
      "title": string,
      "type": string,
      "platform": string,
      "quantity": number,
      "due_date": string,
      "format_requirements": string,
      "payment_amount": number,
      "requires_approval": boolean
    }
  ],
  "deadlines": [{ "event": string, "date": string }],
  "platforms": [string],
  "required_hashtags": [string],
  "required_mentions": [string],
  "required_links": [{ "label": string, "url": string }],
  "approval_requirements": string,
  "revision_terms": string,
  "usage_rights": string,
  "exclusivity_clauses": string,
  "late_payment_terms": string,
  "cancellation_terms": string,
  "risk_flags": [
    { "flag": string, "severity": "low"|"medium"|"high", "clause": string }
  ],
  "summary": string
}

Be precise. Extract exact dollar amounts, dates, hashtags, and platform names as written in the contract. For dates, use ISO 8601 format (YYYY-MM-DD). For payment amounts, extract the numeric value only.`;

const SENTIMENT_PROMPT = `You are a business communication analyst specializing in brand-creator relationships.

Analyze the following communication from a brand to a creator. Return ONLY valid JSON with this structure:

{
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "urgency_level": "low" | "medium" | "high" | "critical",
  "payment_risk": "low" | "medium" | "high",
  "scope_creep_risk": "low" | "medium" | "high",
  "key_concerns": [string],
  "positive_signals": [string],
  "warning_signals": [string],
  "tone_assessment": string,
  "tone_recommendation": string,
  "suggested_reply": string,
  "action_items": [string],
  "summary": string
}

Be specific and practical. The creator needs actionable intelligence, not generic advice.`;

const PERFORMANCE_REPORT_PROMPT = `You are a performance reporting assistant for influencer marketing campaigns.

Given the following campaign data and compliance results, generate a professional, sponsor-ready performance report in JSON format.

Return ONLY valid JSON with this structure:
{
  "executive_summary": string,
  "campaign_overview": {
    "campaign_name": string,
    "brand_name": string,
    "creator_name": string,
    "campaign_period": string,
    "total_deliverables": number,
    "completed_deliverables": number,
    "compliance_score": number
  },
  "deliverable_results": [
    {
      "title": string,
      "platform": string,
      "content_url": string,
      "published_date": string,
      "required_hashtags": [string],
      "hashtags_found": [string],
      "hashtags_missing": [string],
      "required_mentions": [string],
      "mentions_found": [string],
      "required_links": [string],
      "links_found": [string],
      "status": string,
      "notes": string
    }
  ],
  "overall_compliance_score": number,
  "recommendations": string,
  "next_steps": string
}`;

export async function extractContractData(text: string): Promise<Record<string, unknown>> {
  const client = getAnthropicClient();
  const chunks = chunkText(text, 12000);
  const textToProcess = chunks[0];

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${CONTRACT_EXTRACTION_PROMPT}\n\nContract text:\n${textToProcess}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  return JSON.parse(content.text);
}

export async function analyzeSentiment(text: string): Promise<Record<string, unknown>> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `${SENTIMENT_PROMPT}\n\nCommunication:\n${text}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  return JSON.parse(content.text);
}

export async function generatePerformanceReport(
  campaignData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${PERFORMANCE_REPORT_PROMPT}\n\nCampaign data:\n${JSON.stringify(campaignData, null, 2)}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  return JSON.parse(content.text);
}

function chunkText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}
