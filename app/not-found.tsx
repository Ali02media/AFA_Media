import { Link } from "next-view-transitions";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/section";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100svh] items-center">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="orb orb-blue absolute left-1/3 top-1/3 h-[500px] w-[500px] opacity-20" />
      </div>
      <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade opacity-30" />

      <Container>
        <div className="flex max-w-lg flex-col gap-6">
          <p className="font-display text-8xl font-bold text-gradient">404</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Page not found
          </h1>
          <p className="text-lg leading-relaxed text-mist">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>
          <Link
            href="/"
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-line bg-ink-3 px-6 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:border-brand-blue/40 hover:bg-ink-4"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to homepage
          </Link>
        </div>
      </Container>
    </div>
  );
}
