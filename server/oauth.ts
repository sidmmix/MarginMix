import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

// Initialize OAuth strategies
export function initializeOAuthStrategies() {
  // Configure Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Configuring Google OAuth strategy");
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"), false);
        }

        let user = await storage.getUserByEmail(email);
        
        if (user) {
          // Link Google account to existing user
          user = await storage.updateUser(user.id, {
            authProvider: "google",
          });
        } else {
          // Create new user
          user = await storage.createUser({
            email,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            authProvider: "google",
            consentGiven: true,
          });
        }

        // Auto-generate briefs for recent completed sessions
        // This handles the case where users complete questionnaire then immediately log in
        try {
          // For now, check the specific session that was just completed based on recent activity
          // In a production app, we'd track the session ID in the OAuth state parameter
          
          // Check the most recent completed session (likely the one they just finished)
          const { db } = await import("./db");
          const { conversationSessions } = await import("@shared/schema");
          const { eq, gte, and, desc } = await import("drizzle-orm");
          
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
          const recentSessions = await db
            .select()
            .from(conversationSessions)
            .where(
              and(
                eq(conversationSessions.isCompleted, "true"),
                gte(conversationSessions.updatedAt, thirtyMinutesAgo)
              )
            )
            .orderBy(desc(conversationSessions.updatedAt))
            .limit(5); // Check last 5 sessions to be safe

          // Generate briefs for completed sessions that don't have them yet
          for (const session of recentSessions) {
            const completedSession = await storage.getCompletedSessionWithoutBrief(session.id);
            if (completedSession) {
              console.log(`Auto-generating brief for session ${session.id} after user login`);
              await storage.generateAndSaveBrief(session.id, user.id);
            }
          }
        } catch (briefError) {
          console.error("Error auto-generating briefs during login:", briefError);
          // Don't fail the login process if brief generation fails
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }));
  } else {
    console.log("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }

}

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export function setupOAuth(app: Express) {
  // Initialize OAuth strategies
  initializeOAuthStrategies();
  
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes
  app.get("/api/auth/google", (req, res, next) => {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
    } else {
      res.status(501).json({ message: "Google OAuth not configured - missing environment variables" });
    }
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      passport.authenticate("google", { 
        failureRedirect: "/auth?error=google_auth_failed",
        successRedirect: "/dashboard"
      })(req, res, next);
    } else {
      res.redirect("/auth?error=google_not_configured");
    }
  });


  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      req.session?.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Error destroying session" });
        }
        res.json({ message: "Logged out successfully" });
      });
    });
  });
}