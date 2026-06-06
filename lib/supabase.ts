import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    "https://axjijxvbxnamqsrxurlp.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4amlqeHZieG5hbXFzcnh1cmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODY0NzUsImV4cCI6MjA5NDQ2MjQ3NX0.jjZmavwXf0_rEJfqRVhMnhjaMFrTEejn8T20149w3wU"
  );
}