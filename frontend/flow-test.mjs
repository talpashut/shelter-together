#!/usr/bin/env node
/**
 * E2E flow test for מקלט ביחד app
 * Navigates through: welcome -> profile -> home -> create group -> start game -> safety -> first game -> intro -> rules
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = __dirname + '/screenshots';

async function takeScreenshot(page, name) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const path = `${SCREENSHOTS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  📸 Saved: ${path}`);
}

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'he-IL',
  });
  const page = await context.newPage();

  page.on('pageerror', (err) => console.error('Page error:', err.message));
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('error')) console.log('Console:', text);
  });

  try {
    // Step 1: Load app (cache-bust to ensure latest code)
    console.log('\n1. Loading app at http://localhost:5174/');
    await page.goto('http://localhost:5174/?_t=' + Date.now(), { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '01-welcome');

    // Step 2: Click "יאללה, בואו נתחיל!"
    console.log('\n2. Clicking welcome button...');
    await page.getByRole('button', { name: /יאללה|בואו נתחיל/ }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '02-profile');

    // Step 3: Select avatar, enter name, select city
    console.log('\n3. Filling profile...');
    await page.getByRole('button', { name: '😊' }).first().click();
    await page.getByPlaceholder(/איך קוראים/).fill('טל');
    await page.getByRole('button', { name: 'תל אביב - יפו' }).click();
    await takeScreenshot(page, '03-profile-filled');

    // Step 4: Click כניסה
    console.log('\n4. Clicking login...');
    const loginBtn = page.getByRole('button', { name: /כניסה/ });
    await loginBtn.click();
    // Wait for Home - "שלום" appears in greeting "שלום, טל!"
    await page.getByText('שלום', { exact: false }).waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const rootHtml = await page.locator('#root').innerHTML();
    console.log('  Root HTML length:', rootHtml?.length);
    await takeScreenshot(page, '04-home');

    // Step 5: Create group - try button or text
    console.log('\n5. Creating group...');
    const createBtn = page.locator('button:has-text("קבוצה חדשה")').first();
    await createBtn.waitFor({ state: 'visible', timeout: 5000 });
    await createBtn.click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder(/משפחת כהן/).fill('משפחת כהן');
    await page.getByRole('button', { name: 'צור קבוצה' }).click();
    await page.waitForTimeout(800);
    await takeScreenshot(page, '05-group-page');

    // Step 6: Start game
    console.log('\n6. Clicking התחלת משחק...');
    await page.getByRole('button', { name: /התחלת משחק/ }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '06-safety-check');

    // Step 7: Mark safe
    console.log('\n7. Clicking אני במקום בטוח!...');
    await page.getByRole('button', { name: /אני במקום בטוח/ }).click();
    await page.waitForTimeout(800);
    await takeScreenshot(page, '07-ready-to-start');

    // Step 8: Start first game
    console.log('\n8. Clicking התחלת משחק ראשון...');
    await page.getByRole('button', { name: /התחלת משחק ראשון/ }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '08-game-intro');

    // Game intro auto-advances after 3s, wait for rules screen
    console.log('\n9. Waiting for rules screen (intro auto-advances)...');
    await page.waitForTimeout(3500);
    await takeScreenshot(page, '09-game-rules');

    console.log('\n✅ Flow completed! Screenshots saved to', SCREENSHOTS_DIR);
  } catch (err) {
    console.error('Error:', err.message);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

main();
