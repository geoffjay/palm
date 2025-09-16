/**
 * Database Services - Export all database service classes
 * Provides easy imports for database operations
 */

export { BiometricService } from "./biometricService";
export { SessionService } from "./sessionService";
export { UserService } from "./userService";

import { BiometricService } from "./biometricService";
import { SessionService } from "./sessionService";
import { UserService } from "./userService";

// Create singleton instances for convenience
export const userService = new UserService();
export const sessionService = new SessionService();
export const biometricService = new BiometricService();
