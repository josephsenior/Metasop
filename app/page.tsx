import { redirect } from "next/navigation"

/**
 * Root route: redirect to dashboard (open-source local usage, no marketing homepage).
 */
export default function Home() {
  redirect("/dashboard")
}
