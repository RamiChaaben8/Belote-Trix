# Belote Trix

Multiplayer 4-player Belote Trix (32-card deck, no trump) built with Next.js 15, Socket.IO, Prisma/PostgreSQL and NextAuth.

## Run locally

```bash
docker compose up -d db        # PostgreSQL on :5432 (or point DATABASE_URL at your own)
npm install
npm run prisma:migrate         # creates the schema (prisma migrate dev)
npm run prisma:seed            # optional demo users (password: password123)
npm run dev                    # http://localhost:3000
```

Environment variables are in `.env` (see `.env.example`).

Everything in one container: `docker compose up --build`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Custom server (Next.js + Socket.IO) |
| `npm test` | Vitest unit tests (engine, rules, AI, room) |
| `npm run test:e2e` | Playwright (needs DB + `npx playwright install`) |
| `npm run lint` | Type check |

## Rules implemented

- 4 players x 4 modes = 16 rounds. Each player picks every mode once; the selector leads.
- Card order A > 10 > K > Q > J > 9 > 8 > 7; follow suit when possible.
- **King of Hearts**: K♥ capturer +150; hearts cannot be led until a heart is discarded off-suit.
- **Diamonds**: +10 per diamond; same lead restriction for diamonds.
- **Queens**: +20 per queen.
- **Fifty One**: 7=+7, 8=+8, 9=pass, 10=-10, J=reverse, Q=+3, K=+4, A=+1/+11. Moves exceeding 51 are illegal; players with no legal move are skipped. Reaching exactly 51 = +510.

## Architecture

- `src/game-engine`: framework-free engine (`GameEngine`, `GameRoom`, `RoundManager`, `Deck`, `Card`, `ModeManager`, `ScoreManager`, `RuleEngine`, `TrickEngine`, mode classes, `Player`/`BotPlayer`).
- `src/ai`: easy (random), medium (trick evaluation), hard (card counting, void tracking, win probability, 51-setup search).
- `src/socket/server.ts`: Socket.IO server. Events: `create_room`, `join_room`, `leave_room`, `start_game`, `select_mode`, `play_card`, `chat_message`, `add_bot`, `fill_bots`, `remove_bot`, `set_difficulty`; broadcasts `room_state`, `deal_cards`, `mode_selected`, `card_played`, `trick_finished`, `round_finished`, `score_updated`, `game_finished`, `player_reconnected`, `player_disconnected`.
- Reconnect: clients keep a persistent id (or user id when signed in) and are re-seated on reconnect; absent humans are covered by a bot after 15 s.
- `src/services/persistence.ts`: stores finished games (rounds, tricks, played cards, scores, chat) for history, replay and leaderboard.
# Belote-Trix
