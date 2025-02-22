import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './style.css';
function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#242424] text-white w-[400px] h-[500px]">
      <div className="flex justify-center gap-4">
        <a
          href="https://wxt.dev"
          target="_blank"
          className="p-6 transition-all duration-300 hover:drop-shadow-[0_0_0.5em_#54bc4ae0]"
        >
          <img src={wxtLogo} className="h-24 w-24" alt="WXT logo" />
        </a>
        <a
          href="https://react.dev"
          target="_blank"
          className="p-6 transition-all duration-300 hover:drop-shadow-[0_0_0.5em_#61dafbaa]"
        >
          <img
            src={reactLogo}
            className="h-24 w-24 motion-safe:animate-[spin_20s_linear_infinite]"
            alt="React logo"
          />
        </a>
      </div>
      <h1 className="text-5xl font-normal leading-tight mt-8">WXT + React</h1>
      <div className="p-8">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="rounded-lg border border-transparent bg-[#1a1a1a] px-5 py-2.5 text-base font-medium transition-colors hover:border-[#646cff] focus:outline-none focus:ring-4 focus:ring-[#646cff]/25"
        >
          count is {count}
        </button>
        <p className="mt-4 text-lg">
          Edit{' '}
          <code className="font-mono bg-[#1a1a1a] px-2 py-1 rounded">
            src/App.tsx
          </code>{' '}
          and save to test HMR
        </p>
      </div>
      <p className="text-white mt-4">
        Click on the WXT and React logos to learn more
      </p>
    </div>
  );
}

export default App;
