alter table comun.users add primary key (username);

insert into comun.users (username, hashpass) values 
  ('gustavo','c6744d30f58a20cd80f9b3856c16c892'),
  ('tecnico1','0c9ccfe0d0661d9f3123cf375cbd66c9'),
  ('tecnico2','7904fa64ae665f83af792d60edf31b97'),
  ('tecnico3','e8cdd7f1d92843c5986f83e2cbec94b4');

alter table comun.planillas add column obstxt text;

grant all on database nuestros_clsdb to nuestros;
grant usage on schema comun to nuestros;
grant all on comun.users to nuestros;
grant all on comun.planillas to nuestros;

create table parametros(
  parametro text primary key,
  valor text
);

insert into parametros(parametro,valor) values('version_db','1.00');