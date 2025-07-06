// Test URL detection in different environments
const testUrlDetection = () => {
  console.log('🔍 Testing URL detection...');
  
  // Simulate different environments - including new Vercel domains
  const testEnvironments = [
    { name: 'Local Development', VERCEL_URL: undefined, NEXT_PUBLIC_BASE_URL: undefined },
    { name: 'Vercel Production', VERCEL_URL: 'artcode-git-main-sam-oyzis-projects.vercel.app', NEXT_PUBLIC_BASE_URL: undefined },
    { name: 'Vercel New Deploy', VERCEL_URL: 'artcode-abc123-sam-oyzis-projects.vercel.app', NEXT_PUBLIC_BASE_URL: undefined },
    { name: 'Vercel Preview Branch', VERCEL_URL: 'artcode-git-feature-branch-sam-oyzis-projects.vercel.app', NEXT_PUBLIC_BASE_URL: undefined },
    { name: 'Vercel Auto Domain', VERCEL_URL: 'artcode-def456-sam-oyzis-projects.vercel.app', NEXT_PUBLIC_BASE_URL: undefined },
    { name: 'Custom Domain Override', VERCEL_URL: 'artcode-xyz789-sam-oyzis-projects.vercel.app', NEXT_PUBLIC_BASE_URL: 'https://artcode-two.vercel.app' },
  ];

  testEnvironments.forEach(env => {
    console.log(`\n📍 ${env.name}:`);
    
    // Mock environment variables
    const originalVercel = process.env.VERCEL_URL;
    const originalBase = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (env.VERCEL_URL) {
      process.env.VERCEL_URL = env.VERCEL_URL;
    } else {
      delete process.env.VERCEL_URL;
    }
    
    if (env.NEXT_PUBLIC_BASE_URL) {
      process.env.NEXT_PUBLIC_BASE_URL = env.NEXT_PUBLIC_BASE_URL;
    } else {
      delete process.env.NEXT_PUBLIC_BASE_URL;
    }
    
    // Simulate getBaseUrl function
    const getBaseUrl = () => {
      // Priority 1: Custom base URL (highest priority)
      if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL;
      }
      
      // Priority 2: Vercel automatic URL
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
      }
      
      // Priority 3: Default to localhost
      return 'http://localhost:3000';
    };
    
    const baseUrl = getBaseUrl();
    console.log(`  Base URL: ${baseUrl}`);
    console.log(`  Model API: ${baseUrl}/api/models/[fileId]`);
    console.log(`  Image API: ${baseUrl}/api/images/[fileId]`);
    
    // Restore environment
    if (originalVercel) {
      process.env.VERCEL_URL = originalVercel;
    } else {
      delete process.env.VERCEL_URL;
    }
    
    if (originalBase) {
      process.env.NEXT_PUBLIC_BASE_URL = originalBase;
    } else {
      delete process.env.NEXT_PUBLIC_BASE_URL;
    }
  });
};

// Test the actual API endpoint locally
const testApiRoute = async () => {
  try {
    console.log('🧪 Testing local API route...');
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

console.log('🧪 URL Detection Test - Including New Vercel Domains\n');
testUrlDetection();

console.log('\n🚀 Make sure your dev server is running (npm run dev)');
console.log('Then test the actual API routes...\n');
testApiRoute();

// Export for browser console use
if (typeof window !== 'undefined') {
  window.testApiRoute = testApiRoute;
} 