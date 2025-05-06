-- Migration: Initial Schema Setup
-- Description: Creates the initial database schema for Na Winie (Grab & Cook) application
-- Tables: users, ingredients, default_ingredients, user_default_ingredients, recipes, 
--         recipe_ingredients, recipe_views, ingredient_popularity
-- Author: System
-- Date: 2025-04-30

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Create custom types
do $$ begin
    create type unit_type as enum ('ml', 'g', 'szt');
    create type complexity_level as enum ('easy', 'medium', 'hard');
exception
    when duplicate_object then null;
end $$;

-- Users table
create table users (
    id uuid references auth.users primary key,
    email text unique not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

comment on table users is 'Profile data for authenticated users';

-- Enable RLS on users table
alter table users enable row level security;

-- RLS Policies for users table
create policy "Public users are viewable by everyone" 
    on users for select 
    to anon 
    using (true);

create policy "Authenticated users can view all users" 
    on users for select 
    to authenticated 
    using (true);

create policy "Users can update own profile" 
    on users for update 
    to authenticated 
    using (auth.uid() = id);

-- Ingredients table
create table ingredients (
    id uuid primary key default uuid_generate_v4(),
    name text unique not null,
    unit_type unit_type not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

comment on table ingredients is 'Master list of all available ingredients';

-- Enable RLS on ingredients table
alter table ingredients enable row level security;

-- RLS Policies for ingredients table
create policy "Ingredients are viewable by everyone" 
    on ingredients for select 
    to anon 
    using (true);

create policy "Authenticated users can view ingredients" 
    on ingredients for select 
    to authenticated 
    using (true);

create policy "Only authenticated users can insert ingredients" 
    on ingredients for insert 
    to authenticated 
    with check (true);

-- Default ingredients table
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

-- Enable RLS on default_ingredients table
alter table default_ingredients enable row level security;

-- RLS Policies for default_ingredients table
create policy "Default ingredients are viewable by everyone" 
    on default_ingredients for select 
    to anon 
    using (true);

create policy "Authenticated users can view default ingredients" 
    on default_ingredients for select 
    to authenticated 
    using (true);

-- User default ingredients table
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

-- Enable RLS on user_default_ingredients table
alter table user_default_ingredients enable row level security;

-- RLS Policies for user_default_ingredients table
create policy "Users can view their own default ingredients" 
    on user_default_ingredients for select 
    to authenticated 
    using (auth.uid() = user_id);

create policy "Users can insert their own default ingredients" 
    on user_default_ingredients for insert 
    to authenticated 
    with check (auth.uid() = user_id);

create policy "Users can update their own default ingredients" 
    on user_default_ingredients for update 
    to authenticated 
    using (auth.uid() = user_id);

create policy "Users can delete their own default ingredients" 
    on user_default_ingredients for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- Recipes table
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

-- Enable RLS on recipes table
alter table recipes enable row level security;

-- RLS Policies for recipes table
create policy "Recipes are viewable by everyone" 
    on recipes for select 
    to anon 
    using (true);

create policy "Authenticated users can view all recipes" 
    on recipes for select 
    to authenticated 
    using (true);

create policy "Authenticated users can create recipes" 
    on recipes for insert 
    to authenticated 
    with check (auth.uid() = author_id);

create policy "Users can update their own recipes" 
    on recipes for update 
    to authenticated 
    using (auth.uid() = author_id);

create policy "Users can delete their own recipes" 
    on recipes for delete 
    to authenticated 
    using (auth.uid() = author_id);

-- Recipe ingredients table
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

-- Enable RLS on recipe_ingredients table
alter table recipe_ingredients enable row level security;

-- RLS Policies for recipe_ingredients table
create policy "Recipe ingredients are viewable by everyone" 
    on recipe_ingredients for select 
    to anon 
    using (true);

create policy "Authenticated users can view recipe ingredients" 
    on recipe_ingredients for select 
    to authenticated 
    using (true);

create policy "Recipe authors can manage ingredients" 
    on recipe_ingredients for all 
    to authenticated 
    using (
        exists (
            select 1 from recipes 
            where id = recipe_id 
            and author_id = auth.uid()
        )
    );

-- Recipe views table
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

-- Enable RLS on recipe_views table
alter table recipe_views enable row level security;

-- RLS Policies for recipe_views table
create policy "Users can view their own recipe views" 
    on recipe_views for select 
    to authenticated 
    using (auth.uid() = user_id);

create policy "Users can insert their own recipe views" 
    on recipe_views for insert 
    to authenticated 
    with check (auth.uid() = user_id);

create policy "Users can update their own recipe views" 
    on recipe_views for update 
    to authenticated 
    using (auth.uid() = user_id);

-- Ingredient popularity table
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

-- Enable RLS on ingredient_popularity table
alter table ingredient_popularity enable row level security;

-- RLS Policies for ingredient_popularity table
create policy "Ingredient popularity is viewable by everyone" 
    on ingredient_popularity for select 
    to anon 
    using (true);

create policy "Authenticated users can view ingredient popularity" 
    on ingredient_popularity for select 
    to authenticated 
    using (true);

-- Create indexes
create index idx_ingredients_name_search on ingredients using gin (name gin_trgm_ops);
create index idx_ingredients_unit_type on ingredients(unit_type);
create index idx_recipes_name_search on recipes using gin (name gin_trgm_ops);
create index idx_recipes_complexity_rating on recipes(complexity_level, average_rating);
create index idx_recipes_creation_date on recipes(created_at);
create index idx_recipe_ingredients_ingredient on recipe_ingredients(ingredient_id);
create index idx_recipe_ingredients_optional on recipe_ingredients(is_optional);
create index idx_recipe_views_user_time on recipe_views(user_id, view_start);
create index idx_recipe_views_recipe_time on recipe_views(recipe_id, view_start);
create index idx_ingredient_popularity_count on ingredient_popularity(search_count desc);

-- Create materialized view for popular ingredients
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

-- Create functions
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

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

create or replace function refresh_popular_ingredients()
returns void as $$
begin
    refresh materialized view concurrently popular_ingredients;
end;
$$ language plpgsql security definer;

-- Create triggers
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