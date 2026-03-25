'use client';

import { cn } from '@/lib/utils';

type ModuleType = 'games' | 'chat' | 'messages' | 'spotify' | 'leaderboard' | 'tournaments' | 'events' | 'welcome';

interface Module {
  id: ModuleType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface ModulePanelProps {
  modules: Module[];
  activeModule: ModuleType;
  onModuleSelect: (module: ModuleType) => void;
}

export default function ModulePanel({
  modules,
  activeModule,
  onModuleSelect,
}: ModulePanelProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur overflow-hidden h-fit sticky top-4">
      <div className="p-4 border-b border-border/30">
        <h3 className="text-sm font-semibold text-foreground">MODULES</h3>
      </div>

      <nav className="space-y-1 p-2">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => onModuleSelect(module.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
              activeModule === module.id
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
            )}
          >
            <span className="flex-shrink-0">{module.icon}</span>
            <span className="flex-1 text-left truncate">{module.label}</span>
            {module.badge && (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-xs font-semibold">
                {module.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Settings Section */}
      <div className="border-t border-border/30 p-4 mt-4">
        <div className="space-y-2">
          <button className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-primary/10 transition-colors">
            Settings
          </button>
          <button className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-primary/10 transition-colors">
            Help
          </button>
        </div>
      </div>
    </div>
  );
}
