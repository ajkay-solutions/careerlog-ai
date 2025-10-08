# WorkLog AI - UserProvider Migration Production Guide

## Overview

This guide covers the deployment of the multi-provider OAuth authentication system to production. The migration enables users to connect both Google and LinkedIn accounts to their WorkLog AI profile, with LinkedIn profile photos now displaying correctly.

## Key Improvements

- **Multi-Provider Support**: Users can connect both Google and LinkedIn to the same account
- **LinkedIn Profile Photos**: LinkedIn profile photos (190+ characters) now display correctly
- **Better Profile Management**: Profile photos are fetched from the database instead of JWT tokens
- **Robust Architecture**: UserProvider junction table for scalable multi-provider support

## Pre-Migration Checklist

### 1. Backup Current Database
```sql
-- Create a backup of the User table
CREATE TABLE "User_backup_$(date +%Y%m%d)" AS SELECT * FROM "User";
```

### 2. Verify OAuth Callback URLs
Ensure these callback URLs are added to your OAuth applications:

**Google OAuth Application**:
- Production: `https://worklog.ajkaysolutions.com/auth/google/callback`
- Development: `http://localhost:3004/auth/google/callback`

**LinkedIn OAuth Application**:
- Production: `https://worklog.ajkaysolutions.com/auth/linkedin/callback`
- Development: `http://localhost:3004/auth/linkedin/callback`

### 3. Environment Variables
Verify all environment variables are set correctly in production:
```bash
# Required OAuth credentials (same as before)
GOOGLE_CLIENT_ID=677875518045-8qa0q2msug0ngmgvkvokc5s3somaooh0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_secret
LINKEDIN_CLIENT_ID=7730ozpx4pzs6w
LINKEDIN_CLIENT_SECRET=your_linkedin_secret

# Database connections (optimized for Prisma)
DATABASE_URL="postgresql://postgres.[project]:[password]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project]:[password]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# Other required variables
JWT_SECRET=your_jwt_secret
ANTHROPIC_API_KEY=your_anthropic_key
REDIS_URL=your_redis_url
```

## Migration Process

### Step 1: Run Database Migration

Execute the migration script in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `backend/scripts/migrate-to-userprovider-production.sql`
3. Execute the script
4. Verify the output shows successful migration

**Expected Output:**
```
NOTICE: Migration completed successfully:
NOTICE:   - Users in User table: X
NOTICE:   - Provider records in UserProvider table: X
NOTICE:   - Expected ratio: 1:1 (one provider per user initially)
```

### Step 2: Deploy Backend Code

Deploy the updated backend code to your production environment (Render.com):

1. Merge the feature branch to main:
   ```bash
   git checkout main
   git merge feature/issue-4-journal-templates
   git push origin main
   ```

2. Verify the deployment in Render dashboard
3. Check the deployment logs for any errors

### Step 3: Deploy Frontend Code

Deploy the updated frontend code:

1. Frontend will auto-deploy from the main branch
2. Verify the deployment is successful
3. Check that the frontend can connect to the backend

### Step 4: Verification Testing

Test the following scenarios:

#### 4.1 Existing User Login
- Test login with existing Google accounts
- Test login with existing LinkedIn accounts
- Verify profile photos display correctly
- Verify user data is preserved

#### 4.2 New User Registration
- Test new user registration with Google
- Test new user registration with LinkedIn
- Verify profile photos are captured correctly

#### 4.3 Multi-Provider Linking
- Login with Google, then connect LinkedIn
- Login with LinkedIn, then connect Google
- Verify both providers appear in user profile
- Verify profile photo uses the best available image

#### 4.4 API Endpoints
Test these new endpoints:
```bash
# Get user profile with all providers
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://worklog.ajkaysolutions.com/api/user/profile

# Get connected providers
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://worklog.ajkaysolutions.com/api/user/providers
```

## Monitoring & Troubleshooting

### Key Metrics to Monitor

1. **Login Success Rate**: Should remain at 100%
2. **Profile Photo Display**: LinkedIn photos should now display
3. **Database Performance**: UserProvider queries should be fast (<250ms)
4. **Error Rates**: Watch for authentication errors

### Common Issues & Solutions

#### Issue: "User not found" errors
**Cause**: User data not migrated properly
**Solution**: Check migration logs, verify User table data

#### Issue: Profile photos not displaying
**Cause**: API endpoint not returning photo URLs
**Solution**: Check `/api/user/profile` endpoint response

#### Issue: LinkedIn photos still not showing
**Cause**: LinkedIn OAuth scope or API changes
**Solution**: Verify LinkedIn OAuth configuration and scopes

#### Issue: Slow authentication
**Cause**: Database queries not optimized
**Solution**: Check UserProvider table indexes

### Rollback Procedure

If critical issues occur, use the rollback script:

1. Execute `backend/scripts/rollback-userprovider-production.sql` in Supabase SQL Editor
2. Deploy the previous version of the backend code
3. Verify that single-provider authentication works
4. Investigate issues before re-attempting migration

## Post-Migration Tasks

### 1. User Communication
Consider notifying users about the new multi-provider support:
- LinkedIn profile photos now display correctly
- Users can connect multiple OAuth providers
- Enhanced profile management

### 2. Documentation Updates
Update any internal documentation to reflect:
- New database schema with UserProvider table
- New API endpoints for user profile management
- Multi-provider authentication flow

### 3. Performance Monitoring
Monitor these metrics for the first 24-48 hours:
- Authentication success rates
- API response times
- Database connection pool usage
- User satisfaction with profile photos

## Technical Architecture Changes

### Database Schema
- **New Table**: `UserProvider` - stores OAuth provider data per user
- **Preserved**: `User` table - maintains backward compatibility
- **Indexes**: Optimized for multi-provider queries
- **RLS Policies**: Secure access to provider data

### Authentication Flow
1. User authenticates with OAuth provider
2. Backend creates/updates User record
3. Backend creates/updates UserProvider record
4. JWT contains basic user info
5. Profile photo fetched from UserProvider table via API

### API Changes
- **New**: `GET /api/user/profile` - complete user profile with providers
- **New**: `GET /api/user/providers` - list connected providers
- **New**: `DELETE /api/user/providers/:provider` - disconnect provider
- **Enhanced**: Frontend fetches profile data from API instead of JWT

## Success Criteria

The migration is successful when:
- [ ] All existing users can login successfully
- [ ] LinkedIn profile photos display correctly
- [ ] New users can register with either provider
- [ ] Users can connect multiple providers
- [ ] No increase in authentication errors
- [ ] Database performance remains optimal
- [ ] All tests pass in production environment

## Support & Contact

If issues occur during migration:
1. Check Supabase dashboard for database errors
2. Check Render logs for backend errors
3. Use browser dev tools to check frontend errors
4. Refer to rollback procedure if needed

The migration introduces significant improvements to user authentication and profile management while maintaining backward compatibility with existing user data.