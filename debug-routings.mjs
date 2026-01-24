import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

try {
  // Navigate to routings page
  await page.goto("http://localhost:3000/technical/routings");
  await page.waitForLoadState("networkidle");

  // Get all headings
  const headings = await page.locator("h1, h2, h3, h4, h5, h6").allTextContents();
  console.log("Headings:", headings);

  // Get table headers
  const headers = await page.locator("thead th").allTextContents();
  console.log("Table Headers:", headers);

  // Get all buttons
  const buttons = await page.locator("button").allTextContents();
  console.log("Buttons:", buttons.filter(b => b.trim().length > 0));

  // Get page content
  const content = await page.content();
  if (content.includes("Routings")) console.log("✓ Page has 'Routings' text");
  if (content.includes("Add Routing")) console.log("✓ Page has 'Add Routing' button");
  if (content.includes("<table")) console.log("✓ Page has table element");

} catch (error) {
  console.error("Error:", error.message);
}

await browser.close();
