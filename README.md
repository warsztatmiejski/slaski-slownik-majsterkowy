# Śląski Słownik Majsterkowy

Aplikacja webowa rozwijana przez Warsztat Miejski, której celem jest stworzenie specjalistycznego słownika technicznego łączącego język śląski i polski. Projekt udostępnia nowoczesny interfejs do przeszukiwania haseł, gromadzenia nowych zgłoszeń od społeczności oraz moderacji treści przez zespół redakcyjny.

## Aktualna funkcjonalność
- interaktywna strona główna z wyszukiwarką haseł, podglądem znaczeń, przykładami użycia i statystykami słownika (obecnie w oparciu o dane przykładowe),
- rozbudowany formularz zgłaszania nowych słów (`/dodaj`) z dynamicznym dodawaniem znaczeń oraz przykładów wraz z walidacją wymaganych pól,
- panel administratora (`/admin`) prezentujący statystyki, listę oczekujących zgłoszeń oraz zatwierdzone wpisy – na tę chwilę zasilany danymi makietowymi, ale przygotowany pod integrację z API,
- warstwa API (`/api/search`, `/api/submissions`, `/api/submissions/[id]`) obsługująca wyszukiwanie w bazie, przyjmowanie zgłoszeń od użytkowników oraz proces akceptacji/odrzucania przez moderatorów,
- model danych Prisma z kompletnym schematem słownika i możliwością zasiania bazy prawdziwymi hasłami śląsko-polskimi (`prisma/seed.ts`).

## Stos technologiczny
- **Next.js 15 (App Router)** z React 19 oraz TypeScript,
- **Tailwind CSS 4** z konfiguracją w `app/globals.css` i komponentami UI bazującymi na shadcn/ui i Radix UI,
- **Prisma ORM** z bazą PostgreSQL do przechowywania haseł, zgłoszeń i metadanych,
- **Next API Routes** do obsługi wyszukiwania i procesu moderacji,
- dodatkowe biblioteki: `lucide-react` (ikony), `class-variance-authority`, `tailwind-merge`, `next-auth` (przygotowanie pod autoryzację administratorów).

## Uruchomienie lokalne
1. Zainstaluj zależności: `npm install`.
2. Skonfiguruj zmienną `DATABASE_URL` (PostgreSQL) w pliku `.env`.
3. Wygeneruj klienta ORM i zaktualizuj schemat: `npm run db:push` (opcjonalnie `npm run db:seed` dla danych przykładowych).
4. Uruchom aplikację: `npm run dev` i odwiedź `http://localhost:3000`.

## Struktura projektu
- `app/` – widoki i trasy (strona główna, formularz zgłoszeń, panel admina, endpointy API),
- `components/` – komponenty UI oraz logika stron zbudowana w trybie `use client`,
- `lib/` – konfiguracja Prisma, helpery i klienci API dla warstwy frontowej,
- `prisma/` – schemat bazy danych i skrypt seedujący z rzeczywistym słownictwem,
- pliki konfiguracyjne Next.js, Tailwind i Vercel w katalogu głównym.

Projekt jest w aktywnym rozwoju – interfejs użytkownika już odzwierciedla docelowe doświadczenie, a dalsze prace skupiają się na pełnym spięciu warstwy frontowej z API oraz rozbudowie panelu moderacji.
