create user nuestros_clsow password 'ivown3210098';
create database nuestros_clsdb with owner nuestros_clsow;
\c nuestros_clsdb
create schema comun authorization nuestros_clsow;
set search_path = comun, public;
create table users(
  username text,
  hashpass text
);
alter table users owner to nuestros_clsow;
insert into users(username, hashpass) values ('guest', md5('1234guest'));

create table comun.planillas(
  orden    integer primary key,
  fecha    text,
  inicio   text,
  equipo   text,
  tecnico  text,
  baterias text,
  iniciob  text,
  finb     text,
  lugarver text,
  lugarcie text,
  cantobs  text,
  itemsobs text,
  momento timestamp
);
alter table comun.planillas owner to nuestros_clsow;
