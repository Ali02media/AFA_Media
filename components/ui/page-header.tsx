import { Container } from "@/components/ui/section";

export function PageHeader({
  title,
  lead,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-36 pb-16 sm:pt-44 sm:pb-20">
      <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade opacity-40" />
      <div className="absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />
      <Container>
        <div className="flex max-w-3xl flex-col gap-6">
          <h1 className="font-display text-5xl font-semibold leading-[1.04] tracking-tight text-foreground sm:text-6xl">
            {title}
          </h1>
          {lead && (
            <p className="max-w-2xl text-lg leading-relaxed text-mist sm:text-xl">
              {lead}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
