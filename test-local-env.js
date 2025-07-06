// Test environment variables locally
console.log('🔍 Testing Local Environment Variables');
console.log('=====================================');

console.log('NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY:', process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY ? 'SET' : 'NOT SET');
console.log('API Key Length:', process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY?.length || 0);

// Test the actual API endpoint locally
const testApiRoute = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/models/1qmsS1au2m9uP1UxpRkzWnDDTKNA4_QSC');
    console.log('Local API Route Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Local API route works!');
    } else {
      const error = await response.text();
      console.log('❌ Local API route error:', error);
    }
  } catch (error) {
    console.log('❌ Cannot reach local API route (server not running?)');
  }
};

console.log('\n🚀 Make sure your dev server is running (npm run dev)');
console.log('Then run: testApiRoute()');

// Export for browser console use
if (typeof window !== 'undefined') {
  window.testApiRoute = testApiRoute;
} 