// Central content + config for AFA Media. Edit copy here, not in components.

export const site = {
  name: "AFA Media",
  tagline: "One partner for everything that grows your business.",
  description:
    "AFA Media builds high-converting websites, AI chatbots, email marketing and paid ads for UK service businesses — all under one roof, built to get your phone ringing.",
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
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const trustPoints = [
  "14-Day Delivery",
  "No Long Contracts",
  "UK-Based Team",
  "GDPR Compliant",
  "AI-Powered",
  "Built to Convert",
] as const;

export const services = [
  {
    id: "web-design",
    name: "Web Design",
    tag: "Websites that convert",
    blurb:
      "Lightning-fast, mobile-first websites engineered to turn visitors into booked jobs — not just look pretty.",
    points: [
      "Conversion-focused design",
      "Built for speed & SEO",
      "Live in 14 days",
    ],
    accent: "blue",
  },
  {
    id: "ai-chatbots",
    name: "AI Chatbots",
    tag: "Never miss a lead",
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
    id: "email-marketing",
    name: "Email Marketing",
    tag: "Turn leads into regulars",
    blurb:
      "Psychology-driven campaigns and automations that warm up cold leads and bring past customers back.",
    points: [
      "Done-for-you campaigns",
      "Automated follow-ups",
      "Win-back sequences",
    ],
    accent: "blue",
  },
  {
    id: "paid-ads",
    name: "Paid Ads",
    tag: "Leads on demand",
    blurb:
      "Google and Meta ad campaigns managed for one thing only: more qualified enquiries at a price that pays back.",
    points: [
      "Google & Meta managed",
      "Lead-generation focused",
      "Transparent reporting",
    ],
    accent: "teal",
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
      "Live in 14 days. Your calendar starts filling while you focus on the work you actually do best.",
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
  onboarding: number;
  blurb: string;
  features: string[];
  featured?: boolean;
};

export const plans: Plan[] = [
  {
    id: "foundation",
    name: "Foundation",
    monthly: 797,
    onboarding: 297,
    blurb: "Everything a growing service business needs to look the part and capture every lead.",
    features: [
      "High-converting website",
      "24/7 AI chatbot assistant",
      "Automated booking system",
      "Monthly performance report",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 1497,
    onboarding: 497,
    blurb: "Add paid ads and email so new leads come in while existing ones come back.",
    featured: true,
    features: [
      "Everything in Foundation",
      "Paid ads on 1 channel (Google or Meta)",
      "1 email campaign / month",
      "Advanced lead qualification",
      "Monthly strategy call",
      "Priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    monthly: 2497,
    onboarding: 797,
    blurb: "The full automated growth engine for businesses ready to dominate their area.",
    features: [
      "Everything in Growth",
      "Paid ads on both channels",
      "Email automation & flows",
      "WhatsApp AI integration",
      "Bi-weekly strategy calls",
      "VIP direct support",
    ],
  },
];

export const oneOffProjects = [
  {
    name: "Website Build",
    price: "£1,500 – £3,500",
    blurb: "A one-time, high-converting website without the monthly retainer.",
  },
  {
    name: "AI Chatbot Setup",
    price: "£750 + £80/mo",
    blurb: "Add a custom-trained AI assistant to your existing website.",
  },
  {
    name: "Ad Campaign Setup",
    price: "from £500",
    blurb: "A fully-built Google or Meta campaign, ready to launch.",
  },
] as const;

export const faqs = [
  {
    q: "You're a newer agency — why should I trust you?",
    a: "We're new, but we're hungry, and we back it up. Our first clients saw results fast and you can read their words on this page. Plus our 14-day delivery guarantee means the risk sits with us, not you.",
  },
  {
    q: "How long does it take to build?",
    a: "Most projects go live in 7–14 days. More complex builds can take up to 21 days. You'll know your exact timeline before we start a thing.",
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
