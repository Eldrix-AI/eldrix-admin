import { users } from "../../../../db/index.mjs";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import twilio from "twilio";
import nodemailer from "nodemailer";

export async function GET(request: NextRequest) {
  try {
    // Check if the user is authenticated via cookies
    const isAuthenticated = request.cookies.has("isAuthenticated");

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Get all users
    const allUsers = await users.getAllUsers();

    // Sort users by name alphabetically
    const sortedUsers = (allUsers as any[]).sort((a: any, b: any) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json(sortedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if the user is authenticated via cookies
    const isAuthenticated = request.cookies.has("isAuthenticated");

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { name, email, phone, tempPassword } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !tempPassword) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await users.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate unique user ID
    const userId = uuidv4();

    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user data
    const userData = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      description: "",
      imageUrl: null,
      age: null,
      techUsage: null,
      accessibilityNeeds: null,
      preferredContactMethod: "phone",
      experienceLevel: "beginner",
      emailList: true,
      smsConsent: true,
      notification: false,
      darkMode: false,
    };

    // Create the user in the database
    const newUser = (await users.createUser(userData)) as any;

    // Send email and SMS with setup link
    const setupLink = `http://localhost:3001/accountSetup?email=${encodeURIComponent(
      email
    )}&password=${encodeURIComponent(tempPassword)}`;

    console.log("Setup link generated:", setupLink);
    console.log("Environment variables check:");
    console.log("ELDRIX_USER:", process.env.ELDRIX_USER ? "SET" : "NOT SET");
    console.log("ELDRIX_PASS:", process.env.ELDRIX_PASS ? "SET" : "NOT SET");
    console.log(
      "ELDRIX_SMTP_HOST:",
      process.env.ELDRIX_SMTP_HOST ? "SET" : "NOT SET"
    );
    console.log(
      "ELDRIX_SMTP_PORT:",
      process.env.ELDRIX_SMTP_PORT ? "SET" : "NOT SET"
    );
    console.log(
      "TWILIO_ACCOUNT_SID:",
      process.env.TWILIO_ACCOUNT_SID ? "SET" : "NOT SET"
    );
    console.log(
      "TWILIO_AUTH_TOKEN:",
      process.env.TWILIO_AUTH_TOKEN ? "SET" : "NOT SET"
    );
    console.log(
      "TWILIO_PHONE_NUMBER:",
      process.env.TWILIO_PHONE_NUMBER ? "SET" : "NOT SET"
    );

    let emailSent = false;
    let smsSent = false;

    try {
      // Send email
      console.log("Attempting to send email to:", email);
      await sendEmail(email, name, setupLink);
      emailSent = true;
      console.log("Email sent successfully");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    try {
      // Send SMS
      console.log("Attempting to send SMS to:", phone);
      await sendSMS(phone, name, setupLink);
      smsSent = true;
      console.log("SMS sent successfully");
    } catch (smsError) {
      console.error("Error sending SMS:", smsError);
    }

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: (newUser as any).id,
        name: (newUser as any).name,
        email: (newUser as any).email,
        phone: (newUser as any).phone,
      },
      notifications: {
        emailSent,
        smsSent,
        setupLink,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 }
    );
  }
}

// Function to send email
async function sendEmail(email: string, name: string, setupLink: string) {
  if (
    !process.env.ELDRIX_USER ||
    !process.env.ELDRIX_PASS ||
    !process.env.ELDRIX_SMTP_HOST ||
    !process.env.ELDRIX_SMTP_PORT
  ) {
    throw new Error("Eldrix email credentials not configured");
  }

  try {
    console.log("Creating Eldrix email transporter...");
    // Create Eldrix email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.ELDRIX_SMTP_HOST,
      port: parseInt(process.env.ELDRIX_SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.ELDRIX_USER,
        pass: process.env.ELDRIX_PASS,
      },
    });

    console.log("Verifying transporter connection...");
    await transporter.verify();

    const mailOptions = {
      from: process.env.ELDRIX_USER,
      to: email,
      subject: "Welcome to Eldrix - Complete Your Account Setup",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2D3E50;">Welcome to Eldrix, ${name}!</h2>
          <p>Your account has been created successfully. To complete your setup and start using Eldrix, please click the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupLink}" style="background-color: #2D3E50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Account Setup</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${setupLink}</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Eldrix Team</p>
        </div>
      `,
    };

    console.log("Sending email...");
    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Email sent successfully to ${email}. Message ID: ${result.messageId}`
    );
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Function to send SMS
async function sendSMS(phone: string, name: string, setupLink: string) {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    throw new Error("Twilio credentials not configured");
  }

  try {
    const message = `Hi ${name}! Welcome to Eldrix. Complete your account setup here: ${setupLink}`;
    console.log("SMS message:", message);

    // Initialize Twilio client
    console.log("Initializing Twilio client...");
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log("Sending SMS...");
    // Send SMS
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    console.log(
      `SMS sent successfully to ${phone}. Message SID: ${result.sid}`
    );
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
}
