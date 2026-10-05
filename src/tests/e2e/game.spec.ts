import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Belote Trix" })).toBeVisible();
});

test("play against bots: lobby, start, choose mode, play a card", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("play-bots").click();
  await expect(page.getByTestId("start-game")).toBeEnabled();
  await page.getByTestId("start-game").click();
  await expect(page.getByTestId("current-selector")).toBeVisible();
  await page.getByTestId("mode-Queens").click();
  await expect(page.getByTestId("current-mode")).toContainText("Queens");
  await expect(page.getByTestId("turn-hint")).toContainText("Your turn");
  const card = page.getByTestId("hand").locator("button:not([disabled])").first();
  await card.click();
  await expect(page.getByTestId("hand").locator("button")).toHaveCount(7);
});

test("chat works", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create-room").click();
  await page.getByLabel("Chat message").fill("hello table");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("chat-log")).toContainText("hello table");
});

test("leaderboard page loads", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
});
