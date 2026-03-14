import { Resend } from 'resend';
import { DecisionObject } from './decision-engine';

const resend = new Resend(process.env.RESEND_API_KEY);

// Determine the correct app URL based on environment
function getAppUrl(): string {
  // Production deployment URL
  if (process.env.REPLIT_DEPLOYMENT === '1' && process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  // Development environment
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  // Fallback to production domains
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  // Last resort fallback
  return 'https://marginmix.replit.app';
}

const APP_URL = getAppUrl();

function getVerdictColor(verdict: string): { bg: string; text: string; border: string; gradientFrom: string; gradientTo: string } {
  switch (verdict) {
    case "Structurally Safe":
      return { bg: "#064e3b", text: "#6ee7b7", border: "#10b981", gradientFrom: "#064e3b", gradientTo: "#065f46" };
    case "Execution Heavy":
      return { bg: "#78350f", text: "#fcd34d", border: "#f59e0b", gradientFrom: "#78350f", gradientTo: "#92400e" };
    case "Price Sensitive":
      return { bg: "#7c2d12", text: "#fdba74", border: "#f97316", gradientFrom: "#7c2d12", gradientTo: "#9a3412" };
    case "Structurally Fragile":
      return { bg: "#7f1d1d", text: "#fca5a5", border: "#ef4444", gradientFrom: "#7f1d1d", gradientTo: "#991b1b" };
    case "Do Not Proceed Without Repricing":
      return { bg: "#7f1d1d", text: "#fca5a5", border: "#dc2626", gradientFrom: "#7f1d1d", gradientTo: "#991b1b" };
    default:
      return { bg: "#1f2937", text: "#d1d5db", border: "#6b7280", gradientFrom: "#1f2937", gradientTo: "#374151" };
  }
}

function getDimensionLabel(level: string): string {
  switch (level) {
    case "high": return "High";
    case "medium": return "Medium";
    case "low": return "Low";
    case "positive": return "Positive";
    case "neutral": return "Neutral";
    case "negative": return "Negative";
    default: return level;
  }
}

function getDimensionColor(level: string): { bg: string; text: string; border: string } {
  switch (level) {
    case "high":
    case "negative":
      return { bg: "#7f1d1d", text: "#fca5a5", border: "#991b1b" };
    case "medium":
    case "neutral":
      return { bg: "#78350f", text: "#fcd34d", border: "#92400e" };
    case "low":
    case "positive":
      return { bg: "#064e3b", text: "#6ee7b7", border: "#065f46" };
    default:
      return { bg: "#1f2937", text: "#d1d5db", border: "#374151" };
  }
}

function getVerdictRecommendations(verdict: string): string[] {
  switch (verdict) {
    case "Do Not Proceed Without Repricing":
      return [
        "Halt engagement until pricing reflects true delivery complexity",
        "Conduct a structural redesign of the delivery model",
        "Re-evaluate senior involvement requirements and cost implications",
        "Negotiate scope boundaries before any commitment",
        "Establish mandatory repricing triggers for scope changes",
      ];
    case "Structurally Fragile":
      return [
        "Reduce coordination load across teams and stakeholders",
        "Implement governance checkpoints at key delivery milestones",
        "Cap senior involvement to sustainable levels",
        "Establish clear escalation protocols to prevent ad-hoc demands",
        "Monitor workforce intensity metrics weekly",
      ];
    case "Execution Heavy":
      return [
        "Set clear effort caps for senior and mid-level resources",
        "Limit senior leadership involvement to strategic checkpoints only",
        "Automate repetitive execution tasks where possible",
        "Track iteration cycles to prevent scope creep through overwork",
      ];
    case "Price Sensitive":
      return [
        "Protect scope boundaries with formal change request processes",
        "Build pricing safeguards for out-of-scope work",
        "Review commercial terms for flexibility provisions",
        "Monitor scope elasticity indicators monthly",
      ];
    case "Structurally Safe":
      return [
        "Proceed with standard governance and monitoring",
        "Maintain current delivery model and resource allocation",
        "Schedule periodic reviews to catch emerging risk signals",
        "Document successful patterns for future engagements",
      ];
    default:
      return ["Review engagement parameters and consult with leadership."];
  }
}

function getBarColor(score: number): string {
  if (score >= 60) return "#ef4444";
  if (score >= 35) return "#f59e0b";
  return "#10b981";
}

function getRiskBandColor(band: string): string {
  switch (band) {
    case "Low": return "#10b981";
    case "Moderate": return "#f59e0b";
    case "High": return "#f97316";
    case "Very High": return "#ef4444";
    default: return "#6b7280";
  }
}

function formatBucketLabel(key: string): string {
  const labels: Record<string, string> = {
    WI: "Workforce Intensity",
    SI: "Senior Involvement",
    CO: "Coordination Overhead",
    VSI: "Value Saturation Index",
    CE: "Commercial Elasticity"
  };
  return labels[key] || key;
}

export interface PDFAttachment {
  filename: string;
  content: Buffer;
}

export async function sendAssessmentEmail(
  decision: DecisionObject,
  openSignal: string | null,
  attachments?: PDFAttachment[]
) {
  const verdictColors = getVerdictColor(decision.marginRiskVerdict);
  const riskBandColor = getRiskBandColor(decision.riskBand);
  const compositeBarColor = getBarColor(decision.compositeRiskScore);
  const recommendations = getVerdictRecommendations(decision.marginRiskVerdict);

  const dimensionCards = [
    { name: "Workforce Intensity", level: decision.dimensions?.workforceIntensity },
    { name: "Coordination Entropy", level: decision.dimensions?.coordinationEntropy },
    { name: "Commercial Exposure", level: decision.dimensions?.commercialExposure },
    { name: "Volatility Control", level: decision.dimensions?.volatilityControl },
    { name: "Confidence Signal", level: decision.dimensions?.confidenceSignal },
    { name: "Measurement Maturity", level: decision.dimensions?.measurementMaturity },
  ];

  const dimensionCardsHtml = dimensionCards.map(dim => {
    const colors = getDimensionColor(dim.level || "low");
    return `
      <td width="33.33%" style="padding: 4px; vertical-align: top;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px;">
          <tr><td style="padding: 12px;">
            <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 11px;">${dim.name}</p>
            <p style="color: ${colors.text}; margin: 0; font-weight: 600; font-size: 13px;">${getDimensionLabel(dim.level || "low")}</p>
          </td></tr>
        </table>
      </td>`;
  });

  const bucketRows = (["WI", "SI", "CO", "VSI", "CE"] as const).map(key => {
    const score = decision.bucketScores[key] ?? 0;
    const band = decision.bucketBands[key] ?? "";
    const barColor = getBarColor(score);
    return `
      <tr>
        <td colspan="3" style="padding: 10px 0 2px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="color: #d1d5db; font-size: 13px;">${formatBucketLabel(key)}</td>
              <td style="text-align: right; color: #6b7280; font-size: 12px;">${band} &nbsp;
                <span style="color: white; font-weight: 700; font-family: monospace;">${score}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="3" style="padding: 0 0 8px 0;">
          <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
            <div style="width: ${score}%; height: 8px; background: ${barColor}; border-radius: 4px;"></div>
          </div>
        </td>
      </tr>`;
  }).join('');

  const saturationFlags = [
    { label: "Value Saturation Present", value: decision.saturationDetails?.valueSaturationPresent },
    { label: "Optics-Driven Staffing", value: decision.saturationDetails?.opticsDrivenStaffing },
    { label: "Upward Cost Shift", value: decision.saturationDetails?.upwardCostShift },
  ];

  const saturationFlagsHtml = saturationFlags.map(flag => `
    <tr>
      <td style="padding: 8px 12px; border-radius: 6px; background: rgba(255,255,255,0.03);">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td width="12" style="vertical-align: middle;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${flag.value ? '#ef4444' : '#10b981'};"></div>
            </td>
            <td style="padding-left: 8px; color: #d1d5db; font-size: 13px;">${flag.label}</td>
            <td style="text-align: right; font-size: 12px; font-weight: 600; color: ${flag.value ? '#fca5a5' : '#6ee7b7'};">${flag.value ? 'Yes' : 'No'}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height: 4px;"></td></tr>
  `).join('');

  const contradictionFlagsHtml = (decision.contradictionFlags && decision.contradictionFlags.length > 0) ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 16px;">
      <tr>
        <td style="padding: 16px 20px;">
          <h3 style="color: white; margin: 0 0 12px 0; font-size: 16px;">⚠️ Contradiction Flags</h3>
          ${decision.contradictionFlags.map(flag => {
            const isWarning = flag.severity === "warning";
            const flagBg = isWarning ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)";
            const flagBorder = isWarning ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)";
            const flagColor = isWarning ? "#fcd34d" : "#93c5fd";
            const flagLabel = isWarning ? "Warning" : "Info";
            return `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${flagBg}; border: 1px solid ${flagBorder}; border-radius: 8px; margin-bottom: 6px;">
                <tr>
                  <td style="padding: 10px 12px;">
                    <p style="color: #e5e7eb; margin: 0 0 2px 0; font-size: 13px;">${flag.description}</p>
                    <p style="color: ${flagColor}; margin: 0; font-size: 11px; font-weight: 600;">${flagLabel}</p>
                  </td>
                </tr>
              </table>`;
          }).join('')}
        </td>
      </tr>
    </table>
  ` : '';

  const recommendationsHtml = recommendations.map((rec, i) => `
    <tr>
      <td style="padding: 4px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.03); border-radius: 8px;">
          <tr>
            <td width="28" style="padding: 10px 0 10px 12px; vertical-align: top;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background: rgba(16,185,129,0.2); color: #6ee7b7; font-size: 11px; font-weight: 700; text-align: center; line-height: 20px;">${i + 1}</div>
            </td>
            <td style="padding: 10px 12px 10px 8px; color: #d1d5db; font-size: 13px;">${rec}</td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MarginMix Assessment Results</title>
      <style>
        @media only screen and (max-width: 600px) {
          .main-container { padding: 10px !important; }
          .content-padding { padding: 15px !important; }
          .header-padding { padding: 20px !important; }
          .dim-row td { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 3px 0 !important; }
          .signal-row td { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 3px 0 !important; }
          h2 { font-size: 22px !important; }
          h3 { font-size: 16px !important; }
        }
      </style>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #d1d5db; margin: 0; padding: 0; background-color: #111827;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td class="main-container" style="padding: 20px;">
            <!-- Header -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="header-padding" style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">MarginMix</h1>
                  <p style="color: #d1fae5; margin: 5px 0 0 0; font-style: italic; font-family: Georgia, serif;">Margin Risk Clarity</p>
                </td>
              </tr>
            </table>
            
            <!-- Main Content -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #1f2937; border: 1px solid rgba(255,255,255,0.1); border-top: none;">
              <tr>
                <td class="content-padding" style="padding: 24px;">

                  <!-- Section 1 - Verdict Banner -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${verdictColors.gradientFrom}; border: 1px solid ${verdictColors.border}; border-radius: 12px; margin-bottom: 16px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <h2 style="color: ${verdictColors.text}; margin: 0 0 6px 0; font-size: 24px;">${decision.marginRiskVerdict}</h2>
                        <p style="margin: 0 0 12px 0;">
                          <span style="background: ${riskBandColor}20; color: ${riskBandColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; border: 1px solid ${riskBandColor}; display: inline-block;">${decision.riskBand} Risk</span>
                        </p>
                        <p style="color: #d1d5db; margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">${decision.verdictReason}</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="color: #9ca3af; font-size: 12px;">Composite Risk Score</td>
                            <td style="text-align: right; color: white; font-weight: 700; font-family: monospace; font-size: 12px;">${decision.compositeRiskScore}/100</td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding-top: 4px;">
                              <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden;">
                                <div style="width: ${decision.compositeRiskScore}%; height: 10px; background: ${compositeBarColor}; border-radius: 5px;"></div>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${decision.marginImpact ? `
                  <!-- Margin Impact Section -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 16px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <h3 style="color: white; margin: 0 0 12px 0; font-size: 16px;">📊 Estimated Margin Impact</h3>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td width="33%" style="text-align: center; padding: 8px 4px;">
                              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 11px;">Current Margin</p>
                              <p style="color: white; margin: 0; font-size: 22px; font-weight: 700;">${decision.marginImpact.currentMargin}%</p>
                            </td>
                            <td width="33%" style="text-align: center; padding: 8px 4px;">
                              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 11px;">Estimated Margin Erosion</p>
                              <p style="color: ${decision.marginImpact.impactColor === 'emerald' ? '#6ee7b7' : decision.marginImpact.impactColor === 'amber' ? '#fcd34d' : '#fca5a5'}; margin: 0; font-size: 22px; font-weight: 700;">${decision.marginImpact.estimatedLoss > 0 ? `-${decision.marginImpact.estimatedLoss}%` : '0%'}</p>
                            </td>
                            <td width="33%" style="text-align: center; padding: 8px 4px;">
                              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 11px;">Effective Margin</p>
                              <p style="color: ${decision.marginImpact.effectiveMargin >= decision.marginImpact.currentMargin * 0.7 ? '#6ee7b7' : decision.marginImpact.effectiveMargin >= decision.marginImpact.currentMargin * 0.5 ? '#fcd34d' : '#fca5a5'}; margin: 0; font-size: 22px; font-weight: 700;">${decision.marginImpact.effectiveMargin}%</p>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="3" style="padding: 8px 0 0 0;">
                              <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden; position: relative;">
                                <div style="width: ${Math.min(decision.marginImpact.effectiveMargin, 100)}%; height: 10px; background: ${decision.marginImpact.impactColor === 'emerald' ? '#10b981' : decision.marginImpact.impactColor === 'amber' ? '#f59e0b' : '#ef4444'}; border-radius: 5px;"></div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="3" style="text-align: center; padding: 8px 0 0 0;">
                              <span style="background: ${decision.marginImpact.impactColor === 'emerald' ? 'rgba(16,185,129,0.2)' : decision.marginImpact.impactColor === 'amber' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${decision.marginImpact.impactColor === 'emerald' ? '#6ee7b7' : decision.marginImpact.impactColor === 'amber' ? '#fcd34d' : '#fca5a5'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; border: 1px solid ${decision.marginImpact.impactColor === 'emerald' ? '#10b981' : decision.marginImpact.impactColor === 'amber' ? '#f59e0b' : '#ef4444'}; display: inline-block;">${decision.marginImpact.impactLabel}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  <!-- Section 2 - Basic Details -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 16px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <h3 style="color: white; margin: 0 0 12px 0; font-size: 16px;">👤 Basic Details</h3>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td width="50%" style="padding: 6px 8px 6px 0; vertical-align: top;">
                              <p style="color: #6b7280; margin: 0; font-size: 11px;">Name</p>
                              <p style="color: white; margin: 2px 0 0 0; font-size: 13px; font-weight: 500; word-wrap: break-word;">${decision.engagementContext.fullName}</p>
                            </td>
                            <td width="50%" style="padding: 6px 0 6px 8px; vertical-align: top;">
                              <p style="color: #6b7280; margin: 0; font-size: 11px;">Email</p>
                              <p style="color: white; margin: 2px 0 0 0; font-size: 13px; font-weight: 500; word-wrap: break-word;">${decision.engagementContext.workEmail}</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="padding: 6px 8px 6px 0; vertical-align: top;">
                              <p style="color: #6b7280; margin: 0; font-size: 11px;">Role / Title</p>
                              <p style="color: white; margin: 2px 0 0 0; font-size: 13px; font-weight: 500; word-wrap: break-word;">${decision.engagementContext.roleTitle}</p>
                            </td>
                            <td width="50%" style="padding: 6px 0 6px 8px; vertical-align: top;">
                              <p style="color: #6b7280; margin: 0; font-size: 11px;">Organisation</p>
                              <p style="color: white; margin: 2px 0 0 0; font-size: 13px; font-weight: 500; word-wrap: break-word;">${decision.engagementContext.organisationName}</p>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding: 6px 0;">
                              <p style="color: #6b7280; margin: 0; font-size: 11px;">Organisation Size</p>
                              <p style="color: white; margin: 2px 0 0 0; font-size: 13px; font-weight: 500;">${decision.engagementContext.organisationSize} employees</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Section 3 - Risk Dimensions -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
                    <tr>
                      <td>
                        <h3 style="color: white; margin: 0 0 10px 0; font-size: 16px;">🎯 Risk Dimensions</h3>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr class="dim-row">${dimensionCardsHtml[0]}${dimensionCardsHtml[1]}${dimensionCardsHtml[2]}</tr>
                          <tr class="dim-row">${dimensionCardsHtml[3]}${dimensionCardsHtml[4]}${dimensionCardsHtml[5]}</tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Section 4 - Bucket Scores -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 16px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <h3 style="color: white; margin: 0 0 12px 0; font-size: 16px;">📊 Bucket Scores</h3>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          ${bucketRows}
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Section 5 - Effort Allocation -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 16px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <h3 style="color: white; margin: 0 0 4px 0; font-size: 16px;">👥 Effort Allocation</h3>
                        <p style="margin: 0 0 12px 0;"><span style="background: rgba(255,255,255,0.1); color: #d1d5db; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${decision.effortBand}</span></p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          ${[
                            { label: "Senior", value: decision.effortPercentages.senior, alloc: decision.effortAllocation?.senior },
                            { label: "Mid-Level", value: decision.effortPercentages.mid, alloc: decision.effortAllocation?.mid },
                            { label: "Junior / Execution", value: decision.effortPercentages.junior, alloc: decision.effortAllocation?.execution },
                          ].map(item => `
                            <tr>
                              <td style="padding: 4px 0 1px 0;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                  <tr>
                                    <td style="color: #d1d5db; font-size: 13px;">${item.label}</td>
                                    <td style="text-align: right; color: white; font-weight: 700; font-family: monospace; font-size: 13px;">${item.value}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 0 0 ${item.alloc != null ? '0' : '8'}px 0;">
                                <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                                  <div style="width: ${item.value || '0%'}; height: 8px; background: #06b6d4; border-radius: 4px;"></div>
                                </div>
                              </td>
                            </tr>
                            ${item.alloc != null ? `<tr><td style="padding: 0 0 8px 0; color: #6b7280; font-size: 11px;">Allocation: ${item.alloc}%</td></tr>` : ''}
                          `).join('')}
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Section 6 - Primary Risk Drivers -->
                  ${decision.dominantDrivers && decision.dominantDrivers.length > 0 ? `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 16px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <h3 style="color: white; margin: 0 0 12px 0; font-size: 16px;">⚡ Primary Risk Drivers</h3>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          ${decision.dominantDrivers.map(driver => `
                            <tr>
                              <td style="padding: 3px 0;">
                                <span style="display: inline-block; background: rgba(245,158,11,0.2); color: #fcd34d; padding: 4px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; border: 1px solid rgba(245,158,11,0.3);">▸ ${driver}</span>
                              </td>
                            </tr>
                          `).join('')}
                        </table>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  <!-- Section 7 - Structural Risk Signals -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 16px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <h3 style="color: white; margin: 0 0 12px 0; font-size: 16px;">🛡️ Structural Risk Signals</h3>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          ${saturationFlagsHtml}
                        </table>
                        <table role="presentation" class="signal-row" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 8px;">
                          <tr>
                            <td width="33.33%" style="padding: 4px; vertical-align: top;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.03); border-radius: 8px;">
                                <tr><td style="padding: 10px;">
                                  <p style="color: #6b7280; margin: 0 0 2px 0; font-size: 11px;">AI Effort Shift</p>
                                  <p style="color: white; margin: 0; font-weight: 600; font-size: 13px;">${decision.aiImpactClassification}</p>
                                </td></tr>
                              </table>
                            </td>
                            <td width="33.33%" style="padding: 4px; vertical-align: top;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.03); border-radius: 8px;">
                                <tr><td style="padding: 10px;">
                                  <p style="color: #6b7280; margin: 0 0 2px 0; font-size: 11px;">Risk Source</p>
                                  <p style="color: white; margin: 0; font-weight: 600; font-size: 13px;">${decision.riskSource}</p>
                                </td></tr>
                              </table>
                            </td>
                            <td width="33.33%" style="padding: 4px; vertical-align: top;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.03); border-radius: 8px;">
                                <tr><td style="padding: 10px;">
                                  <p style="color: #6b7280; margin: 0 0 2px 0; font-size: 11px;">Correctability</p>
                                  <p style="color: white; margin: 0; font-weight: 600; font-size: 13px;">${decision.correctability}</p>
                                </td></tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Section 8 - Contradiction Flags -->
                  ${contradictionFlagsHtml}

                  <!-- Section 9 - Actionable Recommendations -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 16px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <h3 style="color: white; margin: 0 0 12px 0; font-size: 16px;">✅ Actionable Recommendations</h3>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          ${recommendationsHtml}
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Decision ID & Timestamp -->
                  <p style="text-align: center; color: #6b7280; font-size: 11px; margin: 16px 0 0 0;">
                    Decision ID: ${decision.id} · Generated: ${new Date(decision.createdAt).toLocaleString()}
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background: #111827; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid rgba(255,255,255,0.1); border-top: none;">
                  <p style="color: #10b981; font-weight: bold; margin: 0;">MarginMix</p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">Deterministic Decision Engine v1.0</p>
                  <p style="color: #6b7280; font-size: 11px; margin: 5px 0 0 0;">© 2026 Digital Lexicon. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const emailAttachments = attachments?.map(att => ({
    filename: att.filename,
    content: att.content
  }));

  const result = await resend.emails.send({
    from: 'Sid <sid@marginmix.ai>',
    to: ['sid@marginmix.ai', decision.engagementContext.workEmail],
    subject: `Margin Risk Assessment: ${decision.marginRiskVerdict} - ${decision.engagementContext.organisationName}`,
    html: htmlContent,
    attachments: emailAttachments
  });

  return result;
}

