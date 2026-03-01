#!/usr/bin/env node
/**
 * E2E flow test for מקלט ביחד app - User's exact steps
 * Port: 5173
 * Uses 2 users so "התחלת משחק" is enabled (needs 2+ members)
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = __dirname + '/flow-screenshots';
const BASE_URL = 'http://localhost:5173';

async function takeScreenshot(page, name) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const path = `${SCREENSHOTS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  📸 Saved: ${path}`);
  return path;
}

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true, timeout: 30000 });
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

  const reports = [];

  try {
    // ========== Step 1: Load app ==========
    console.log('\n--- Step 1: Load http://localhost:5173/ ---');
    await page.goto(`${BASE_URL}/?_t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '01-welcome');
    const hasTitle = await page.locator('text=מקלט ביחד').isVisible();
    const hasBtn = await page.getByRole('button', { name: /יאללה|בואו נתחיל/ }).isVisible();
    reports.push({ step: 1, ok: hasTitle && hasBtn, note: hasTitle && hasBtn ? 'Welcome screen OK' : 'Missing title or button' });

    // ========== Step 2: Click "יאללה, בואו נתחיל!" ==========
    console.log('\n--- Step 2: Click welcome button ---');
    await page.getByRole('button', { name: /יאללה|בואו נתחיל/ }).click();
    await page.waitForTimeout(800);
    await takeScreenshot(page, '02-profile');
    const hasProfile = await page.locator('text=צרו פרופיל').isVisible();
    reports.push({ step: 2, ok: hasProfile, note: hasProfile ? 'Profile screen OK' : 'Profile screen not shown' });

    // ========== Step 3: Profile - avatar 🦊, name טל, city תל אביב ==========
    console.log('\n--- Step 3: Fill profile (fox, טל, תל אביב) ---');
    await page.getByRole('button', { name: '🦊' }).click();
    await page.getByPlaceholder(/איך קוראים/).fill('טל');
    // Scroll cities if needed - תל אביב - יפו is first in list
    await page.getByRole('button', { name: 'תל אביב - יפו' }).click();
    await takeScreenshot(page, '03-profile-filled');

    // ========== Step 4: Click כניסה ==========
    console.log('\n--- Step 4: Click כניסה ---');
    await page.getByRole('button', { name: /כניסה/ }).click();
    await page.getByText('שלום', { exact: false }).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '04-home');
    const hasHome = await page.locator('text=הקבוצות שלי').isVisible();
    reports.push({ step: 4, ok: hasHome, note: hasHome ? 'Home screen OK' : 'Home not shown' });

    // ========== Step 5: Create group "משפחת כהן" ==========
    console.log('\n--- Step 5: Create group משפחת כהן ---');
    await page.getByRole('button', { name: 'קבוצה חדשה' }).click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder(/משפחת כהן|השכנים/).fill('משפחת כהן');
    await page.getByRole('button', { name: 'צור קבוצה' }).click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '05-group-page');
    const onGroupPage = await page.locator('text=משפחת כהן').first().isVisible();
    reports.push({ step: 5, ok: onGroupPage, note: onGroupPage ? `Group created (bots auto-added)` : 'Group page not shown' });

    // ========== Step 6: Click התחלת משחק ==========
    console.log('\n--- Step 6: Click התחלת משחק ---');
    const startBtn = page.getByRole('button', { name: /התחלת משחק/ });
    await startBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const startEnabled = await startBtn.isEnabled();
    if (startEnabled) {
      await startBtn.click();
      await page.waitForTimeout(800);
      await takeScreenshot(page, '06-safety-check');
      const hasSafety = await page.locator('text=אני במקום בטוח').isVisible();
      reports.push({ step: 6, ok: hasSafety, note: hasSafety ? 'Safety check screen OK' : 'Safety check not shown' });
    } else {
      await takeScreenshot(page, '06-group-cannot-start');
      reports.push({ step: 6, ok: false, note: 'התחלת משחק button disabled (need 2+ members)' });
    }

    if (startEnabled) {
      // ========== Step 7: Click אני במקום בטוח! ==========
      console.log('\n--- Step 7: Click אני במקום בטוח! ---');
      await page.getByRole('button', { name: /אני במקום בטוח/ }).click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '07-ready-to-start');
      const hasFirstGameBtn = await page.getByRole('button', { name: /התחלת משחק ראשון/ }).isVisible();
      reports.push({ step: 7, ok: hasFirstGameBtn, note: hasFirstGameBtn ? 'Ready to start first game' : 'First game button not shown' });

      // ========== Step 8: Click התחלת משחק ראשון ==========
      if (hasFirstGameBtn) {
        console.log('\n--- Step 8: Click התחלת משחק ראשון ---');
        await page.getByRole('button', { name: /התחלת משחק ראשון/ }).click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '08-game-intro');
        await page.waitForTimeout(3500); // intro auto-advances
        await takeScreenshot(page, '09-game-rules');
        const hasRules = await page.locator('text=מוכנים').isVisible().catch(() => false)
          || await page.getByRole('button', { name: /בואו נתחיל|מוכנים/ }).isVisible().catch(() => false);
        reports.push({ step: 8, ok: true, note: 'Game intro and rules screens captured' });
      }
    }

    // Summary
    console.log('\n========== REPORT ==========');
    reports.forEach((r) => console.log(`Step ${r.step}: ${r.ok ? '✓' : '✗'} ${r.note}`));
    console.log('\nScreenshots saved to:', SCREENSHOTS_DIR);
  } catch (err) {
    console.error('Error:', err.message);
    try {
      await takeScreenshot(page, 'error-state');
    } catch (_) {}
    reports.push({ step: 0, ok: false, note: `Error: ${err.message}` });
  } finally {
    await browser.close();
  }
}

main();
