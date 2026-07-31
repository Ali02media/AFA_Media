import { PageTransition } from "@/components/layout/page-transition";

// template.tsx (NOT layout.tsx): Next re-mounts this subtree on every navigation, which is what
// lets the route transition replay each time. Layout would persist and only animate once.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
