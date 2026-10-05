"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/card";
import type { ChatEntry } from "@/hooks/useRoom";

interface ChatPanelProps {
  chat: ChatEntry[];
  onSend: (text: string) => void;
  onlineCount?: number;
}

export function ChatPanel({ chat, onSend, onlineCount = 4 }: ChatPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [text, setText] = useState("");
  const unreadCount = chat.length;

  return (
    <div className="flex flex-col items-end">
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-amber-500/30 backdrop-blur-md shadow-lg transition-all"
        title="Toggle Chat"
      >
        <span className="text-sm">💬</span>
        <span className="text-xs font-bold hidden sm:inline">Chat</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
          {onlineCount} online
        </span>
        <span className="text-[10px] text-slate-400">{collapsed ? "▼" : "▲"}</span>
      </button>

      {/* Collapsible panel overlay */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 w-72 sm:w-80 h-72 sm:h-80 flex flex-col rounded-2xl border border-amber-500/30 bg-slate-950/95 backdrop-blur-xl shadow-2xl p-3 z-40"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Table Chat</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  {onlineCount} seated
                </span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div
              className="flex-1 space-y-1.5 overflow-y-auto pr-1 text-xs"
              data-testid="chat-log"
            >
              {chat.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 italic text-[11px]">
                  No messages yet. Say hello!
                </div>
              ) : (
                chat.map((m, i) => (
                  <div key={i} className="leading-snug">
                    <span className="font-bold text-amber-400">{m.author}: </span>
                    <span className="text-slate-200">{m.content}</span>
                  </div>
                ))
              )}
            </div>

            <form
              className="mt-2 flex gap-1.5 pt-2 border-t border-slate-800/80"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                onSend(text.trim());
                setText("");
              }}
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message..."
                maxLength={300}
                className="h-8 text-xs py-1 px-2.5 bg-slate-900 border-slate-700"
                aria-label="Chat message"
              />
              <Button type="submit" size="sm" className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500">
                Send
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
