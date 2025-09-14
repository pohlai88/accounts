/**
 * Enhanced Animations and Transitions for Validation Components
 * Provides smooth, accessible animations using framer-motion
 */

import React, { memo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { AlertCircle, AlertTriangle, Info, Lightbulb, CheckCircle } from "lucide-react";
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "@/lib/validation/gl-entry-validator";
import { useValidationI18n } from "./ValidationI18nProvider";
import { useValidationClasses, useValidationTheme } from "./ValidationThemeProvider";

interface AnimatedValidationDisplayProps {
  validation: ValidationResult | null;
  showSuggestions?: boolean;
  className?: string;
  animationPreset?: "subtle" | "smooth" | "bouncy" | "fast";
  enableStagger?: boolean;
  enableHover?: boolean;
  enableFocus?: boolean;
}

/**
 * Animation variants for different presets
 */
const getAnimationVariants = (preset: string, theme: any): Record<string, Variants> => {
  const duration = preset === "fast" ? 0.15 : preset === "bouncy" ? 0.4 : 0.25;
  const ease = preset === "bouncy" ? [0.68, -0.55, 0.265, 1.55] : "easeOut";

  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: duration * 0.8,
          ease,
          staggerChildren: 0.1,
          delayChildren: 0.05,
        },
      },
      exit: {
        opacity: 0,
        transition: { duration: duration * 0.6, ease: "easeIn" },
      },
    },

    item: {
      hidden: {
        opacity: 0,
        y: preset === "subtle" ? 10 : 20,
        scale: preset === "bouncy" ? 0.9 : 1,
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration,
          ease,
          type: preset === "bouncy" ? "spring" : "tween",
          ...(preset === "bouncy" && {
            stiffness: 300,
            damping: 20,
          }),
        },
      },
      exit: {
        opacity: 0,
        y: -10,
        scale: 0.95,
        transition: { duration: duration * 0.6, ease: "easeIn" },
      },
    },

    card: {
      hidden: {
        opacity: 0,
        y: preset === "subtle" ? 15 : 30,
        scale: preset === "bouncy" ? 0.95 : 1,
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: duration * 1.2,
          ease,
          type: preset === "bouncy" ? "spring" : "tween",
        },
      },
      exit: {
        opacity: 0,
        y: -15,
        scale: 0.98,
        transition: { duration: duration * 0.8, ease: "easeIn" },
      },
    },

    icon: {
      hidden: {
        opacity: 0,
        scale: 0.5,
        rotate: preset === "bouncy" ? -180 : 0,
      },
      visible: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: {
          duration: duration * 1.5,
          ease,
          type: preset === "bouncy" ? "spring" : "tween",
          delay: 0.1,
        },
      },
      exit: {
        opacity: 0,
        scale: 0.8,
        transition: { duration: duration * 0.5 },
      },
    },

    badge: {
      hidden: { opacity: 0, scale: 0.8, x: -10 },
      visible: {
        opacity: 1,
        scale: 1,
        x: 0,
        transition: {
          duration: duration * 0.8,
          ease,
          delay: 0.15,
        },
      },
      exit: {
        opacity: 0,
        scale: 0.9,
        x: 10,
        transition: { duration: duration * 0.4 },
      },
    },
  };
};

/**
 * Hover and focus animation variants
 */
