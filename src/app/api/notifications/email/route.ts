import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  sendOrderCreatedEmail,
  sendOrderReadyEmail,
  processTemplate,
  textToHtml,
} from "@/lib/email";
import { getSettings, getOrderById } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/email
 *
 * Body options:
 * 1. Send order notification:
 *    { type: "order_created" | "order_ready", orderId: string }
 *
 * 2. Send custom email:
 *    { type: "custom", to: string, subject: string, body: string }
 *
 * 3. Test email configuration:
 *    { type: "test", to: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Tipo de notificación requerido" },
        { status: 400 }
      );
    }

    // Handle order notifications
    if (type === "order_created" || type === "order_ready") {
      const { orderId } = body;

      if (!orderId) {
        return NextResponse.json(
          { error: "ID de orden requerido" },
          { status: 400 }
        );
      }

      const order = await getOrderById(orderId);
      if (!order) {
        return NextResponse.json(
          { error: "Orden no encontrada" },
          { status: 404 }
        );
      }

      if (!order.customerEmail) {
        return NextResponse.json(
          { error: "El cliente no tiene email registrado" },
          { status: 400 }
        );
      }

      const result = type === "order_created"
        ? await sendOrderCreatedEmail(order)
        : await sendOrderReadyEmail(order);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Email enviado a ${order.customerEmail}`,
        messageId: result.messageId,
      });
    }

    // Handle custom email
    if (type === "custom") {
      const { to, subject, body: emailBody } = body;

      if (!to || !subject || !emailBody) {
        return NextResponse.json(
          { error: "Destinatario, asunto y cuerpo son requeridos" },
          { status: 400 }
        );
      }

      const settings = await getSettings();
      const htmlContent = textToHtml(emailBody, settings.brandColor);

      const result = await sendEmail({
        to,
        subject,
        html: htmlContent,
        text: emailBody,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Email enviado a ${to}`,
        messageId: result.messageId,
      });
    }

    // Handle test email
    if (type === "test") {
      const { to } = body;

      if (!to) {
        return NextResponse.json(
          { error: "Destinatario requerido para prueba" },
          { status: 400 }
        );
      }

      const settings = await getSettings();
      const testBody = `Este es un correo de prueba del sistema de notificaciones de ${settings.businessName}.\n\nSi recibes este mensaje, la configuración de email está funcionando correctamente.`;
      const htmlContent = textToHtml(testBody, settings.brandColor);

      const result = await sendEmail({
        to,
        subject: `[Prueba] Notificación de ${settings.businessName}`,
        html: htmlContent,
        text: testBody,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Email de prueba enviado a ${to}`,
        messageId: result.messageId,
      });
    }

    return NextResponse.json(
      { error: "Tipo de notificación no válido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[api/notifications/email] POST error:", error);
    return NextResponse.json(
      { error: "Error al enviar notificación" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/email/status
 * Check if email notifications are properly configured
 */
export async function GET() {
  try {
    const settings = await getSettings();

    const configured =
      settings.emailEnabled &&
      settings.emailApiKey &&
      settings.emailFromAddress;

    return NextResponse.json({
      enabled: settings.emailEnabled,
      configured: !!configured,
      provider: settings.emailProvider,
      fromAddress: settings.emailFromAddress ?
        settings.emailFromAddress.replace(/(.{2}).*@/, "$1***@") : null,
    });
  } catch (error) {
    console.error("[api/notifications/email] GET error:", error);
    return NextResponse.json(
      { error: "Error al obtener estado de configuración" },
      { status: 500 }
    );
  }
}
