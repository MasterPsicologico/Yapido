"use client";

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'fleet-report-status';

interface ReportStatus {
  lastGenerated: string | null;
  dismissed: boolean;
}

function getStoredStatus(): ReportStatus {
  if (typeof window === 'undefined') return { lastGenerated: null, dismissed: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { lastGenerated: null, dismissed: false };
  } catch {
    return { lastGenerated: null, dismissed: false };
  }
}

function setStoredStatus(status: ReportStatus): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
}

/**
 * Hook that checks every 60s whether the configured report time has been reached today.
 * Returns whether a report is available (not yet dismissed) and a function to dismiss.
 */
export function useReportScheduler(reportTime: string = '19:00') {
  const [isReportAvailable, setIsReportAvailable] = useState(false);

  const checkReportTime = useCallback(() => {
    const now = new Date();
    const [hours, minutes] = reportTime.split(':').map(Number);
    const todayKey = now.toISOString().slice(0, 10);
    const stored = getStoredStatus();

    // Already dismissed today
    if (stored.dismissed && stored.lastGenerated === todayKey) {
      setIsReportAvailable(false);
      return;
    }

    // Check if current time >= configured time
    if (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes)) {
      // Mark as generated today if not already
      if (stored.lastGenerated !== todayKey) {
        setStoredStatus({ lastGenerated: todayKey, dismissed: false });
      }
      setIsReportAvailable(true);
    } else {
      // Reset for new day
      if (stored.lastGenerated !== todayKey) {
        setStoredStatus({ lastGenerated: null, dismissed: false });
      }
      setIsReportAvailable(false);
    }
  }, [reportTime]);

  useEffect(() => {
    checkReportTime();
    const interval = setInterval(checkReportTime, 60_000);
    return () => clearInterval(interval);
  }, [checkReportTime]);

  const dismissReport = useCallback(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    setStoredStatus({ lastGenerated: todayKey, dismissed: true });
    setIsReportAvailable(false);
  }, []);

  return { isReportAvailable, dismissReport };
}
