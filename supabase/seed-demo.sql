-- Valfritt: en demosalong på /demo att visa kunder. Kör efter schema.sql.
do $$
declare s uuid; a uuid; b uuid; d int;
begin
  insert into public.salons (slug, name, description, address, instagram, owner_id)
  values ('demo', 'Demo Barbershop', 'Fades, skägg och klassiska klipp. Drop-in när det finns plats.', 'Kungsgatan 1, Göteborg', 'demobarber', null)
  on conflict (slug) do nothing returning id into s;
  if s is null then return; end if;

  insert into public.staff (salon_id, name, title, sort) values (s, 'Ali', 'Barber', 0) returning id into a;
  insert into public.staff (salon_id, name, title, sort) values (s, 'Sara', 'Frisör', 1) returning id into b;

  insert into public.services (salon_id, name, duration_min, price_sek, sort) values
    (s, 'Herrklippning', 30, 350, 0),
    (s, 'Fade', 45, 400, 1),
    (s, 'Skäggtrim', 20, 200, 2),
    (s, 'Klippning + skägg', 60, 500, 3);

  for d in 1..5 loop
    insert into public.staff_hours (salon_id, staff_id, weekday, start_time, end_time) values
      (s, a, d, '10:00', '19:00'), (s, b, d, '09:00', '17:00');
  end loop;
  insert into public.staff_hours (salon_id, staff_id, weekday, start_time, end_time) values (s, a, 6, '10:00', '16:00');
end $$;
