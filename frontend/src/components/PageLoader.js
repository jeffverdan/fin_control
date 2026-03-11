import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoader = ({ label = 'Carregando dados...' }) => {
  return (
    <div className="flex min-h-[24rem] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/80 p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
          <div>
            <p className="text-sm font-semibold">Sincronizando</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-2 w-5/6 rounded-full bg-muted/80 animate-pulse" />
          <div className="h-2 w-full rounded-full bg-muted/80 animate-pulse" />
          <div className="h-2 w-4/6 rounded-full bg-muted/80 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
