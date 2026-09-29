import { test, expect } from "@playwright/test";

const units = [
  ["0.1", 171.44, 147.46, 3, 12],
  ["0.2", 142.22, 125.6, 2, 12],
  ["0.3", 142.22, 125.6, 2, 12],
  ["0.4", 171.44, 147.46, 3, 12],
  ["1.1", 118.54, 102.69, 2, 12.6],
  ["1.2", 107.61, 94.1, 2, 12],
  ["1.3", 107.61, 94.1, 2, 12],
  ["1.4", 118.54, 102.69, 2, 12.6],
  ["2.1", 189.96, 171.94, 3, 40.74],
  ["2.2", 189.96, 171.94, 3, 40.74],
] as const;
const format = (value: number) =>
  value.toLocaleString("nl-BE", { maximumFractionDigits: 2 });

test("all ten homes expose correct details across three levels", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const [id, gross, net, beds, terrace] of units) {
    const level = Number(id[0]);
    await page
      .getByRole("button", { name: new RegExp(`^Niveau ${level}:`) })
      .click();
    await expect(page.locator(".apartment-card")).toHaveCount(
      level === 2 ? 2 : 4,
    );
    await page.locator(".apartment-card").filter({ hasText: id }).click();
    const detail = page.getByRole("region", {
      name: `Details appartement ${id}`,
      exact: true,
    });
    await expect(detail).toBeVisible();
    for (const [label, value] of [
      ["Bruto-oppervlakte", `${format(gross)} m²`],
      ["Netto-oppervlakte", `${format(net)} m²`],
      ["Slaapkamers", String(beds)],
    ] as const) {
      await expect(
        detail
          .locator("dl > div")
          .filter({ has: page.locator("dt", { hasText: label }) })
          .locator("dd"),
      ).toHaveText(value);
    }
    await expect(
      detail
        .locator("dl > div")
        .filter({ has: page.locator("dt", { hasText: /^Terras/ }) })
        .locator("dd"),
    ).toContainText(`${format(terrace)} m²`);
    await expect(page).toHaveURL(
      new RegExp(`#woning-${id.replace(".", "\\.")}$`),
    );
    await expect(detail.locator(".price-row")).toContainText("Nog te bepalen");
    await expect(
      detail.getByRole("img", {
        name: `Gemeubileerd architectuurplan appartement ${id}`,
        exact: true,
      }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("exterior, interior markers, zoom and accessible dialog work with keyboard", async ({
  page,
}) => {
  await page.goto("/");
  for (const name of ["Achtergevel", "Links", "Rechts", "Voorgevel"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".building-view img")).toBeVisible();
  }
  await page.getByRole("button", { name: "Interieur & plan" }).click();
  for (const level of [0, 1, 2]) {
    await page
      .getByRole("button", { name: new RegExp(`^Niveau ${level}:`) })
      .click();
    await expect(
      page.getByRole("button", { name: /^Bekijk appartement/ }),
    ).toHaveCount(level === 2 ? 2 : 4);
  }
  const marker = page.getByRole("button", { name: "Bekijk appartement 2.2" });
  await marker.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("region", { name: "Details appartement 2.2", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Vergroot het appartementplan" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Inzoomen", exact: true }).click();
  await expect(dialog.locator(".zoom-controls")).toContainText("150%");
  await dialog.getByRole("button", { name: "Zoom herstellen" }).click();
  await expect(
    dialog.getByRole("button", { name: "Uitzoomen", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("enquiry validates, retains entered values on selection and downloads honestly", async ({
  page,
}) => {
  await page.goto("/");
  const form = page.locator(".enquiry-form");
  await form.getByRole("button", { name: "Download aanvraag" }).click();
  expect(await form.evaluate((el: HTMLFormElement) => el.checkValidity())).toBe(
    false,
  );
  await form.getByLabel(/^Naam/).fill("Testkoper");
  await form.getByLabel(/^E-mailadres/).fill("koper@example.test");
  await form
    .getByLabel(/^Uw vraag/)
    .fill("Graag meer informatie over de woning.");
  expect(await form.evaluate((el: HTMLFormElement) => el.checkValidity())).toBe(
    false,
  );
  await form.getByRole("checkbox").check();
  await page.locator(".apartment-card").filter({ hasText: "0.2" }).click();
  await expect(form.getByLabel(/^Naam/)).toHaveValue("Testkoper");
  const downloaded = page.waitForEvent("download");
  await form.getByRole("button", { name: "Download aanvraag" }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("informatieaanvraag.txt");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8");
  expect(text).toContain("0.2");
  expect(text).toContain("koper@example.test");
  await expect(form.getByRole("status")).toContainText("Niet verzonden");
  await expect(form.getByRole("button", { name: "Open e-mail" })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(() => [localStorage.length, sessionStorage.length]),
  ).toEqual([0, 0]);
});

for (const width of [390, 768, 1440]) {
  test(`no horizontal page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Interieur & plan" }).click();
    await page
      .locator(".building-view")
      .getByRole("button", { name: "Inzoomen", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Vergroot het appartementplan" })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  });
}

test("missing plan preserves usable apartment data", async ({ page }) => {
  await page.route("**/assets/*.webp", (route) => route.abort());
  await page.goto("/");
  await page.locator("#woning").scrollIntoViewIfNeeded();
  await expect(page.locator("#woning .image-error")).toBeVisible();
  await expect(page.locator("#woning .facts")).toContainText("147,46 m²");
  await page.locator(".apartment-card").filter({ hasText: "0.2" }).click();
  await expect(page.locator("#woning .facts")).toContainText("125,6 m²");
});

test("content load failure offers successful retry", async ({ page }) => {
  await page.route("**/content.json", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Opnieuw proberen" }),
  ).toBeVisible();
  await page.unroute("**/content.json");
  await page.getByRole("button", { name: "Opnieuw proberen" }).click();
  await expect(page.locator(".apartment-card")).toHaveCount(4);
});

test("direct apartment link selects its level and keyboard skip link works", async ({
  page,
}) => {
  await page.goto("/#woning-1.3");
  await expect(
    page.getByRole("region", { name: "Details appartement 1.3", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Niveau 1:/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/");
  await expect(page.locator(".apartment-card")).toHaveCount(4);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Naar de woningen" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#ontdek$/);
});
