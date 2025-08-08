# Local PostgreSQL Migration Guide

This guide shows how to migrate from Supabase database to local PostgreSQL while keeping Supabase auth (including MFA).

## What This Migration Does

### Keeps with Supabase:
- ✅ Authentication (login/logout/signup) 
- ✅ Multi-factor authentication (MFA)
- ✅ Email verification
- ✅ Password reset
- ✅ JWT token generation
- ✅ Session management

### Moves to Local PostgreSQL:
- 📦 `users` table (profile data: name, surname, profile_picture_url)
- 📦 `accounts` table 
- 📦 User profile operations

## Setup Instructions

### 1. Start Local PostgreSQL

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Verify it's running
docker ps
```

### 2. Initialize Database

The database will be automatically initialized with the migration script in `migrations/001_create_users_table.sql`.

### 3. Update Backend Configuration

The `appsettings.json` has been updated to use local PostgreSQL:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=pocketbank;Username=postgres;Password=pocketbanklocal;Port=5432"
}
```

### 4. Set Up Supabase Webhook (Option 1 - Recommended)

#### Step A: Configure Webhook in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Database > Webhooks**
3. Click **Create a new hook**
4. Configure:
   - **Name**: `user-sync-webhook`
   - **Table**: `auth.users`
   - **Events**: `INSERT`, `UPDATE`
   - **Type**: `HTTP Request`
   - **HTTP Method**: `POST`
   - **URL**: `https://your-backend-url.com/api/webhook/supabase-auth`
   - **HTTP Headers**:
     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer your-webhook-secret"
     }
     ```

#### Step B: Test Webhook

1. Start your .NET backend: `dotnet run`
2. Create a new user in your app
3. Check the logs - you should see webhook processing messages

### 5. Alternative: Manual Sync (Option 2)

If webhooks don't work, you can manually sync existing users:

```csharp
// Add this endpoint to your UserController for one-time migration
[HttpPost("migrate-from-supabase")]
public async Task<IActionResult> MigrateFromSupabase()
{
    // This would require querying Supabase auth users
    // and calling CreateOrUpdateUserFromAuthAsync for each
}
```

## How It Works

### User Registration Flow:
1. User signs up using Supabase auth (frontend: `supabase.auth.signUp()`)
2. Supabase sends email verification
3. User clicks verification link
4. **Webhook triggers** → calls your backend `/api/webhook/supabase-auth`
5. Backend creates user in local PostgreSQL with random account

### User Login Flow:
1. User logs in using Supabase auth (frontend: `supabase.auth.signInWithPassword()`)
2. Supabase returns JWT token
3. Frontend makes API calls with JWT token
4. Backend validates JWT with Supabase and queries local PostgreSQL for user data

### Profile Updates:
1. User updates profile in your app
2. Frontend calls your backend API
3. Backend updates local PostgreSQL (not Supabase)
4. Auth data (email, password) stays in Supabase

## Benefits

✅ **Keep all Supabase auth features**: MFA, social login, email verification, etc.
✅ **Reduce Supabase dependency**: User data stored locally  
✅ **Better control**: Full ownership of user profile data
✅ **Cost optimization**: Reduce Supabase database usage
✅ **Gradual migration**: Can migrate piece by piece

## Testing

### 1. Test Local Database
```bash
# Connect to local PostgreSQL
docker exec -it pocketbank_postgres psql -U postgres -d pocketbank

# Check tables
\dt

# Check users
SELECT * FROM users;

# Check accounts  
SELECT * FROM accounts;
```

### 2. Test Auth Integration
1. Start local PostgreSQL: `docker-compose up -d`
2. Start backend: `dotnet run`
3. Start frontend: `npm run dev`
4. Register new user and verify webhook creates local user
5. Login and check profile loads from local DB
6. Update profile and verify it saves to local DB

### 3. Test MFA (if enabled)
1. Enable MFA in Supabase dashboard
2. User enables MFA in your app  
3. Verify MFA still works with local user data

## Rollback Plan

If you need to rollback:

1. **Stop using webhooks**: Disable the webhook in Supabase dashboard
2. **Switch connection string back**: Update `appsettings.json` to use Supabase connection
3. **Update UserService**: Remove the webhook handling code
4. **Keep auth unchanged**: Supabase auth continues working

## Security Notes

- **JWT Validation**: Backend still validates tokens with Supabase
- **Data Separation**: Auth data (passwords) stays in Supabase, profile data in local DB
- **Webhook Security**: Use webhook secrets to verify requests from Supabase
- **Connection Security**: Use strong passwords for local PostgreSQL

## Monitoring

Monitor these logs:
- Webhook processing success/failures
- User creation/update operations  
- Database connection issues
- JWT validation errors

## Next Steps

After migration:
1. Monitor webhook reliability
2. Set up database backups for local PostgreSQL
3. Consider adding database migrations system
4. Optimize queries with indexes as needed
5. Set up database monitoring/alerting