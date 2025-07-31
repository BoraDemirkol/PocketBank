# Supabase Storage Policies for Profile Pictures

## Issue
When uploading profile pictures, you may encounter this error:
```
403 Unauthorized: new row violates row-level security policy
```

This happens because the storage bucket needs proper Row Level Security (RLS) policies.

## Solution

Run one of the following SQL scripts in your **Supabase SQL Editor** to fix the upload issue.

---

## Option 1: Simple Policies (Less Secure)

**Use this if you want to get uploads working quickly:**

```sql
-- Drop any existing policies
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- Create simple policies that allow all operations
CREATE POLICY "Anyone can upload to profile-pictures bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "Anyone can view profile-pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Anyone can update profile-pictures" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-pictures');

CREATE POLICY "Anyone can delete profile-pictures" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-pictures');
```

---

## Option 2: Secure Policies (Recommended)

**Use this for better security - only authenticated users can upload:**

```sql
-- Drop any existing policies
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- Create secure policies for authenticated users
CREATE POLICY "Authenticated users can upload profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Authenticated users can update profile pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pictures' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete profile pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pictures' AND 
    auth.role() = 'authenticated'
  );
```

---

## Option 3: Most Secure Policies (Advanced)

**Use this if you want users to only manage their own files:**

```sql
-- Drop any existing policies
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- Create policies that restrict users to their own files
-- Note: This requires the filename to start with the user's ID
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' AND 
    auth.role() = 'authenticated' AND
    (name LIKE auth.uid()::text || '%')
  );

CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pictures' AND 
    auth.role() = 'authenticated' AND
    (name LIKE auth.uid()::text || '%')
  );

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pictures' AND 
    auth.role() = 'authenticated' AND
    (name LIKE auth.uid()::text || '%')
  );
```

---

## How to Apply

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste one of the SQL scripts above**
4. **Click "Run"**
5. **Test profile picture upload in your app**

---

## Verification

After applying the policies, you should be able to:
- ✅ Upload profile pictures without getting 403 errors
- ✅ See uploaded files in the `profile-pictures` bucket
- ✅ View profile pictures in your application

---

## Troubleshooting

**If uploads still fail:**

1. **Check bucket exists**: Make sure `profile-pictures` bucket is created and public
2. **Check bucket policies**: Verify the policies were applied by running:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects';
   ```
3. **Check authentication**: Ensure user is properly signed in
4. **Check browser console**: Look for detailed error messages

---

## Security Notes

- **Option 1**: Least secure, anyone can upload/modify files
- **Option 2**: Moderate security, only authenticated users can upload
- **Option 3**: Most secure, users can only manage their own files (requires filename convention)

Choose the option that best fits your security requirements.