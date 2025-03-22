import { generateText, generateObject } from 'ai';
import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import {
  createGoogleGenerativeAI,
  GoogleGenerativeAIProvider,
} from '@ai-sdk/google';
import { z } from 'zod';

import { PkgData, Summary } from './utils';
import { Env } from '../env.config';

const reportSystemPrompt = `
<system_context>
You are an advanced AUR package safety analyzer. You evaluate Arch Linux packages by examining their PKGBUILD, metadata, and community feedback to assess security risks and trustworthiness. You rely on your own knowledge and reasoning to identify potential risks, as you do not have access to real-time data or external databases, however the information you are provided about the package is up to date.
</system_context>

<analysis_guidelines>
- Focus on concrete security indicators, such as:
  - Unsafe practices in PKGBUILD (e.g., unverified sources, unchecked scripts)
  - Signs of malicious intent (e.g., obfuscated code, unusual behavior)
  - Verification-related fields in PKGBUILD (e.g., \`validpgpkeys\`, checksum validation)
- Highlight both positive and negative findings, with examples where possible.
- Evaluate trust signals based on general patterns, including:
  - Package popularity (e.g., general advice about votes/downloads)
  - Update frequency (e.g., outdated or orphaned packages)
  - Maintainer track record (e.g., responsiveness, history of contributions)
  - Community sentiment (e.g., general advice about checking forums or comments)
- Provide clear, actionable conclusions with a risk score (e.g., low/medium/high risk).
- Maintain a professional tone that is clear and concise, suitable for technical users.
</analysis_guidelines>

<output_format>
Generate a security report with these sections, you should not respond with anything else than the report:

1. **TRUST SIGNALS**
   - Package popularity and update frequency (based on general patterns; advise users to check AUR page for votes/downloads)
   - Maintainer track record (based on metadata or general advice)
   - Community sentiment summary (general advice about checking forums or comments)

2. **SECURITY ANALYSIS**
   - PKGBUILD inspection results (e.g., unsafe practices, unverified sources)
   - Dependency evaluation (e.g., outdated libraries, general risks)
   - Identified risk patterns (e.g., obfuscated code, unusual behavior)

3. **VERDICT**
   - Risk score (e.g., low/medium/high risk)
   - Clear install recommendation (e.g., safe to install, proceed with caution, avoid)
   - Key concerns (if any)
   - Suggested precautions (e.g., verify sources, sandbox installation, manually check votes/downloads)
   - Important information to know from the comments.

Use markdown for formatting to ensure readability.
</output_format>
`;

const summarizeSystemPrompt = `
<system_context>
You are a UI content specialist for a Chrome extension that analyzes AUR package safety. Your job is to transform detailed security reports into concise, user-friendly summaries that can be displayed in a browser extension popup. Focus on clarity, brevity, and actionable information.
</system_context>

<input_format>
You will receive a detailed security report with sections on trust signals, security analysis, and a verdict for an AUR package.
</input_format>

<task>
Transform the detailed report into a concise, visually scannable summary suitable for a Chrome extension popup. Extract the most critical information while preserving the overall security assessment.
</task>

<output_requirements>
Your response should include:

1. The name of the AUR package being analyzed.

2. A risk assessment with:
   - A clear risk level (low, medium, or high)
   - A color indicator (green, yellow, or red)
   - A one-sentence overall assessment (max 100 characters)

3. A clear recommendation (install, proceed with caution, or avoid)

4. 3-5 key points that highlight the most important findings (keep each under 80 characters)

5. Top concerns (if any exist)

6. Recommended precautions (if needed)

7. Important information to know from the comments.
</output_requirements>
`;

const getModels = (
  openai: OpenAIProvider,
  google: GoogleGenerativeAIProvider
) => ({
  models: {
    openai: {
      models: {
        openAiO3Mini: openai('o3-mini'),
        openAiO1Mini: openai('o1-mini'),
        openAiGpt4: openai('gpt-4o'),
        openAiGpt4Mini: openai('gpt-4o-mini'),
      },
    },
    google: {
      models: {
        geminiFlashThinkingExperimental: google(
          'gemini-2.0-flash-thinking-exp-01-21'
        ),
        geminiFlash2Experimental: google('gemini-2.0-flash-001'),
        geminiPro2Experimental: google('gemini-2.0-pro-exp-02-05'),
        geminiFlashStable: google('gemini-1.5-flash'),
        geminiProStable: google('gemini-1.5-pro'),
      },
    },
  },
});

export const generateReport = async (pkgData: PkgData, env: Env) => {
  const openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const google = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_API_KEY,
  });

  const ai = getModels(openai, google);

  const { text } = await generateText({
    model: ai.models.openai.models.openAiO3Mini,
    system: reportSystemPrompt,
    messages: [
      {
        role: 'user',
        content: `Analyze the following package and provide a detailed report:

        Metadata: ${JSON.stringify(pkgData.metadata, null, 2)}
        PKGBUILD: ${JSON.stringify(pkgData.build, null, 2)}
        Comments: ${JSON.stringify(pkgData.comments, null, 2)}`,
      },
    ],
  });

  return text;
};

export const summarizeReport = async (
  report: string,
  env: Env
): Promise<Summary> => {
  const openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const summary = await generateObject({
    model: openai('gpt-4o-mini', {
      structuredOutputs: true,
    }),
    system: summarizeSystemPrompt,
    schemaName: 'AUR Package Report Summary',
    schemaDescription: 'A summary of the AUR package report',
    schema: z.object({
      name: z.string(),
      riskLevel: z.enum(['low', 'medium', 'high']),
      riskColor: z.enum(['green', 'yellow', 'red']),
      summary: z.string(),
      recommendation: z.enum(['install', 'proceed with caution', 'avoid']),
      keyPoints: z.array(z.string()),
      topConcerns: z.array(z.string()),
      commentsFYI: z.string(),
    }),
    prompt: `Summarize the following report:
        ${report}`,
  });

  return summary.object;
};