const interactionVariants: Variants = {
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
  focus: {
    scale: 1.01,
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.5)",
    transition: { duration: 0.15 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

/**
 * Animated validation error item
 */
export const AnimatedValidationErrorItem = memo(function AnimatedValidationErrorItem({
  error,
  animationPreset = "smooth",
  enableHover = true,
  enableFocus = true,
  index = 0,
}: {
  error: ValidationError;
  animationPreset?: string;
  enableHover?: boolean;
  enableFocus?: boolean;
  index?: number;
}) {
  const theme = useValidationTheme();
  const classes = useValidationClasses("error");
  const variants = getAnimationVariants(animationPreset, theme);

  return (
    <motion.div
      variants={variants.item}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={enableHover ? interactionVariants.hover : undefined}
      whileFocus={enableFocus ? interactionVariants.focus : undefined}
      whileTap="tap"
      className={`flex items-start gap-3 ${classes.item} cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50`}
      tabIndex={0}
      role="button"
      aria-label={`Error: ${error.message}`}
      style={{
        transformOrigin: "center",
        backfaceVisibility: "hidden", // Prevent flickering
      }}
    >
      <motion.div variants={variants.icon}>
        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <motion.div
          className="flex items-center gap-2 mb-1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
        >
          <span className="font-medium text-red-800 dark:text-red-200">{error.field}</span>
          <motion.div variants={variants.badge}>
            <span className={`text-xs px-2 py-1 rounded ${classes.badge}`}>
              {error.category.replace("_", " ")}
            </span>
          </motion.div>
        </motion.div>

        <motion.p
          className="text-sm text-red-700 dark:text-red-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
        >
          {error.message}
        </motion.p>

        <motion.p
          className="text-xs text-red-600 dark:text-red-400 font-mono mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.3, duration: 0.3 }}
        >
          Code: {error.code}
        </motion.p>
      </div>
    </motion.div>
  );
});

/**
 * Animated validation warning item
 */
export const AnimatedValidationWarningItem = memo(function AnimatedValidationWarningItem({
  warning,
  animationPreset = "smooth",
  enableHover = true,
  enableFocus = true,
  index = 0,
}: {
  warning: ValidationWarning | (ValidationError & { impact?: string });
  animationPreset?: string;
  enableHover?: boolean;
  enableFocus?: boolean;
  index?: number;
}) {
  const theme = useValidationTheme();
  const classes = useValidationClasses("warning");
  const variants = getAnimationVariants(animationPreset, theme);

  return (
    <motion.div
      variants={variants.item}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={enableHover ? interactionVariants.hover : undefined}
      whileFocus={enableFocus ? interactionVariants.focus : undefined}
      whileTap="tap"
      className={`flex items-start gap-3 ${classes.item} cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50`}
      tabIndex={0}
      role="button"
      aria-label={`Warning: ${warning.message}`}
      style={{
        transformOrigin: "center",
        backfaceVisibility: "hidden",
      }}
    >
      <motion.div variants={variants.icon}>
        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <motion.div
          className="flex items-center gap-2 mb-1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
        >
          <span className="font-medium text-yellow-800 dark:text-yellow-200">{warning.field}</span>
          <motion.div variants={variants.badge}>
            <span className={`text-xs px-2 py-1 rounded ${classes.badge}`}>
              {(warning as any).impact || "medium"}
            </span>
          </motion.div>
        </motion.div>

        <motion.p
          className="text-sm text-yellow-700 dark:text-yellow-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
        >
          {warning.message}
        </motion.p>

        <motion.p
          className="text-xs text-yellow-600 dark:text-yellow-400 font-mono mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.3, duration: 0.3 }}
        >
          Code: {warning.code}
        </motion.p>
      </div>
    </motion.div>
  );
});

/**
 * Animated validation info item
 */
export const AnimatedValidationInfoItem = memo(function AnimatedValidationInfoItem({
  info,
  animationPreset = "smooth",
  enableHover = true,
  enableFocus = true,
  index = 0,
}: {
  info: ValidationError;
  animationPreset?: string;
  enableHover?: boolean;
  enableFocus?: boolean;
  index?: number;
}) {
  const theme = useValidationTheme();
  const classes = useValidationClasses("info");
  const variants = getAnimationVariants(animationPreset, theme);

  return (
    <motion.div
      variants={variants.item}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={enableHover ? interactionVariants.hover : undefined}
      whileFocus={enableFocus ? interactionVariants.focus : undefined}
      whileTap="tap"
      className={`flex items-start gap-3 ${classes.item} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
      tabIndex={0}
      role="button"
      aria-label={`Info: ${info.message}`}
      style={{
        transformOrigin: "center",
        backfaceVisibility: "hidden",
      }}
    >
      <motion.div variants={variants.icon}>
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <motion.div
          className="flex items-center gap-2 mb-1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
        >
          <span className="font-medium text-blue-800 dark:text-blue-200">{info.field}</span>
        </motion.div>

        <motion.p
          className="text-sm text-blue-700 dark:text-blue-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
        >
          {info.message}
        </motion.p>
      </div>
    </motion.div>
  );
});

/**
 * Animated validation suggestion item
 */
export const AnimatedValidationSuggestionItem = memo(function AnimatedValidationSuggestionItem({
  suggestion,
  animationPreset = "smooth",
  enableHover = true,
  enableFocus = true,
  index = 0,
}: {
  suggestion: string;
  animationPreset?: string;
  enableHover?: boolean;
  enableFocus?: boolean;
  index?: number;
}) {
  const theme = useValidationTheme();
  const classes = useValidationClasses("success");
  const variants = getAnimationVariants(animationPreset, theme);

  return (
    <motion.div
      variants={variants.item}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={enableHover ? interactionVariants.hover : undefined}
      whileFocus={enableFocus ? interactionVariants.focus : undefined}
      whileTap="tap"
      className={`flex items-start gap-3 ${classes.item} cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50`}
      tabIndex={0}
      role="button"
      aria-label={`Suggestion: ${suggestion}`}
      style={{
        transformOrigin: "center",
        backfaceVisibility: "hidden",
      }}
    >
      <motion.div variants={variants.icon}>
        <Lightbulb className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <motion.p
          className="text-sm text-green-700 dark:text-green-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
        >
          {suggestion}
        </motion.p>
      </div>
    </motion.div>
  );
});

/**
 * Animated validation progress bar
 */
export const AnimatedValidationProgress = memo(function AnimatedValidationProgress({
  total,
  validated,
  errors,
  animationPreset = "smooth",
}: {
  total: number;
  validated: number;
  errors: number;
  animationPreset?: string;
}) {
  const i18n = useValidationI18n();
  const theme = useValidationTheme();

  const safeTotal = Math.max(0, total);
  const safeValidated = Math.min(Math.max(0, validated), safeTotal);
  const safeErrors = Math.min(Math.max(0, errors), safeValidated);

  const validatedPct = safeTotal ? (safeValidated / safeTotal) * 100 : 0;
  const errorPctOfValidated = safeValidated ? (safeErrors / safeValidated) * 100 : 0;

  const duration = animationPreset === "fast" ? 0.5 : animationPreset === "bouncy" ? 1.2 : 0.8;

  return (
    <motion.div
      className="space-y-2"
      aria-label={i18n.validationProgressLabel}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          Progress: {safeValidated}/{safeTotal}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {Math.round(validatedPct)}%
        </motion.span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
        <div className="relative h-2">
          {/* Validated progress */}
          <motion.div
            className="h-full bg-green-500 transition-all"
            initial={{ width: 0 }}
            animate={{ width: `${validatedPct}%` }}
            transition={{
              duration,
              ease: animationPreset === "bouncy" ? [0.68, -0.55, 0.265, 1.55] : "easeOut",
              delay: 0.3,
            }}
          />

          {/* Error segment */}
          <motion.div
            className="h-full bg-red-500 -mt-2"
            initial={{ width: 0 }}
            animate={{ width: `${(validatedPct * errorPctOfValidated) / 100}%` }}
            transition={{
              duration: duration * 0.8,
              ease: "easeOut",
              delay: 0.6,
            }}
          />
        </div>
      </div>

      {safeErrors > 0 && (
        <motion.div
          className="text-xs text-red-600 dark:text-red-400"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          {safeErrors} errors found
        </motion.div>
      )}
    </motion.div>
  );
});

/**
 * Animated validation status indicator
 */
export const AnimatedValidationStatusIndicator = memo(function AnimatedValidationStatusIndicator({
  isValidating,
  isValid,
  hasErrors,
  hasWarnings,
  animationPreset = "smooth",
}: {
  isValidating: boolean;
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  animationPreset?: string;
}) {
  const i18n = useValidationI18n();

  const getStatusConfig = () => {
    if (isValidating) {
      return {
        icon: (
          <motion.div
            className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ),
        text: i18n.validating,
        color: "text-blue-600 dark:text-blue-400",
        role: "status",
        ariaBusy: true,
      };
    }

    if (hasErrors) {
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        text: i18n.hasErrors,
        color: "text-red-600 dark:text-red-400",
        role: "status",
        ariaBusy: false,
      };
    }

    if (hasWarnings) {
      return {
        icon: <AlertTriangle className="h-3 w-3" />,
        text: i18n.hasWarnings,
        color: "text-yellow-600 dark:text-yellow-400",
        role: "status",
        ariaBusy: false,
      };
    }

    if (isValid) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: i18n.valid,
        color: "text-green-600 dark:text-green-400",
        role: "status",
        ariaBusy: false,
      };
    }

    return null;
  };

  const config = getStatusConfig();
  if (!config) return null;

  const duration = animationPreset === "fast" ? 0.15 : animationPreset === "bouncy" ? 0.4 : 0.25;

  return (
    <motion.div
      className={`flex items-center gap-2 text-sm ${config.color}`}
      role={config.role}
      aria-busy={config.ariaBusy}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration,
        ease: animationPreset === "bouncy" ? [0.68, -0.55, 0.265, 1.55] : "easeOut",
      }}
    >
      <motion.div
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ delay: 0.1, duration: duration * 1.5 }}
      >
        {config.icon}
      </motion.div>
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: duration }}
      >
        {config.text}
      </motion.span>
    </motion.div>
  );
});

/**
 * Main animated validation display component
 */
export function AnimatedValidationDisplay({
  validation,
  showSuggestions = true,
  className = "",
  animationPreset = "smooth",
  enableStagger = true,
  enableHover = true,
  enableFocus = true,
}: AnimatedValidationDisplayProps) {
  const i18n = useValidationI18n();
  const theme = useValidationTheme();

  if (!validation) return null;

  const { errors, warnings: rawWarnings, suggestions } = validation;
  const variants = getAnimationVariants(animationPreset, theme);

  // Group errors by severity
  const hardErrors = errors.filter(e => e.severity === "error");
  const warningErrors = errors.filter(e => e.severity === "warning");
  const infos = errors.filter(e => e.severity === "info");

  const warnings = [
    ...warningErrors.map(w => ({ ...w, impact: (w as any).impact ?? "medium" })),
    ...rawWarnings.map(w => ({ ...w, severity: "warning" as const })),
  ];

  return (
    <motion.div
      className={`space-y-3 ${className}`}
      aria-live="polite"
      aria-relevant="additions text"
      variants={variants.container}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <AnimatePresence mode="popLayout">
        {/* Hard Errors */}
        {hardErrors.length > 0 && (
          <motion.div
            key="errors"
            variants={variants.card}
            className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4 rounded-lg"
          >
            <motion.div
              className="flex items-center gap-2 mb-3 text-red-800 dark:text-red-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">
                {i18n.validationErrors} ({hardErrors.length})
              </span>
            </motion.div>

            <motion.div
              className="space-y-2"
              variants={enableStagger ? variants.container : undefined}
              initial={enableStagger ? "hidden" : undefined}
              animate={enableStagger ? "visible" : undefined}
            >
              {hardErrors.map((error, index) => (
                <AnimatedValidationErrorItem
                  key={`${error.code}:${error.field}:${error.message}`}
                  error={error}
                  animationPreset={animationPreset}
                  enableHover={enableHover}
                  enableFocus={enableFocus}
                  index={index}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <motion.div
            key="warnings"
            variants={variants.card}
            className="border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-4 rounded-lg"
          >
            <motion.div
              className="flex items-center gap-2 mb-3 text-yellow-800 dark:text-yellow-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Warnings ({warnings.length})</span>
            </motion.div>

            <motion.div
              className="space-y-2"
              variants={enableStagger ? variants.container : undefined}
              initial={enableStagger ? "hidden" : undefined}
              animate={enableStagger ? "visible" : undefined}
            >
              {warnings.map((warning, index) => (
                <AnimatedValidationWarningItem
                  key={`${warning.code}:${warning.field}:${warning.message}`}
                  warning={warning}
                  animationPreset={animationPreset}
                  enableHover={enableHover}
                  enableFocus={enableFocus}
                  index={index}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Info Items */}
        {infos.length > 0 && (
          <motion.div
            key="infos"
            variants={variants.card}
            className="border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-4 rounded-lg"
          >
            <motion.div
              className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Info className="h-4 w-4" />
              <span className="font-medium">
                {i18n.information} ({infos.length})
              </span>
            </motion.div>

            <motion.div
              className="space-y-2"
              variants={enableStagger ? variants.container : undefined}
              initial={enableStagger ? "hidden" : undefined}
              animate={enableStagger ? "visible" : undefined}
            >
              {infos.map((info, index) => (
                <AnimatedValidationInfoItem
                  key={`${info.code}:${info.field}:${info.message}`}
                  info={info}
                  animationPreset={animationPreset}
                  enableHover={enableHover}
                  enableFocus={enableFocus}
                  index={index}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            key="suggestions"
            variants={variants.card}
            className="border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4 rounded-lg"
          >
            <motion.div
              className="flex items-center gap-2 mb-3 text-green-800 dark:text-green-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Lightbulb className="h-4 w-4" />
              <span className="font-medium">Suggestions ({suggestions.length})</span>
            </motion.div>

            <motion.div
              className="space-y-2"
              variants={enableStagger ? variants.container : undefined}
              initial={enableStagger ? "hidden" : undefined}
              animate={enableStagger ? "visible" : undefined}
            >
              {suggestions.map((suggestion, index) => (
                <AnimatedValidationSuggestionItem
                  key={`suggestion-${index}`}
                  suggestion={suggestion}
                  animationPreset={animationPreset}
                  enableHover={enableHover}
                  enableFocus={enableFocus}
                  index={index}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AnimatedValidationDisplay;
