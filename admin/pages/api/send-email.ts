import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

// Create a transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, subject, message }: EmailRequest = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields: to, subject, message" });
  }

  const mailOptions = {
    from: `BiteSpace <${process.env.SMTP_EMAIL}>`,
    to: to,
    subject: subject,
    html: message,
  };

  try {
    console.log("Attempting to send email to:", to);
    console.log("SMTP_EMAIL:", process.env.SMTP_EMAIL);
    console.log("SMTP_PASSWORD exists:", !!process.env.SMTP_PASSWORD);
    
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return res.status(200).json({ messageId: result.messageId });
  } catch (error) {
    console.error("Error while sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : undefined;
    const errorCommand = error && typeof error === "object" && "command" in error ? (error as { command?: string }).command : undefined;
    
    console.error("SMTP Error details:", {
      message: errorMessage,
      code: errorCode,
      command: errorCommand
    });
    return res.status(500).json({ 
      error: "Failed to send email",
      details: errorMessage 
    });
  }
}