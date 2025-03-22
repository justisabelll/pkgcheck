import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

import { PkgData } from './utils';
import { EnvStore } from '../env.config';

const systemPrompt = (pkgData: PkgData) => `
<system_context>
You are an advanced AUR package safety analyzer. You evaluate Arch Linux packages by examining their PKGBUILD, metadata, and community feedback to assess security risks and trustworthiness.
</system_context>

<analysis_guidelines>
- focus on concrete security indicators and trust signals
- highlight both positive and negative findings
- provide clear, actionable conclusions
- maintain professional but conversational tone
</analysis_guidelines>

<output_format>
Generate a security report with these sections:

1. TRUST SIGNALS
- package popularity and update frequency
- maintainer track record
- community sentiment summary

2. SECURITY ANALYSIS
- PKGBUILD inspection results
- dependency evaluation
- identified risk patterns

3. VERDICT
- clear install recommendation
- key concerns (if any)
- suggested precautions

Keep sections concise but thorough. Use markdown for formatting.
</output_format>

<package_context>
Metadata: ${pkgData.metadata}

PKGBUILD: ${pkgData.build}

Comments: ${pkgData.comments}
</package_context>
`;

const getModels = () => ({
  openai: {
    apiKey: EnvStore.get().OPENAI_API_KEY,
    models: {
      openAiO3Mini: openai('o3-mini', {
        reasoningEffort: 'high',
      }),
      openAiO1Mini: openai('o1-mini', {
        reasoningEffort: 'high',
      }),
      openAiGpt4: openai('gpt-4'),
      openAiGpt4Mini: openai('gpt-4-mini'),
    },
    google: {
      apiKey: EnvStore.get().GOOGLE_API_KEY,
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

export const aiAnalysis = async (pkgData: PkgData) => {
  const models = getModels();
  const { text } = await generateText({
    model: openai('o3-mini', {
      reasoningEffort: 'high',
    }),
    system: systemPrompt(pkgData),
    messages: [
      {
        role: 'user',
        content: 'Analyze the package and provide a detailed report.',
      },
    ],
  });

  return text;
};

// Function that calls all models and returns comparison results
export const compareModels = async (pkgData: PkgData) => {
  const models = getModels();

  // Flatten models object into array of model configs
  const modelConfigs = Object.entries(models.openai.models)
    .map(([name, model]) => ({
      name,
      model,
    }))
    .concat(
      Object.entries(models.openai.google.models).map(([name, model]) => ({
        name,
        model,
      }))
    );

  // Run analysis with each model
  const results = await Promise.all(
    modelConfigs.map(async ({ name, model }) => {
      const { text } = await generateText({
        model,
        system: systemPrompt(pkgData),
        messages: [
          {
            role: 'user',
            content: 'Analyze the package and provide a detailed report.',
          },
        ],
      });

      return {
        model: name,
        result: text,
      };
    })
  );

  return results;
};
