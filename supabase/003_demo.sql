-- Saxa 3: 10 demosalonger med team, tjänster, öppettider och omdömen.
-- Kör i Supabase → SQL Editor efter 002_upgrade.sql. Går att köra flera gånger.
-- Ta bort demon senare:  delete from public.salons where is_demo;

alter table public.salons add column if not exists is_demo boolean not null default false;
alter table public.reviews alter column customer_id drop not null;
alter table public.reviews alter column booking_id drop not null;
alter table public.reviews add column if not exists author_name text;

do $$
declare
  slugs  text[] := array['fade-lab','kungs-barbers','studio-saxa','blade-and-brush','majorna-cuts','sodermalm-barbershop','vasastan-hair','malmo-fade-house','mollan-barbers','uppsala-cut-club'];
  names  text[] := array['Fade Lab','Kungs Barbers','Studio Saxa','Blade & Brush','Majorna Cuts','Södermalm Barbershop','Vasastan Hair','Malmö Fade House','Möllan Barbers','Uppsala Cut Club'];
  cities text[] := array['Göteborg','Göteborg','Göteborg','Göteborg','Göteborg','Stockholm','Stockholm','Malmö','Malmö','Uppsala'];
  addrs  text[] := array['Andra Långgatan 12','Kungsgatan 41','Linnégatan 8','Vasagatan 22','Mariaplan 3','Götgatan 58','Odengatan 70','Södra Förstadsgatan 14','Möllevångstorget 5','Svartbäcksgatan 9'];
  descs  text[] := array[
    'Skin fades, taper och skarpa linjer. Drop-in när det finns plats.',
    'Klassisk barbershop mitt i stan – hot towel shave och kaffe ingår.',
    'Modern salong för klipp, färg och styling. Lugn miljö, bra musik.',
    'Skägg är vår grej. Trim, form och rakkniv med precision.',
    'Kvarterets frisör sedan 2012. Barn, vuxna och allt däremellan.',
    'Fades och designs med Stockholms bästa utsikt över Götgatan.',
    'Premiumklipp och färg i en avslappnad studio.',
    'Malmös fade-specialister. Boka online, ingen väntan.',
    'Barbershop med själ på Möllan. Alla är välkomna.',
    'Studentvänliga priser och skarp kvalitet.'];
  covers text[] := array[
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=1200&q=80&auto=format&fit=crop'];
  people text[] := array['Ali','Sara','Omar','Lina','Yusuf','Emma','Hassan','Noah','Amina','Leo','Ibrahim','Maja','Karim','Elsa','Mohamed','Alva','Adam','Nora','Zakaria','Ella','Samir','Wilma','Bilal','Ines','Hugo','Layla','Ahmed','Olivia','Isak','Hodan'];
  titles text[] := array['Barber','Senior barber','Frisör','Färgspecialist','Fade-specialist'];
  bios   text[] := array['Skin fades och skarpa linjer','10 år bakom stolen','Klassiska klipp med modern touch','Skägg är min grej','Lugnt tempo, perfekt resultat'];
  rnames text[] := array['Ahmed','Johan','Mustafa','Erik','Sami','Lucas','Abdi','Filip','Yasin','Oscar','Liam','Hamza'];
  rtext  text[] := array['Bästa faden jag haft!','Supertrevligt bemötande och smidig bokning.','Kommer definitivt tillbaka.','Exakt som jag ville ha det.','Ren salong och grym stämning.','Tog sig tid att lyssna – topp!','Skägget har aldrig sett bättre ut.','Snabbt, proffsigt och bra pris.'];
  s uuid; st uuid; i int; j int; k int; d int; n int := 0; p int;
begin
  for i in 1..10 loop
    if exists (select 1 from public.salons where slug = slugs[i]) then
      n := n + 2 + (i % 2);
      continue;
    end if;
    p := (i % 4) * 25;
    insert into public.salons (slug, name, description, address, city, cover_url, instagram, owner_id, is_demo)
    values (slugs[i], names[i], descs[i], addrs[i], cities[i], covers[i], replace(slugs[i], '-', ''), null, true)
    returning id into s;

    insert into public.services (salon_id, name, description, duration_min, price_sek, sort) values
      (s, 'Herrklippning', 'Klipp + styling', 30, 330 + p, 0),
      (s, 'Skin fade', 'Fade med rakkniv-finish', 45, 390 + p, 1),
      (s, 'Skäggtrim', 'Form, linjer och olja', 20, 190 + p, 2),
      (s, 'Klipp + skägg', 'Hela paketet', 60, 490 + p, 3),
      (s, 'Barnklippning', 'Upp till 12 år', 25, 250 + p, 4);

    for j in 1..(2 + (i % 2)) loop
      n := n + 1;
      insert into public.staff (salon_id, name, title, bio, photo_url, sort)
      values (s, people[n], titles[1 + (n % 5)], bios[1 + ((n + 2) % 5)],
              'https://api.dicebear.com/9.x/notionists/svg?seed=' || people[n] || '&backgroundColor=f3dfa9,e5c98a,d2ab5c',
              j)
      returning id into st;
      for d in 1..6 loop
        insert into public.staff_hours (salon_id, staff_id, weekday, start_time, end_time)
        values (s, st, d, case when j = 2 then '11:00' else '10:00' end::time, case when d = 6 then '16:00' else '19:00' end::time);
      end loop;
      for k in 1..(3 + (n % 3)) loop
        insert into public.reviews (salon_id, staff_id, rating, comment, author_name, created_at)
        values (s, st, case when (n + k) % 7 = 0 then 4 else 5 end, rtext[1 + ((n + k) % 8)], rnames[1 + ((n * 3 + k) % 12)],
                now() - ((n * k) % 45) * interval '1 day');
      end loop;
    end loop;
  end loop;
end $$;
