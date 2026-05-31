import sgMail from "@sendgrid/mail";
import fs from "fs";
import path from "path";
import { config } from "../config";

// Initialize SendGrid with API key
sgMail.setApiKey(config.sendgrid.apiKey);

/**
 * Loads an HTML email template and replaces placeolders.
 */
function loadTemplate(templateName: string, replacements: Record<string, string>): string {
  // Try src/templates in development/ts-node, and fallback to path relative to __dirname
  let templatePath = path.join(process.cwd(), "src/templates", `${templateName}.html`);
  
  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(__dirname, "../templates", `${templateName}.html`);
  }

  let html = fs.readFileSync(templatePath, "utf-8");
  
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  
  return html;
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const verificationUrl = `http://localhost:3001/api/v1/auth/verify-email?token=${token}`;
  const htmlContent = loadTemplate("verification", {
    USER_NAME: name,
    VERIFICATION_URL: verificationUrl,
  });

  const msg = {
    to,
    from: config.sendgrid.fromEmail,
    subject: "Verify Your Email Address - Apex Trading",
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`✉️ Verification email successfully sent to ${to}`);
  } catch (error: any) {
    console.error("❌ Error sending verification email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error("Failed to send email");
  }
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
  const htmlContent = loadTemplate("password-reset", {
    USER_NAME: name,
    RESET_URL: resetUrl,
  });

  const msg = {
    to,
    from: config.sendgrid.fromEmail,
    subject: "Reset Your Password - Apex Trading",
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`✉️ Password reset email successfully sent to ${to}`);
  } catch (error: any) {
    console.error("❌ Error sending password reset email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error("Failed to send email");
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const htmlContent = loadTemplate("welcome", {
    USER_NAME: name,
  });

  const msg = {
    to,
    from: config.sendgrid.fromEmail,
    subject: "Welcome to Apex Trading!",
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`✉️ Welcome email successfully sent to ${to}`);
  } catch (error: any) {
    console.error("❌ Error sending welcome email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error("Failed to send email");
  }
}

export async function sendAlertEmail(to: string, alert: { symbol: string; price: number; type: string }): Promise<void> {
  // Basic custom alert email formatting
  const msg = {
    to,
    from: config.sendgrid.fromEmail,
    subject: `🚨 Price Alert Triggered for ${alert.symbol}`,
    text: `Your alert for ${alert.symbol} was triggered. Price reached ${alert.price}. Type: ${alert.type}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2>Price Alert Triggered!</h2>
        <p>Your custom alert for <strong>${alert.symbol}</strong> has been triggered.</p>
        <p>Current Price: <strong>$${alert.price}</strong> (${alert.type})</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✉️ Price alert email successfully sent to ${to}`);
  } catch (error: any) {
    console.error("❌ Error sending price alert email:", error);
    throw new Error("Failed to send email");
  }
}
