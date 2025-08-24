const { chromium } = require("playwright");

async function testLoginLogout() {
  console.log("Starting login/logout test...");
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Navigating to http://localhost:5193");
    await page.goto("http://localhost:5193");
    await page.waitForTimeout(2000);
    
    console.log("Current URL:", page.url());
    
    if (page.url().includes("/login")) {
      console.log("On login page, attempting login...");
      
      await page.fill("input[type=\"text\"]", "Freedom_exe");
      await page.fill("input[type=\"password\"]", "Fr33dom123!");
      await page.click("button[type=\"submit\"]");
      await page.waitForTimeout(3000);
      
      console.log("After login URL:", page.url());
    }
    
    // Test navigation
    console.log("Testing navigation...");
    const sections = ["Directory", "Create", "Manage", "Reports"];
    
    for (const section of sections) {
      console.log(`Testing ${section}...`);
      const link = page.locator(`text="${section}"`).first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(1000);
        console.log(`${section} URL:`, page.url());
      } else {
        console.log(`${section} link not found`);
      }
    }
    
    // Test logout
    console.log("Testing logout...");
    const logoutBtn = page.locator("text=\"Logout\"").first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      console.log("After logout URL:", page.url());
      
      await page.waitForTimeout(3000);
      console.log("After waiting URL:", page.url());
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }

  await browser.close();
}

testLoginLogout();
