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

test("signing up with an already-registered email shows an error", async ({
  page,
}) => {
  const email = uniqueEmail("dup");
  await signup(page, { name: "Original User", email, role: "SONGWRITER" });

  await page.goto("/signup");
  await page.getByTestId("signup-name").fill("Duplicate Attempt");
  await page.getByTestId("signup-email").fill(email);
  await page.getByTestId("signup-password").fill(PASSWORD);
  await page.locator('input[name="role"][value="ARTIST"]').check();
  await page.getByTestId("signup-submit").click();

  await expect(page.getByTestId("signup-error")).toContainText(
    "already exists"
  );
  await expect(page).toHaveURL(/\/signup/);
});

test("logging in with the wrong password shows an error, not a crash", async ({
  page,
}) => {
  const email = uniqueEmail("wrongpw");
  await signup(page, { name: "Wrong Password User", email, role: "ARTIST" });

  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill("definitely-not-the-password");
  await page.getByTestId("login-submit").click();

  await expect(page.getByTestId("login-error")).toContainText(
    "Invalid email or password"
  );
  await expect(page).toHaveURL(/\/login/);
});

test("passing on a broadcast submission does not create a match", async ({
  browser,
}) => {
  const songwriterCtx = await browser.newContext();
  const songwriterPage = await songwriterCtx.newPage();
  const songTitle = `E2E Pass-Only Song ${Date.now()}`;

  await signup(songwriterPage, {
    name: "E2E Pass Songwriter",
    email: uniqueEmail("swpass"),
    role: "SONGWRITER",
  });

  await songwriterPage.goto("/dashboard/songwriter/submissions/new");
  await songwriterPage.getByTestId("submission-title").fill(songTitle);
  await songwriterPage
    .getByTestId("submission-lyrics")
    .fill("A verse nobody will like back.");
  await songwriterPage
    .locator('input[name="targetMode"][value="ALL_ARTISTS"]')
    .check();
  await songwriterPage.getByTestId("submission-submit").click();
  await expect(songwriterPage).toHaveURL(/\/dashboard\/songwriter$/);

  const artistCtx = await browser.newContext();
  const artistPage = await artistCtx.newPage();
  await signup(artistPage, {
    name: "E2E Pass Artist",
    email: uniqueEmail("artpass"),
    role: "ARTIST",
  });
  await artistPage.goto("/dashboard/artist");

  let found = false;
  for (let i = 0; i < 30; i++) {
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
      await artistPage.getByTestId("pass-button").click();
      await artistPage.waitForTimeout(600);
      found = true;
      break;
    }
    await artistPage.getByTestId("pass-button").click();
    await artistPage.waitForTimeout(600);
  }
  expect(found).toBe(true);

  // No match banner should ever appear for a pass.
  await expect(artistPage.getByTestId("match-banner")).toHaveCount(0);

  await artistPage.goto("/dashboard/artist/matches");
  await expect(
    artistPage.getByTestId("match-list-item").filter({ hasText: songTitle })
  ).toHaveCount(0);

  await songwriterPage.goto("/dashboard/songwriter/matches");
  await expect(
    songwriterPage
      .getByTestId("match-list-item")
      .filter({ hasText: songTitle })
  ).toHaveCount(0);

  await songwriterCtx.close();
  await artistCtx.close();
});

test("file API requires authentication", async ({ page }) => {
  const res = await page.request.get("/api/files/nonexistent-id", {
    maxRedirects: 0,
  });
  expect(res.status()).toBe(401);
});
