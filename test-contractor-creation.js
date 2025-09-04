const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console errors
  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log("CONSOLE ERROR:", msg.text());
    }
    if (msg.type() === "warn") {
      console.log("CONSOLE WARN:", msg.text());
    }
  });
  
  // Listen for network errors
  page.on("response", response => {
    if (!response.ok()) {
      console.log(`NETWORK ERROR: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log("Navigating to frontend...");
    await page.goto("http://localhost:5183");
    
    console.log("Waiting for page to load...");
    await page.waitForTimeout(2000);
    
    console.log("Looking for Admin hub button...");
    await page.click("text=Admin");
    
    console.log("Waiting for admin page to load...");
    await page.waitForTimeout(2000);
    
    console.log("Looking for Contractors tab...");
    await page.click("text=Contractors");
    
    console.log("Waiting for contractors page to load...");
    await page.waitForTimeout(2000);
    
    console.log("Looking for Create Contractor button...");
    await page.click("button:has-text(\"Create Contractor\")");
    
    console.log("Waiting for form to appear...");
    await page.waitForTimeout(1000);
    
    console.log("Filling out contractor form...");
    await page.fill("input[name=\"company_name\"]", "Test Company");
    await page.fill("input[name=\"address\"]", "123 Test Street");
    await page.fill("input[name=\"contact_person\"]", "John Doe");
    await page.fill("input[name=\"phone\"]", "555-1234");
    await page.fill("input[name=\"email\"]", "test@example.com");
    await page.fill("input[name=\"website\"]", "https://test.com");
    
    console.log("Submitting form...");
    await page.click("button[type=\"submit\"]");
    
    console.log("Waiting for response...");
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.log("ERROR:", error.message);
  }
  
  console.log("Test completed. Browser will stay open for 10 seconds...");
  await page.waitForTimeout(10000);
  
  await browser.close();
})();
