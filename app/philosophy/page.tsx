import type { Metadata } from "next";
import { Check, X, ShieldCheck, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Container, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/reveal";
import { CalButton } from "@/components/cal";
import { Proof } from "@/components/sections/proof";
import { CTA } from "@/components/sections/cta";
import { WorkShowcase } from "@/components/ui/work-showcase";
import { JsonLd } from "@/components/json-ld";
import { breadcrumb } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Our Philosophy & System",
  description:
    "A high-end website and Google Ads engine built to bring UK service businesses more customers — for a fraction of what agencies usually charge, live in days rather than months.",
  alternates: { canonical: "/philosophy" },
};

/** Small editorial label — teal rule + monospace tag — matching the "The gap" / "The fix"
 *  treatment used in the Problem and Services sections, so this page reads as the same brand. */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="h-px w-6 bg-brand-teal" />
      <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-brand-teal">
        {children}
      </span>
    </div>
  );
}

const engineeringStats = [
  { stat: "300+", note: "premium design pieces, ready to build your site with" },
  { stat: "100s", note: "of hours of work already done before your project starts" },
  { stat: "£20k+", note: "worth of design and code, already built" },
  { stat: "Days", note: "from first call to a site that's live — not months" },
];

const vaultPoints = [
  "300+ premium design pieces — 3D touches, animations, layouts you'd normally pay thousands for",
  "Smooth, expensive-feeling motion that makes visitors trust you the moment they land",
  "Every page laid out to turn a curious visitor into a booked call",
];

const performancePoints = [
  "Loads instantly — nothing loses a customer faster than a slow site",
  "Flawless on a phone, where most of your customers will actually find you",
  "Built to be found on Google — not just to look pretty",
];

// Section 3 — the Google Ads engine. Where the standard media buyer's model leaks money.
const adFailures = [
  "Your budget spent on the wrong searchers — people who were never going to buy from you",
  "Boring ad copy that reads the same as every competitor's — so nobody clicks",
  "A monthly fee that keeps landing whether the phone rings or not",
];

const adPillars = [
  {
    n: "01",
    title: "Only ready buyers see your ad",
    body: "We aim your budget at people actively searching to buy what you sell — not people who are just curious. The tyre-kickers get filtered out before you pay for their click.",
    result: "Less wasted spend. Lower cost per lead.",
  },
  {
    n: "02",
    title: "Ads written to make the phone ring",
    body: "Every ad is built on proven sales writing — a headline that stops the scroll, a line that speaks to what the customer actually wants, and an offer that's hard to walk past.",
    result: "The right people click. The wrong ones scroll past — before you pay for them.",
  },
  {
    n: "03",
    title: "We find what works — fast",
    body: "We run several versions of each ad at once, see which one is bringing you the most enquiries, and put your budget behind the winner. What takes other agencies weeks, we settle in days.",
    result: "More enquiries, from the same budget. Faster.",
  },
];

// Section 4 — the Founding Partner Programme (Option A: radically transparent). Real terms:
// 50% off setup/build for the next 10 clients, in exchange for a documented video case study
// + testimonial once growth targets are hit; an ads guarantee; hard cap of 10, then price
// returns to full market rate.
const SPOTS_LEFT = 8; // of 10 — set this to the real number of founding spots remaining.

const tradeTerms = [
  {
    head: "We cover 50% of your setup and build.",
    body: "The same premium site and sales-focused ad copy every later client pays full rate for — at half the entry cost.",
  },
  {
    head: "You give us the proof.",
    body: "Once we've hit your growth targets, you sit down with us for a short video case study and testimonial. Miss the targets and you film nothing.",
  },
];

