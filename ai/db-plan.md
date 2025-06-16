# Database Schema for Na Winie (Grab & Cook)

## Tables

### 1. Users
```sql
create table users (
  id uuid references auth.users primary key,
  email text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table users is 'Profile data for authenticated users';
```

### 2. Ingredients
```sql
create type unit_type as enum ('ml', 'g', 'szt');

create table ingredients (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  unit_type unit_type not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table ingredients is 'Master list of all available ingredients';
```

### 3. Default Ingredients
```sql
create table default_ingredients (
  id uuid primary key default uuid_generate_v4(),
  ingredient_id uuid references ingredients(id) not null,
  created_at timestamptz default now(),
  constraint fk_default_ingredient
    foreign key (ingredient_id)
    references ingredients(id)
    on delete cascade
);

comment on table default_ingredients is 'Global list of common ingredients like salt, water';
```

### 4. User Default Ingredients
```sql
create table user_default_ingredients (
  user_id uuid references users(id),
  ingredient_id uuid references ingredients(id),
  created_at timestamptz default now(),
  primary key (user_id, ingredient_id),
  constraint fk_user
    foreign key (user_id)
    references users(id)
    on delete cascade,
  constraint fk_ingredient
    foreign key (ingredient_id)
    references ingredients(id)
    on delete cascade
);

comment on table user_default_ingredients is 'User-specific list of ingredients they always have';
```

### 5. Recipes
```sql
create type complexity_level as enum ('EASY', 'MEDIUM', 'HARD');

create table recipes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  preparation_time_minutes integer not null check (preparation_time_minutes > 0),
  complexity_level complexity_level not null,
  steps jsonb not null,
  author_id uuid references users(id) not null,
  average_rating numeric(2,1) default 0 check (average_rating >= 0 and average_rating <= 5),
  total_votes integer default 0 check (total_votes >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint fk_author
    foreign key (author_id)
    references users(id)
    on delete set null
);

comment on table recipes is 'Main recipes table with preparation details';
```

### 6. Recipe Ingredients
```sql
create table recipe_ingredients (
  recipe_id uuid references recipes(id),
  ingredient_id uuid references ingredients(id),
  amount numeric not null check (amount > 0),
  is_optional boolean default false,
  substitute_recommendation text,
  primary key (recipe_id, ingredient_id),
  constraint fk_recipe
    foreign key (recipe_id)
    references recipes(id)
    on delete cascade,
  constraint fk_ingredient
    foreign key (ingredient_id)
    references ingredients(id)
    on delete cascade
);

comment on table recipe_ingredients is 'Ingredients required for each recipe with amounts and substitution options';
```

### 7. Recipe Views
```sql
create table recipe_views (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  recipe_id uuid references recipes(id),
  view_start timestamptz default now(),
  view_end timestamptz,
  created_at timestamptz default now(),
  constraint fk_user
    foreign key (user_id)
    references users(id)
    on delete set null,
  constraint fk_recipe
    foreign key (recipe_id)
    references recipes(id)
    on delete cascade,
  constraint valid_view_duration
    check (view_end is null or view_end > view_start)
);

comment on table recipe_views is 'Tracking user interactions with recipes';
```

### 8. Ingredient Popularity
```sql
create table ingredient_popularity (
  ingredient_id uuid references ingredients(id) primary key,
  search_count integer default 0 check (search_count >= 0),
  last_updated timestamptz default now(),
  constraint fk_ingredient
    foreign key (ingredient_id)
    references ingredients(id)
    on delete cascade
);

comment on table ingredient_popularity is 'Global tracking of ingredient search frequency';
```

## Indexes

