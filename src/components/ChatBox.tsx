"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/card";
import type { ChatEntry } from "@/hooks/useRoom";

export function ChatBox({ chat, onSend }: { chat: ChatEntry[]; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="flex h-64 flex-col rounded-xl border border-slate-700 bg-slate-900/80 p-3 lg:h-full">
      <h3 className="mb-2 text-sm font-bold text-white">Chat</h3>
      <div className="flex-1 space-y-1 overflow-y-auto text-sm" data-testid="chat-log">
        {chat.map((m, i) => (
          <p key={i} className="text-slate-200">
            <span className="font-semibold text-emerald-400">{m.author}: </span>
            {m.content}
          </p>
        ))}
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onSend(text.trim());
          setText("");
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say something…" maxLength={300} aria-label="Chat message" />
        <Button type="submit" size="sm">
          Send
        </Button>
      </form>
    </div>
  );
}
