import { Resend } from 'resend';
import { DecisionObject } from './decision-engine';

const resend = new Resend(process.env.RESEND_API_KEY);

function getVerdictColor(verdict: string): { bg: string; text: string; border: string } {
  switch (verdict) {
    case "Structurally Viable":
      return { bg: "#d1fae5", text: "#065f46", border: "#10b981" };
    case "Conditionally Viable":
      return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" };
    case "Structurally Fragile":
      return { bg: "#fed7aa", text: "#9a3412", border: "#f97316" };
    case "Economically Non-Viable":
      return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" };
    default:
      return { bg: "#f3f4f6", text: "#374151", border: "#9ca3af" };
  }
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

  const bucketRows = Object.entries(decision.bucketScores)
    .map(([key, score]) => {
      const band = decision.bucketBands[key as keyof typeof decision.bucketBands];
      const bandColor = getRiskBandColor(band);
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formatBucketLabel(key)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${score}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="background: ${bandColor}20; color: ${bandColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${band}</span>
          </td>
        </tr>
      `;
    })
    .join('');

  const dominantDriversList = decision.dominantDrivers
    .map(driver => `<li style="margin-bottom: 6px;">${driver}</li>`)
    .join('');

  const saturationWarnings = [];
  if (decision.saturationDetails.valueSaturationPresent) {
    saturationWarnings.push("Value Saturation Present");
  }
  if (decision.saturationDetails.opticsDrivenStaffing) {
    saturationWarnings.push("Optics-Driven Staffing Detected");
  }
  if (decision.saturationDetails.upwardCostShift) {
    saturationWarnings.push("Upward Cost Shift Detected");
  }

  const saturationSection = saturationWarnings.length > 0 ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-top: 20px;">
      <h4 style="color: #991b1b; margin: 0 0 10px 0; font-size: 14px;">⚠️ Saturation Warnings</h4>
      <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
        ${saturationWarnings.map(w => `<li>${w}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  const openSignalSection = openSignal ? `
    <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e7eb;">
      <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Additional Context</h3>
      <p style="color: #4b5563; margin: 0;">${openSignal}</p>
    </div>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MarginMix Assessment Results</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">MarginMix</h1>
        <p style="color: #d1fae5; margin: 5px 0 0 0; font-style: italic; font-family: Georgia, serif;">Margin Risk Clarity</p>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <!-- Decision ID & Timestamp -->
        <div style="text-align: right; color: #6b7280; font-size: 12px; margin-bottom: 20px;">
          Decision ID: ${decision.id}<br>
          Generated: ${new Date(decision.createdAt).toLocaleString()}
        </div>

        <!-- Contact Information -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Engagement Context</h3>
          <p><strong>Name:</strong> ${decision.engagementContext.fullName}</p>
          <p><strong>Email:</strong> ${decision.engagementContext.workEmail}</p>
          <p><strong>Organization:</strong> ${decision.engagementContext.organisationName}</p>
          <p><strong>Role:</strong> ${decision.engagementContext.roleTitle}</p>
          <p><strong>Organization Size:</strong> ${decision.engagementContext.organisationSize}</p>
          <p><strong>Engagement Type:</strong> ${decision.engagementContext.type}</p>
          <p><strong>Classification:</strong> ${decision.engagementContext.classification} (${decision.engagementContext.multiplier}x multiplier)</p>
        </div>

        <!-- Margin Risk Verdict -->
        <div style="background: ${verdictColors.bg}; border: 2px solid ${verdictColors.border}; border-radius: 12px; padding: 24px; margin-bottom: 20px; text-align: center;">
          <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Margin Risk Verdict</p>
          <h2 style="color: ${verdictColors.text}; margin: 0; font-size: 28px;">${decision.marginRiskVerdict}</h2>
          <div style="margin-top: 16px;">
            <span style="background: ${riskBandColor}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">${decision.riskBand} Risk</span>
          </div>
          <p style="color: #6b7280; margin: 16px 0 0 0; font-size: 14px;">Composite Score: <strong>${decision.compositeRiskScore}/100</strong></p>
        </div>

        <!-- Key Classifications -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">AI Impact</p>
            <p style="color: #374151; margin: 0; font-weight: 600;">${decision.aiImpactClassification}</p>
          </div>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Risk Source</p>
            <p style="color: #374151; margin: 0; font-weight: 600;">${decision.riskSource}</p>
          </div>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Effort Band</p>
            <p style="color: #374151; margin: 0; font-weight: 600;">${decision.effortBand}</p>
          </div>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Correctability</p>
            <p style="color: #374151; margin: 0; font-weight: 600;">${decision.correctability}</p>
          </div>
        </div>

        <!-- Bucket Scores Table -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Risk Bucket Scores</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Bucket</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Score</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Band</th>
              </tr>
            </thead>
            <tbody>
              ${bucketRows}
            </tbody>
          </table>
        </div>

        <!-- Effort Distribution -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Effort Distribution</h3>
          <div style="display: flex; justify-content: space-around; text-align: center;">
            <div>
              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px;">Senior</p>
              <p style="color: #059669; margin: 0; font-size: 24px; font-weight: 700;">${decision.effortPercentages.senior}</p>
            </div>
            <div>
              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px;">Mid-Level</p>
              <p style="color: #0d9488; margin: 0; font-size: 24px; font-weight: 700;">${decision.effortPercentages.mid}</p>
            </div>
            <div>
              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px;">Junior</p>
              <p style="color: #14b8a6; margin: 0; font-size: 24px; font-weight: 700;">${decision.effortPercentages.junior}</p>
            </div>
          </div>
        </div>

        <!-- Dominant Drivers -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Dominant Risk Drivers</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
            ${dominantDriversList}
          </ul>
        </div>

        ${saturationSection}
        ${openSignalSection}

        <!-- Value Saturation Flag -->
        ${decision.valueSaturationFlag ? `
        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-top: 20px; text-align: center;">
          <p style="color: #92400e; margin: 0; font-weight: 600;">⚠️ Value Saturation Flag Active</p>
          <p style="color: #a16207; margin: 8px 0 0 0; font-size: 14px;">This engagement shows signs of diminishing marginal value relative to effort invested.</p>
        </div>
        ` : ''}
      </div>
      
      <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="color: #10b981; font-weight: bold; margin: 0;">MarginMix</p>
        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">Deterministic Decision Engine v1.0</p>
        <p style="color: #6b7280; font-size: 11px; margin: 5px 0 0 0;">© 2026 Digital Lexicon. All rights reserved.</p>
      </div>
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
