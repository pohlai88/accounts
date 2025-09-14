/**
 * AppShell Component - Steve Jobs Inspired
 *
 * "The whole widget" - Control the entire user experience
 * This provides the persistent structural skeleton of the app
 */

import React, { useState } from "react";
import { cn } from "@aibos/ui/utils";
import { StatusBar } from "./StatusBar";
import { Dock } from "./Dock";
import { CommandPalette, Command } from "./CommandPalette";
import { UniversalInbox } from "./UniversalInbox";
import { TimelineDrawer } from "./TimelineDrawer";
import { UniversalCreate } from "./UniversalCreate";

export interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  currentContext?: "sell" | "buy" | "cash" | "close" | "reports" | "settings";
  onNavigate?: (context: string) => void;
  onSearch?: (query: string) => void;
  onCommand?: (command: Command) => void;
  onCreate?: (action: any) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  className,
  currentContext = "sell",
  onNavigate,
  onSearch,
  onCommand,
  onCreate,
}) => {
  const [showInbox, setShowInbox] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const handleSearch = (query: string) => {
    onSearch?.(query);
  };

  const handleCommand = (command: Command) => {
    onCommand?.(command);
    setShowCommandPalette(false);
  };

  const handleCreate = (action: any) => {
    onCreate?.(action);
  };

  const handleNavigate = (context: string) => {
    onNavigate?.(context);
  };

  const handleCompanySwitch = () => {
    console.log("Company switch clicked");
  };

  const handleNotifications = () => {
    setShowInbox(!showInbox);
  };

  const handleUserMenu = () => {
    console.log("User menu clicked");
  };

  return (
    <div className={cn("min-h-screen bg-sys-bg-base", className)}>
      {/* Status Bar - Top navigation */}
      <StatusBar
        onSearch={handleSearch}
        onCommandPalette={() => setShowCommandPalette(true)}
        onCompanySwitch={handleCompanySwitch}
        onNotifications={handleNotifications}
        onUserMenu={handleUserMenu}
      />

      {/* Main Layout */}
      <div className="flex h-screen pt-16">
        {/* Dock - Left sidebar navigation */}
        <Dock
          activeItem={currentContext}
          onNavigate={handleNavigate}
          onCreate={() => setShowCommandPalette(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="flex h-full">
            {/* Content */}
            <div className="flex-1 p-6">{children}</div>

            {/* Right Sidebar */}
            <div className="w-80 border-l border-sys-border-hairline bg-sys-bg-subtle p-4 space-y-4">
              {/* Universal Inbox */}
              {showInbox && (
                <UniversalInbox
                  onItemAction={(itemId, action) => {
                    console.log(`Inbox action: ${action} on ${itemId}`);
                  }}
                  onFilterChange={filters => {
                    console.log("Inbox filters changed:", filters);
                  }}
                />
              )}

              {/* Timeline Drawer */}
              {showTimeline && (
                <TimelineDrawer
                  onItemClick={item => {
                    console.log("Timeline item clicked:", item);
                  }}
                  onFilterChange={filters => {
                    console.log("Timeline filters changed:", filters);
                  }}
                />
              )}

              {/* Universal Create */}
              <UniversalCreate
                context={currentContext}
                onCreate={handleCreate}
                onSearch={handleSearch}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Command Palette - Universal search */}
      {showCommandPalette && <CommandPalette onCommand={handleCommand} onSearch={handleSearch} />}
    </div>
  );
};

export default AppShell;