export default function PhilosophyPage() {
  return (
    <>
      <JsonLd data={breadcrumb([{ name: "Philosophy", path: "/philosophy" }])} />
      <PageHeader
        title={
          <>
            Premium websites that win you customers —{" "}
            <span className="text-gradient">in days, not months.</span>
          </>
        }
        lead="Most agencies are slow and cost a fortune. Cheap website builders look cheap. We give you both sides of what you actually want: a high-end site that brings in work, built fast, for a fraction of the usual price."
      />

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 1 — The Core Philosophy
          The false choice (legacy vs AI slop) → the third category.
      ───────────────────────────────────────────────────────────────────── */}
      <section className="pb-8">
        <Container>
          <Reveal>
            <Label>The two bad options</Label>
            <p className="max-w-3xl font-display text-2xl font-medium leading-snug text-foreground sm:text-3xl">
              Until now, a serious business had two ways to get a website — and
              both quietly worked against them.
            </p>
          </Reveal>

          {/* The two traps, as a contrasting pair. */}
          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-line bg-ink-2 p-8 sm:p-10">
                <Label>Option 1 — the big agency</Label>
                <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                  £10,000 and a three-month wait.
                </h2>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-mist sm:text-base">
                  <p>
                    A £10,000–£15,000 quote isn&apos;t the price of a better
                    website. It&apos;s the price of{" "}
                    <span className="text-foreground">everyone in the middle</span>{" "}
                    — the account manager, the project manager, the meetings, the
                    slow back-and-forth — long before anyone starts building the
                    thing that actually matters.
                  </p>
                  <p>
                    And while you&apos;re waiting three months to go live,{" "}
                    <span className="text-foreground">
                      your competitors aren&apos;t.
                    </span>{" "}
                    Every week you&apos;re still in draft is a week of enquiries
                    going somewhere else.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="h-full rounded-2xl border border-line bg-ink-2 p-8 sm:p-10">
                <Label>Option 2 — the cheap builder</Label>
                <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                  Cheap, instant, and looks like everyone else.
                </h2>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-mist sm:text-base">
                  <p>
                    At the other end you&apos;ve got the AI website makers and
                    drag-and-drop templates — a site built in an afternoon for a
                    few pounds a month. It looks exactly like what it is: a{" "}
                    <span className="text-foreground">generic template</span>{" "}
                    thousands of other businesses are using right now.
                  </p>
                  <p>
                    If you&apos;re trying to be taken seriously, this is the more
                    dangerous choice —{" "}
                    <span className="text-foreground">
                      years of hard-earned reputation, undermined by a website
                    </span>{" "}
                    that a competitor down the road is using with the colours
                    swapped.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* The third option — the resolution, given visual weight. */}
          <Reveal delay={0.1}>
            <div className="border-gradient mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-teal/10 p-8 sm:p-12">
              <Label>The third option</Label>
              <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                The best of both —{" "}
                <span className="text-gradient">without the catch.</span>
              </h2>
              <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-mist sm:text-lg">
                <p>
                  We spent hundreds of hours up front building the expensive parts
                  — the polished design, the smooth animations, the interactive
                  touches that normally cost thousands and take weeks. Over{" "}
                  <span className="text-foreground">
                    300 premium pieces
                  </span>{" "}
                  we can build any site out of, all crafted to a high standard.
                </p>
                <p>
                  So when you come to us, we&apos;re not starting from zero. We
                  build your site around your business from parts that are already
                  polished — which is how you get a{" "}
                  <span className="text-foreground">
                    site that looks like a £10,000 job, turns visitors into
                    booked customers, and goes live in days
                  </span>{" "}
                  — for a fraction of the usual price.
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 2 — The Engineering Standard
          Kills the "AI = cheap/lazy" objection: the system, the vault, the speed.
      ───────────────────────────────────────────────────────────────────── */}
      <section className="border-t border-line bg-ink-2/30 py-24 sm:py-32">
        <Container>
          <Reveal>
            <Label>What this means for you</Label>
            <SectionHeading
              align="left"
              title={
                <>
                  A site that looks expensive, loads instantly,{" "}
                  <span className="text-gradient">and books you jobs.</span>
                </>
              }
              lead="When people hear &ldquo;built with AI&rdquo; they picture cheap and generic. Ours is the opposite. Behind every site is a library of premium hand-built pieces and a real designer making sure it looks right and actually sells for you — the AI just makes the whole thing possible in days instead of months."
            />
          </Reveal>

          {/* Stat row */}
          <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
            {engineeringStats.map((s, i) => (
              <Reveal key={s.stat} delay={i * 0.06}>
                <div className="h-full bg-ink px-6 py-8">
                  <div className="font-mono text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                    {s.stat}
                  </div>
                  <p className="mt-2 font-mono text-[12px] leading-relaxed text-mist-dim">
                    {s.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Three things that make it different — reframed to what it means for the client. */}
          <div className="mt-20 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <Reveal>
              <div>
                <Label>Why our sites don&apos;t look like the cheap ones</Label>
                <h3 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                  Fast, but never generic.
                </h3>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-mist sm:text-base">
                  <p>
                    A site built entirely by AI in an afternoon looks like a site
                    built entirely by AI in an afternoon. You can spot one a mile
                    off — and so can your customer.
                  </p>
                  <p className="text-foreground">
                    Ours don&apos;t. Because a real person with taste is leading
                    every build — the AI is just doing the heavy lifting fast, from
                    a set of high-end pieces we made ourselves.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <ul className="space-y-5">
                {[
                  ["A real person leads every build.", "Smart tools do the heavy lifting fast; a designer makes sure it looks right and actually sells for you. You never get handed a generic template with your logo pasted on."],
                  ["Nobody else can copy it.", "The library of pieces we build from is ours, and only ours. Your competitor can't buy the same look because it isn't for sale anywhere."],
                  ["Built around how you make money.", "Every page is set up to turn a curious visitor into a call, an enquiry or a booking — not just to look pretty and sit there."],
                ].map(([head, body]) => (
                  <li key={head} className="flex gap-4 rounded-xl border border-line bg-ink p-5">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
                    <div>
                      <p className="font-display font-semibold text-foreground">{head}</p>
                      <p className="mt-1 text-[14px] leading-relaxed text-mist">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* The vault + performance, as a pair */}
          <div className="mt-20 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-line bg-ink p-8 sm:p-10">
                <Label>What you&apos;re getting</Label>
                <h3 className="font-display text-2xl font-semibold text-foreground">
                  300+ premium pieces, ready to go.
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-mist">
                  Big agencies charge tens of thousands and take months to build
                  the sort of design touches, animations and interactive elements
                  we already have made. Yours gets the same treatment — without
                  the wait or the price tag.
                </p>
                <ul className="mt-6 space-y-3">
                  {vaultPoints.map((p) => (
                    <li key={p} className="flex gap-3 text-[14px] leading-relaxed text-mist">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="h-full rounded-2xl border border-line bg-ink p-8 sm:p-10">
                <Label>Fast, and flawless on a phone</Label>
                <h3 className="font-display text-2xl font-semibold text-foreground">
                  Looks premium. Loads like it&apos;s not there.
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-mist">
                  Fancy websites are usually slow websites — and a site that takes
                  more than a couple of seconds to load loses the customer before
                  they&apos;ve even seen it. Ours don&apos;t. Same look, none of
                  the drag.
                </p>
                <ul className="mt-6 space-y-3">
                  {performancePoints.map((p) => (
                    <li key={p} className="flex gap-3 text-[14px] leading-relaxed text-mist">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* Bridge — now leads into the interactive work showcase directly below. */}
          <Reveal delay={0.1}>
            <p className="mx-auto mt-16 max-w-2xl text-center font-display text-xl font-medium leading-snug text-foreground sm:text-2xl">
              Rather than take our word for it, see it.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SHOWCASE — the vault, in the wild. Fanned, interactive project cards.
      ───────────────────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <Container>
          <Reveal>
            <Label>Selected work</Label>
            <SectionHeading
              align="left"
              title={
                <>
                  The system, <span className="text-gradient">in the wild.</span>
                </>
              }
              lead="A mix of demo builds and real client work from over the years — each one engineered from the same vault, tuned to the brand it carries. Click through them."
            />
          </Reveal>
        </Container>

        <Reveal delay={0.08}>
          <div className="mt-14">
            <WorkShowcase />
          </div>
        </Reveal>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 3 — The Ads Engine & Copy Philosophy
          Pivots from web engineering to the revenue engine: Google Ads run as
          direct-response copywriting, not a media-buyer setup task.
      ───────────────────────────────────────────────────────────────────── */}
      <section className="border-t border-line py-24 sm:py-32">
        <Container>
          <Reveal>
            <Label>Then we bring you the customers</Label>
            <SectionHeading
              align="left"
              title={
                <>
                  Google Ads run to make{" "}
                  <span className="text-gradient">the phone ring.</span>
                </>
              }
              lead="A great site does nothing if nobody sees it. Most agencies run Google Ads like a setup task — pick some keywords, write a boring ad, take a monthly fee. We run them like a salesperson: aimed at the people ready to buy, with copy written to actually make them click. A click costs you money; a booked job pays you back."
            />
          </Reveal>

          {/* The media-buyer problem */}
          <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <Reveal>
              <div>
                <Label>The usual agency trap</Label>
                <h3 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                  You&apos;ve paid for this before. The clicks came; the
                  customers didn&apos;t.
                </h3>
                <p className="mt-5 text-[15px] leading-relaxed text-mist sm:text-base">
                  Most Google Ads agencies run a system built to protect their
                  monthly fee, not to make you money. It&apos;s{" "}
                  <span className="text-foreground">easy to bill, hard to blame</span>{" "}
                  — which is why nearly every business owner has a Google Ads
                  story that ends the same way.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <ul className="space-y-4">
                {adFailures.map((f) => (
                  <li key={f} className="flex gap-4 rounded-xl border border-line bg-ink p-5">
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-mist-dim" />
                    <p className="text-[14px] leading-relaxed text-mist">{f}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* The engine */}
          <Reveal delay={0.05}>
            <div className="border-gradient mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-teal/10 p-8 sm:p-12">
              <Label>How we do it differently</Label>
              <h3 className="max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
                Ads written by proven sales writing —{" "}
                <span className="text-gradient">not guesswork.</span>
              </h3>
              <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-mist sm:text-lg">
                <p>
                  We built our own system for writing Google Ads, trained on the
                  same writing techniques that top sales writers use to sell
                  billions of pounds of products every year — the ones that know
                  exactly how to get someone to click and buy.
                </p>
                <p>
                  So instead of guessing at a headline and hoping for the best,
                  every ad is built around{" "}
                  <span className="text-foreground">
                    what actually makes someone stop, read and get in touch
                  </span>{" "}
                  — and we can produce, test and improve them much faster than
                  someone doing it by hand.
                </p>
              </div>
            </div>
          </Reveal>

          {/* The 3 pillars */}
          <div className="mt-16 grid gap-5 lg:grid-cols-3">
            {adPillars.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.07}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-ink p-8 sm:p-10">
                  <span className="font-mono text-sm font-medium text-brand-teal">
                    {p.n}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-mist">
                    {p.body}
                  </p>
                  <p className="mt-5 border-t border-line pt-4 text-sm font-medium text-foreground">
                    {p.result}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Bridge → the guarantee / founding-partner section below. */}
          <Reveal delay={0.1}>
            <p className="mx-auto mt-16 max-w-2xl text-center font-display text-xl font-medium leading-snug text-foreground sm:text-2xl">
              We&apos;re confident enough in all this to{" "}
              <span className="text-gradient">put money on it.</span>
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 4 — The Founding Partner Programme (radically transparent).
          50% off setup/build for the next 10 clients ↔ a filmed case study on success,
          an ads guarantee, and a hard cap that returns pricing to full rate once full.
      ───────────────────────────────────────────────────────────────────── */}
      <section className="border-t border-line bg-ink-2/30 py-24 sm:py-32">
        <Container>
          <Reveal>
            <Label>The founding partner programme</Label>
            <SectionHeading
              align="left"
              title={
                <>
                  Why this is currently{" "}
                  <span className="text-gradient">half price.</span>
                </>
              }
              lead="We're a new agency. That's not a disclaimer — it's the reason you can get £10,000 work for half of it, right now."
            />
          </Reveal>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* The honest version */}
            <Reveal>
              <div>
                <Label>The honest version</Label>
                <h3 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                  We have the systems. Not yet the wall of case studies.
                </h3>
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-mist sm:text-base">
                  <p>
                    We have the tools and the system — 300+ premium design pieces,
                    an ads engine built on proven sales writing, sites live in 20 days.
                    What we don&apos;t yet have is a long list of names to show off.
                  </p>
                  <p>
                    <span className="text-foreground">So we won&apos;t pretend.</span>{" "}
                    We&apos;d rather build that list fast than quietly overcharge our
                    first few clients to look established. Your timing is the
                    advantage — you get top-tier work before the price catches up.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* The trade */}
            <Reveal delay={0.08}>
              <div className="h-full rounded-2xl border border-line bg-ink p-8 sm:p-10">
                <Label>The trade</Label>
                <h3 className="font-display text-2xl font-semibold text-foreground">
                  A partnership, not a favour.
                </h3>
                <ul className="mt-6 space-y-5">
                  {tradeTerms.map((term) => (
                    <li key={term.head} className="flex gap-4">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
                      <div>
                        <p className="font-display font-semibold text-foreground">{term.head}</p>
                        <p className="mt-1 text-[14px] leading-relaxed text-mist">{term.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-line pt-5 text-[14px] leading-relaxed text-mist">
                  We take on the cost and the risk up front. You give us the story once the
                  results speak for themselves.
                </p>
              </div>
            </Reveal>
          </div>

          {/* The ironclad guarantee */}
          <Reveal delay={0.05}>
            <div className="border-gradient mt-8 flex flex-col gap-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-teal/10 p-8 sm:flex-row sm:items-center sm:gap-8 sm:p-12">
              <ShieldCheck className="h-10 w-10 shrink-0 text-brand-teal" />
              <div>
                <Label>The ironclad guarantee</Label>
                <p className="font-display text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                  If our Google Ads don&apos;t drive qualified traffic and real lead
                  opportunities in your first 30 days,{" "}
                  <span className="text-gradient">you pay zero management fees.</span>
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-mist">
                  You never pay us to spin our wheels. We earn the fee by producing — or we
                  don&apos;t earn it.
                </p>
              </div>
            </div>
          </Reveal>

          {/* The cap + CTA */}
          <Reveal delay={0.05}>
            <div className="mt-8 flex flex-col items-center gap-6 rounded-2xl border border-line bg-ink px-6 py-12 text-center sm:px-12">
              <Label>Strictly ten</Label>
              <h3 className="max-w-2xl font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                Capped at 10 founding partners. When they&apos;re gone,{" "}
                <span className="text-gradient">they&apos;re gone.</span>
              </h3>
              <p className="max-w-2xl text-[15px] leading-relaxed text-mist sm:text-base">
                A fixed number, not a rolling offer — we only need a handful of
                strong results to prove ourselves. When the tenth spot is filled,
                founding rates close and pricing goes back to the full rate for good.
              </p>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-4xl font-medium text-foreground sm:text-5xl">{SPOTS_LEFT}</span>
                <span className="text-sm text-mist-dim">of 10 founding spots remaining</span>
              </div>
              <CalButton className="bg-gradient-brand group mt-2 inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-semibold text-white shadow-[0_8px_30px_-8px_rgba(44,135,208,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-8px_rgba(25,176,161,0.7)]">
                Book a strategy call — claim a founding spot
                <ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </CalButton>
            </div>
          </Reveal>
        </Container>
      </section>

      <Proof />
      <CTA />
    </>
  );
}
