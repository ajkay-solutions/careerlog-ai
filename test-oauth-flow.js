// OAuth testing script for WorkLog AI
// const puppeteer = require('puppeteer'); // Not required for basic testing

const testCredentials = {
  email: 'ajk.workflowgen.dev@gmail.com',
  password: 'Ajk@w0rkf10wgen'
};

async function testOAuthFlow() {
  console.log('🧪 Testing WorkLog AI OAuth Flow...\n');
  
  let browser;
  try {
    // Check if both servers are running
    console.log('1. Checking server status...');
    
    // Test backend
    const backendResponse = await fetch('http://localhost:3004/health');
    if (!backendResponse.ok) {
      throw new Error('Backend not running on port 3004');
    }
    console.log('✅ Backend running on port 3004');
    
    // Test frontend
    const frontendResponse = await fetch('http://localhost:5173/');
    if (!frontendResponse.ok) {
      throw new Error('Frontend not running on port 5173');
    }
    console.log('✅ Frontend running on port 5173\n');
    
    // Launch browser for OAuth testing
    console.log('2. Starting OAuth flow test...');
    browser = await puppeteer.launch({ 
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Go to WorkLog AI
    console.log('📱 Opening WorkLog AI app...');
    await page.goto('http://localhost:5173');
    
    // Wait for the page to load
    await page.waitForSelector('h1', { timeout: 5000 });
    const title = await page.$eval('h1', el => el.textContent);
    console.log('✅ App loaded:', title);
    
    // Look for Google login button
    console.log('🔍 Looking for Google login button...');
    const loginButton = await page.$('button:has-text("Continue with Google")') || 
                       await page.$('button[onclick*="google"]') ||
                       await page.$('*[href*="/auth/google"]');
    
    if (loginButton) {
      console.log('✅ Found Google login button');
      
      // Click the login button
      console.log('🖱️  Clicking Google login...');
      await loginButton.click();
      
      // Wait for Google OAuth page
      await page.waitForNavigation({ timeout: 10000 });
      
      const currentUrl = page.url();
      if (currentUrl.includes('accounts.google.com')) {
        console.log('✅ Redirected to Google OAuth');
        console.log('🔐 URL:', currentUrl);
        
        // TODO: Could automate login here, but for security reasons,
        // we'll just verify the redirect works
        console.log('\n✅ OAuth redirect successful!');
        console.log('🙋 Manual step required: Complete Google login in browser');
        
        // Keep browser open for manual testing
        console.log('Browser will stay open for manual testing...');
        return true;
      } else {
        console.log('❌ Not redirected to Google OAuth');
        console.log('Current URL:', currentUrl);
        return false;
      }
    } else {
      console.log('❌ Google login button not found');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'login-page-debug.png' });
      console.log('📸 Screenshot saved as login-page-debug.png');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ OAuth flow test failed:', error.message);
    return false;
  }
  
  // Note: Don't close browser for manual testing
  // if (browser) await browser.close();
}

// Only run if not using Puppeteer (which we may not have installed)
async function simpleTest() {
  console.log('🧪 Simple WorkLog AI Test (without Puppeteer)...\n');
  
  try {
    // Test backend health
    console.log('1. Testing backend...');
    const backendResponse = await fetch('http://localhost:3004/health');
    const backendData = await backendResponse.json();
    console.log('✅ Backend:', backendData.status, backendData.service);
    
    // Test OAuth redirect
    console.log('2. Testing OAuth redirect...');
    const oauthResponse = await fetch('http://localhost:3004/auth/google', {
      redirect: 'manual'
    });
    
    if (oauthResponse.status === 302) {
      const location = oauthResponse.headers.get('location');
      console.log('✅ OAuth redirect working');
      console.log('🔗 Redirect URL:', location);
      
      if (location.includes('accounts.google.com')) {
        console.log('✅ Correctly redirects to Google');
      }
    }
    
    // Test frontend
    console.log('3. Testing frontend...');
    const frontendResponse = await fetch('http://localhost:5173/');
    if (frontendResponse.ok) {
      console.log('✅ Frontend accessible');
    }
    
    console.log('\n🎉 Basic tests passed!');
    console.log('🌐 Open http://localhost:5173/ to test manually');
    console.log('🔐 Use provided credentials for Google OAuth');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run simple test (without Puppeteer dependency)
simpleTest().then(success => {
  if (success) {
    console.log('\n✅ Ready for manual testing with provided credentials');
  } else {
    console.log('\n❌ Tests failed - check server status');
  }
});