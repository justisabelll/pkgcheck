import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/input';
import { Button } from '@/components/button';
import { db, type AnalyzedPackage } from '@/db';
import { AnalyzedPackageCard } from '@/components/analyzed-package-card';

let currentUrl = await chrome.tabs
  .query({
    active: true,
    currentWindow: true,
  })
  .then((tabs) => tabs[0].url);

const savedPassword = await chrome.storage.local
  .get('password')
  .then((res) => res.password);

function App() {
  const [password, setPassword] = useState(savedPassword as string);
  const [pkgData, setPkgData] = useState<AnalyzedPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pkgName = currentUrl?.split('/').pop();

  // load cached data on initial render
  useEffect(() => {
    async function loadCachedData() {
      if (!pkgName) return;

      try {
        const cachedPkgData = await db.analyzedPackages
          .where('packageName')
          .equals(pkgName)
          .toArray();

        if (cachedPkgData.length > 0) {
          setPkgData(cachedPkgData[0]);
        }
      } catch (err) {
        console.error('Error loading cached data:', err);
      }
    }

    loadCachedData();
  }, [pkgName]);

  // set up message listener for background responses
  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === 'analyzePackageComplete') {
        setIsLoading(false);
        console.log('Analysis complete:', message);

        if (message.success && message.data) {
          setPkgData(message.data);
        } else if (!message.success) {
          setError(new Error(message.error || 'Analysis failed'));
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const analyzePackage = useCallback(async () => {
    if (!pkgName || !password) return;

    setIsLoading(true);
    setError(null);

    // check if package is already analyzed again
    const cachedPkgData = await db.analyzedPackages
      .where('packageName')
      .equals(pkgName)
      .toArray();

    if (cachedPkgData.length > 0) {
      setPkgData(cachedPkgData[0]);
      setIsLoading(false);
      return;
    }

    // request background analysis
    chrome.runtime.sendMessage({
      type: 'analyzePackage',
      url: currentUrl,
      password,
    });

    // the actual response will be handled by the useEffect listener
  }, [pkgName, password]);

  // force a new analysis, bypassing the cache
  const forceNewAnalysis = useCallback(async () => {
    if (!pkgName) return;

    setIsLoading(true);
    setError(null);

    // delete from local DB if exists
    await db.analyzedPackages.where('packageName').equals(pkgName).delete();

    // reset state and trigger new analysis
    setPkgData(null);

    // request background analysis
    chrome.runtime.sendMessage({
      type: 'analyzePackage',
      url: currentUrl,
      password,
    });
  }, [pkgName, password]);

  async function handlePasswordChange(password: string) {
    setPassword(password);
    await chrome.storage.local.set({ password });
  }

  async function resetPassword() {
    await chrome.storage.local.remove('password');
    setPassword('');
  }

  function handleViewReport() {
    // This could open a new tab with the full report
    alert('Full report details would be shown here');
  }

  return (
    <div className="flex flex-col items-center p-4  bg-zinc-900 text-white w-[400px] ">
      <h1 className="text-3xl font-mono font-bold tracking-tight mb-2">
        PKGCHECK
      </h1>
      <p className="text-zinc-400 text-xs text-center max-w-xs mb-2">
        Helps you verify the safety of AUR packages before downloading them.
      </p>
      {password ? (
        currentUrl?.startsWith('https://aur.archlinux.org/packages/') ? (
          <div className="w-full">
            {error ? (
              <div className="w-full max-w-sm rounded-xl bg-red-950/20 p-6 ring-1 ring-red-500/20">
                <h2 className="text-lg font-medium mb-2 text-red-400">
                  Error analyzing package
                </h2>
                <p className="text-sm text-zinc-400">
                  {error.message ||
                    'There was an error analyzing this package. Please try again.'}
                </p>
                <Button
                  color="pink"
                  className="w-full cursor-pointer mt-4"
                  onClick={analyzePackage}
                >
                  Retry
                </Button>
              </div>
            ) : pkgData ? (
              <>
                <AnalyzedPackageCard
                  data={pkgData}
                  onViewReport={handleViewReport}
                />
                <div className="flex justify-center mt-3">
                  <button
                    className="text-xs text-blue-500 bg-blue-900/20 px-3 py-1 rounded-full hover:bg-blue-900/30 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={forceNewAnalysis}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-1">
                        <span className="loader"></span> Analyzing...
                      </span>
                    ) : (
                      'Reanalyze package'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full max-w-sm rounded-xl bg-zinc-800/50 backdrop-blur p-6 shadow-lg ring-1 ring-white/10">
                <h2 className="text-lg font-medium mb-4 text-zinc-200">
                  Package:{' '}
                  <span className="text-white font-bold">{pkgName}</span>
                </h2>
                <Button
                  color="pink"
                  className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={analyzePackage}
                  disabled={isLoading}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Package'}
                </Button>
                <button
                  className="text-xs text-zinc-400 underline hover:text-zinc-300 mt-4 hover:cursor-pointer"
                  onClick={resetPassword}
                >
                  Reset password (Only affects extension)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="w-full max-w-sm rounded-xl bg-red-950/20 p-6 ring-1 ring-red-500/20">
              <h2 className="text-lg font-medium mb-2 text-red-400">
                Not an AUR Package
              </h2>
              <p className="text-sm text-zinc-400">
                Please navigate to a valid AUR package page to analyze.
              </p>
            </div>
            <button
              className="text-xs text-zinc-400 underline hover:text-zinc-300 mt-4 hover:cursor-pointer"
              onClick={resetPassword}
            >
              Reset password (Only affects extension)
            </button>
          </div>
        )
      ) : (
        <div className="w-full max-w-sm rounded-xl bg-zinc-800/50 backdrop-blur p-6 shadow-lg ring-1 ring-white/10">
          <div className="flex flex-col gap-2">
            <p className="text-xs mb-4 text-zinc-200">
              Please enter the password (auth token) you setup for your server.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handlePasswordChange(formData.get('password') as string);
              }}
            >
              <Input type="password" placeholder="Password" name="password" />
              <Button
                color="blue"
                className="w-full cursor-pointer mt-2"
                type="submit"
              >
                Save Password
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
