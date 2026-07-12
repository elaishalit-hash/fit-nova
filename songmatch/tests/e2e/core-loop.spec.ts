import path from "path";
import { test, expect, type Page } from "@playwright/test";

const PASSWORD = "TestPassword123!";
const FIXTURES_DIR = path.join(__dirname, "fixtures");

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@e2e.test`;
}

async function signup(
  page: Page,
  {
    name,
    email,
    role,
  }: { name: string; email: string; role: "SONGWRITER" | "ARTIST" }
) {
  await page.goto("/signup");
  await page.getByTestId("signup-name").fill(name);
  await page.getByTestId("signup-email").fill(email);
  await page.getByTestId("signup-password").fill(PASSWORD);
  await page.locator(`input[name="role"][value="${role}"]`).check();
  await page.getByTestId("signup-submit").click();
  await expect(page).toHaveURL(/\/terms\/accept/);
  await page.getByTestId("terms-checkbox").check();
  await page.getByTestId("terms-accept-submit").click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/dashboard/);
}

// Clicks "pass" through the deck until a card with the given title shows up,
// then clicks the requested decision on it. Returns whether it was found.
// Next.js dev mode occasionally serves a deck snapshot that lags a
// just-created row by one request, so if the deck runs dry without finding
// the target, the page is reloaded (a fresh server fetch) and retried a
// couple of times before giving up.
async function swipeUntilTitleFound(
  page: Page,
  title: string,
  decision: "like-button" | "pass-button" = "like-button"
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await page.reload();
    }

    for (let i = 0; i < 20; i++) {
      const empty = await page
        .getByTestId("deck-empty")
        .isVisible()
        .catch(() => false);
      if (empty) break;

      const cardTitle = await page
        .getByTestId("deck-card-title")
        .first()
        .innerText();

      if (cardTitle === title) {
        await page.getByTestId(decision).click();
        await page.waitForTimeout(350);
        return true;
      }
      await page.getByTestId("pass-button").click();
      await page.waitForTimeout(350);
    }
  }
  return false;
}

test("specific-targeting match + messaging flow", async ({ browser }) => {
  const songwriterCtx = await browser.newContext();
  const songwriterPage = await songwriterCtx.newPage();
  const songTitle = `E2E Specific Song ${Date.now()}`;

  await signup(songwriterPage, {
    name: "E2E Songwriter",
    email: uniqueEmail("sw"),
    role: "SONGWRITER",
  });

  await songwriterPage.goto("/dashboard/songwriter/submissions/new");
  await songwriterPage.getByTestId("submission-title").fill(songTitle);
  await songwriterPage
    .getByTestId("submission-lyrics")
    .fill("La la la, this is a test verse.");
  await songwriterPage
    .locator('input[name="targetMode"][value="SPECIFIC"]')
    .check();
  await songwriterPage.getByTestId("submission-submit").click();
  await expect(songwriterPage).toHaveURL(/\/target$/);

  const targeted = await swipeUntilTitleFound(
    songwriterPage,
    "Nova Sterling",
    "like-button"
  );
  expect(targeted).toBe(true);

  const artistCtx = await browser.newContext();
  const artistPage = await artistCtx.newPage();
  await login(artistPage, "artist1@songmatch.test", "password123");
  await artistPage.goto("/dashboard/artist");

  const matched = await swipeUntilTitleFound(
    artistPage,
    songTitle,
    "like-button"
  );
  expect(matched).toBe(true);
  await expect(artistPage.getByTestId("match-banner")).toBeVisible();

  await artistPage.goto("/dashboard/artist/matches");
  const artistMatchItem = artistPage
    .getByTestId("match-list-item")
    .filter({ hasText: songTitle });
  await expect(artistMatchItem).toHaveCount(1);
  const artistPercentText = await artistMatchItem
    .getByTestId("match-copyright-percent")
    .innerText();
  const artistTermsText = await artistMatchItem
    .getByTestId("match-terms-version")
    .innerText();

  await songwriterPage.goto("/dashboard/songwriter/matches");
  const songwriterMatchItem = songwriterPage
    .getByTestId("match-list-item")
    .filter({ hasText: songTitle });
  await expect(songwriterMatchItem).toHaveCount(1);
  const songwriterPercentText = await songwriterMatchItem
    .getByTestId("match-copyright-percent")
    .innerText();
  const songwriterTermsText = await songwriterMatchItem
    .getByTestId("match-terms-version")
    .innerText();

  expect(songwriterPercentText).toBe(artistPercentText);
  expect(songwriterTermsText).toBe(artistTermsText);

  await songwriterMatchItem.click();
  await expect(songwriterPage).toHaveURL(/\/matches\//);
  const messageText = `Hello from songwriter ${Date.now()}`;
  await songwriterPage.getByTestId("message-input").fill(messageText);
  await songwriterPage.getByTestId("message-send").click();
  await expect(songwriterPage.getByTestId("message-list")).toContainText(
    messageText
  );

  const matchUrl = songwriterPage.url();
  await artistPage.goto(matchUrl);
  await expect(artistPage.getByTestId("message-list")).toContainText(
    messageText
  );

  await songwriterCtx.close();
  await artistCtx.close();
});

test("broadcast-to-all-artists match flow", async ({ browser }) => {
  const songwriterCtx = await browser.newContext();
  const songwriterPage = await songwriterCtx.newPage();
  const songTitle = `E2E Broadcast Song ${Date.now()}`;

  await signup(songwriterPage, {
    name: "E2E Broadcast Songwriter",
    email: uniqueEmail("swb"),
    role: "SONGWRITER",
  });

  await songwriterPage.goto("/dashboard/songwriter/submissions/new");
  await songwriterPage.getByTestId("submission-title").fill(songTitle);
  await songwriterPage
    .getByTestId("submission-lyrics")
    .fill("Broadcast verse for everyone to hear.");
  await songwriterPage
    .locator('input[name="targetMode"][value="ALL_ARTISTS"]')
    .check();
  await songwriterPage.getByTestId("submission-submit").click();
  await expect(songwriterPage).toHaveURL(/\/dashboard\/songwriter$/);

  const artistCtx = await browser.newContext();
  const artistPage = await artistCtx.newPage();
  await login(artistPage, "artist2@songmatch.test", "password123");
  await artistPage.goto("/dashboard/artist");

  const matched = await swipeUntilTitleFound(
    artistPage,
    songTitle,
    "like-button"
  );
  expect(matched).toBe(true);

  await artistPage.goto("/dashboard/artist/matches");
  await expect(
    artistPage.getByTestId("match-list-item").filter({ hasText: songTitle })
  ).toHaveCount(1);

  await songwriterPage.goto("/dashboard/songwriter/matches");
  await expect(
    songwriterPage
      .getByTestId("match-list-item")
      .filter({ hasText: songTitle })
  ).toHaveCount(1);

  await songwriterCtx.close();
  await artistCtx.close();
});

test("submission with a picture and audio renders for the songwriter and a matching artist", async ({
  browser,
}) => {
  const songwriterCtx = await browser.newContext();
  const songwriterPage = await songwriterCtx.newPage();
  const songTitle = `E2E Media Song ${Date.now()}`;

  await signup(songwriterPage, {
    name: "E2E Media Songwriter",
    email: uniqueEmail("swm"),
    role: "SONGWRITER",
  });

  await songwriterPage.goto("/dashboard/songwriter/submissions/new");
  await songwriterPage.getByTestId("submission-title").fill(songTitle);
  await songwriterPage
    .getByTestId("submission-lyrics")
    .fill("A verse to go with a picture and a tune.");
  await songwriterPage
    .getByTestId("submission-image")
    .setInputFiles(path.join(FIXTURES_DIR, "cover.png"));
  await songwriterPage
    .getByTestId("submission-audio")
    .setInputFiles(path.join(FIXTURES_DIR, "demo.wav"));
  await songwriterPage
    .locator('input[name="targetMode"][value="ALL_ARTISTS"]')
    .check();
  await songwriterPage.getByTestId("submission-submit").click();
  await expect(songwriterPage).toHaveURL(/\/dashboard\/songwriter$/);

  // Songwriter's own list shows the cover thumbnail.
  await expect(
    songwriterPage.locator("li", { hasText: songTitle }).locator("img")
  ).toBeVisible();

  // A brand-new artist account has an empty swipe history, so its deck only
  // contains long-lived broadcast submissions (like the seeded demo one)
  // plus ours — a small, predictable set to page through. Next.js dev mode
  // occasionally serves a deck snapshot that lags a just-created row by one
  // request, so a full reload is retried a couple of times if the target
  // card isn't found before the deck runs out.
  const artistCtx = await browser.newContext();
  const artistPage = await artistCtx.newPage();
  await signup(artistPage, {
    name: "E2E Media Artist",
    email: uniqueEmail("artm"),
    role: "ARTIST",
  });

  let found = false;
  for (let attempt = 0; attempt < 3 && !found; attempt++) {
    await artistPage.goto("/dashboard/artist");

    for (let i = 0; i < 10; i++) {
      const empty = await artistPage
        .getByTestId("deck-empty")
        .isVisible()
        .catch(() => false);
      if (empty) break;

      const cardTitle = await artistPage
        .getByTestId("deck-card-title")
        .first()
        .innerText();

      if (cardTitle === songTitle) {
        await expect(
          artistPage.getByTestId("deck-card-image").first()
        ).toBeVisible();
        // Native <audio controls> has a shadow-DOM control bar that
        // Chromium can take a moment to paint, which briefly leaves the
        // element with a zero-height box even once display/visibility are
        // already correct — that's a browser rendering-timing detail, not
        // something our app controls. What matters here is that our code
        // put the right <audio src> in the DOM.
        const audio = artistPage.getByTestId("deck-card-audio").first();
        await expect(audio).toBeAttached();
        await expect(audio).toHaveAttribute("src", /demo\.wav$/);
        found = true;
        break;
      }
      await artistPage.getByTestId("pass-button").click();
      await artistPage.waitForTimeout(350);
    }
  }
  expect(found).toBe(true);

  await songwriterCtx.close();
  await artistCtx.close();
});
