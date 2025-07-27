import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and anon key from project settings
const supabaseUrl = 'https://yrpfcforiwwwrvcanyhb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycGZjZm9yaXd3d3J2Y2FueWhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEzNDE4OCwiZXhwIjoyMDY1NzEwMTg4fQ.GPR6-2es_iqSVwdmVAiQO4V1-_g7gvXLNdS8VNofnsU';
 
export const supabase = createClient(supabaseUrl, supabaseKey); 