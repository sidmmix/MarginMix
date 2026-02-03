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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MarginMix Assessment Results</title>
      <style>
        @media only screen and (max-width: 600px) {
          .main-container { padding: 10px !important; }
          .content-padding { padding: 15px !important; }
          .header-padding { padding: 20px !important; }
          .classification-table td { display: block !important; width: 100% !important; box-sizing: border-box !important; }
          .effort-table td { padding: 10px 5px !important; }
          .bucket-table th, .bucket-table td { padding: 8px 4px !important; font-size: 13px !important; }
          h2 { font-size: 22px !important; }
          h3 { font-size: 16px !important; }
        }
      </style>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td class="main-container" style="padding: 20px;">
            <!-- Header -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="header-padding" style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">MarginMix</h1>
                  <p style="color: #d1fae5; margin: 5px 0 0 0; font-style: italic; font-family: Georgia, serif;">Margin Risk Clarity</p>
                </td>
              </tr>
            </table>
            
            <!-- Main Content -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
              <tr>
                <td class="content-padding" style="padding: 30px;">
                  <!-- Decision ID & Timestamp -->
                  <p style="text-align: right; color: #6b7280; font-size: 12px; margin: 0 0 20px 0;">
                    Decision ID: ${decision.id}<br>
                    Generated: ${new Date(decision.createdAt).toLocaleString()}
                  </p>

                  <!-- Contact Information -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #374151; margin: 0 0 10px 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Engagement Context</h3>
                        <p style="margin: 8px 0; word-wrap: break-word;"><strong>Name:</strong> ${decision.engagementContext.fullName}</p>
                        <p style="margin: 8px 0; word-wrap: break-word;"><strong>Email:</strong> ${decision.engagementContext.workEmail}</p>
                        <p style="margin: 8px 0; word-wrap: break-word;"><strong>Organization:</strong> ${decision.engagementContext.organisationName}</p>
                        <p style="margin: 8px 0; word-wrap: break-word;"><strong>Role:</strong> ${decision.engagementContext.roleTitle}</p>
                        <p style="margin: 8px 0;"><strong>Organization Size:</strong> ${decision.engagementContext.organisationSize}</p>
                        <p style="margin: 8px 0;"><strong>Engagement Type:</strong> ${decision.engagementContext.type}</p>
                        <p style="margin: 8px 0;"><strong>Classification:</strong> ${decision.engagementContext.classification}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Margin Risk Verdict -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${verdictColors.bg}; border: 2px solid ${verdictColors.border}; border-radius: 12px; margin-bottom: 20px;">
                    <tr>
                      <td style="padding: 24px; text-align: center;">
                        <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Margin Risk Verdict</p>
                        <h2 style="color: ${verdictColors.text}; margin: 0; font-size: 24px;">${decision.marginRiskVerdict}</h2>
                        <p style="margin: 16px 0 0 0;">
                          <span style="background: ${riskBandColor}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block;">${decision.riskBand} Risk</span>
                        </p>
                        <p style="color: #6b7280; margin: 16px 0 0 0; font-size: 14px;">Composite Score: <strong>${decision.compositeRiskScore}/100</strong></p>
                      </td>
                    </tr>
                  </table>

                  <!-- Key Classifications - Stacked for mobile -->
                  <table role="presentation" class="classification-table" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                    <tr>
                      <td width="50%" style="padding: 0 5px 10px 0; vertical-align: top;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                          <tr><td style="padding: 16px; text-align: center;">
                            <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">AI Impact</p>
                            <p style="color: #374151; margin: 0; font-weight: 600; font-size: 14px;">${decision.aiImpactClassification}</p>
                          </td></tr>
                        </table>
                      </td>
                      <td width="50%" style="padding: 0 0 10px 5px; vertical-align: top;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                          <tr><td style="padding: 16px; text-align: center;">
                            <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Risk Source</p>
                            <p style="color: #374151; margin: 0; font-weight: 600; font-size: 14px;">${decision.riskSource}</p>
                          </td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="padding: 0 5px 0 0; vertical-align: top;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                          <tr><td style="padding: 16px; text-align: center;">
                            <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Effort Band</p>
                            <p style="color: #374151; margin: 0; font-weight: 600; font-size: 14px;">${decision.effortBand}</p>
                          </td></tr>
                        </table>
                      </td>
                      <td width="50%" style="padding: 0 0 0 5px; vertical-align: top;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                          <tr><td style="padding: 16px; text-align: center;">
                            <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Correctability</p>
                            <p style="color: #374151; margin: 0; font-weight: 600; font-size: 14px;">${decision.correctability}</p>
                          </td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Bucket Scores Table -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #374151; margin: 0 0 10px 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Risk Bucket Scores</h3>
                        <table class="bucket-table" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse;">
                          <thead>
                            <tr style="background: #f9fafb;">
                              <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 13px;">Bucket</th>
                              <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #e5e7eb; font-size: 13px;">Score</th>
                              <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #e5e7eb; font-size: 13px;">Band</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${bucketRows}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Effort Distribution -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #374151; margin: 0 0 15px 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Effort Distribution</h3>
                        <table class="effort-table" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td width="33.33%" style="text-align: center; padding: 10px;">
                              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px;">Senior</p>
                              <p style="color: #059669; margin: 0; font-size: 22px; font-weight: 700;">${decision.effortPercentages.senior}</p>
                            </td>
                            <td width="33.33%" style="text-align: center; padding: 10px;">
                              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px;">Mid-Level</p>
                              <p style="color: #0d9488; margin: 0; font-size: 22px; font-weight: 700;">${decision.effortPercentages.mid}</p>
                            </td>
                            <td width="33.33%" style="text-align: center; padding: 10px;">
                              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px;">Junior</p>
                              <p style="color: #14b8a6; margin: 0; font-size: 22px; font-weight: 700;">${decision.effortPercentages.junior}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Dominant Drivers -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #374151; margin: 0 0 10px 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Dominant Risk Drivers</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                          ${dominantDriversList}
                        </ul>
                      </td>
                    </tr>
                  </table>

                  ${saturationSection}
                  ${openSignalSection}

                  <!-- Value Saturation Flag -->
                  ${decision.valueSaturationFlag ? `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; margin-top: 20px;">
                    <tr>
                      <td style="padding: 16px; text-align: center;">
                        <p style="color: #92400e; margin: 0; font-weight: 600;">⚠️ Value Saturation Flag Active</p>
                        <p style="color: #a16207; margin: 8px 0 0 0; font-size: 14px;">This engagement shows signs of diminishing marginal value relative to effort invested.</p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
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
