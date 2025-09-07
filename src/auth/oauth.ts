/**
 * Google OAuth implementation using Bun's native APIs
 */

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

  constructor() {
    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.BASE_URL}/auth/google/callback`,
      scopes: ["openid", "email", "profile"],
    };

    // Validate required environment variables
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error("Missing required Google OAuth environment variables");
    }
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
   * Verify and decode Google ID token (basic verification)
   */
  async verifyIdToken(idToken: string): Promise<any> {
    // For production, you should use a proper JWT library or Google's verification
    // This is a simplified implementation
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid ID token format");
    }

    try {
      const payload = JSON.parse(atob(parts[1]));

      // Basic validation
      if (payload.aud !== this.config.clientId) {
        throw new Error("Invalid audience");
      }

      if (payload.exp < Date.now() / 1000) {
        throw new Error("Token expired");
      }

      return payload;
    } catch (error) {
      throw new Error(`Failed to verify ID token: ${error}`);
    }
  }
}
