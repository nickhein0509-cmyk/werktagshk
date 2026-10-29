create role anon;
create role authenticated;
create role service_role;
create schema auth;
create table auth.users(id uuid primary key);
