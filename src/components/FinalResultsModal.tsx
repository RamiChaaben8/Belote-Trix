"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";

interface FinalResultsModalProps {
  players: { seat: number; name: string; avatar: string }[];
  totals: number[];
  stats?: {
    modesWon: number;
    tricksWon: number;
    diamonds: number;
    queens: number;
    kingHearts: number;
    fiftyOneWins: number;
  }[] | null;
  replayId?: string | null;
  onPlayAgain: () => void;
}

export function FinalResultsModal({
  players,
  totals,
  stats,
  replayId,
  onPlayAgain,
}: FinalResultsModalProps) {
  // Sort players by ascending total score (Lowest score = 1st place)
  const ranking = players
    .map((p, seat) => ({
      ...p,
      seat,
      score: totals[seat],
      playerStats: stats ? stats[seat] : null,
    }))
    .sort((a, b) => a.score - b.score);

  const winner = ranking[0];

  const medalEmojis = ["🥇", "🥈", "🥉", "4th"];
  const rankLabels = ["1st Place", "2nd Place", "3rd Place", "4th Place"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-5 sm:p-8 shadow-2xl my-auto"
      >
        {/* Celebration header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-5xl sm:text-6xl mb-2"
          >
            🏆
          </motion.div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Match Finished
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white mt-1">
            {winner.name} Wins!
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold text-xs">
            <span>⭐</span>
            <span>Winner is the player with the LOWEST score ({winner.score} pts)</span>
          </div>
        </div>

        {/* Podium Rankings Table */}
        <div className="space-y-3 mb-6">
          {ranking.map((player, rankIdx) => {
            const isWinner = rankIdx === 0;

            return (
              <motion.div
                key={player.seat}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * rankIdx }}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isWinner
                    ? "bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-slate-900/60 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    : "bg-slate-950/60 border-slate-800"
                }`}
              >
                {/* Left: Medal, Avatar, Name & Place */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center font-black">
                    {medalEmojis[rankIdx]}
                  </span>
                  <div className="text-3xl">{player.avatar}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base">
                        {player.name}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        ({rankLabels[rankIdx]})
                      </span>
                    </div>

                    {/* Stats badges */}
                    {player.playerStats && (
                      <div className="flex flex-wrap gap-1.5 mt-1 text-[11px] text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                          Tricks: {player.playerStats.tricksWon}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                          ♦: {player.playerStats.diamonds}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                          Queens: {player.playerStats.queens}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                          K♥: {player.playerStats.kingHearts}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                          51 Wins: {player.playerStats.fiftyOneWins}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Total Score */}
                <div className="mt-2 sm:mt-0 flex sm:flex-col items-baseline sm:items-end justify-between font-mono">
                  <span className="text-[10px] text-slate-400 sm:block uppercase">Total Score</span>
                  <span
                    className={`text-xl sm:text-2xl font-black ${
                      isWinner ? "text-amber-400" : "text-slate-200"
                    }`}
                  >
                    {player.score} pts
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {replayId && (
            <Button
              variant="outline"
              onClick={() => (window.location.href = `/replay/${replayId}`)}
              className="flex-1 py-3 text-sm font-semibold"
            >
              Watch Game Replay
            </Button>
          )}
          <Button
            onClick={onPlayAgain}
            className="flex-1 py-3 text-base font-bold bg-emerald-600 hover:bg-emerald-500 shadow-xl"
          >
            Play Again / Back to Lobby
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
