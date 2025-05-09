# Disabling Supabase RLS Policies for Mock Authentication

This guide explains how to temporarily disable Row Level Security (RLS) in Supabase to allow direct database insertions for the mock authentication flow in the StreetVend app.

## Understanding the Issue

The SQL schema includes Row Level Security (RLS) policies that restrict direct insertions into tables like `users`, `buyers`, and `sellers`. These policies are designed to work with Supabase Auth to ensure users can only modify their own data. 

For our mock authentication flow, we need to bypass these restrictions temporarily.

## Option 1: Disable RLS for Development

### Step 1: Log in to Supabase Dashboard
Navigate to your Supabase project dashboard.

### Step 2: Go to the SQL Editor
Click on "SQL Editor" in the left navigation panel.

### Step 3: Run SQL Commands to Disable RLS
Run the following SQL commands to temporarily disable RLS for the relevant tables:

```sql
-- Disable RLS for the users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS for the buyers table
ALTER TABLE buyers DISABLE ROW LEVEL SECURITY;

-- Disable RLS for the sellers table
ALTER TABLE sellers DISABLE ROW LEVEL SECURITY;
```

### Step 4: Re-enable RLS When Ready for Production
When you're ready to implement real authentication, re-enable RLS:

```sql
-- Re-enable RLS for the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS for the buyers table
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS for the sellers table
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
```

## Option 2: Modify RLS Policies

If you prefer to keep RLS enabled, you can modify the policies to allow the specific operations needed for the mock flow:

```sql
-- Drop existing users policy
DROP POLICY IF EXISTS users_policy ON users;

-- Create new users policy that allows all operations
CREATE POLICY users_policy ON users
  USING (true) -- Allow all reads
  WITH CHECK (true); -- Allow all writes

-- Similarly for buyers
DROP POLICY IF EXISTS buyers_policy ON buyers;
CREATE POLICY buyers_policy ON buyers
  USING (true)
  WITH CHECK (true);

-- And for sellers
DROP POLICY IF EXISTS sellers_policy ON sellers;
CREATE POLICY sellers_policy ON sellers
  USING (true)
  WITH CHECK (true);
```

## Option 3: Use Service Role Key for API Calls

If you want to maintain security policies but bypass them for your app:

1. In the Supabase dashboard, go to Project Settings > API
2. Find your "service_role" key (WARNING: This key bypasses RLS)
3. Update your supabase.js file to use this key instead of the anon key:

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'; // Use with caution!

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

**SECURITY WARNING**: Never use the service role key in production client-side code! This approach is only for development.

## Recommendation for Production

For a production app:

1. Implement proper Supabase authentication
2. Keep RLS enabled 
3. Use appropriate RLS policies that check authentication
4. Never expose the service role key to clients

---

*Note: The mock authentication approach is only for development and testing. In a production environment, you should implement proper authentication using Supabase Auth and secure RLS policies.* 