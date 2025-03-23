import { db, type AnalyzedPackage } from '../db';

const API_URL =
  process.env.NODE_ENV === 'development' ? 'http://localhost:8787/analyze' : '';

export interface Message {
  type: 'analyzePackage';
  url: string;
  password: string;
}

export interface AnalyzePackageResponse {
  summary: PackageSummary;
  report: string;
  lastChecked: Date;
}

export interface PackageSummary {
  riskLevel: 'low' | 'medium' | 'high';
  riskColor: 'green' | 'yellow' | 'red';
  summary: string;
  recommendation: 'install' | 'proceed with caution' | 'avoid';
  keyPoints: string[];
  topConcerns: string[];
  commentsFYI: string;
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      switch (message.type) {
        case 'analyzePackage':
          console.log('Analyzing package:', message.url);
          const packageName = message.url.split('/').pop();

          (async () => {
            const result = await tryCatch<AnalyzePackageResponse>(
              fetch(`${API_URL}?package=${packageName}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${message.password}`,
                },
              }).then((response) => {
                if (!response.ok) {
                  throw new Error(
                    `API request failed with status ${response.status}`
                  );
                }
                return response.json();
              })
            );

            if (result.error) {
              console.error('Error analyzing package:', result.error);
              chrome.runtime.sendMessage({
                type: 'analyzePackageComplete',
                success: false,
                packageName: packageName,
                error: result.error.message,
              });
            } else {
              const dataToSave: AnalyzedPackage = {
                packageName: packageName!,
                summary: result!.data.summary,
                report: result!.data.report,
                lastChecked: new Date(),
              };

              await db.analyzedPackages.add(dataToSave);

              // send message back to popup with the results
              chrome.runtime.sendMessage({
                type: 'analyzePackageComplete',
                success: true,
                packageName: packageName,
                data: dataToSave,
              });
            }
          })();
          // always return true to indicate we'll respond asynchronously
          return true;
      }
    }
  );

  async function tryCatch<T, E = Error>(
    promise: Promise<T>
  ): Promise<Result<T, E>> {
    try {
      const data = await promise;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as E };
    }
  }

  type Success<T> = {
    data: T;
    error: null;
  };

  type Failure<E> = {
    data: null;
    error: E;
  };

  type Result<T, E = Error> = Success<T> | Failure<E>;
});
