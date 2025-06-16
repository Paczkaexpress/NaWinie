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

## Step 5: Database Schema

Set up the required database tables for the Na Winie application:

### 1. User Profiles (Optional)
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

### 2. Ingredients Table
```sql
-- Create ingredients table
create table ingredients (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  unit_type text not null check (unit_type in ('ml', 'g', 'szt')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Set up Row Level Security (RLS)
alter table ingredients enable row level security;

-- Create policy for ingredients (readable by everyone)
create policy "Ingredients are viewable by everyone" on ingredients
  for select using (true);

-- Create policy for authenticated users to insert ingredients
create policy "Authenticated users can insert ingredients" on ingredients
  for insert with check (auth.role() = 'authenticated');

-- Create indexes for better performance
create index ingredients_name_idx on ingredients(name);
create index ingredients_unit_type_idx on ingredients(unit_type);

-- Insert some sample ingredients
insert into ingredients (name, unit_type) values
  ('Jajka', 'szt'),
  ('Mleko', 'ml'),
  ('Mąka', 'g'),
  ('Pomidory', 'g'),
  ('Kurczak', 'g'),
  ('Cebula', 'szt'),
  ('Czosnek', 'szt'),
  ('Oliwa z oliwek', 'ml'),
  ('Sól', 'g'),
  ('Pieprz', 'g'),
  ('Makaron spaghetti', 'g'),
  ('Ser parmezan', 'g'),
  ('Boczek', 'g'),
  ('Mascarpone', 'g'),
  ('Ziemniaki', 'g'),
  ('Marchewka', 'g'),
  ('Papryka', 'szt'),
  ('Oliwki', 'g'),
  ('Ser feta', 'g'),
  ('Ogórek', 'szt');
```

### 3. Recipes Table
```sql
-- Create recipes table
create table recipes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  preparation_time_minutes integer not null,
  complexity_level text not null check (complexity_level in ('EASY', 'MEDIUM', 'HARD')),
  author_id uuid references auth.users(id),
  average_rating decimal(3,2) default 0,
  total_votes integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Set up Row Level Security (RLS)
alter table recipes enable row level security;

-- Create policy for recipes (readable by everyone)
create policy "Recipes are viewable by everyone" on recipes
  for select using (true);

-- Create policy for authenticated users to insert recipes
create policy "Authenticated users can insert recipes" on recipes
  for insert with check (auth.role() = 'authenticated');

-- Create policy for users to update their own recipes
create policy "Users can update their own recipes" on recipes
  for update using (auth.uid() = author_id);

-- Create indexes for better performance
create index recipes_name_idx on recipes(name);
create index recipes_author_id_idx on recipes(author_id);
create index recipes_average_rating_idx on recipes(average_rating);

-- Insert some sample recipes
insert into recipes (name, preparation_time_minutes, complexity_level, average_rating, total_votes) values
  ('Spaghetti Carbonara', 20, 'MEDIUM', 4.5, 23),
  ('Omlet z ziołami', 10, 'EASY', 4.2, 15),
  ('Kurczak w sosie curry', 35, 'MEDIUM', 4.8, 42),
  ('Sałatka grecka', 15, 'EASY', 4.3, 18);
```

### 4. Recipe Ingredients Junction Table (Advanced)
```sql
-- Create recipe_ingredients junction table
create table recipe_ingredients (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  amount decimal(10,2) not null,
  is_optional boolean default false,
  substitute_recommendation text,
  created_at timestamptz default now(),
  unique(recipe_id, ingredient_id)
);

-- Set up Row Level Security (RLS)
alter table recipe_ingredients enable row level security;

-- Create policy for recipe ingredients (readable by everyone)
create policy "Recipe ingredients are viewable by everyone" on recipe_ingredients
  for select using (true);

-- Create indexes for better performance
create index recipe_ingredients_recipe_id_idx on recipe_ingredients(recipe_id);
create index recipe_ingredients_ingredient_id_idx on recipe_ingredients(ingredient_id);
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

The application now includes:

### Authentication:
- ✅ User registration with email confirmation
- ✅ User login/logout
- ✅ Password reset functionality
- ✅ Session management
- ✅ Protected routes
- ✅ Real-time auth state updates
- ✅ Responsive UI matching your app's design

### Ingredients System:
- ✅ Ingredient search with real-time suggestions
- ✅ Ingredient selection and management
- ✅ Mock data fallback when Supabase isn't configured
- ✅ Optimized search with debouncing
- ✅ Responsive ingredient selector component

### Recipes System:
- ✅ Recipe display and browsing
- ✅ Recipe search by ingredients (coming soon)
- ✅ Mock data fallback for development
- ✅ Pagination support

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