import { cn } from "@heroui/react";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-md bg-dark-200 dark:bg-dark-300",
            className
          )}
        />
      ))}
    </>
  );
}
