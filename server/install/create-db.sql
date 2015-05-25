create user interviewer_owner password 'ivown3210098';
create database interviewer_db with owner interviewer_owner;
\c interviewer_db
create schema inter authorization interviewer_owner;
set search_path = inter, public;
create table users(
  username text,
  hashpass text
);
alter table users owner to interviewer_owner;
insert into users(username, hashpass) values ('guest', md5('1234guest'));