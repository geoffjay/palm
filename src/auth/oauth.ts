/**
 * Google OAuth implementation using Bun's native APIs
 */

import { jwtVerify, createRemoteJWKSet } from "jose";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class GoogleOAuth {
  private config: OAuthConfig;
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID environment variable is required");
    }
    if (!clientSecret) {
      throw new Error("GOOGLE_CLIENT_SECRET environment variable is required");
    }

    this.config = {
      clientId,
      clientSecret,
      redirectUri: `${process.env.BASE_URL}/auth/google/callback`,
      scopes: ["openid", "email", "profile"],
    };

    // Validate required environment variables
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error("Missing required Google OAuth environment variables");
    }

    // Initialize JWKS for JWT verification
    this.jwks = createRemoteJWKSet(
      new URL("https://www.googleapis.com/oauth2/v3/certs")
    );
  }

  /**
   * Generate the authorization URL for Google OAuth
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: this.config.scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
    });

    if (state) {
      params.set("state", state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const tokenUrl = "https://oauth2.googleapis.com/token";

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    return (await response.json()) as GoogleTokenResponse;
  }

  /**
   * Get user information from Google using access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    return (await response.json()) as GoogleUserInfo;
  }

  /**
   * Verify and decode Google ID token with cryptographic signature verification
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const { payload } = await jwtVerify(idToken, this.jwks, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: this.config.clientId,
      });

      return {
        id: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string,
        picture: payload.picture as string,
        given_name: payload.given_name as string,
        family_name: payload.family_name as string,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid ID token: ${error.message}`);
      }
      throw new Error("Invalid ID token");
    }
  }
}
