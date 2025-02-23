import { Message } from '../background';
import './style.css';

import { Button } from '@/components/button';

let currentUrl = await chrome.tabs
  .query({
    active: true,
    currentWindow: true,
  })
  .then((tabs) => tabs[0].url);

function analyzePackage() {
  chrome.runtime.sendMessage({
    type: 'analyzePackage',
    url: currentUrl,
  });
}

function App() {
  return (
    <div className="flex flex-col items-center p-8 bg-zinc-900 text-white w-[400px] h-[250 px]">
      <h1 className="text-4xl font-mono font-bold tracking-tight mb-3">
        PKGCHECK
      </h1>
      <p className="text-zinc-400 text-sm text-center max-w-xs mb-8">
        Helps you verify the safety of AUR packages before downloading them.
      </p>

      {currentUrl?.startsWith('https://aur.archlinux.org/packages/') ? (
        <div className="w-full max-w-sm rounded-xl bg-zinc-800/50 backdrop-blur p-6 shadow-lg ring-1 ring-white/10">
          <h2 className="text-lg font-medium mb-4 text-zinc-200">
            Package:{' '}
            <span className="text-white font-bold">
              {currentUrl?.split('/').pop()}
            </span>
          </h2>
          <Button
            color="blue"
            className="w-full cursor-pointer"
            onClick={analyzePackage}
          >
            Analyze Package
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-sm rounded-xl bg-red-950/20 p-6 ring-1 ring-red-500/20">
          <h2 className="text-lg font-medium mb-2 text-red-400">
            Not an AUR Package
          </h2>
          <p className="text-sm text-zinc-400">
            Please navigate to a valid AUR package page to analyze.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
