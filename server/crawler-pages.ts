const crawlerPages: Record<string, string> = {
  "/": `
    <main aria-label="MarginMix overview">
      <h1>Make Margin Risk Visible.</h1>
      <p>Pressure test pricing, staffing, and delivery assumptions of an engagement.</p>
      <p>MarginMix is structured decision support for pricing and margin risk. It is not a productivity or time tracking system.</p>
      <h2>Make engagement economics visible before delivery</h2>
      <p>AI is reshaping delivery, while many pricing models have not caught up. MarginMix helps agency and consulting leaders consider the work behind the price before an engagement begins.</p>
      <h2>Consider more than the quoted scope</h2>
      <p>Review staffing assumptions, scope movement, billing signals, senior attention, coordination, and repeated iteration. The goal is to make assumptions visible while decisions can still change.</p>
      <h2>Decision support across commercial models</h2>
      <p>MarginMix is designed for time and materials, fixed price, outcome-based, and hybrid engagements. It supports a clearer pricing conversation; it does not replace financial review or professional judgment.</p>
      <h2>Try the free leak calculator</h2>
      <p>The calculator lets you pressure test engagement assumptions and returns an indicative exposure estimate based on preset rules. It is not an audited loss or a live engagement result.</p>
    </main>`,
  "/platform": `
    <main aria-label="MarginMix platform">
      <p>MarginMix platform</p>
      <h1>See the risk before you sign.</h1>
      <p>Pressure test engagement economics before delivery begins.</p>
      <h2>Available now: Free Leak Calculator</h2>
      <p>Pressure test fees, costs, scope, staffing, billing, and hours-tracking assumptions. The calculator returns an indicative exposure estimate based on preset rules, not an audited loss.</p>
      <h2>Planned: Full document review</h2>
      <p>A planned review may include a statement of work, timesheet export, and rate card. Document review is not available through the free calculator today.</p>
      <h2>Future direction: Margin Intelligence</h2>
      <p>Margin Intelligence is a future direction, not a live capability. Its scope and availability have not been announced.</p>
      <h2>Talk through a current use case</h2>
      <p>A conversation does not activate planned features.</p>
    </main>`,
  "/why-choose": `
    <main aria-label="Why choose MarginMix">
      <p>Decision support, not another dashboard</p>
      <h1>Why Choose MarginMix</h1>
      <h2>Enterprise systems explain what happened</h2>
      <p>ERPs and dashboards report on the past. MarginMix acts earlier, when work is priced, staffed, and committed.</p>
      <h2>Pricing decisions create variance</h2>
      <p>Margin risk is locked in before delivery begins. MarginMix helps challenge pricing assumptions while there is still time to make a different decision.</p>
      <h2>Why historical data is not enough</h2>
      <p>Timesheets are negotiated and senior effort is underreported. MarginMix helps surface the blind spots that traditional systems may not address early enough.</p>
      <h2>Standardized pricing risk evaluation</h2>
      <p>A shared lens helps teams pressure test pricing, staffing, and coordination risk, creating discipline without bureaucracy.</p>
      <h2>Stays lightweight</h2>
      <p>No ERP integrations, timesheets, or cost tables are required. MarginMix is designed to be used when pricing is discussed.</p>
      <h2>Pricing clarity does not require perfect data</h2>
      <p>Use early warning and structured judgment to support defensible decisions. MarginMix is decision support, not a guarantee of engagement profitability.</p>
      <h2>Assess margin risk</h2>
      <p>Use the free scanner or book a conversation to discuss a current use case.</p>
    </main>`,
  "/founder": `
    <main aria-label="Why MarginMix exists">
      <p>Why MarginMix exists</p>
      <h1>Margin rarely breaks all at once.</h1>
      <p>Delivery complexity quietly reshapes the economics after the work is sold.</p>
      <h2>Work looks sound. The load grows.</h2>
      <p>The team is busy and the client is satisfied, yet senior attention, coordination, and rework begin to outpace the plan. Those signals are easy to miss until the economics stop adding up.</p>
      <h2>What sits outside the quote</h2>
      <ul>
        <li>Senior attention: how much leadership time the work consumes.</li>
        <li>Coordination: how many people and decisions must align.</li>
        <li>Iteration: how often work is revisited or refined.</li>
      </ul>
      <p>Make the pattern visible while decisions can still change.</p>
      <h2>A decision lens for the economics of work</h2>
      <p>MarginMix is not a productivity, time tracking, or utilization tool. It supports better economic decisions, not optimization of people.</p>
      <p>Pricing, utilization, and delivery efficiency matter, but they do not always reveal how an engagement is staffed and governed. Senior attention over time, coordination across stakeholders, repeated refinement, and cognitive load can sit outside formal reporting. MarginMix helps leaders assess structural viability from likely staffing, coordination, and governance before delivery begins.</p>
      <h2>Built from operating experience</h2>
      <p>MarginMix draws on experience across agency and consulting work, including commercial and operational decisions, growth, and profitability. Its perspective is informed by enterprise transformation and operating model experience.</p>
      <h2>Make the assumptions visible</h2>
      <p>Consider an engagement's structure before committing to the work. Try the free scanner or book a conversation.</p>
    </main>`,
};

export function injectCrawlerPage(template: string, pathname: string): string {
  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const page = crawlerPages[normalizedPath];

  return template.replace("<!-- CRAWLER_PAGE_CONTENT -->", page ?? "");
}
