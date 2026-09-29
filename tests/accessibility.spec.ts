import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("main journey and plan dialog meet automated WCAG checks", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".apartment-card")).toHaveCount(4);
  let results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Vergroot het appartementplan" })
    .click();
  results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Vergroot het appartementplan" }),
  ).toBeFocused();
});
test("malformed content is rejected, configured sales contact is actionable", async ({
  page,
}) => {
  await page.route("**/content.json", (route) =>
    route.fulfill({ json: { apartments: Array(10).fill({ id: "0.1" }) } }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Opnieuw proberen" }),
  ).toBeVisible();
  await page.unroute("**/content.json");
  await page.route("**/content.json", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.salesEmail = "sales@example.test";
    await route.fulfill({ json: data });
  });
  await page.getByRole("button", { name: "Opnieuw proberen" }).click();
  await expect(
    page.getByRole("link", { name: "sales@example.test" }),
  ).toHaveAttribute("href", "mailto:sales@example.test");
  await expect(page.getByRole("button", { name: "Open e-mail" })).toBeVisible();
});
test("all content images load and navigation anchors resolve", async ({
  page,
  request,
}) => {
  const data = await (await request.get("/content.json")).json();
  for (const unit of data.apartments) {
    const response = await request.get(unit.plan);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/webp");
  }
  await page.goto("/");
  await expect(page.locator(".apartment-card")).toHaveCount(4);
  const broken = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((a) => a.getAttribute("href"))
        .filter((h) => h && h !== "#" && !document.getElementById(h.slice(1))),
    );
  expect(broken).toEqual([]);
});
