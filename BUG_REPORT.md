# Comprehensive Bug Report - Kanban Board Application

**Date:** 2025-10-30
**Reviewer:** Claude Code
**Scope:** Full application security and functionality audit

---

## Executive Summary

This report documents **18 bugs** found during a thorough security and functionality review of the Kanban board application. Issues range from critical security vulnerabilities to data integrity problems and potential memory leaks.

**Severity Breakdown:**
- **Critical:** 5 bugs
- **High:** 6 bugs
- **Medium:** 5 bugs
- **Low:** 2 bugs

---

## Critical Severity Bugs

### 1. Self-Role Modification Vulnerability
**Location:** `src/server/services/board.service.ts:435-482`
**Severity:** CRITICAL

**Description:**
The `updateBoardMemberRole` function lacks a check to prevent users from modifying their own role. While `addBoardMember` (line 396-398) correctly prevents self-modification, this protection is missing in the update function.

**Impact:**
A malicious user could escalate their own privileges to owner/admin, bypassing the permission system entirely.

**Code Reference:**
```typescript
// src/server/services/board.service.ts:435
export async function updateBoardMemberRole(
  boardId: string,
  memberId: string,
  actorId: string,
  role: BoardRole,
): Promise<BoardMemberInfo> {
  // Missing: if (memberId === actorId) check
```

**Recommendation:**
Add a self-modification check:
```typescript
if (memberId === actorId) {
  throw new ServiceError("Cannot modify your own role", 400, "BOARD_MEMBER_SELF_MODIFY");
}
```

---

### 2. Duplicate Cards Preserve Original Ownership
**Location:** `src/server/services/card.service.ts:328-372`
**Severity:** CRITICAL

**Description:**
When duplicating a board, the `duplicateCards` function copies cards with the original `createdBy`, `createdAt`, and `updatedAt` values instead of setting them to the current user and timestamp.

**Impact:**
- Incorrect audit trail
- Attribution to wrong users
- Potential authorization bypass scenarios
- Database integrity violations

**Code Reference:**
```typescript
// src/server/services/card.service.ts:360-369
await db.insert(cards).values(
  sourceCards.map((card) => ({
    columnId: targetColumnId,
    title: card.title,
    description: card.description,
    position: card.position,
    createdBy: card.createdBy,  // BUG: Should be current user
    createdAt: card.createdAt,  // BUG: Should be new Date()
    updatedAt: card.updatedAt,  // BUG: Should be new Date()
  })),
);
```

**Recommendation:**
Pass userId to the function and use current timestamp:
```typescript
createdBy: userId,
// createdAt will use default sql`(unixepoch())`
// updatedAt will use default sql`(unixepoch())`
```

---

### 3. Race Condition in Card Movement
**Location:** `src/server/services/card.service.ts:201-257`
**Severity:** CRITICAL

**Description:**
The `moveCard` function calls `calculatePosition` which rebalances ALL card positions in the target column. When multiple cards are moved simultaneously (e.g., by different users or rapid drag-drop), this causes race conditions.

**Impact:**
- Cards can end up in wrong positions
- Position values can become corrupted
- Data inconsistency across concurrent users
- Lost card movements

**Code Flow:**
1. User A starts moving card 1 to position 2
2. User B starts moving card 2 to position 3
3. Both read the current positions
4. Both rebalance the entire column
5. One transaction overwrites the other

**Recommendation:**
Use a more robust positioning algorithm (fractional indexing) or implement pessimistic locking on the column during rebalancing operations.

---

### 4. Memory Leak in Rate Limiting
**Location:** `src/server/api/middleware/rate-limit.ts:1-84`
**Severity:** CRITICAL

**Description:**
The rate limit middleware stores request counts in a global Map that never cleans up expired entries. Over time, this will consume unbounded memory.

**Impact:**
- Memory exhaustion in long-running production servers
- Application crashes
- Performance degradation

**Code Reference:**
```typescript
// src/server/api/middleware/rate-limit.ts:15-22
const store = globalForRateLimit.apiRateLimit ?? new Map<string, RateState>();
// No cleanup mechanism for expired entries
```

**Recommendation:**
Implement periodic cleanup:
```typescript
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of store.entries()) {
    if (now - state.windowStart >= WINDOW_MS) {
      store.delete(key);
    }
  }
}, WINDOW_MS);
```

---

### 5. Duplicate Better-Auth Instance in Middleware
**Location:** `middleware.ts:8-21`
**Severity:** CRITICAL

**Description:**
The middleware creates a separate Better-Auth instance instead of importing the centralized configuration from `src/server/auth/config.ts`. This duplication can lead to configuration drift and inconsistent authentication behavior.

**Impact:**
- Configuration inconsistencies
- Potential authentication bypass
- Maintenance nightmares
- Difficult to debug auth issues

