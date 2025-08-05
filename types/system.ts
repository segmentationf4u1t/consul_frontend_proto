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
  system: {
    cpu: {
      cores: number;
      model: string;
      usage: number; // Average CPU usage percentage
      loadAverage: {
        oneMinute: number;
        fiveMinutes: number;
        fifteenMinutes: number;
      };
    };
    memory: {
      totalGB: number;
      freeGB: number;
      usedGB: number;
      usagePercentage: number;
    };
  };
}