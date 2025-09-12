/**
 * Database Services - Export all database service classes
 * Provides easy imports for database operations
 */

export { SessionService } from "./sessionService";
export { UserService } from "./userService";

import { SessionService } from "./sessionService";
// Create singleton instances for convenience
import { UserService } from "./userService";

export const userService = new UserService();
export const sessionService = new SessionService();
