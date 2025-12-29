import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  verified?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const VerificationBadge = ({ 
  verified, 
  className,
  size = 'md'
}: VerificationBadgeProps) => {
  if (!verified) return null;

  return (
    <div className={cn('inline-flex items-center gap-1', className)} title="Verified Agent">
      <BadgeCheck className={cn(sizeClasses[size], 'text-primary fill-primary/20')} />
    </div>
  );
};
