export type PageMetadata = {
  title: string;
  description: string;
  canonicalPath?: string;
  indexable?: boolean;
};

export const publicPages: Record<string, PageMetadata> = {
  "/": {
    title: "MarginMix | Make Margin Risk Visible",
    description:
      "Pressure test pricing, staffing, and delivery assumptions before an engagement begins with MarginMix, decision support for services businesses.",
    canonicalPath: "/",
    indexable: true,
  },
  "/platform": {
    title: "MarginMix Platform | Pressure-Test Engagement Economics",
    description:
      "See how MarginMix helps agency and consulting leaders pressure test fees, costs, scope, staffing, and billing assumptions before delivery.",
    canonicalPath: "/platform",
    indexable: true,
  },
  "/free-tier/calculator": {
    title: "Free Margin Leak Calculator | MarginMix",
    description:
      "Estimate potential delivery and scope exposure by pressure testing an engagement’s fee, staffing, cost, and billing assumptions.",
    canonicalPath: "/free-tier/calculator",
    indexable: true,
  },
  "/founder": {
    title: "Why MarginMix Exists | Founder Story",
    description:
      "Learn why MarginMix was created to make hidden senior effort, coordination, and delivery complexity visible before they erode engagement margins.",
    canonicalPath: "/founder",
    indexable: true,
  },
  "/why-choose": {
    title: "Why Choose MarginMix for Margin Risk Decisions",
    description:
      "See how MarginMix helps leaders assess pricing and delivery risk earlier than historical dashboards, timesheets, and utilization reports.",
    canonicalPath: "/why-choose",
    indexable: true,
  },
  "/free-tier/input": {
    title: "Free Margin Leak Calculator | MarginMix",
    description:
      "Estimate potential delivery and scope exposure by pressure testing an engagement’s fee, staffing, cost, and billing assumptions.",
  },
  "/auth": {
    title: "Sign In | MarginMix",
    description: "Sign in to your MarginMix workspace.",
  },
  "/quick-profiler": {
    title: "Quick Engagement Risk Profiler | MarginMix",
    description:
      "Answer engagement questions to review a personalized view of potential pricing and delivery risks.",
  },
  "/free-tier/calculator/output": {
    title: "Your Margin Leak Estimate | MarginMix",
    description:
      "Review the estimate generated from your engagement assumptions.",
  },
  "/audit-questions": {
    title: "Engagement Assumptions Audit | MarginMix",
    description:
      "Review and record engagement assumptions in a private working audit.",
  },
  "/assessment": {
    title: "Margin Risk Assessment | MarginMix",
    description:
      "Assess the conditions that may affect the economics of a specific engagement.",
  },
  "/demo": {
    title: "Margin Risk Assessment | MarginMix",
    description:
      "Assess the conditions that may affect the economics of a specific engagement.",
  },
  "/sign-in": {
    title: "Sign In | MarginMix",
    description: "Sign in to your MarginMix workspace.",
  },
  "/sign-up": {
    title: "Create an Account | MarginMix",
    description: "Create a MarginMix account to access your workspace.",
  },
  "/dashboard": {
    title: "Dashboard | MarginMix",
    description: "Your private MarginMix workspace.",
  },
  "/home": {
    title: "Workspace | MarginMix",
    description: "Your private MarginMix workspace.",
  },
  "/pitch": {
    title: "MarginMix Presentation",
    description: "A presentation about MarginMix.",
  },
};

export const siteOrigin = "https://marginmix.ai";
export const socialImage = `${siteOrigin}/images/og-image.png`;

export type ResolvedPageMetadata = {
  title: string;
  description: string;
  robots: "index, follow" | "noindex, nofollow";
  canonicalUrl?: string;
  openGraph: {
    type: "website";
    url: string;
    title: string;
    description: string;
    image: string;
  };
  twitter: {
    card: "summary_large_image";
    title: string;
    description: string;
    image: string;
  };
};

export function resolvePageMetadata(path: string): ResolvedPageMetadata {
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const metadata = publicPages[normalizedPath] ?? {
    title: normalizedPath.startsWith("/sign-in/")
      ? "Sign In | MarginMix"
      : normalizedPath.startsWith("/sign-up/")
        ? "Create an Account | MarginMix"
        : "Page Not Found | MarginMix",
    description: "This MarginMix page is not available for search indexing.",
  };
  const canonicalUrl = metadata.canonicalPath
    ? `${siteOrigin}${metadata.canonicalPath}`
    : undefined;
  const socialUrl = canonicalUrl ?? `${siteOrigin}${normalizedPath}`;

  return {
    title: metadata.title,
    description: metadata.description,
    robots: metadata.indexable ? "index, follow" : "noindex, nofollow",
    canonicalUrl,
    openGraph: {
      type: "website",
      url: socialUrl,
      title: metadata.title,
      description: metadata.description,
      image: socialImage,
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      image: socialImage,
    },
  };
}
