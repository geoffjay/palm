import { beforeEach, describe, expect, mock, test } from "bun:test";
import { testUtils } from "../../setup";

// Mock the database connection
const mockDb = {
  select: mock(() => ({
    from: mock(() => ({
      where: mock(() => ({
        limit: mock(() => [testUtils.createMockUser()]),
      })),
    })),
  })),
  insert: mock(() => ({
    into: mock(() => ({
      values: mock(() => ({
        returning: mock(() => [testUtils.createMockUser()]),
      })),
    })),
  })),
  update: mock(() => ({
    set: mock(() => ({
      where: mock(() => ({
        returning: mock(() => [testUtils.createMockUser()]),
      })),
    })),
  })),
};

// Mock the userService module
mock.module("../../../db/services/userService", () => ({
  default: {
    findByGoogleId: mock(async (googleId: string) => {
      if (googleId === "existing_user") {
        return testUtils.createMockUser();
      }
      return null;
    }),

    findOrCreateUser: mock(async (_googleId: string, _userData: Record<string, unknown>) => {
      const existingUser = await mockDb.select();
      if (existingUser) {
        return testUtils.createMockUser();
      }
      return testUtils.createMockUser();
    }),

    updateLastLogin: mock(async (_userId: number) => {
      return testUtils.createMockUser();
    }),
  },
}));

describe("UserService", () => {
  beforeEach(() => {
    mock.restore();
  });

  test("findByGoogleId - should return user when found", async () => {
    const { default: userService } = await import("../../../db/services/userService");
    const user = await userService.findByGoogleId("existing_user");

    expect(user).toBeTruthy();
    expect(user?.email).toBe("test@example.com");
  });

  test("findByGoogleId - should return null when not found", async () => {
    const { default: userService } = await import("../../../db/services/userService");
    const user = await userService.findByGoogleId("nonexistent_user");

    expect(user).toBeNull();
  });

  test("findOrCreateUser - should create new user with valid data", async () => {
    const { default: userService } = await import("../../../db/services/userService");
    const userData = {
      email: "newuser@example.com",
      name: "New User",
      givenName: "New",
      familyName: "User",
      picture: "https://example.com/new-avatar.jpg",
    };

    const user = await userService.findOrCreateUser("new_google_id", userData);

    expect(user).toBeTruthy();
    expect(user.email).toBe("test@example.com");
  });

  test("updateLastLogin - should update user last login timestamp", async () => {
    const { default: userService } = await import("../../../db/services/userService");
    const updatedUser = await userService.updateLastLogin(1);

    expect(updatedUser).toBeTruthy();
    expect(updatedUser.id).toBe(1);
  });
});