export async function sendFeedbackRequestEmail(
  fullName: string,
  email: string,
  assessmentId: number
) {
  const feedbackToken = Buffer.from(`${assessmentId}:${email}:${Date.now()}`).toString('base64');
  
  const yesUrl = `${APP_URL}/api/feedback?response=yes&token=${encodeURIComponent(feedbackToken)}&name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}`;
  const noUrl = `${APP_URL}/api/feedback?response=no&token=${encodeURIComponent(feedbackToken)}&name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quick Check on your MarginMix experience</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="padding: 20px;">
            <!-- Header -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">MarginMix</h1>
                  <p style="color: #d1fae5; margin: 5px 0 0 0; font-style: italic; font-family: Georgia, serif;">Margin Risk Clarity</p>
                </td>
              </tr>
            </table>
            
            <!-- Content -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
              <tr>
                <td style="padding: 30px;">
                  <p style="font-size: 16px; color: #374151; margin: 0;">Dear ${fullName},</p>
                  
                  <p style="font-size: 16px; color: #374151; margin: 20px 0;">
                    Thank you for using MarginMix. Would you be open to paying a small fee for future usage?
                  </p>
                  
                  <!-- Buttons -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="padding-right: 10px; padding-bottom: 10px;">
                              <a href="${yesUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Yes</a>
                            </td>
                            <td style="padding-left: 10px; padding-bottom: 10px;">
                              <a href="${noUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">No</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="font-size: 16px; color: #374151; margin: 30px 0 5px 0;">Regards,</p>
                  <p style="font-size: 16px; color: #374151; font-weight: 600; margin: 0;">Siddhartha</p>
                  <p style="font-size: 14px; color: #059669; margin: 5px 0 0 0;">Founder, MarginMix</p>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="color: #10b981; font-weight: bold; margin: 0;">MarginMix</p>
                  <p style="color: #6b7280; font-size: 11px; margin: 5px 0 0 0;">© 2026 Digital Lexicon. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const result = await resend.emails.send({
    from: 'Sid <sid@marginmix.ai>',
    to: [email],
    subject: 'Quick Check on your MarginMix experience',
    html: htmlContent
  });

  return result;
}

export async function sendFeedbackNotificationEmail(
  fullName: string,
  email: string,
  response: 'yes' | 'no'
) {
  const responseText = response === 'yes' 
    ? '✅ YES - Open to paying for future usage' 
    : '❌ NO - Not open to paying for future usage';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MarginMix Feedback Response</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="padding: 20px;">
            <!-- Header -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">Feedback Response Received</h1>
                </td>
              </tr>
            </table>
            
            <!-- Content -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
              <tr>
                <td style="padding: 30px;">
                  <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 18px;">User Feedback Details</h2>
                  
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 30%;">Name:</td>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word;">${fullName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Email:</td>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word;">${email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Response:</td>
                      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 16px;">${responseText}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; font-weight: 600;">Timestamp:</td>
                      <td style="padding: 12px;">${new Date().toLocaleString()}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background: #1f2937; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="color: #10b981; font-weight: bold; margin: 0; font-size: 14px;">MarginMix Feedback System</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const result = await resend.emails.send({
    from: 'MarginMix Feedback <sid@marginmix.ai>',
    to: ['sid@marginmix.ai'],
    subject: `Feedback Response: ${response.toUpperCase()} from ${fullName}`,
    html: htmlContent
  });

  return result;
}
