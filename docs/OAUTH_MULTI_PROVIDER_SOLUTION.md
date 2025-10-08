# OAuth Multi-Provider Solution

## Problem Statement
Currently, when a user with the same email (e.g., `arsalan.jehangir@gmail.com`) logs in via different OAuth providers (Google and LinkedIn), the system overwrites the provider information instead of maintaining both connections.

## Current Database Schema Issues
```prisma
model User {
  id           String   @id
  email        String   @unique
  provider     String   // ← Only one provider stored
  providerId   String   // ← Only one provider ID stored
  // ...other fields
}
```

## Proposed Solution: UserProvider Junction Table

### 1. New Database Schema
```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  displayName  String?
  profilePhoto String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime
  lastLoginAt  DateTime?
  
  // Relations
  providers    UserProvider[]
  Entry        Entry[]
  Project      Project[]
  // ...other relations
}

model UserProvider {
  id          String   @id @default(cuid())
  userId      String
  provider    String   // 'google' | 'linkedin' | 'github' etc.
  providerId  String   // Provider-specific user ID
  accessToken String?  // Optional: store for API calls
  refreshToken String? // Optional: for token refresh
  profileData Json?    // Store provider-specific profile data
  createdAt   DateTime @default(now())
  updatedAt   DateTime
  lastUsed    DateTime @default(now())
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerId])
  @@unique([userId, provider])
  @@index([userId])
  @@index([provider])
}
```

### 2. Benefits
- ✅ **Single User Identity**: One user record per unique email
- ✅ **Multiple Login Methods**: User can login via Google OR LinkedIn
- ✅ **Provider-Specific Data**: Store profile photos, names from each provider
- ✅ **Audit Trail**: Track when each provider was last used
- ✅ **Future Extensibility**: Easy to add GitHub, Microsoft, etc.
- ✅ **No Data Loss**: Never lose OAuth connections

### 3. Authentication Flow
```
1. User logs in via Google:
   - Find User by email → Create if not exists
   - Find UserProvider(userId, 'google') → Create if not exists
   - Update lastUsed timestamp
   - Generate JWT with consolidated user data

2. Same user logs in via LinkedIn:
   - Find User by email → User already exists
   - Find UserProvider(userId, 'linkedin') → Create if not exists  
   - Update lastUsed timestamp
   - Generate JWT with consolidated user data

Result: User has TWO UserProvider records, can login via either
```

### 4. Data Consolidation Strategy
When multiple providers exist for same user:
- **Display Name**: Use most recently updated provider
- **Profile Photo**: Prefer provider with best quality (LinkedIn > Google)
- **Email**: Always use the canonical email from User table
- **Login Method**: JWT indicates which provider was used for current session

### 5. Implementation Priority
**Phase 1**: Migration script for existing users
**Phase 2**: Update OAuth providers to use new schema  
**Phase 3**: Frontend UI to show connected accounts
**Phase 4**: Account unlinking functionality

## Migration Script Example
```javascript
// Convert existing User records to new UserProvider structure
const users = await prisma.user.findMany();
for (const user of users) {
  await prisma.userProvider.create({
    data: {
      userId: user.id,
      provider: user.provider,
      providerId: user.providerId,
      profileData: {
        displayName: user.displayName,
        profilePhoto: user.profilePhoto
      },
      lastUsed: user.lastLoginAt || user.createdAt
    }
  });
}
```

## Alternative Solutions Considered

### Option B: Composite Primary Key (Less Flexible)
```prisma
model User {
  email        String
  provider     String  
  providerId   String
  // ...
  @@id([email, provider]) // Multiple records per email
}
```
**Rejected**: Makes querying complex, harder to maintain relationships

### Option C: JSON Field for Providers (Less Queryable)  
```prisma
model User {
  email        String   @unique
  providers    Json     // Store all provider info as JSON
}
```
**Rejected**: No referential integrity, harder to query, no indexing

## Recommendation
Implement **Option A (UserProvider junction table)** as it provides the best balance of flexibility, data integrity, and query performance.