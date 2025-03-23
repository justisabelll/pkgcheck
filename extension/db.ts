import Dexie, { type Table } from 'dexie';
import { AnalyzePackageResponse } from './entrypoints/background';

interface AnalyzedPackage extends AnalyzePackageResponse {
  id?: number;
  packageName: string;
}

class AURAnalysisDatabase extends Dexie {
  analyzedPackages!: Table<AnalyzedPackage, number>; // number is the type of the primary key

  constructor() {
    super('AURAnalysisDB');

    this.version(1).stores({
      analyzedPackages: '++id, packageName, lastChecked',
    });
  }
}

const db = new AURAnalysisDatabase();

export type { AnalyzedPackage };
export { db };
