import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../lib/prisma";
import { config } from "./index";
import { sendWelcomeEmail } from "../lib/email";

export async function verifyGoogleUser(
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: (err: any, user?: any) => void
) {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error("No email found in Google profile"));
    }

    // 1. Look up user by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id },
    });

    if (user) {
      return done(null, user);
    }

    // 2. Look up user by email
    user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user) {
      // Link account
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.id,
          emailVerified: true, // Google already verified this email
        },
      });
      return done(null, user);
    }

    // 3. Create new user
    user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        fullName: profile.displayName || "Google User",
        googleId: profile.id,
        emailVerified: true,
        profile: {
          create: {},
        },
      },
    });

    // Send welcome email asynchronously
    try {
      await sendWelcomeEmail(user.email, user.fullName);
    } catch (emailError) {
      console.error("Failed to send welcome email to Google user:", emailError);
    }

    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: "http://localhost:3001/api/v1/auth/oauth/google/callback",
    },
    verifyGoogleUser
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});
