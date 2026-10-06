"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ChatEntry } from "@/hooks/useRoom";

interface ChatPanelProps {
  chat: ChatEntry[];
  onSend: (text: string) => void;
  onlineCount?: number;
}

export function ChatPanel({ chat, onSend, onlineCount = 4 }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const prevLenRef = useRef(chat.length);
  const logRef = useRef<HTMLDivElement>(null);

  // Track unread messages while panel is closed
  useEffect(() => {
    if (chat.length > prevLenRef.current) {
      if (!open) setUnread((u) => u + (chat.length - prevLenRef.current));
    }
    prevLenRef.current = chat.length;
  }, [chat.length, open]);

  // Clear unread when opened; scroll to bottom
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [open]);

  // Auto-scroll when new messages arrive while open
  useEffect(() => {
    if (open && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [chat, open]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <>
      {/*
       * TOGGLE BUTTON — fixed to right edge, always visible, zero layout impact.
       * Sits below the navbar (top: 70px) and above the table content (z-50).
       */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-slate-200 border border-amber-500/30 backdrop-blur-md shadow-lg transition-colors"
        style={{ top: "calc(var(--nav-h, 52px) + 14px)" }}
      >
        <span className="text-sm leading-none">💬</span>
        <span className="text-xs font-bold hidden sm:inline">Chat</span>
        {/* Online count */}
        <span className="text-[10px] px-1.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-600/40 font-mono">
          {onlineCount}
        </span>
        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && !open && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="text-[10px] text-slate-500 leading-none">{open ? "▲" : "▼"}</span>
      </button>

      {/*
       * CHAT PANEL — fixed overlay, slides in from the right.
       * Width: 320px (clamps to 92vw on very small screens).
       * Height: 500px (clamps to 70vh).
       * Never affects the layout of anything underneath.
       *
       * Z-index hierarchy:
       *   table content      z-20
       *   scoreboard         z-40
       *   chat toggle btn    z-50
       *   chat panel         z-[55]   ← above scoreboard, below modals (z-[60]+)
       */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="fixed z-[55] flex flex-col rounded-l-2xl border border-amber-500/30 bg-slate-950/97 backdrop-blur-xl shadow-2xl overflow-hidden"
            style={{
              top: "calc(var(--nav-h, 52px) + 14px)",
              right: 0,
              width: "min(320px, 92vw)",
              height: "min(500px, 70vh)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Table Chat</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/30">
                  {onlineCount} online
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 transition-colors"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            {/* Message log */}
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 text-xs"
              data-testid="chat-log"
            >
              {chat.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 italic text-[11px]">
                  No messages yet. Say hello!
                </div>
              ) : (
                chat.map((m, i) => (
                  <div key={i} className="leading-snug break-words">
                    <span className="font-bold text-amber-400">{m.author}:</span>{" "}
                    <span className="text-slate-200">{m.content}</span>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex gap-1.5 px-3 py-2 border-t border-slate-800 shrink-0"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message…"
                maxLength={300}
                className="flex-1 h-8 text-xs px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                aria-label="Chat message"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 px-3 text-xs bg-emerald-700 hover:bg-emerald-600 shrink-0"
              >
                Send
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
