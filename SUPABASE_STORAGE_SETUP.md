# Supabase Storage Setup for Profile Pictures

## Required Setup Steps

### 1. Create Storage Bucket
In your Supabase Dashboard:
1. Go to Storage section
2. Click "Create Bucket"
3. Name: `profile-pictures`
4. Set as Public bucket
5. Click "Create bucket"

### 2. Set Up Storage Policies
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public access to view profile pictures
CREATE POLICY "Profile pictures are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 3. Database Schema Update
Add the profile picture column with a default value:

```sql
-- Add the column with default avatar
ALTER TABLE users ADD COLUMN profile_picture_url TEXT 
DEFAULT 'https://ui-avatars.com/api/?name=User&background=4a7c59&color=fff&size=200';

-- Update existing users to use the default avatar (if any exist)
UPDATE users 
SET profile_picture_url = DEFAULT 
WHERE profile_picture_url IS NULL;
```

**Note:** No trigger update needed - the database default value handles new users automatically.

### 4. Backend Configuration
Update your backend's `appsettings.json` with the correct database password and run:

```bash
dotnet restore
```

## Features Implemented

### Frontend Components
- **EditProfile.tsx**: Complete profile editing form with image upload
- **Dashboard.tsx**: Enhanced to show profile pictures and edit button
- **Avatar components**: Fallback to initials when no picture is set

### Backend API
- **GET /api/account/profile**: Returns complete user profile including picture
- **PUT /api/account/profile**: Updates user profile including picture URL

### Default Profile Pictures
- New users automatically get a generated avatar using their initials
- Uses ui-avatars.com service with the app's green theme (#4a7c59)

### File Upload Features
- Image validation (type and size checking)
- Unique filename generation
- Automatic cleanup of old pictures
- Progress indicators and error handling

## Usage
1. Users sign up and get a default avatar with their initials
2. From the dashboard, click "Edit" next to their profile
3. Upload a new profile picture and/or edit name/surname
4. Changes are saved to both database and displayed immediately

## Security
- Storage policies ensure users can only modify their own pictures
- File type validation prevents non-image uploads
- Size limits prevent large file uploads
- Authentication required for all profile operations