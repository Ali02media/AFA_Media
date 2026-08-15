// Central content + config for AFA Media. Edit copy here, not in components.

export const site = {
  name: "AFA Media",
  tagline: "One partner for everything that grows your business.",
  description:
    "AFA Media builds high-converting websites, AI chatbots and paid ads for UK service businesses — all under one roof, built to get your phone ringing.",
  url: "https://www.afamedia.co.uk",
  email: "ali@afamedia.co.uk",
  phone: "+44 7516 294378",
  phoneHref: "tel:+447516294378",
  location: "Brighton, United Kingdom",
  cal: {
    link: "ali-ahmed-lwiikf/30-min-meeting",
    namespace: "30-min-meeting",
  },
} as const;

export const nav = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Philosophy", href: "/philosophy" },
  { label: "Contact", href: "/contact" },
] as const;

export const services = [
  {
    id: "web-design",
    name: "Web Design",
    tag: "Websites that convert",
    // `fixes`: the pain from the Problem section this service kills — rendered on the homepage
    // cards so the reader maps offer→pain instantly. (Not used on the /services detail page.)
    fixes: "Fixes the slow site leaking leads",
    blurb:
      "Lightning-fast, mobile-first websites engineered to turn visitors into booked jobs — not just look pretty.",
    points: [
      "Conversion-focused design",
      "Built for speed & SEO",
      "Live in 20 days",
    ],
    accent: "blue",
  },
  {
    id: "ai-chatbots",
    name: "AI Chatbots",
    tag: "Never miss a lead",
    fixes: "Fixes missed calls & midnight follow-up",
    blurb:
      "Custom-trained AI assistants that answer questions, qualify leads and book appointments 24/7 — in your voice.",
    points: [
      "24/7 lead capture",
      "Trained on your business",
      "WhatsApp & calendar integration",
    ],
    accent: "teal",
  },
  {
    id: "paid-ads",
    name: "Paid Ads",
    tag: "Leads on demand",
    fixes: "Fixes not enough enquiries",
    blurb:
      "Google and Meta ad campaigns managed for one thing only: more qualified enquiries at a price that pays back.",
    points: [
      "Google & Meta managed",
      "Lead-generation focused",
      "Transparent reporting",
    ],
    // blue so the three cards alternate blue-teal-blue (web / chatbots / ads) now that the
    // fourth service is gone; two teal cards would otherwise sit adjacent.
    accent: "blue",
  },
] as const;

export const process = [
  {
    step: "01",
    title: "Discovery Call",
    blurb:
      "A free 30-minute call. We map where you're losing leads today and exactly how we'll fix it. No hard sell.",
  },
  {
    step: "02",
    title: "Custom Build",
    blurb:
      "We design your site and train your AI on your business, services and tone — then you approve everything before launch.",
  },
  {
    step: "03",
    title: "Launch & Grow",
    blurb:
      "Live in 20 days. Your calendar starts filling while you focus on the work you actually do best.",
  },
] as const;

export const testimonials = [
  {
    quote:
      "I love it. It looks really professional. It's straight to the point, no fuss. Clean and clear — it's much better than the old one. That's really great work Ali, thank you so much.",
    name: "Oya",
    role: "Service Business Owner",
  },
  {
    quote:
      "The site is great — even on the phone it looks great. Thank you so much for your efforts brother.",
    name: "Gökhan Aydoğdu",
    role: "Service Business Owner",
  },
] as const;

export type Plan = {
  id: string;
  name: string;
  monthly: number;
  /** Founding-partner setup price (currently 50% off the full price). */
  onboarding: number;
  /** Full (post-founding) setup price — shown struck through so the discount is visible. */
  fullOnboarding: number;
  blurb: string;
  deliveryDays: number;
  featured?: boolean;
};

export const plans: Plan[] = [
  {
    id: "growth",
    name: "Growth",
    monthly: 90,
    onboarding: 500,
    fullOnboarding: 1000,
    blurb: "Everything a growing service business needs to look the part and capture every lead.",
    deliveryDays: 20,
  },
  {
    id: "mastery",
    name: "Mastery",
    monthly: 120,
    onboarding: 650,
    fullOnboarding: 1300,
    blurb: "The full AI-powered growth engine — smarter chatbot, sharper site, deeper SEO.",
    deliveryDays: 25,
    featured: true,
  },
];

// Feature comparison matrix for the pricing table. `growth`/`mastery` are either a boolean
// (rendered as a check or an X) or a string (rendered as text — e.g. page count, delivery days).
export type PricingFeatureRow = {
  label: string;
  growth: boolean | string;
  mastery: boolean | string;
};

export const pricingFeatures: PricingFeatureRow[] = [
  { label: "Website", growth: "4 pages", mastery: "Up to 7 pages" },
  { label: "24/7 AI chatbot with calendar booking", growth: true, mastery: true },
  { label: "Full business-knowledge FAQ handling & smart CTA direction", growth: false, mastery: true },
  { label: "Page-aware chat prompts", growth: false, mastery: true },
  { label: "WhatsApp CTA integration", growth: true, mastery: true },
  { label: "AI-managed Google Ads — you keep 100% of revenue", growth: true, mastery: true },
  { label: "Standard on-page SEO", growth: true, mastery: true },
  { label: "Advanced SEO package", growth: false, mastery: true },
  { label: "3D elements & advanced animations", growth: false, mastery: true },
  { label: "Delivery", growth: "20 days", mastery: "25 days" },
];

export const oneOffProjects = [
  {
    name: "AI Chatbot Setup",
    price: "£200 + £60/mo",
    blurb: "Add a custom-trained AI assistant to your existing website.",
  },
  {
    name: "Ad Campaign Setup",
    price: "£180",
    blurb: "A fully-built Google or Meta campaign, ready to launch.",
  },
] as const;

export const faqs = [
  {
    q: "You're a newer agency — why should I trust you?",
    a: "We're new, but we're hungry, and we back it up. Our first clients saw results fast and you can read their words on this page. Plus our delivery guarantee means the risk sits with us, not you: miss the timeline, and you don't pay the setup.",
  },
  {
    q: "How long does it take to build?",
    a: "Growth builds go live in 20 days, Mastery in 25. You'll know your exact timeline before we start a thing — and if we miss it, you don't pay the setup.",
  },
  {
    q: "Is there a long contract?",
    a: "No. Our monthly plans are rolling — cancel any time with 30 days' notice. We'd rather earn your business every month than lock you in.",
  },
  {
    q: "What if I don't like the AI's responses?",
    a: "You approve everything before we go live, and you can update the AI any time. It learns your voice and your business, not generic answers.",
  },
  {
    q: "How is this different from ChatGPT?",
    a: "ChatGPT is general-purpose. Your AI is trained specifically on your services, pricing and tone — and it books appointments, qualifies leads and plugs into your calendar. ChatGPT can't do that.",
  },
  {
    q: "Do you only work with certain industries?",
    a: "We focus on UK service businesses — trades, clinics, professional services and similar. If your business runs on enquiries and bookings, we can almost certainly help.",
  },
  {
    q: "Is my customer data secure?",
    a: "Yes. We use enterprise-grade encryption, we're GDPR compliant, and you own all of your customer data. Always.",
  },
] as const;
