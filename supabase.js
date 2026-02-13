import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://kzbgxaveqbslpzijgthd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6Ymd4YXZlcWJzbHB6aWpndGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjMyMDUsImV4cCI6MjA4NTQzOTIwNX0.chXsz0PfpSp9RSE7pGCOdJCi_Qf_EGnE8Nm39bkKYEQ"
);
