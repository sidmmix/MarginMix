export type PageMetadata = {
  title: string;
  description: string;
  canonicalPath?: string;
  indexable?: boolean;
  structuredData?: Record<string, unknown>;
};

export const siteOrigin = "https://marginmix.ai";
export const siteMetadata = {
  title: "MarginMix - Margin Visibility",
  description: "Catch your Margin Leak before it hits your books.",
} as const;
export const socialImage = `${siteOrigin}/images/og-image.png`;

const organizationId = "https://marginmix.ai/#organization";
const websiteId = "https://marginmix.ai/#website";
const organizationSchema = {
  "@type": "Organization",
  "@id": organizationId,
  name: "Margin Mix",
  alternateName: "MarginMix",
  url: siteOrigin,
  description:
    "A Decision Support System for agency and consulting leaders to assess margin risk early by accounting for hidden senior effort, coordination overhead, and workforce intensity.",
  founder: {
    "@type": "Person",
    name: "Siddhartha Dasgupta",
    jobTitle: "Founder",
  },
  parentOrganization: {
    "@type": "Organization",
    name: "Digital Lexicon Corp",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Delaware",
      addressRegion: "DE",
      addressCountry: "US",
    },
  },
};
const websiteSchema = {
  "@type": "WebSite",
  "@id": websiteId,
  name: "Margin Mix",
  url: siteOrigin,
  description: "Decision Support System for Margin Risk Clarity",
};

export const publicPages: Record<string, PageMetadata> = {
  "/": {
    title: "MarginMix | Make Margin Risk Visible",
    description:
      "Estimate engagement margin exposure with MarginMix’s leak calculator. A deeper risk assessment using SOWs, timesheets and proprietary information is planned.",
    canonicalPath: "/",
    indexable: true,
    structuredData: {
      "@type": "WebPage",
      name: "MarginMix | Make Margin Risk Visible",
      description:
        "Estimate engagement margin exposure with MarginMix’s leak calculator. A deeper risk assessment using SOWs, timesheets and proprietary information is planned.",
      about: { "@id": organizationId },
    },
  },
  "/platform": {
    title: "MarginMix Platform | Pressure Test Engagement Economics",
    description:
      "Explore the available engagement leak calculator and the planned deterministic risk assessment using SOWs, timesheet data and proprietary engagement information.",
    canonicalPath: "/platform",
    indexable: true,
    structuredData: {
      "@type": "WebPage",
      name: "MarginMix Platform",
      description:
        "Explore the available engagement leak calculator and the planned document based risk assessment. Document upload and analysis are not available yet.",
      about: { "@id": organizationId },
    },
  },
  "/free-tier/calculator": {
    title: "Free Margin Leak Calculator | MarginMix",
    description:
      "Estimate potential delivery and scope exposure by pressure testing an engagement’s fee, staffing, cost, and billing assumptions.",
    canonicalPath: "/free-tier/calculator",
    indexable: true,
    structuredData: {
      "@type": "SoftwareApplication",
      name: "Free Margin Leak Calculator",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Pressure test an engagement’s fee, staffing, cost, scope, and billing assumptions to estimate potential delivery exposure. The result is indicative and based on preset rules, not an audited loss.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      publisher: { "@id": organizationId },
    },
  },
  "/founder": {
    title: "Why MarginMix Exists | Founder Story",
    description:
      "Learn why MarginMix was created to make hidden senior effort, coordination, and delivery complexity visible before they erode engagement margins.",
    canonicalPath: "/founder",
    indexable: true,
    structuredData: {
      "@type": "AboutPage",
      name: "Why MarginMix Exists",
      description:
        "Learn why MarginMix was created to make hidden senior effort, coordination, and delivery complexity visible before they erode engagement margins.",
      about: { "@id": organizationId },
      author: {
        "@type": "Person",
        name: "Siddhartha Dasgupta",
      },
    },
  },
  "/why-choose": {
    title: "Why Choose MarginMix for Margin Risk Decisions",
    description:
      "See how MarginMix helps leaders assess pricing and delivery risk earlier than historical dashboards, timesheets, and utilization reports.",
    canonicalPath: "/why-choose",
    indexable: true,
    structuredData: {
      "@type": "WebPage",
      name: "Why Choose MarginMix",
      description:
        "See how MarginMix helps leaders assess pricing and delivery risk earlier than historical dashboards, timesheets, and utilization reports.",
      about: { "@id": organizationId },
    },
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

export type ResolvedPageMetadata = {
  title: string;
  description: string;
  robots: "index, follow" | "noindex, nofollow";
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;
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
  const pageSchema =
    metadata.indexable && metadata.structuredData && canonicalUrl
      ? {
          ...metadata.structuredData,
          "@id": `${canonicalUrl}#${
            metadata.structuredData["@type"] === "SoftwareApplication"
              ? "application"
              : "webpage"
          }`,
          url: canonicalUrl,
          isPartOf: { "@id": websiteId },
        }
      : undefined;
  const structuredData = pageSchema
    ? {
        "@context": "https://schema.org",
        "@graph": [organizationSchema, websiteSchema, pageSchema],
      }
    : undefined;

  return {
    title: siteMetadata.title,
    description: siteMetadata.description,
    robots: metadata.indexable ? "index, follow" : "noindex, nofollow",
    canonicalUrl,
    structuredData,
    openGraph: {
      type: "website",
      url: socialUrl,
      title: siteMetadata.title,
      description: siteMetadata.description,
      image: socialImage,
    },
    twitter: {
      card: "summary_large_image",
      title: siteMetadata.title,
      description: siteMetadata.description,
      image: socialImage,
    },
  };
}