```sql
-- Ingredients search optimization
create index idx_ingredients_name_search on ingredients using gin (name gin_trgm_ops);
create index idx_ingredients_unit_type on ingredients(unit_type);

-- Recipe search and filtering
create index idx_recipes_name_search on recipes using gin (name gin_trgm_ops);
create index idx_recipes_complexity_rating on recipes(complexity_level, average_rating);
create index idx_recipes_creation_date on recipes(created_at);

-- Recipe ingredients lookup
create index idx_recipe_ingredients_ingredient on recipe_ingredients(ingredient_id);
create index idx_recipe_ingredients_optional on recipe_ingredients(is_optional);

-- User activity tracking
create index idx_recipe_views_user_time on recipe_views(user_id, view_start);
create index idx_recipe_views_recipe_time on recipe_views(recipe_id, view_start);

-- Ingredient popularity tracking
create index idx_ingredient_popularity_count on ingredient_popularity(search_count desc);
```

## Materialized Views

```sql
create materialized view popular_ingredients as
select 
  i.*,
  ip.search_count,
  ip.last_updated
from ingredients i
join ingredient_popularity ip on i.id = ip.ingredient_id
order by ip.search_count desc;

create unique index idx_popular_ingredients_id on popular_ingredients(id);
create index idx_popular_ingredients_count on popular_ingredients(search_count desc);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on tables
alter table users enable row level security;
alter table user_default_ingredients enable row level security;
alter table recipes enable row level security;
alter table recipe_views enable row level security;

-- Users policies
create policy "Users can view their own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on users for update
  using (auth.uid() = id);

-- Recipes policies
create policy "Recipes are viewable by everyone"
  on recipes for select
  using (true);

create policy "Users can insert their own recipes"
  on recipes for insert
  with check (auth.uid() = author_id);

create policy "Recipe authors can update their recipes"
  on recipes for update
  using (auth.uid() = author_id);

-- User default ingredients policies
create policy "Users can view their own default ingredients"
  on user_default_ingredients for select
  using (auth.uid() = user_id);

create policy "Users can manage their own default ingredients"
  on user_default_ingredients for all
  using (auth.uid() = user_id);

-- Recipe views policies
create policy "Users can view their own recipe view history"
  on recipe_views for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recipe views"
  on recipe_views for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recipe views"
  on recipe_views for update
  using (auth.uid() = user_id);
```

## Functions

```sql
-- Function to find recipes by ingredients
create or replace function find_recipes_by_ingredients(
  p_ingredient_ids uuid[]
) returns setof recipes as $$
begin
  return query
  select distinct r.*
  from recipes r
  join recipe_ingredients ri on r.id = ri.recipe_id
  where ri.ingredient_id = any(p_ingredient_ids)
  order by r.average_rating desc;
end;
$$ language plpgsql security definer;

-- Function to update recipe view end time
create or replace function update_recipe_view_end(
  p_view_id uuid
) returns void as $$
begin
  update recipe_views
  set view_end = now()
  where id = p_view_id
  and auth.uid() = user_id;
end;
$$ language plpgsql security definer;

-- Function to increment ingredient popularity
create or replace function increment_ingredient_popularity(
  p_ingredient_id uuid
) returns void as $$
begin
  insert into ingredient_popularity (ingredient_id, search_count)
  values (p_ingredient_id, 1)
  on conflict (ingredient_id)
  do update set 
    search_count = ingredient_popularity.search_count + 1,
    last_updated = now();
end;
$$ language plpgsql security definer;

-- Function to refresh popular ingredients view
create or replace function refresh_popular_ingredients()
returns void as $$
begin
  refresh materialized view concurrently popular_ingredients;
end;
$$ language plpgsql security definer;
```

## Triggers

```sql
-- Trigger for updating timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on users
  for each row
  execute function update_updated_at();

create trigger update_recipes_updated_at
  before update on recipes
  for each row
  execute function update_updated_at();

create trigger update_ingredients_updated_at
  before update on ingredients
  for each row
  execute function update_updated_at();
```

## Notes

2. All tables use UUID as primary keys for better distribution and scaling
3. Timestamps are included for auditing and data lifecycle management
4. RLS policies ensure proper data access control
5. Materialized views and indexes are optimized for common query patterns
6. JSONB is used for recipe steps to allow flexible step metadata
7. Triggers maintain updated_at timestamps automatically
8. Foreign key constraints include appropriate cascade rules
9. Check constraints ensure data integrity
10. Comments are added to all tables for better documentation 