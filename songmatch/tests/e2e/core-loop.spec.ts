import { test, expect, type Page } from "@playwright/test";

const PASSWORD = "TestPassword123!";

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
async function swipeUntilTitleFound(
  page: Page,
  title: string,
  decision: "like-button" | "pass-button" = "like-button"
) {
  for (let i = 0; i < 50; i++) {
    const empty = await page
      .getByTestId("deck-empty")
      .isVisible()
      .catch(() => false);
    if (empty) return false;

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
