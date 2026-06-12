-- ============================================
-- QR Food Ordering System - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Tables (restaurant tables with QR codes)
create table tables (
  id uuid primary key default uuid_generate_v4(),
  table_number int unique not null,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Categories for menu items
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Menu items (foods)
create table menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders (one per session per table)
create table orders (
  id uuid primary key default uuid_generate_v4(),
  table_id uuid references tables(id) on delete cascade not null,
  status text not null default 'open' check (status in ('open', 'paid')),
  total_amount numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- Guarantee that only one 'open' order can exist per table at a time
create unique index unique_open_order_per_table on orders (table_id) where (status = 'open');

-- Order items (line items within an order)
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade not null,
  menu_item_id uuid references menu_items(id) on delete cascade not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'preparing', 'served', 'removed')),
  notes text,
  created_at timestamptz default now()
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update order total when items change
create or replace function update_order_total()
returns trigger as $$
begin
  update orders
  set total_amount = (
    select coalesce(sum(quantity * unit_price), 0)
    from order_items
    where order_id = coalesce(new.order_id, old.order_id)
    and status != 'removed'
  )
  where id = coalesce(new.order_id, old.order_id);
  return new;
end;
$$ language plpgsql;

create trigger on_order_item_change
after insert or update or delete on order_items
for each row execute function update_order_total();

-- Auto-update menu_items updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_menu_item_update
before update on menu_items
for each row execute function update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table tables enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Public can read tables, categories, menu items
create policy "Public read tables" on tables for select using (true);
create policy "Public read categories" on categories for select using (true);
create policy "Public read menu items" on menu_items for select using (true);

-- Public can read and insert orders (customers ordering)
create policy "Public read orders" on orders for select using (true);
create policy "Public insert orders" on orders for insert with check (true);
create policy "Public update orders" on orders for update using (true);

-- Public can read and insert order items
create policy "Public read order items" on order_items for select using (true);
create policy "Public insert order items" on order_items for insert with check (true);
create policy "Public update order items" on order_items for update using (true);

-- For admin operations (via service role or authenticated admin)
-- These allow all operations for authenticated users
create policy "Admin all tables" on tables for all using (auth.role() = 'authenticated');
create policy "Admin all categories" on categories for all using (auth.role() = 'authenticated');
create policy "Admin all menu items" on menu_items for all using (auth.role() = 'authenticated');
create policy "Admin all orders" on orders for all using (auth.role() = 'authenticated');
create policy "Admin all order items" on order_items for all using (auth.role() = 'authenticated');

-- ============================================
-- SEED DATA
-- ============================================

-- Insert categories
insert into categories (name, description, sort_order) values
  ('Starters', 'Appetizers and small bites', 1),
  ('Main Course', 'Hearty main dishes', 2),
  ('Beverages', 'Hot and cold drinks', 3),
  ('Desserts', 'Sweet treats', 4);

-- Insert tables
insert into tables (table_number, name) values
  (1, 'Table 1'),
  (2, 'Table 2'),
  (3, 'Table 3'),
  (4, 'Table 4'),
  (5, 'Table 5'),
  (6, 'Table 6');

-- Insert sample menu items (with placeholder images from unsplash)
insert into menu_items (category_id, name, description, price, image_url) values
  ((select id from categories where name = 'Starters'), 'Spring Rolls', 'Crispy vegetable spring rolls with sweet chili sauce', 4.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
  ((select id from categories where name = 'Starters'), 'Chicken Wings', 'Spicy buffalo wings with blue cheese dip', 7.99, 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400'),
  ((select id from categories where name = 'Starters'), 'Soup of the Day', 'Ask your server for today''s soup', 3.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400'),
  ((select id from categories where name = 'Main Course'), 'Grilled Chicken', 'Grilled chicken breast with roasted vegetables', 12.99, 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400'),
  ((select id from categories where name = 'Main Course'), 'Beef Burger', 'Juicy beef patty with lettuce, tomato, and fries', 10.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
  ((select id from categories where name = 'Main Course'), 'Margherita Pizza', 'Classic tomato and mozzarella pizza', 11.99, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
  ((select id from categories where name = 'Main Course'), 'Pasta Carbonara', 'Creamy pasta with bacon and parmesan', 9.99, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400'),
  ((select id from categories where name = 'Beverages'), 'Fresh Lemonade', 'Freshly squeezed lemonade with mint', 2.99, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400'),
  ((select id from categories where name = 'Beverages'), 'Iced Coffee', 'Cold brew coffee over ice', 3.49, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'),
  ((select id from categories where name = 'Beverages'), 'Mango Smoothie', 'Fresh mango blended with yogurt', 3.99, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400'),
  ((select id from categories where name = 'Desserts'), 'Chocolate Lava Cake', 'Warm chocolate cake with molten center', 5.99, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400'),
  ((select id from categories where name = 'Desserts'), 'Ice Cream Sundae', 'Three scoops with hot fudge and whipped cream', 4.49, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400');

-- ============================================
-- ENABLE REALTIME REPLICATION
-- ============================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table menu_items;

-- ============================================
-- WAITER CALLS (Staff notifications)
-- ============================================

-- Waiter call requests from customers
create table waiter_calls (
  id uuid primary key default uuid_generate_v4(),
  table_id uuid references tables(id) on delete cascade not null,
  resolved boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table waiter_calls enable row level security;

-- Customers (public/anon) can insert a waiter call
create policy "Public insert waiter calls" on waiter_calls for insert with check (true);

-- Anyone can read waiter calls (staff needs to see them)
create policy "Public read waiter calls" on waiter_calls for select using (true);

-- Authenticated users (staff/admin) can update (resolve) calls
create policy "Auth update waiter calls" on waiter_calls for update using (auth.role() = 'authenticated');

-- Enable realtime for instant staff notifications
alter publication supabase_realtime add table waiter_calls;