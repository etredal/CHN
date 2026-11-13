import React from 'react';
import { RefreshCw } from 'lucide-react';
import { usePwa } from '../../pwa';

/** Shown when a new version of the app has been downloaded in the background. */
export const UpdateToast: React.FC = () => {
  const { updateReady, applyUpdate } = usePwa();
  if (!updateReady) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-lg text-sm font-chinese-sans">
      <span>新版本已就绪</span>
      <button
        onClick={applyUpdate}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        更新
      </button>
    </div>
  );
};
