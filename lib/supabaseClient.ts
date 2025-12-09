
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aeideybonufqzpzmuhmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlaWRleWJvbnVmcXpwem11aG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzgyNDMsImV4cCI6MjA4MDgxNDI0M30.ez_ZlF0RZua3gyo6TU1nO3rdznbYyuQIWtQjrmHhliU';

export const supabase = createClient(supabaseUrl, supabaseKey);
