import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and anon key from project settings
const supabaseUrl = 'https://yrpfcforiwwwrvcanyhb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycGZjZm9yaXd3d3J2Y2FueWhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY1MjM1MiwiZXhwIjoyMDYyMjI4MzUyfQ.y4lTg8gufdV6Tanyj2h0As0uLluHCFwzg9QLKucQoAw';

export const supabase = createClient(supabaseUrl, supabaseKey); 