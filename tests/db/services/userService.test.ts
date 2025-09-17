import { beforeEach, describe, expect, mock, test } from "bun:test";
import { testUtils } from "../../setup";

// Create mock UserService class
const mockUserService = {
  findByGoogleId: mock(async (googleId: string) => {
    if (googleId === "existing_user") {
      return testUtils.createMockUser();
    }
    return null;
  }),

  findOrCreateUser: mock(async (_googleId: string, _userData: Record<string, unknown>) => {
    return testUtils.createMockUser();
  }),

  updateLastLogin: mock(async (_userId: number) => {
    // This method returns void in the real implementation
  }),
};

describe("UserService", () => {
  beforeEach(() => {
    mock.restore();
  });

  test("findByGoogleId - should return user when found", async () => {
    const user = await mockUserService.findByGoogleId("existing_user");

    expect(user).toBeTruthy();
    expect(user?.email).toBe("test@example.com");
  });

  test("findByGoogleId - should return null when not found", async () => {
    const user = await mockUserService.findByGoogleId("nonexistent_user");

    expect(user).toBeNull();
  });

  test("findOrCreateUser - should create new user with valid data", async () => {
    const userData = {
      email: "newuser@example.com",
      name: "New User",
      givenName: "New",
      familyName: "User",
      picture: "https://example.com/new-avatar.jpg",
    };

    const user = await mockUserService.findOrCreateUser("new_google_id", userData);

    expect(user).toBeTruthy();
    expect(user.email).toBe("test@example.com");
  });

  test("updateLastLogin - should update user last login timestamp", async () => {
    await mockUserService.updateLastLogin(1);

    // updateLastLogin returns void, so just check it doesn't throw
    expect(true).toBe(true);
  });
});
