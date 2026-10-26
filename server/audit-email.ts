function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/** Kept pure so recipients, exact copy and attachments can be tested without sending email. */
export function buildAuditQuestionnaireEmail(input: { id: string; name: string; email: string; pdf: Buffer }) {
  const text = `Dear ${input.name.trim()}\n\nThank you for filling the questionnaire, we will be in touch with you. Please find your responses attached.\n\nRegards\nSid`;
  return {
    from: "Sid <sid@marginmix.ai>",
    to: [input.email.trim()],
    ...(input.email.trim().toLowerCase() === "sid@dilexicon.com" ? {} : { bcc: ["sid@dilexicon.com"] }),
    replyTo: "sid@dilexicon.com",
    subject: "Your MarginMix questionnaire responses",
    text,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#253d37">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`,
    attachments: [{ filename: "MarginMix-Questionnaire-Responses.pdf", content: input.pdf }],
  };
}
