import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import type { Express } from "express";
import { storage } from "./storage";

// Configure Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("No email found in Google profile"), null);
      }

      // Check if user exists with this Google ID
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (!user) {
        // Check if user exists with this email
        user = await storage.getUserByEmail(email);
        
        if (user) {
          // Link Google account to existing user
          user = await storage.updateUser(user.id, {
            profileImageUrl: profile.photos?.[0]?.value,
            authProvider: "google",
          });
        } else {
          // Create new user
          user = await storage.createUser({
            email,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            profileImageUrl: profile.photos?.[0]?.value,
            authProvider: "google",
            consentGiven: true,
          });
        }
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Configure Facebook OAuth
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("No email found in Facebook profile"), null);
      }

      // Check if user exists with this Facebook ID
      let user = await storage.getUserByFacebookId(profile.id);
      
      if (!user) {
        // Check if user exists with this email
        user = await storage.getUserByEmail(email);
        
        if (user) {
          // Link Facebook account to existing user
          user = await storage.updateUser(user.id, {
            profileImageUrl: profile.photos?.[0]?.value,
            authProvider: "facebook",
          });
        } else {
          // Create new user
          user = await storage.createUser({
            email,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            profileImageUrl: profile.photos?.[0]?.value,
            authProvider: "facebook",
            consentGiven: true,
          });
        }
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
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
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes (only if strategy is configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", 
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/auth?error=google_auth_failed" }),
      (req, res) => {
        res.redirect("/dashboard");
      }
    );
  } else {
    app.get("/api/auth/google", (req, res) => {
      res.status(501).json({ message: "Google OAuth not configured - missing environment variables" });
    });
  }

  // Facebook OAuth routes (only if strategy is configured)
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    app.get("/api/auth/facebook",
      passport.authenticate("facebook", { scope: ["email"] })
    );

    app.get("/api/auth/facebook/callback",
      passport.authenticate("facebook", { failureRedirect: "/auth?error=facebook_auth_failed" }),
      (req, res) => {
        res.redirect("/dashboard");
      }
    );
  } else {
    app.get("/api/auth/facebook", (req, res) => {
      res.status(501).json({ message: "Facebook OAuth not configured - missing environment variables" });
    });
  }
}