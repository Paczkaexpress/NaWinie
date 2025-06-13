# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for the Na Winie application.

## Prerequisites

1. A Supabase account ([create one here](https://supabase.com))
2. A Supabase project

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - Name: `na-winie` (or your preferred name)
   - Database Password: (generate a strong password)
   - Region: Choose the closest to your users

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon (public) key** (starts with `eyJ...`)

## Step 3: Configure Environment Variables

Create a `.env` file in your project root with the following content:

```env
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace the values with your actual Supabase project URL and anon key.

## Step 4: Configure Authentication in Supabase

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following settings:

### Site URL
Set your site URL to where your application will be hosted:
- For development: `http://localhost:4321`
- For production: `https://your-domain.com`

### Additional Redirect URLs
Add any additional URLs where users can be redirected after authentication:
- `http://localhost:4321/auth`
- `https://your-domain.com/auth`

### Email Templates (Optional)
You can customize the email templates for:
- Confirm signup
- Reset password
- Magic link

## Step 5: Database Schema (Optional)

The authentication system uses Supabase's built-in `auth.users` table. If you want to extend user profiles, you can create a `profiles` table:

```sql
-- Create a profiles table that references auth.users
create table profiles (
  id uuid references auth.users(id) primary key,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Create policy for users to read their own profile
create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

-- Create policy for users to update their own profile
create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Create a trigger to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Step 6: Test the Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:4321`
3. Click the "Zaloguj się" (Login) button
4. Try creating a new account
5. Check your email for the confirmation link
6. Try logging in with your credentials

## Step 7: Email Configuration (Production)

For production, you should configure a custom SMTP provider:

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your SMTP provider (e.g., SendGrid, Mailgun, etc.)
3. Test the email functionality

## Features Included

The authentication system includes:

- ✅ User registration with email confirmation
- ✅ User login/logout
- ✅ Password reset functionality
- ✅ Session management
- ✅ Protected routes
- ✅ Real-time auth state updates
- ✅ Responsive UI matching your app's design

## Security Features

- Row Level Security (RLS) policies
- JWT token-based authentication
- Secure session management
- Email verification
- Password strength validation
- Rate limiting (built into Supabase)

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check that your environment variables are correct
2. **"Email not confirmed"**: Users need to confirm their email before logging in
3. **Redirect issues**: Make sure your redirect URLs are configured in Supabase settings
4. **CORS errors**: Ensure your domain is added to the allowed origins in Supabase

### Debug Authentication State:

You can add this to any component to debug authentication:

```typescript
import { supabase } from '../lib/supabaseClient';

// Check current session
const checkSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Session:', session);
  console.log('Error:', error);
};
```

## Next Steps

Once authentication is working:

1. Add user profiles and preferences
2. Implement role-based access control
3. Add social login providers (Google, GitHub, etc.)
4. Set up user analytics and monitoring
5. Configure email templates to match your brand

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Discord Community](https://discord.supabase.com/) 