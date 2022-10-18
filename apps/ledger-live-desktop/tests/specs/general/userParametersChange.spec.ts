import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../models/SettingsPage";
import { Layout } from "../../models/Layout";

test.use({ userdata: "skip-onboarding" });

test("User retrive data", async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);

  await test.step("user change currency", async () => {
    await layout.goToSettings();
    await settingsPage.changeCounterValue();
    await expect(settingsPage.counterValueSelector).toHaveText("Euro - EUR");
  });

  await test.step("user change language", async () => {
    await settingsPage.changeLanguage("English", "Français");
    await expect(settingsPage.languageSelector).toHaveText("Français");
  });

  await test.step("user change Theme", async () => {
    await settingsPage.changeTheme();
    await expect(settingsPage.themeSelector).toHaveText("Clair");
  });
});
