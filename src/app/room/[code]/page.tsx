"use client";

import { useParams, useRouter } from "next/navigation";
import { ChatBox } from "@/components/ChatBox";
import { RoomLobby } from "@/components/RoomLobby";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useRoom } from "@/hooks/useRoom";

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { room, chat, error, connected, lastTrick, notice, gameId, act } = useRoom(code.toUpperCase());

  if (!room) {
    return (
      <div className="py-20 text-center text-slate-300">
        {error ? (
          <>
            <p className="mb-4 text-red-400">{error}</p>
            <Button onClick={() => router.push("/")}>Back to lobby</Button>
          </>
        ) : (
          "Connecting to room…"
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-slate-300">
          Room <b className="font-mono text-emerald-400">{room.code}</b>
        </span>
        <span className={connected ? "text-emerald-400" : "text-red-400"}>{connected ? "● online" : "● reconnecting…"}</span>
        {room.spectators > 0 && <span className="text-slate-400">👁 {room.spectators}</span>}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={async () => {
            await act("leave_room");
            router.push("/");
          }}
        >
          Leave
        </Button>
      </div>
      {notice && <div className="rounded bg-amber-700/80 px-3 py-2 text-sm text-white">{notice}</div>}
      {error && <div className="rounded bg-red-800/80 px-3 py-2 text-sm text-white">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          {room.status === "lobby" ? (
            <RoomLobby room={room} act={act} />
          ) : (
            <Table room={room} lastTrick={lastTrick} act={act} gameId={gameId} />
          )}
        </div>
        <ChatBox chat={chat} onSend={(content) => void act("chat_message", { content })} />
      </div>
    </div>
  );
}
