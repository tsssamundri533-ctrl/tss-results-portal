
import { redirect } from "next/navigation";

/**
 * Root redirection protocol.
 * Ensures the system starts directly at the secure login terminal.
 */
export default function RootPage() {
  redirect("/login");
}
