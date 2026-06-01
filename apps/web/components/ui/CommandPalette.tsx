"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, Home, TrendingUp, Sun, Moon, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { clearAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette on Ctrl+Space or CMD+K (if desired to have separate palette)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const actions = [
    {
      id: "nav-dashboard",
      name: "Go to Dashboard",
      icon: <Home className="h-4 w-4 mr-3 text-slate-400" />,
      perform: () => {
        router.push("/dashboard");
        setOpen(false);
      },
    },
    {
      id: "nav-trading",
      name: "Go to Trading Room",
      icon: <TrendingUp className="h-4 w-4 mr-3 text-slate-400" />,
      perform: () => {
        router.push("/trading");
        setOpen(false);
      },
    },
    {
      id: "theme-dark",
      name: "Switch to Dark Mode",
      icon: <Moon className="h-4 w-4 mr-3 text-slate-400" />,
      perform: () => {
        console.log("Switch to dark theme");
        setOpen(false);
      },
    },
    {
      id: "action-logout",
      name: "Log Out of Apex",
      icon: <LogOut className="h-4 w-4 mr-3 text-rose-400" />,
      perform: () => {
        clearAuth();
        router.push("/login");
        setOpen(false);
      },
    },
  ];

  const filteredActions = actions.filter((action) =>
    action.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredActions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions[activeIndex]) {
        filteredActions[activeIndex].perform();
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content 
          onKeyDown={handleKeyDown}
          className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in p-4 focus:outline-none"
        >
          <div className="flex items-center border-b border-slate-800 pb-3 mb-3">
            <Search className="h-4 w-4 text-slate-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search shortcuts and commands..."
              className="bg-transparent border-0 outline-0 p-0 text-sm text-white placeholder-slate-500 w-full focus:ring-0 focus:outline-none"
              autoFocus
            />
            <kbd className="bg-slate-800 border border-slate-700 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
              ESC
            </kbd>
          </div>

          <Dialog.Title className="sr-only">Command Menu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Quick command access palette for navigation and actions
          </Dialog.Description>

          <div className="space-y-0.5 max-h-72 overflow-y-auto no-scrollbar">
            {filteredActions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No commands found
              </div>
            ) : (
              filteredActions.map((action, index) => (
                <div
                  key={action.id}
                  onClick={action.perform}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    activeIndex === index
                      ? "bg-slate-800 text-white scale-[1.01] border-l-2 border-sky-500"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {action.icon}
                  <span className="text-xs font-semibold">{action.name}</span>
                </div>
              ))
            )}
          </div>
          
          <div className="border-t border-slate-800/80 pt-3 mt-3 flex items-center justify-between text-[10px] text-slate-500 font-semibold px-1">
            <span>Tip: Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 font-mono">Ctrl+P</kbd> to open anytime</span>
            <span>Use arrows + enter</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CommandPalette;
