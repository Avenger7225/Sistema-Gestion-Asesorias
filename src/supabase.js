import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://toupojjbqnyakiixelyr.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdXBvampicW55YWtpaXhlbHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTQ2MjMsImV4cCI6MjA3NjI5MDYyM30.IxMGDVB-LPesgqOWq5zvzHA5dRFxO3M3fuuog_81SyY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)