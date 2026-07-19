import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60 disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-brand text-white shadow-[0_8px_30px_-8px_rgba(44,135,208,0.6)] hover:shadow-[0_12px_40px_-8px_rgba(25,176,161,0.7)] hover:-translate-y-0.5",
  secondary:
    "glass text-foreground hover:border-brand-blue/60 hover:-translate-y-0.5",
  ghost: "text-mist hover:text-foreground",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-8 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps &
  ({ href: string } & React.ComponentProps<typeof Link>)) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function ButtonEl({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
