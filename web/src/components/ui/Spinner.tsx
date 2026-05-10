import { cn } from '../../lib/utils';

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string; }

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClass = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-[3px]' }[size];
  return (
    <div
      className={cn(
        'rounded-full border-brand-500 border-t-transparent animate-spin',
        sizeClass,
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-surface-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
          <span className="text-white font-bold text-xl">E3</span>
        </div>
        <Spinner size="lg" />
        <p className="text-gray-400 text-sm animate-pulse-slow">Loading platform…</p>
      </div>
    </div>
  );
}

interface SkeletonProps { className?: string; }
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton h-4 w-full', className)} />;
}
