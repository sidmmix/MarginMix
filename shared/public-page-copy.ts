export const engagementJourneyCopy = {
  title: "Start with the leak. Then look deeper.",
  calculator:
    "Available now: use the engagement leak calculator to estimate potential delivery and scope exposure from the assumptions you enter.",
  assessment:
    "Planned: a deterministic risk assessment based on your statement of work (SOW), timesheet data and other proprietary engagement information.",
  availability:
    "Document upload and analysis are not available yet. Registering interest does not start a document assessment.",
} as const;

export const platformPageCopy = {
  headline: "See the risk before you sign.",
  introduction: "Start with an engagement leak estimate today. A deeper assessment using engagement documents is planned.",
  stages: [
    {
      status: "Available now",
      title: "Free Leak Calculator",
      summary: "Pressure test fees, costs, scope and billing assumptions.",
      detail:
        "The calculator also considers hours tracking and returns an indicative exposure estimate based on preset rules, not an audited loss.",
    },
    {
      status: "Planned",
      title: "Document based risk assessment",
      summary: engagementJourneyCopy.assessment,
      detail:
        "The planned assessment will use the SOW, timesheet data and other proprietary engagement information to examine risk beyond the initial estimate. Document upload and analysis are not available yet.",
    },
    {
      status: "Future direction",
      title: "Margin Intelligence",
      summary: "A future direction, not a live capability.",
      detail: "Its scope and availability have not been announced.",
    },
  ],
  conversationTitle: "Talk through the current use case.",
  conversationDetail: "A conversation does not activate planned features.",
} as const;

export const founderPageCopy = {
  eyebrow: "Why MarginMix exists",
  headline: "Margin rarely breaks all at once.",
  introduction:
    "Delivery complexity quietly reshapes the economics after the work is sold.",
  patternTitle: "Work looks sound. The load grows.",
  pattern:
    "The team is busy and the client is satisfied, yet senior attention, coordination and rework begin to outpace the plan.",
  patternConclusion:
    "Those signals are easy to miss until the economics stop adding up.",
  outsideQuoteTitle: "What sits outside the quote",
  outsideQuote: [
    {
      title: "Senior attention",
      description: "How much leadership time the work consumes",
    },
    {
      title: "Coordination",
      description: "How many people and decisions must align",
    },
    {
      title: "Iteration",
      description: "How often work is revisited or refined",
    },
  ],
  patternCallout: "Make the pattern visible while decisions can still change.",
  decisionTitle: "A decision lens for the economics of work.",
  decisionSummary:
    "Not a productivity, time tracking or utilization tool. Better economic decisions, not optimization of people.",
  fullerStory: [
    "Margin conversations often turn to pricing, utilization and delivery efficiency. These matter, but they do not always reveal how an engagement is staffed and governed.",
    "Senior attention over time, coordination across stakeholders, repeated refinement and cognitive load can sit outside formal reporting. This pattern appears across retainers, fixed fee projects and complex transformation work, often too late to act. It is often the single biggest driver of margin erosion.",
    "MarginMix makes those conditions visible earlier, helping leaders assess structural viability from likely staffing, coordination and governance. It is a decision lens for pricing and margin assurance, not a productivity, time tracking or utilization system.",
  ],
  experienceTitle: "Built from operating experience.",
  experienceSummary:
    "His career spans creative, media, corporate marketing and performance environments, including Dentsu, Ogilvy, Grey and Publicis, as well as an independent consultancy.",
  founderExperience:
    "He led large accounts and cross market teams, took part in commercial and operational decisions, and was accountable for growth and profitability. MarginMix draws on patterns seen over years inside agency and consulting work.",
  advisorSummary:
    "An enterprise operator with transformation experience across global teams at HP, AMEX and Genpact.",
  advisorExperience:
    "Based in Boston, Joy is CEO of gyanAI. He advises MarginMix on decision system design, operating model risk and enterprise adoption, bringing firsthand understanding of margin risk in labor intensive operating models.",
  callToActionTitle: "Make the assumptions visible.",
} as const;

export const whyChoosePageCopy = {
  eyebrow: "Decision support, not another dashboard",
  headline: "Why Choose MarginMix",
  cards: [
    {
      title: "Enterprise systems explain what happened",
      body: "ERPs and dashboards report on the past. MarginMix acts earlier, when work is priced, staffed, and committed.",
    },
    {
      title: "Pricing decisions create variance",
      body: "Margin risk is locked in before delivery begins. MarginMix operates at this moment, when pricing assumptions can still be challenged.",
    },
    {
      title: "Why historical data isn't enough",
      body: "Timesheets are negotiated. Senior effort is underreported. MarginMix fills the blind spot traditional systems can't address early enough.",
    },
    {
      title: "Standardized pricing risk evaluation",
      body: "A shared lens to pressure test pricing, staffing, and coordination risk, creating discipline without bureaucracy.",
    },
    {
      title: "Stays lightweight",
      body: "No ERP integrations, timesheets, or cost tables required. Designed to be used every time pricing is discussed.",
    },
    {
      title: "Pricing clarity doesn't require perfect data",
      body: "Early warning and defensible decisions. Repricing even one engagement can protect hundreds of thousands in margin.",
    },
  ],
  callToActionTitle: "Assess Margin Risk & Be Profitable!",
} as const;
