import React, { useState } from 'react';
import { type AnalyzedPackage } from '@/db';
import { Button } from './button';
import { Strong } from './text';

interface AnalyzedPackageCardProps {
  data: AnalyzedPackage;
  onViewReport?: () => void;
}

export function AnalyzedPackageCard({
  data,
  onViewReport,
}: AnalyzedPackageCardProps) {
  const { summary, packageName, lastChecked } = data;
  const { riskLevel, riskColor, recommendation, keyPoints, topConcerns } =
    summary;

  const [expandedPoint, setExpandedPoint] = useState<number | null>(null);
  const [expandedConcern, setExpandedConcern] = useState<number | null>(null);

  const riskColorClasses = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const formattedDate = new Date(lastChecked).toLocaleString();

  const togglePoint = (index: number) => {
    setExpandedPoint(expandedPoint === index ? null : index);
  };

  const toggleConcern = (index: number) => {
    setExpandedConcern(expandedConcern === index ? null : index);
  };

  return (
    <div className="w-full max-w-sm rounded-xl bg-zinc-800/50 backdrop-blur p-4 shadow-lg ring-1 ring-white/10">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-400">Package</h2>
            <Strong className="text-lg">{packageName}</Strong>
          </div>
          <div
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskColorClasses[riskColor]} border`}
          >
            {riskLevel.toUpperCase()} RISK
          </div>
        </div>

        <div className="h-px bg-zinc-700/50 w-full"></div>

        <div>
          <p className="text-xs text-zinc-300 mb-2 leading-relaxed line-clamp-2">
            {summary.summary}
          </p>
          <div className="flex items-center gap-1">
            <Strong className="text-xs">Recommendation:</Strong>
            <span className="text-xs capitalize text-zinc-300">
              {recommendation}
            </span>
          </div>
        </div>

        {keyPoints.length > 0 && (
          <div className="bg-zinc-800/80 rounded-lg p-2">
            <Strong className="text-xs block mb-1">Key Points</Strong>
            <ul className="space-y-1 max-h-[80px] overflow-y-auto">
              {keyPoints.map((point, index) => (
                <li
                  key={index}
                  className="text-xs text-zinc-400 flex items-start"
                >
                  <span className="mr-1 text-zinc-500 flex-shrink-0">•</span>
                  <div className="leading-tight">
                    <span className="line-clamp-1">{point}</span>
                    {point.length > 50 && (
                      <button
                        onClick={() => togglePoint(index)}
                        className="text-blue-400 hover:text-blue-300 text-[10px]"
                      >
                        {expandedPoint === index ? 'Less' : 'More'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {topConcerns.length > 0 && (
          <div className="bg-red-900/10 rounded-lg p-2 border border-red-500/20">
            <Strong className="text-xs text-red-400 block mb-1">
              Top Concerns
            </Strong>
            <ul className="space-y-1 max-h-[80px] overflow-y-auto">
              {topConcerns.map((concern, index) => (
                <li
                  key={index}
                  className="text-xs text-zinc-300 flex items-start"
                >
                  <span className="mr-1 text-red-400 flex-shrink-0">!</span>
                  <div className="leading-tight">
                    <span className="line-clamp-1">{concern}</span>
                    {concern.length > 50 && (
                      <button
                        onClick={() => toggleConcern(index)}
                        className="text-blue-400 hover:text-blue-300 text-[10px]"
                      >
                        {expandedConcern === index ? 'Less' : 'More'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-1">
          {onViewReport && (
            <button
              className="w-full cursor-pointer mb-1 text-xs border border-blue-500 bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700"
              onClick={onViewReport}
            >
              View Full Report
            </button>
          )}
          <p className="text-[10px] text-zinc-500 text-center">
            Last analyzed: {formattedDate}
          </p>
        </div>
      </div>
    </div>
  );
}
