"use client";

import { useParams, useRouter } from "next/navigation";
import { RoomLobby } from "@/components/RoomLobby";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useRoom } from "@/hooks/useRoom";

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { room, chat, error, connected, lastTrick, notice, gameId, act } =
    useRoom(code.toUpperCase());

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

  // Lobby mode: show the pre-game lobby card and minimal leave bar
  if (room.status === "lobby") {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">
            Room <b className="font-mono text-emerald-400">{room.code}</b>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await act("leave_room");
              router.push("/");
            }}
          >
            Leave
          </Button>
        </div>
        {notice && (
          <div className="rounded bg-amber-700/80 px-3 py-2 text-sm text-white">
            {notice}
          </div>
        )}
        {error && (
          <div className="rounded bg-red-800/80 px-3 py-2 text-sm text-white">
            {error}
          </div>
        )}
        <RoomLobby room={room} act={act} />
      </div>
    );
  }

  // Active game mode: Table takes almost full screen with integrated top-left scoreboard and top-right chat overlay
  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Floating leave & status micro bar */}
      <div className="absolute top-2 right-28 sm:right-32 z-40 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 text-xs text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 backdrop-blur-md rounded-xl"
          onClick={async () => {
            await act("leave_room");
            router.push("/");
          }}
        >
          Leave
        </Button>
      </div>

      {notice && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 rounded-full bg-amber-500 text-slate-950 font-bold px-4 py-1 text-xs shadow-2xl animate-fade">
          {notice}
        </div>
      )}
      {error && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 rounded-full bg-rose-600 text-white font-bold px-4 py-1 text-xs shadow-2xl">
          {error}
        </div>
      )}

      {/* Main card table with full focus */}
      <Table
        room={room}
        lastTrick={lastTrick}
        chat={chat}
        act={act}
        gameId={gameId}
      />
    </div>
  );
}
