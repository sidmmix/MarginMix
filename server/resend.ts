import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function sendAssessmentEmail(assessmentData: {
  fullName: string;
  workEmail: string;
  roleTitle: string;
  organisationName: string;
  organisationSize: string;
  engagementType: string;
  engagementDuration: string;
  clientVolatility: string;
  stakeholderComplexity: string;
  seniorLeadershipInvolvement: string;
  midLevelOversight: string;
  executionThinkingMix: string;
  iterationIntensity: string;
  scopeChangeLikelihood: string;
  crossFunctionalCoordination: string;
  openSignal?: string | null;
  submittedAt: Date;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  
  const questions = [
    { label: "Organization Size", value: assessmentData.organisationSize },
    { label: "Engagement Type", value: assessmentData.engagementType },
    { label: "Engagement Duration", value: assessmentData.engagementDuration },
    { label: "Client Volatility", value: assessmentData.clientVolatility },
    { label: "Stakeholder Complexity", value: assessmentData.stakeholderComplexity },
    { label: "Senior Leadership Involvement", value: assessmentData.seniorLeadershipInvolvement },
    { label: "Mid-Level Oversight", value: assessmentData.midLevelOversight },
    { label: "Execution/Thinking Mix", value: assessmentData.executionThinkingMix },
    { label: "Iteration Intensity", value: assessmentData.iterationIntensity },
    { label: "Scope Change Likelihood", value: assessmentData.scopeChangeLikelihood },
    { label: "Cross-Functional Coordination", value: assessmentData.crossFunctionalCoordination },
  ];

  const responseLines = questions
    .map(({ label, value }) => {
      return `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 40%; vertical-align: top;">${label}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">${value}</td>
      </tr>`;
    })
    .join('');

  const openSignalRow = assessmentData.openSignal ? `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 40%; vertical-align: top;">Open Signal (Additional Comments)</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">${assessmentData.openSignal}</td>
    </tr>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>MarginMix Assessment Submission</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">MarginMix</h1>
        <p style="color: #d1fae5; margin: 5px 0 0 0; font-style: italic; font-family: Georgia, serif;">Margin Risk Clarity</p>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #059669; margin-top: 0;">New Margin Risk Assessment Submission</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Contact Information</h3>
          <p><strong>Name:</strong> ${assessmentData.fullName}</p>
          <p><strong>Email:</strong> ${assessmentData.workEmail}</p>
          <p><strong>Organization:</strong> ${assessmentData.organisationName}</p>
          <p><strong>Role:</strong> ${assessmentData.roleTitle}</p>
          <p><strong>Submitted:</strong> ${assessmentData.submittedAt.toLocaleString()}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #059669; padding-bottom: 10px;">Assessment Responses</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${responseLines}
            ${openSignalRow}
          </table>
        </div>
      </div>
      
      <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="color: #10b981; font-weight: bold; margin: 0;">MarginMix</p>
        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">MarginMix is a Digital Lexicon Corp brand.</p>
        <p style="color: #6b7280; font-size: 11px; margin: 5px 0 0 0;">© 2025 Digital Lexicon. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const result = await client.emails.send({
    from: fromEmail || 'MarginMix <onboarding@resend.dev>',
    to: ['sid@marginmix.ai'],
    subject: `New Margin Risk Assessment: ${assessmentData.organisationName} - ${assessmentData.fullName}`,
    html: htmlContent
  });

  return result;
}
