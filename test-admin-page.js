const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console errors
  page.on("console", msg => {
    console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
  });
  
  // Listen for network errors
  page.on("response", response => {
    if (!response.ok()) {
      console.log(`NETWORK ERROR: ${response.status()} ${response.url()}`);
    }
  });
  
  // Listen for page errors
  page.on("pageerror", error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log("Navigating to admin page directly...");
    await page.goto("http://localhost:5183/hub/admin");
    
    console.log("Waiting for page to load...");
    await page.waitForTimeout(3000);
    
    console.log("Current page title:", await page.title());
    console.log("Current URL:", page.url());
    
    // Take a screenshot
    await page.screenshot({ path: "admin-page.png" });
    
    console.log("Looking for page content...");
    const bodyText = await page.textContent("body");
    console.log("Page text content:", bodyText.substring(0, 500) + "...");
    
  } catch (error) {
    console.log("ERROR:", error.message);
  }
  
  console.log("Test completed. Browser will stay open for 15 seconds...");
  await page.waitForTimeout(15000);
  
  await browser.close();
})();