**Code Reference:**
```typescript
// middleware.ts:9
const auth = betterAuth({
  database: drizzleAdapter(db, { /* ... */ }),
  // Duplicated configuration
});
```

**Recommendation:**
Import and use the centralized auth instance:
```typescript
import { auth } from "~/server/auth/config";
```

---

## High Severity Bugs

### 6. Malformed Database Query in getUserById
**Location:** `src/server/services/user.service.ts:28-38`
**Severity:** HIGH

**Description:**
The `select` clause incorrectly wraps the table in an object, which is not the correct Drizzle ORM syntax.

**Code Reference:**
```typescript
// src/server/services/user.service.ts:30
const [row] = await db
  .select({ user })  // BUG: Should be .select() or specific columns
  .from(user)
```

**Impact:**
- Query returns unexpected structure
- Type safety violations
- Potential runtime errors

**Recommendation:**
```typescript
const [row] = await db
  .select()
  .from(user)
  .where(eq(user.id, userId))
  .limit(1);

if (!row) return null;
return mapUser(row);
```

---

### 7. Stub Role Middleware Provides No Protection
**Location:** `src/server/api/middleware/auth.ts:45-54`
**Severity:** HIGH

**Description:**
The `requireRole` middleware is a non-functional stub that doesn't check roles at all.

**Code Reference:**
```typescript
// src/server/api/middleware/auth.ts:47
export const requireRole = (role: string) => {
  return createMiddleware<AuthContext>(async (c, next) => {
    void role;  // Role parameter is completely ignored
    const user = c.get("user");
    if (!user) {
      return jsonError(c, "Unauthorized", 401);
    }
    await next();
  });
};
```

**Impact:**
- Any code relying on this middleware has NO role-based protection
- False sense of security

**Recommendation:**
Either implement proper role checking or remove this misleading function entirely.

---

### 8. No Guaranteed Owner on Board
**Location:** `src/server/services/board.service.ts:484-501`
**Severity:** HIGH

**Description:**
When removing board members, there's no check to ensure at least one owner remains. Combined with bug #1 (self-role modification), a board could end up with no owners.

**Impact:**
- Orphaned boards
- Unable to delete or manage boards
- Data integrity issues

**Recommendation:**
Before removing a member or changing their role, verify that at least one other owner will remain.

---

### 9. Missing Index Bounds Validation
**Location:** `src/server/api/routes/cards.ts:42-45`
**Severity:** HIGH

**Description:**
The `moveCardSchema` validates index as non-negative but doesn't validate the upper bound.

**Code Reference:**
```typescript
// src/server/api/routes/cards.ts:44
const moveCardSchema = z.object({
  toColumnId: z.string().min(1),
  index: z.number().int().nonnegative(),  // No max validation
});
```

**Impact:**
- Users can specify absurdly large index values (e.g., 999999999)
- Potential DoS through excessive position calculations
- Unexpected behavior in rebalancing logic

**Recommendation:**
```typescript
index: z.number().int().min(0).max(10000),
```

---

### 10. Frontend State Reversion Bug
**Location:** `src/app/(dashboard)/dashboard/boards/hooks/useBoardDragDrop.ts:133-141`
**Severity:** HIGH

**Description:**
When the move card API call fails, the code reverts to the original `columns` state captured in the closure, not the current state. This can cause state corruption if other updates happened in the meantime.

**Code Reference:**
```typescript
// useBoardDragDrop.ts:136
.catch((error) => {
  console.error("Move card error", error);
  onError(error instanceof Error ? error.message : "Failed to move card");
  setColumns(columns);  // BUG: This is the closure value, not current state
})
```

**Impact:**
- Lost updates from concurrent operations
- UI state inconsistency
- User confusion

**Recommendation:**
```typescript
setColumns(prev => {
  // Revert the specific card move, not the entire state
  return revertCardMove(prev, cardId, sourceColumnId);
});
```

---

### 11. No Position Uniqueness Constraint
**Location:** `src/server/db/schema.ts:205-233`
**Severity:** HIGH

**Description:**
While positions are indexed, there's no unique constraint ensuring cards/columns have unique positions within their parent. Multiple items could have the same position value.

**Impact:**
- Ambiguous ordering
- Unpredictable drag-drop behavior
- Difficult to debug ordering issues

**Recommendation:**
Add a composite unique index on (boardId, position) for columns and (columnId, position) for cards.

---

## Medium Severity Bugs

### 12. Validation Inconsistency for Column Names
**Location:** `src/server/api/routes/columns.ts:35` vs `src/server/services/column.service.ts:80`
**Severity:** MEDIUM

**Description:**
API validation uses `.min(1).max(100)` while service layer checks `trimmed.length === 0 || trimmed.length > 100`.

