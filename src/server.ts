import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Therapy Website <onboarding@resend.dev>";
const TO_EMAIL = process.env.RECEIVER_EMAIL as string;

// Prevents form input from breaking the email HTML
const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Health check route for UptimeRobot
app.get("/", (req, res) => {
  res.status(200).send("API is running...");
});

// CORS
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

app.use(express.json());

// 1. Check Gift Card Balance & Send Email
app.post("/api/gift-card-balance", async (req: Request, res: Response) => {
  const { cardNumber, email, name, phone } = req.body;

  if (!cardNumber) {
    return res.status(400).json({ error: "Card number is required" });
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email || undefined,
      subject: `Gift Card Balance Inquiry: ${cardNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ea7a24;">Gift Card Balance Check Inquiry</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
          <p><strong>Card Number:</strong> <span style="font-size: 16px; font-weight: bold; color: #222;">${escapeHtml(cardNumber)}</span></p>
          <p><strong>Submitted Email:</strong> ${escapeHtml(email || "Not provided")}</p>
          <p><strong>Name:</strong> ${escapeHtml(name || "Not provided")}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
          <br />
          <p style="font-size: 12px; color: #777;">This inquiry was sent from the Check Gift Card Balance page.</p>
        </div>
      `,
    });

    if (error) console.error("Resend gift card error:", error);
    else console.log(`Gift card inquiry for card ${cardNumber} sent.`);
  } catch (err) {
    console.error("Error sending gift card email:", err);
  }

  return res.json({
    valid: true,
    balance: 150.0,
    currency: "USD",
    message: "Balance retrieved and request received.",
  });
});

// 2. Submit Contact Form
app.post("/api/contact", async (req: Request, res: Response) => {
  const { name, email, phone, subject, message, type } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Name, email, and message are required." });
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New Form Submission: ${subject || "Website Contact Form"}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ea7a24;">New Website Inquiry</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
          <p><strong>Service Type:</strong> ${escapeHtml(type || "Not specified")}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject || "General Inquiry")}</p>
          <br />
          <p><strong>Message:</strong></p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #ea7a24; white-space: pre-wrap;">
            ${escapeHtml(message)}
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend contact error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to send email message. Please try again.",
      });
    }

    console.log(`New inquiry from ${name} (${email}) sent.`);
    return res.status(200).json({
      success: true,
      message: "Message sent and received successfully.",
    });
  } catch (err) {
    console.error("Error sending email:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to send email message. Please try again.",
    });
  }
});

// 3. Fetch Reviews
app.get("/api/reviews", (req: Request, res: Response) => {
  return res.json({
    reviews: [
      {
        id: 1,
        name: "Jay Will",
        date: "Sep 24, 2026",
        rating: 5,
        text: "Super friendly, great conversation...",
      },
      {
        id: 2,
        name: "Lucas",
        date: "Sep 22, 2026",
        rating: 5,
        text: "She looked even better in person...",
      },
    ],
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
