import bcrypt from "bcryptjs";

import { getSupabase } from "./supabase.server";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  passwordHash: string;
  role: string;
};

export async function verifyAdminCredentials(email: string, password: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("role", "admin")
    .single();

  if (error || !data) return null;

  const user = data as unknown as AdminUser;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.displayName || user.username,
  };
}
