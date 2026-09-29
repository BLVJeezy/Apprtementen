import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("3D entry, walking, zoom, every apartment and all view modes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enter the apartment", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Interactieve 3D rondleiding",
  });
  const scene = dialog.locator(".scene-canvas");
  await expect(scene).toHaveAttribute("data-scene-status", "ready", {
    timeout: 20000,
  });
  const start = await scene.getAttribute("data-camera-position");
  const joystick = dialog.getByRole("button", { name: "Wandeljoystick" });
  const stickBox = (await joystick.boundingBox())!;
  await page.mouse.move(
    stickBox.x + stickBox.width / 2,
    stickBox.y + stickBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(stickBox.x + stickBox.width / 2, stickBox.y + 18);
  await expect(scene).not.toHaveAttribute("data-camera-position", start!);
  await page.mouse.up();
  const stopped = await scene.getAttribute("data-camera-position");
  await page.waitForTimeout(200);
  await expect(scene).toHaveAttribute("data-camera-position", stopped!);
  await scene.locator("canvas").focus();
  await page.keyboard.down("s");
  await expect(scene).not.toHaveAttribute("data-camera-position", stopped!);
  await page.keyboard.up("s");
  await dialog
    .getByRole("button", { name: "Volledig scherm", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(true);
  await dialog
    .getByRole("button", { name: "Verlaat volledig scherm", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "3D inzoomen", exact: true })
    .click();
  await expect(scene).toHaveAttribute("data-fov", "63");
  for (const level of [0, 1, 2]) {
    await dialog
      .getByLabel("Niveau", { exact: true })
      .selectOption(String(level));
    for (let n = 1; n <= (level === 2 ? 2 : 4); n++) {
      await dialog
        .getByLabel("Appartement", { exact: true })
        .selectOption(`${level}.${n}`);
      await expect(scene).toHaveAttribute("data-unit", `${level}.${n}`);
      await expect
        .poll(async () =>
          Number(
            (await scene.getAttribute("data-camera-position"))?.split(",")[1],
          ),
        )
        .toBeCloseTo(level * 2.85 + 1.62, 2);
    }
  }
  await dialog.getByRole("button", { name: "Verdieping", exact: true }).click();
  await expect(scene).toHaveAttribute("data-mode", "overview");
  await dialog
    .getByRole("button", { name: "Buiten bekijken", exact: true })
    .click();
  await expect(scene).toHaveAttribute("data-mode", "exterior");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("mobile tour controls fit, look responds to drag and dialog is accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enter the apartment", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Interactieve 3D rondleiding",
  });
  const scene = dialog.locator(".scene-canvas");
  await expect(scene).toHaveAttribute("data-scene-status", "ready", {
    timeout: 20000,
  });
  const canvas = scene.locator("canvas");
  const b = (await canvas.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 55, b.y + b.height / 2 + 10);
  await page.mouse.up();
  await expect(scene).toHaveAttribute("data-camera-rotation", /./);
  expect(await dialog.evaluate((el) => el.scrollWidth <= innerWidth)).toBe(
    true,
  );
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
test("WebGL failure leaves working plans and dismissible tour", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: any[]
    ) {
      if (type === "webgl2") return null;
      return original.apply(this, [type, ...args] as any);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".hero-visual img")).toBeVisible();
  await page
    .getByRole("button", { name: "Enter the apartment", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Interactieve 3D rondleiding",
  });
  await expect(
    dialog.getByText("3D is niet beschikbaar in deze browser."),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Terug naar de plannen" }).click();
  await expect(page.locator(".apartment-card")).toHaveCount(4);
});

test("mobile immersive fallback fills the viewport with controls at the side", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () =>
      Promise.reject(new Error("Unavailable"));
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enter the apartment", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Interactieve 3D rondleiding",
  });
  await expect(dialog.locator(".scene-canvas")).toHaveAttribute(
    "data-scene-status",
    "ready",
    { timeout: 20000 },
  );
  await dialog
    .getByRole("button", { name: "Volledig scherm", exact: true })
    .click();
  await expect(dialog).toHaveClass(/experience-immersive/);
  const stage = (await dialog.locator(".experience-stage").boundingBox())!;
  expect(stage.x).toBe(0);
  expect(stage.y).toBe(0);
  expect(stage.width).toBe(390);
  expect(stage.height).toBe(844);
  const controls = (await dialog
    .locator(".experience-controls")
    .boundingBox())!;
  expect(controls.x).toBeGreaterThan(260);
  expect(controls.width).toBeLessThan(120);
  await expect(dialog.locator(".experience-help")).toBeHidden();
  await page.screenshot({ path: "/tmp/solyn-fullscreen-mobile-final.png" });
  await dialog
    .getByRole("button", { name: "Verlaat volledig scherm", exact: true })
    .click();
  await expect(dialog).not.toHaveClass(/experience-immersive/);
});
