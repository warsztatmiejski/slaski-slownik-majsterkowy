# Śląski Słownik Majsterkowy

Aplikacja webowa rozwijana przez Warsztat Miejski, której celem jest stworzenie specjalistycznego słownika technicznego łączącego język śląski i polski. Projekt udostępnia nowoczesny interfejs do przeszukiwania haseł, gromadzenia nowych zgłoszeń od społeczności oraz moderacji treści przez zespół redakcyjny.

## Aktualna funkcjonalność
- interaktywna strona główna z wyszukiwarką haseł i panelem prezentującym przykłady użycia (na razie w oparciu o dane mockowe),
- formularz zgłaszania nowych słów (`/dodaj`) z możliwością dodawania przykładów zdań, lokalizacji, propozycji nowej kategorii i danych kontaktowych (wysyłka jest obecnie symulowana),
- panel administratora (`/admin`) prezentujący statystyki oraz zgłoszenia w oparciu o dane przykładowe; logika akceptacji/odrzucania jest gotowa do spięcia z API,
- warstwa API (`/api/search`, `/api/submissions`, `/api/submissions/[id]`) obsługująca wyszukiwanie, przyjmowanie zgłoszeń oraz proces moderacji (wymaga połączenia z bazą),
- model danych Prisma bez sekcji „znaczeń” – focus na przykładach zdań i metadanych wpisów; seed (`prisma/seed.ts`) uzupełnia bazę realnymi hasłami.

## Stos technologiczny
- **Next.js 15 (App Router)** z React 19 oraz TypeScript,
- **Tailwind CSS 4** z konfiguracją w `app/globals.css` i komponentami UI bazującymi na shadcn/ui i Radix UI,
- **Prisma ORM** z bazą PostgreSQL do przechowywania haseł, zgłoszeń i metadanych,
- **Next API Routes** do obsługi wyszukiwania i procesu moderacji,
- dodatkowe biblioteki: `lucide-react` (ikony), `class-variance-authority`, `tailwind-merge`, `next-auth` (przygotowanie pod autoryzację administratorów).

## Uruchomienie lokalne
1. Zainstaluj zależności: `npm install`.
2. Skonfiguruj zmienną `DATABASE_URL` (PostgreSQL) w pliku `.env`. W przypadku hostingu MyDevil wymagane jest tunelowanie SSH lub shadow baza – patrz [dokumentacja Prisma](https://pris.ly/d/migrate-shadow).
3. Wygeneruj klienta ORM i zaktualizuj schemat: `npx prisma migrate dev` / `npm run db:push` (opcjonalnie `npm run db:seed` dla danych przykładowych).
4. Uruchom aplikację: `npm run dev` i odwiedź `http://localhost:3000`.

## Struktura projektu
- `app/` – widoki i trasy (strona główna, formularz zgłoszeń, panel admina, endpointy API),
- `components/` – komponenty UI oraz logika stron zbudowana w trybie `use client`,
- `lib/` – konfiguracja Prisma, helpery i klienci API dla warstwy frontowej,
- `prisma/` – schemat bazy danych i skrypt seedujący z rzeczywistym słownictwem,
- pliki konfiguracyjne Next.js, Tailwind i Vercel w katalogu głównym.

Projekt jest w aktywnym rozwoju – interfejs użytkownika już odzwierciedla docelowe doświadczenie, a dalsze prace skupiają się na pełnym spięciu warstwy frontowej z API oraz rozbudowie panelu moderacji.
