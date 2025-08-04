export interface SystemInfo {
  lastUpdated: string;
  database: {
    totalRecords: {
      panelLogs: number;
      campaignLogs: number;
      predictionLogs: number;
      total: number;
    };
    fileSizeMB: number;
    oldestRecord: string | null;
    newestRecord: string | null;
  };
  storage: {
    freeDiskSpaceGB: number;
    totalDiskSpaceGB: number;
    usedPercentage: number;
  };
}