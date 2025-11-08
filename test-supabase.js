const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ztiirfcyyobhlwdtcxbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aWlyZmN5eW9iaGx3ZHRjeGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzM0MDMsImV4cCI6MjA3NjcwOTQwM30.kkv5fZ7bMCAmWXCGpOwQzRmLc-lCRB1KVr1R5Yfys0o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  
  try {
    // Test 1: Check startup_profiles table
    console.log('1. Checking startup_profiles table...');
    const { data: startups, error: startupsError } = await supabase
      .from('startup_profiles')
      .select('*')
      .limit(5);
    
    if (startupsError) {
      console.error('Error fetching startups:', startupsError.message);
    } else {
      console.log(`✅ Found ${startups?.length || 0} startups`);
      if (startups && startups.length > 0) {
        console.log('Sample startup:', JSON.stringify(startups[0], null, 2));
      }
    }
    
    // Test 2: Check profiles table
    console.log('\n2. Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profiles`);
    }
    
    // Test 3: Check auth users
    console.log('\n3. Checking authentication status...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session ? 'Logged in' : 'Not logged in');
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();
