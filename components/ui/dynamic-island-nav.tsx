'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, ChevronDown } from 'lucide-react';

type DynamicIslandNavProps = {
  leading?: ReactNode;
  title?: ReactNode;
  trailing?: ReactNode;
  expandedContent?: ReactNode;
  initialOpen?: boolean;
  maxWidth?: number;
  minWidth?: number;
  onToggle?: (open: boolean) => void;
};

export function DynamicIslandNav({
  leading,
  title,
  trailing,
  expandedContent,
  initialOpen = false,
  maxWidth = 960,
  minWidth = 560,
  onToggle
}: DynamicIslandNavProps) {
  const [open, setOpen] = useState(initialOpen);
  const [hovered, setHovered] = useState(false);
  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      onToggle?.(next);
      return next;
    });
  };

  return (
    <TooltipProvider>
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center">
        <motion.div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="pointer-events-auto"
          initial={false}
          animate={{ scale: hovered ? 1.01 : 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.6 }}
        >
          <motion.div
            initial={false}
            animate={{
              width: open ? maxWidth : minWidth,
              borderRadius: 9999
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.6 }}
            className="relative mx-auto flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 shadow-sm backdrop-blur-md"
            role="toolbar"
            aria-label="Nawigacja"
          >
            <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-foreground/5 via-transparent to-foreground/5 blur-md" />

            <div className="flex items-center gap-1 pl-1">{leading}</div>

            <div className="flex-1 min-w-0">
              <div className="truncate text-center text-sm font-medium text-foreground/90">{title}</div>
            </div>

            <div className="flex items-center gap-1 pr-1">
              {trailing}
              <Separator orientation="vertical" className="mx-1 h-5" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={open ? 'Zwiń' : 'Rozwiń'}
                    onClick={toggle}
                    className="h-7 w-7"
                  >
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{open ? 'Zwiń panel' : 'Rozwiń panel'}</TooltipContent>
              </Tooltip>
            </div>
          </motion.div>

          <AnimatePresence initial={false}>
            {open && expandedContent && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, y: -6, scale: 0.995 }}
                animate={{ opacity: 1, y: 6, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.995 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.6 }}
                className="mx-auto mt-1.5 w-[--island-w] overflow-hidden"
                style={{ ['--island-w' as any]: `${maxWidth}px` } as React.CSSProperties}
              >
                <div className="rounded-2xl border bg-background/70 p-2 shadow-sm backdrop-blur-md">
                  {expandedContent}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
