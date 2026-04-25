import "dotenv/config";
import { AuthService } from "./modules/auth/auth.service";

async function testLogin() {
  console.log("Testing login...");
  
  try {
    const authService = new AuthService();
    
    // Test login with demo credentials
    const result = await authService.login("admin@erp.com", "admin123");
    
    console.log("Login successful!");
    console.log("User:", result.user);
    console.log("Access Token:", result.accessToken.substring(0, 50) + "...");
    console.log("Refresh Token:", result.refreshToken.substring(0, 50) + "...");
    
  } catch (error) {
    console.error("Login failed:", error);
  }
}

testLogin();
