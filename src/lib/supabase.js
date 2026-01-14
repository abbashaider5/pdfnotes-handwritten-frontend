import { createClient } from '@supabase/supabase-js';

// ==========================================
// ENVIRONMENT VARIABLE VALIDATION
// ==========================================

const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
  VITE_APP_URL: import.meta.env.VITE_APP_URL,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('====================================');
  console.error('MISSING ENVIRONMENT VARIABLES:');
  console.error('====================================');
  missingVars.forEach(varName => {
    console.error(`❌ ${varName} is not defined`);
  });
  console.error('====================================');
  console.error('Please set these environment variables in your .env file or in your hosting platform.');
  console.error('====================================');
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Log loaded environment variables (for debugging)
console.log('✅ Environment variables loaded:', {
  VITE_SUPABASE_URL: requiredEnvVars.VITE_SUPABASE_URL.substring(0, 20) + '...',
  VITE_SUPABASE_ANON_KEY: requiredEnvVars.VITE_SUPABASE_ANON_KEY.substring(0, 10) + '...',
  VITE_BACKEND_URL: requiredEnvVars.VITE_BACKEND_URL,
  VITE_APP_URL: requiredEnvVars.VITE_APP_URL,
});

// ==========================================
// SUPABASE CLIENT
// ==========================================

const supabase = createClient(
  requiredEnvVars.VITE_SUPABASE_URL,
  requiredEnvVars.VITE_SUPABASE_ANON_KEY
);

export { supabase };

// Export environment variables for use in other files
export const ENV = {
  SUPABASE_URL: requiredEnvVars.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: requiredEnvVars.VITE_SUPABASE_ANON_KEY,
  BACKEND_URL: requiredEnvVars.VITE_BACKEND_URL,
  APP_URL: requiredEnvVars.VITE_APP_URL,
};
