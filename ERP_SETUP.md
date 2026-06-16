# Дотоод ERP — тохиргооны заавар

Компанийн дотоод систем: нэвтрэлт, эрхийн хяналт, ирсэн/явсан бичиг, бичиг баримт,
үйлдлийн бүртгэл (audit), хяналтын самбар.

## Хэсгүүд (рол)
- **Супер админ** — бүх эрх. Хэрэглэгч үүсгэх, эрх олгох, бүгдийг үзэх/засах.
- **Захирал** — бүх модулийг **үзэх**, хяналтын самбар, үйлдлийн бүртгэл харах.
- **Ажилтан** — зөвхөн өөрт нь олгосон модульд, олгосон эрхээр (үзэх/үүсгэх/засах).

---

## 1. Нууц түлхүүр (secret key) солих ⚠️
Чатад `sb_secret_...` задарсан тул **Supabase → Project Settings → API keys → secret key → Roll**
дарж шинээр үүсгэ. Шинэ secret key-г зөвхөн доорх Edge Function-д ашиглана (frontend-д ХЭЗЭЭ Ч биш).

## 2. Өгөгдлийн сан үүсгэх
1. Supabase Dashboard → **SQL Editor** → New query
2. `supabase/schema.sql` файлыг бүхэлд нь хуулж тавиад **RUN**.
   - Бүх хүснэгт, эрхийн хяналт (RLS), audit триггер, `docs` storage bucket үүснэ.

## 3. Эхний супер админаа үүсгэх
1. Supabase → **Authentication → Users → Add user** → и-мэйл + нууц үг (Auto-confirm ON).
2. SQL Editor дээр (и-мэйлээ тавь):
   ```sql
   update public.profiles set role='superadmin' where email='ТАНЫ@MAIL';
   ```
3. `http://localhost:5173/app` руу орж нэвтэр.

## 4. (Сонголт) Хэрэглэгчийг апп дотроос үүсгэх — Edge Function
"Хэрэглэгч / эрх" хуудасны "+ ХЭРЭГЛЭГЧ ҮҮСГЭХ" товч ажиллахын тулд `create-user`
функцийг deploy хийнэ. Үүнгүйгээр Supabase Dashboard-аас гараар хэрэглэгч нэмж болно.

```bash
# Supabase CLI суулгах (нэг удаа)
npm i -g supabase

supabase login
supabase link --project-ref fzlqlcaaryqmyrgsbbrs

# Шинэ secret key-гээ SERVICE_KEY болгож тавих (SUPABASE_URL/ANON_KEY автоматаар бэлэн)
supabase secrets set SERVICE_KEY=ШИНЭ_SECRET_KEY

supabase functions deploy create-user
```

## 5. Ажиллуулах
```bash
npm run dev
```
- Нийтийн вэбсайт: `http://localhost:5173/`
- Дотоод систем: `http://localhost:5173/app`  (баруун дээд "НЭВТРЭХ →")

---

## Модуль нэмэх (ирээдүйд)
`Бэлэн бүтээгдэхүүн`, `Агуулах` зэргийг нэмэхдээ:
1. `schema.sql`-д хүснэгт + RLS policy нэмэх (`has_perm('<module>', ...)`).
2. `src/lib/supabase.ts`-ийн `MODULES`-д нэмэх.
3. `src/erp/pages/`-д хуудас, `Layout.tsx`-д цэс, `Users.tsx`-ийн `MODULES` жагсаалтад нэмэх.
