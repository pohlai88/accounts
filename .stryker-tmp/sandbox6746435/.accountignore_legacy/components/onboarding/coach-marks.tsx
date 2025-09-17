/**
 * Contextual Coach Marks System
 * 5 contextual UI tips with real element targeting - not a slideshow
 */
// @ts-nocheck


"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ArrowRight,
  Search,
  FileText,
  Calculator,
  Banknote,
  Shield,
  Sparkles,
  Zap,
  Target,
} from "lucide-react";

interface CoachMark {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: "top" | "bottom" | "left" | "right";
  icon: React.ComponentType<{ className?: string }>;
  actionText?: string;
  actionUrl?: string;
  celebration?: boolean;
}

interface CoachMarksProps {
  isActive: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

const COACH_MARKS: CoachMark[] = [
  {
    id: "global-search",
    title: "Global Search (⌘K)",
    description:
      'Press ⌘K anywhere to search or create anything. Try typing "Create invoice" right now!',
    targetSelector: '[data-coach="global-search"]',
    position: "bottom",
    icon: Search,
    actionText: "Try ⌘K now",
    actionUrl: "#",
  },
  {
    id: "new-invoice",
    title: "MFRS-Ready Invoices",
    description:
      "This invoice template is pre-configured for Malaysian businesses with SST calculations.",
    targetSelector: '[data-coach="new-invoice"]',
    position: "bottom",
    icon: FileText,
    actionText: "Create Invoice",
    actionUrl: "/invoices/new",
  },
  {
    id: "chart-of-accounts",
    title: "Chart of Accounts",
    description:
      "Your MFRS-aligned COA is ready. You can post transactions without touching this, but it's here if you need it.",
    targetSelector: '[data-coach="chart-of-accounts"]',
    position: "right",
    icon: Calculator,
    actionText: "View COA",
    actionUrl: "/accounts",
  },
  {
    id: "reconcile",
    title: "Bank Reconciliation",
    description:
      "Match 2 transactions to feel the speed. Our reconciliation engine is lightning fast.",
    targetSelector: '[data-coach="reconcile"]',
    position: "left",
    icon: Banknote,
    actionText: "Try Reconcile",
    actionUrl: "/banking/reconcile",
  },
  {
    id: "audit-log",
    title: "Audit Trail",
    description:
      "Everything you do is tracked by user and time. This is your compliance superpower.",
    targetSelector: '[data-coach="audit-log"]',
    position: "top",
    icon: Shield,
    actionText: "View Audit Log",
    actionUrl: "/audit",
    celebration: true,
  },
];

export function CoachMarks({ isActive, onComplete, onDismiss }: CoachMarksProps) {
  const [currentMarkIndex, setCurrentMarkIndex] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [markPosition, setMarkPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentMark = COACH_MARKS[currentMarkIndex];
  const progress = ((currentMarkIndex + 1) / COACH_MARKS.length) * 100;

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }

    // Find target element
    const findTarget = () => {
      const element = document.querySelector(currentMark.targetSelector) as HTMLElement;
      if (element) {
        setTargetElement(element);
        updatePosition(element);
        setIsVisible(true);

        // Add highlight class
        element.classList.add("coach-highlight");

        // Scroll element into view
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      } else {
        // Retry after a short delay
        setTimeout(findTarget, 100);
      }
    };

    findTarget();

    return () => {
      // Cleanup highlight
      if (targetElement) {
        targetElement.classList.remove("coach-highlight");
      }
    };
  }, [currentMark, isActive, targetElement]);

  const updatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = 0;
    let left = 0;

    switch (currentMark.position) {
      case "bottom":
        top = rect.bottom + scrollTop + 10;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case "top":
        top = rect.top + scrollTop - 10;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case "right":
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.right + scrollLeft + 10;
        break;
      case "left":
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.left + scrollLeft - 10;
        break;
    }

    setMarkPosition({ top, left });
  };

  const handleNext = () => {
    if (currentMarkIndex < COACH_MARKS.length - 1) {
      // Remove highlight from current element
      if (targetElement) {
        targetElement.classList.remove("coach-highlight");
      }

      setCurrentMarkIndex(currentMarkIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (targetElement) {
      targetElement.classList.remove("coach-highlight");
    }

    // Show celebration if this is the last mark
    if (currentMark.celebration) {
      showCelebration();
    }

    setTimeout(
      () => {
        onComplete();
      },
      currentMark.celebration ? 2000 : 0,
    );
  };

  const handleSkip = () => {
    if (targetElement) {
      targetElement.classList.remove("coach-highlight");
    }
    onDismiss();
  };

  const handleAction = () => {
    if (currentMark.actionUrl && currentMark.actionUrl !== "#") {
      window.location.href = currentMark.actionUrl;
    } else if (currentMark.id === "global-search") {
      // Trigger global search
      const event = new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    }
  };

  const showCelebration = () => {
    // Create confetti effect
    const confetti = document.createElement("div");
    confetti.innerHTML = "🎉";
    confetti.style.position = "fixed";
    confetti.style.top = "50%";
    confetti.style.left = "50%";
    confetti.style.fontSize = "4rem";
    confetti.style.zIndex = "9999";
    confetti.style.animation = "confetti-burst 2s ease-out forwards";
    document.body.appendChild(confetti);

    setTimeout(() => {
      document.body.removeChild(confetti);
    }, 2000);
  };

  if (!isActive || !isVisible) return null;

  const CurrentIcon = currentMark.icon;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-40 coach-overlay"
        style={{ backdropFilter: "blur(2px)" }}
      />

      {/* Spotlight */}
      {targetElement && (
        <div
          className="fixed pointer-events-none z-45"
          style={{
            top: targetElement.getBoundingClientRect().top + window.pageYOffset - 8,
            left: targetElement.getBoundingClientRect().left + window.pageXOffset - 8,
            width: targetElement.offsetWidth + 16,
            height: targetElement.offsetHeight + 16,
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.4), 0 0 0 9999px rgba(0, 0, 0, 0.5)",
            borderRadius: "8px",
            transition: "all 0.3s ease",
          }}
        />
      )}

      {/* Coach Mark Card */}
      <div
        className="fixed z-50 coach-mark-card"
        style={{
          top: markPosition.top,
          left: markPosition.left,
          transform:
            currentMark.position === "top" || currentMark.position === "bottom"
              ? "translateX(-50%)"
              : currentMark.position === "left"
                ? "translateX(-100%) translateY(-50%)"
                : "translateY(-50%)",
        }}
      >
        <Card className="w-80 shadow-2xl border-2 border-primary/20 animate-in slide-in-from-bottom-2">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <CurrentIcon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {currentMarkIndex + 1} of {COACH_MARKS.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="w-full bg-muted rounded-full h-1">
                <div
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{currentMark.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {currentMark.description}
              </p>

              {/* Special content for specific marks */}
              {currentMark.id === "global-search" && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Pro tip:</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Works from anywhere in the app - even in forms!
                  </p>
                </div>
              )}

              {currentMark.celebration && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Congratulations!</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    You've completed the tour. You're ready to use Modern Accounting like a pro!
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex space-x-2">
                {currentMark.actionText && (
                  <Button variant="outline" size="sm" onClick={handleAction}>
                    {currentMark.actionText}
                  </Button>
                )}
              </div>

              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip Tour
                </Button>
                <Button size="sm" onClick={handleNext}>
                  {currentMarkIndex === COACH_MARKS.length - 1 ? (
                    <>
                      Complete
                      <Target className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Styles */}
      <style jsx global>{`
        .coach-highlight {
          position: relative;
          z-index: 46;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .coach-mark-card {
          animation: coachMarkSlideIn 0.3s ease-out;
        }

        @keyframes coachMarkSlideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}

// Hook to manage coach marks state
export function useCoachMarks() {
  const [isActive, setIsActive] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Check if user has completed coach marks
    const completed = localStorage.getItem("coach-marks-completed");
    if (completed) {
      setHasCompleted(true);
    }

    // Auto-start coach marks for new users after a delay
    const shouldAutoStart = !completed && !localStorage.getItem("coach-marks-dismissed");
    if (shouldAutoStart) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 3000); // Start after 3 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const startCoachMarks = () => {
    setIsActive(true);
  };

  const completeCoachMarks = () => {
    setIsActive(false);
    setHasCompleted(true);
    localStorage.setItem("coach-marks-completed", "true");
  };

  const dismissCoachMarks = () => {
    setIsActive(false);
    localStorage.setItem("coach-marks-dismissed", "true");
  };

  return {
    isActive,
    hasCompleted,
    startCoachMarks,
    completeCoachMarks,
    dismissCoachMarks,
  };
}
