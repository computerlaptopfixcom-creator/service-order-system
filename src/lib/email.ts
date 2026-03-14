/**
 * Email Service - Supports Resend and SendGrid providers
 */

import { getSettings, BusinessSettings } from "./storage";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using Resend API
 */
async function sendWithResend(
  apiKey: string,
  from: string,
  payload: EmailPayload
): Promise<EmailResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || "Error al enviar email con Resend",
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error("Resend error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Send email using SendGrid API
 */
async function sendWithSendGrid(
  apiKey: string,
  from: string,
  payload: EmailPayload
): Promise<EmailResult> {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: payload.to }],
          },
        ],
        from: { email: from },
        subject: payload.subject,
        content: [
          { type: "text/plain", value: payload.text || payload.html.replace(/<[^>]*>/g, "") },
          { type: "text/html", value: payload.html },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Error al enviar email con SendGrid";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.errors?.[0]?.message || errorMessage;
      } catch {
        // Ignore parse error
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    // SendGrid returns 202 with no body on success
    const messageId = response.headers.get("x-message-id") || "sent";
    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error("SendGrid error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Replace template variables with actual values
 */
export function processTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

/**
 * Convert plain text to simple HTML
 */
export function textToHtml(text: string, brandColor: string = "#2563eb"): string {
  const escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid ${brandColor};
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .content {
      padding: 20px 0;
    }
    .footer {
      border-top: 1px solid #eee;
      padding-top: 15px;
      margin-top: 20px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="content">
    ${escapedText}
  </div>
</body>
</html>`;
}

/**
 * Send notification email using configured provider
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const settings = await getSettings();

  if (!settings.emailEnabled) {
    return {
      success: false,
      error: "Las notificaciones por email están deshabilitadas",
    };
  }

  if (!settings.emailApiKey) {
    return {
      success: false,
      error: "No se ha configurado la API key del servicio de email",
    };
  }

  if (!settings.emailFromAddress) {
    return {
      success: false,
      error: "No se ha configurado la dirección de envío de email",
    };
  }

  const fromAddress = settings.emailFromName
    ? `${settings.emailFromName} <${settings.emailFromAddress}>`
    : settings.emailFromAddress;

  if (settings.emailProvider === "sendgrid") {
    return sendWithSendGrid(settings.emailApiKey, settings.emailFromAddress, payload);
  }

  // Default to Resend
  return sendWithResend(settings.emailApiKey, fromAddress, payload);
}

/**
 * Send order created notification email
 */
export async function sendOrderCreatedEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
}): Promise<EmailResult> {
  if (!order.customerEmail) {
    return { success: false, error: "El cliente no tiene email registrado" };
  }

  const settings = await getSettings();

  if (!settings.emailEnabled) {
    return { success: false, error: "Email deshabilitado" };
  }

  const deviceDescription = [order.deviceType, order.deviceBrand, order.deviceModel]
    .filter(Boolean)
    .join(" ");

  const variables = {
    nombre: order.customerName,
    equipo: deviceDescription,
    orden: order.orderNumber,
    negocio: settings.businessName,
  };

  const template = settings.emailTemplateCreated ||
    "Estimado/a {nombre},\n\nSu equipo {equipo} ha sido recibido.\nNúmero de orden: {orden}\n\nSaludos,\n{negocio}";

  const textContent = processTemplate(template, variables);
  const htmlContent = textToHtml(textContent, settings.brandColor);

  return sendEmail({
    to: order.customerEmail,
    subject: `Orden ${order.orderNumber} - Equipo recibido`,
    html: htmlContent,
    text: textContent,
  });
}

/**
 * Send order ready notification email
 */
export async function sendOrderReadyEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
}): Promise<EmailResult> {
  if (!order.customerEmail) {
    return { success: false, error: "El cliente no tiene email registrado" };
  }

  const settings = await getSettings();

  if (!settings.emailEnabled) {
    return { success: false, error: "Email deshabilitado" };
  }

  const deviceDescription = [order.deviceType, order.deviceBrand, order.deviceModel]
    .filter(Boolean)
    .join(" ");

  const variables = {
    nombre: order.customerName,
    equipo: deviceDescription,
    orden: order.orderNumber,
    negocio: settings.businessName,
  };

  const template = settings.emailTemplateReady ||
    "Estimado/a {nombre},\n\nSu equipo {equipo} está listo para recoger.\nNúmero de orden: {orden}\n\n¡Gracias por su preferencia!\n\nSaludos,\n{negocio}";

  const textContent = processTemplate(template, variables);
  const htmlContent = textToHtml(textContent, settings.brandColor);

  return sendEmail({
    to: order.customerEmail,
    subject: `Orden ${order.orderNumber} - Equipo listo para recoger`,
    html: htmlContent,
    text: textContent,
  });
}
