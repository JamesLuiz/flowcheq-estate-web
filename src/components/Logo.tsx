import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Wrap the logo in a link to "/". Defaults to true. */
  withLink?: boolean;
  /** Show the "Flowcheq" wordmark next to the icon. Defaults to true. */
  showText?: boolean;
}

/**
 * Flowcheq Estate brand mark — an animated "flow" of nodes/connections.
 * Uses the primary brand signal colour (blue in light, cyan in dark).
 */
export const Logo = ({ className = "", withLink = true, showText = true }: LogoProps) => {
  const mark = (
    <motion.div
      className={cn(
        "flex items-center gap-2 font-bold text-xl tracking-tighter",
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary">
          <circle cx="6" cy="6" r="3" fill="currentColor" />
          <circle cx="18" cy="12" r="3" fill="currentColor" />
          <circle cx="6" cy="18" r="3" fill="currentColor" />

          <line
            x1="6"
            y1="6"
            x2="18"
            y2="12"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="2 2"
          />
          <line
            x1="18"
            y1="12"
            x2="6"
            y2="18"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="2 2"
          />

          <motion.circle
            cx="12"
            cy="9"
            r="1.5"
            fill="currentColor"
            animate={{ cx: [6, 18, 6], cy: [6, 12, 18] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>
      {showText && <span className="text-foreground">Flowcheq</span>}
    </motion.div>
  );

  if (!withLink) return mark;

  return (
    <Link to="/" aria-label="Flowcheq Estate home">
      {mark}
    </Link>
  );
};
