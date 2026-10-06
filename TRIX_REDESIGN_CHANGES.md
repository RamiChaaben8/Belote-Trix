# Trix Mode Complete Redesign - Implementation Summary

## Overview
Complete redesign of the Trix board and game rules to match the reference image with 4 separate suit columns, jack-centered progression, and new host-first turn rule.

## Changes Made

### 1. TrixBoard Layout (src/components/TrixCenter.tsx)
**Before**: Horizontal display of suits H, D, C, S (random order)

**After**: 4 separate vertical suit columns from left to right
- ♦ Diamonds (D)
- ♣ Clubs (C)
- ♥ Hearts (H)
- ♠ Spades (S)

Each column shows cards in this order (top to bottom):
```
A
K
Q
J
10
9
8
7
```
J is centered in the stack (4th position of 7 visible cards).

**Visual features**:
- Jacks in the center of a suit's range glow strongly with enhanced shadow
- Green border highlights cards at the range edges (low/high)
- Clean, stacked layout with no overlapping cards

---

### 2. Host Always Starts First (src/game-engine/round.ts)
**Before**: Seat with J♣ opened the round first

**After**: Host (seat 0) always starts first

**Logic**:
1. Host (seat 0) gets the first turn
2. No card is auto-played. If host has Jacks: their Jacks are the only legal plays (highlighted) — host picks which Jack opens the first suit chain
3. If host has no Jacks:
   - Player must press PASS (enabled when it's their turn)
   - Turn passes to next seat clockwise
   - Continue until a player with a Jack plays it

---

### 3. PASS Button (src/components/Table.tsx + src/app/room/[code]/page.tsx)
**Features**:
- Visible "PASS" button shown near player's hand during their turn in Trix mode
- Button is disabled unless:
  1. Player has 0 legal moves (can pass), OR
  2. All legal moves are Aces (ace exception)

**Implementation**:
- Uses `canPass` state derived from room.legal array
- When clicked, sends a pass event to server
- Server advances turn to next player

---

### 4. Legal Move Highlighting (src/components/CardFan.tsx)
**Before**: {ring-2 ring-emerald-400} for eligible cards

**After**:
- All playable cards get a green border (ring-emerald-400)
- Playable Jacks get STRONGER glow: {ring-3 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,1)] border-emerald-300}

**Implementation**:
```typescript
// Check if this is a Jack that should glow strongly
const isGlowingJack = isMyTurn && card.rank === "J" && legal;
// Then conditionally apply heavy glow styling
```

---

### 5. Real-Time Ace Extra Turn (src/game-engine/round.ts)
**Already implemented**: When Ace is played, a trixExtraTurnSeat event is emitted
- "🂡 EXTRA TURN — [Name]" banner displays
- Same player immediately plays again

---

### 6. Socket Server Pass Handler (src/socket/server.ts)
**Before**: play_card only handled actual card moves

**After**:
- Checks for `trixPass: true` in move data
- In Trix mode: triggers applyTrixPass() which skips the turn
- Updates room state and broadcasts play event

---

## Rules Changes

### Starting Player Rule
| Before | After |
|--------|-------|
| Player holding J♣ starts | Host (seat 0) always starts |

### Pass Eligibility
| Scenario | Eligible to Pass |
|----------|-----------------|
| No legal moves | ✅ Yes |
| Has legal move (non-Ace) | ❌ No |
| Has legal moves (only Aces) | ✅ Yes |
| Has legal move (Ace + non-Ace) | ❌ No (must use non-Ace) |

---

## Visual Design

### Board Layout
```
        ♦         ♣         ♥         ♠
    [A♦]      [A♣]      [A♥]      [A♠]
    [K♦]      [K♣]      [K♥]      [K♠]
    [Q♦]      [Q♣]      [Q♥]      [Q♠]
    [J♦]      [J♣]      [J♥]      [J♠]  <- Center
   [10♦]     [10♣]      [10♥]     [10♠]
    [9♦]      [9♣]      [9♥]      [9♠]
    [8♦]      [8♣]      [8♥]      [8♠]
```

- Four evenly spaced vertical columns
- Jack-centered hierarchy (A-K-Q-J sequences)
- Clear card separation with minimal overlap
- Emerald green highlights for playable cards
- Strong glow effect for Jacks

---

## Scoring (Already implemented correctly)
- 1st player finishes: -100
- 2nd player finishes: -50
- Others: 0
- Game ends immediately after second finisher

---

## Files Modified
1. `src/components/TrixCenter.tsx` - Board layout redesign
2. `src/components/CardFan.tsx` - Enhanced Jack glow and legal move highlighting
3. `src/components/Table.tsx` - PASS button UI and state management
4. `src/app/room/[code]/page.tsx` - PASS button handler
5. `src/game-engine/round.ts` - Host-first turn and forced Jack play logic
6. `src/socket/server.ts` - PASS event handling

---

## Testing Checklist
- [ ] Trix board displays 4 suit columns (♦♣♥♠) left to right
- [ ] Cards appear in correct order (A-K-Q-J-10-9-8-7)
- [ ] Jack is centered in each column
- [ ] Host (seat 0) starts the round
- [ ] Host's Jacks are highlighted as the only legal plays at start
- [ ] Host with no Jacks gets a working PASS button
- [ ] PASS button appears next to hand when appropriate
- [ ] PASS button disabled when there are non-Ace legal moves
- [ ] PASS button enabled when no legal moves
- [ ] PASS button enabled when only Aces are playable
- [ ] Pass advances turn clockwise
- [ ] Playable cards have green border
- [ ] Jacks glow strongly (extra shadow/glow)
- [ ] Ace played shows extra turn banner
- [ ] Round ends after 2nd player finishes
- [ ] Scores calculated correctly (-100, -50, 0)