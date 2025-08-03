'use client';

import { memo } from 'react';
import { TriangleAlert } from 'lucide-react';

interface HeaderProps {
  connectionStatus: 'connected' | 'reconnecting' | 'stalled' | 'error';
  error: string | null;
}

export const Header = memo(({ connectionStatus, error }: HeaderProps) => {
  return (
    <div className="flex justify-end items-center mb-4">
      {connectionStatus === 'error' && error && (
        <div className="text-sm text-destructive font-semibold bg-destructive/10 border border-destructive/20 rounded-md px-3 py-1.5 flex items-center gap-2">
          <TriangleAlert className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
});

Header.displayName = 'Header';
