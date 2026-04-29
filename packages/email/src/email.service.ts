import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import config from "../../config/src/index.config.ts";

const envConfig = config[config.env || "development"];

const resend = new Resend(envConfig.resend_api_key);
const prisma = new PrismaClient();

const FROM_EMAIL = "Lumina <noreply@lumina.io>";
const FRONTEND_URL = envConfig.frontend_url;

const getUnsubscribeLink = (email: string, type: string) => {
	return `${FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}&type=${type}`;
};

const emailFooter = (email: string, type: string) => `
  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
    <p>You're receiving this email because you have an account with Lumina.</p>
    <p>
      <a href="${getUnsubscribeLink(email, type)}" style="color: #666;">Unsubscribe</a> from ${type} emails.
    </p>
  </div>
`;

const EMAIL_TYPE_MAP = {
	welcome: "welcome",
	photoApproved: "photoApproved",
	clustering: "clustering",
	albumShared: "albumShared",
	newPhotos: "newPhotos",
} as const;

type EmailType = keyof typeof EMAIL_TYPE_MAP;

const checkEmailPreference = async (
	email: string,
	type: EmailType,
): Promise<boolean> => {
	try {
		const user = await prisma.users.findUnique({
			where: { email },
			select: { email_preferences: true },
		});

		const prefs = (user?.email_preferences as any) || {};
		return prefs[type] !== false;
	} catch (error) {
		console.error(`[EMAIL] Error checking preference for ${email}:`, error);
		return true;
	}
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
	const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

	try {
		const data = await resend.emails.send({
			from: FROM_EMAIL,
			to: [email],
			subject: "Reset your password",
			html: `
        <p>You requested a password reset for your Lumina account.</p>
        <p>Click the link below to reset your password. This link will expire in 15 minutes.</p>
        <a href="${resetLink}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        ${emailFooter(email, "password")}
      `,
		});
		return data;
	} catch (error) {
		console.error("Failed to send reset email:", error);
		throw error;
	}
};

export const sendWelcomeEmail = async (email: string) => {
	const allowed = await checkEmailPreference(email, "welcome");
	if (!allowed) {
		console.log(`[EMAIL] Skipping welcome email for ${email} - unsubscribed`);
		return null;
	}

	try {
		const data = await resend.emails.send({
			from: FROM_EMAIL,
			to: [email],
			subject: "Welcome to Lumina",
			html: `
        <h1>Welcome to Lumina!</h1>
        <p>We're excited to have you on board. Start creating albums and matching faces today!</p>
        <p>Here's what you can do:</p>
        <ul>
          <li>Create albums and upload photos</li>
          <li>Share albums with friends and family</li>
          <li>Use AI-powered face recognition to find photos</li>
        </ul>
        ${emailFooter(email, "welcome")}
      `,
		});
		return data;
	} catch (error) {
		console.error("Failed to send welcome email:", error);
		throw error;
	}
};

export const sendPhotoApprovedEmail = async (
	email: string,
	albumName: string,
) => {
	const allowed = await checkEmailPreference(email, "photoApproved");
	if (!allowed) {
		console.log(
			`[EMAIL] Skipping photo approved email for ${email} - unsubscribed`,
		);
		return;
	}

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: [email],
			subject: `Your photo in ${albumName} was approved!`,
			html: `
        <p>Great news! Your photo contribution to the album <strong>${albumName}</strong> has been approved by the host and is now visible to others.</p>
        <p>Thanks for sharing!</p>
        ${emailFooter(email, "photo")}
      `,
		});
	} catch (error) {
		console.error("Failed to send photo approved email:", error);
	}
};

export const sendClusteringCompleteEmail = async (
	email: string,
	albumName: string,
) => {
	const allowed = await checkEmailPreference(email, "clustering");
	if (!allowed) {
		console.log(
			`[EMAIL] Skipping clustering email for ${email} - unsubscribed`,
		);
		return;
	}

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: [email],
			subject: `Face clustering complete for ${albumName}`,
			html: `
        <p>The AI has finished organizing the faces in your album <strong>${albumName}</strong>.</p>
        <p>You can now view the organized people and name them in your dashboard.</p>
        ${emailFooter(email, "clustering")}
      `,
		});
	} catch (error) {
		console.error("Failed to send clustering complete email:", error);
	}
};

export const sendAlbumSharedEmail = async (
	email: string,
	albumName: string,
	sharedBy: string,
	token: string,
) => {
	const allowed = await checkEmailPreference(email, "albumShared");
	if (!allowed) return;

	const albumLink = `${FRONTEND_URL}/albums/${token}`;

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: [email],
			subject: `${sharedBy} shared an album with you: ${albumName}`,
			html: `
        <p>${sharedBy} has invited you to view the album <strong>${albumName}</strong>.</p>
        <p>Click the link below to view the photos:</p>
        <a href="${albumLink}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px;">View Album</a>
        ${emailFooter(email, "albumShared")}
      `,
		});
	} catch (error) {
		console.error("Failed to send album shared email:", error);
	}
};

export const sendNewPhotosEmail = async (
	email: string,
	albumName: string,
	photoCount: number,
	token: string,
) => {
	const allowed = await checkEmailPreference(email, "newPhotos");
	if (!allowed) return;

	const albumLink = `${FRONTEND_URL}/albums/${token}`;

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: [email],
			subject: `${photoCount} new photos added to ${albumName}`,
			html: `
        <p>${photoCount} new photos have been added to the album <strong>${albumName}</strong> since your last visit.</p>
        <p>Click the link below to see what's new:</p>
        <a href="${albumLink}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 6px;">See New Photos</a>
        ${emailFooter(email, "newPhotos")}
      `,
		});
	} catch (error) {
		console.error("Failed to send new photos email:", error);
	}
};