**Impact:**
- Subtle validation bypass possibilities
- Inconsistent error messages
- Maintenance confusion

**Recommendation:**
Standardize on one validation approach, preferably at the API layer with Zod.

---

### 13. No CSRF Protection
**Location:** `src/server/api/index.ts`
**Severity:** MEDIUM

**Description:**
The API relies solely on cookie-based authentication without CSRF token validation.

**Impact:**
- Vulnerable to Cross-Site Request Forgery attacks
- Users could be tricked into performing unintended actions

**Recommendation:**
Implement CSRF token validation for state-changing operations (POST, PUT, DELETE, PATCH).

---

### 14. Missing Transaction Error Handling
**Location:** Multiple locations using `db.transaction()`
**Severity:** MEDIUM

**Description:**
Transaction blocks don't have explicit error handling or rollback logic. Relies on implicit behavior.

**Example:**
```typescript
// src/server/services/board.service.ts:306
const newBoardId = await db.transaction(async (tx) => {
  // Multiple operations without try/catch
});
```

**Impact:**
- Partial writes on error
- Inconsistent state
- Difficult to debug transaction failures

**Recommendation:**
Add explicit error handling and logging in transaction blocks.

---

### 15. Weak Password Requirements
**Location:** `src/lib/validations/auth.ts:11-14`
**Severity:** MEDIUM

**Description:**
Password validation only requires 8 characters minimum with no complexity requirements.

**Code Reference:**
```typescript
password: z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters"),
```

**Impact:**
- Weak passwords like "password" or "12345678" are accepted
- Increased risk of brute force attacks
- Compromised accounts

**Recommendation:**
Add complexity requirements (uppercase, lowercase, numbers, special characters).

---

### 16. No Email Validation Before Adding Board Members
**Location:** `src/server/services/board.service.ts:382-433`
**Severity:** MEDIUM

**Description:**
The `addBoardMember` function checks if the user exists but doesn't validate the email format or prevent adding non-existent users with invalid IDs.

**Impact:**
- Potential for invalid data
- Unclear error messages to users

**Recommendation:**
Add email format validation and provide clearer error messages.

---

## Low Severity Bugs

### 17. Unused Import in Error Handler
**Location:** `src/server/api/middleware/error-handler.ts`
**Severity:** LOW

**Description:**
The error handler imports but doesn't use all necessary types, and error logging could be more detailed.

**Recommendation:**
Enhance error logging with request context, user information, and stack traces in development.

---

### 18. Missing Accessibility Attributes
**Location:** `src/app/(dashboard)/dashboard/boards/components/board-columns.tsx`
**Severity:** LOW

**Description:**
Drag-and-drop interface lacks proper ARIA labels and keyboard navigation support.

**Impact:**
- Inaccessible to screen reader users
- Cannot be used without a mouse
- WCAG compliance violations

**Recommendation:**
Add ARIA labels, roles, and implement keyboard navigation for drag-drop operations.

---

## Security Recommendations

1. **Implement rate limiting cleanup** to prevent memory leaks
2. **Add CSRF token validation** for all state-changing operations
3. **Strengthen password requirements** with complexity rules
4. **Add audit logging** for permission changes and sensitive operations
5. **Implement database query timeouts** to prevent DoS
6. **Add input sanitization** for all user-provided text fields
7. **Use prepared statements verification** - audit all raw SQL queries

---

## Testing Recommendations

1. Write integration tests for concurrent card movements
2. Add unit tests for permission checking logic
3. Test board duplication with various permission levels
4. Load test rate limiting to verify memory usage
5. Security test for privilege escalation scenarios
6. Test accessibility with screen readers

---

## Priority Fix Order

1. **Immediate (Days 1-2):**
   - Bug #1: Self-role modification vulnerability
   - Bug #3: Race condition in card movement
   - Bug #4: Memory leak in rate limiting

2. **Short-term (Week 1):**
   - Bug #2: Duplicate cards ownership
   - Bug #5: Duplicate auth instance
   - Bug #6: Malformed database query
   - Bug #8: No guaranteed owner

3. **Medium-term (Weeks 2-3):**
   - Remaining high and medium severity bugs
   - CSRF protection
   - Password strength requirements

4. **Long-term (Month 1):**
   - Low severity bugs
   - Accessibility improvements
   - Comprehensive test suite

---

## Conclusion

The application has a solid foundation but contains several critical security vulnerabilities that must be addressed before production deployment. The most concerning issues are around permission management, data integrity during concurrent operations, and resource management.

All critical and high severity bugs should be fixed before deploying to production. Medium severity bugs should be addressed in the first maintenance cycle.

**Estimated Fix Effort:** 3-5 developer days for critical bugs, 1-2 weeks for comprehensive fixes.
