import Link from 'next/link'
import Image from 'next/image'

interface FooterProps {
  onOpenAdminDialog?: () => void
}

export default function Footer({ onOpenAdminDialog }: FooterProps) {
  return (
    <footer className="border-t border-slate-300 bg-white/90 text-slate-700">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl">
            Projekt współfinansowany ze środków Ministra Kultury i Dziedzictwa Narodowego w ramach programu dotacyjnego
            „Różnorodność Językowa” Instytutu Różnorodności Językowej Rzeczypospolitej.
          </p>
          <div className="flex items-center gap-10">
            <Image src="/mkdin.svg" alt="Ministerstwo Kultury" width={140} height={48} className="h-10 w-auto" />
            <Image src="/irjr.svg" alt="Instytut Różnorodności Językowej" width={140} height={48} className="h-10 w-auto" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-slate-500">
          <span>&#169; 2025 Warsztat Miejski</span>
          <div className="flex items-center gap-4">
            <Link href="/polityka-prywatnosci" className="hover:text-primary">
              Polityka prywatności
            </Link>
            {onOpenAdminDialog && (
              <button
                type="button"
                onClick={onOpenAdminDialog}
                className="font-medium hover:text-primary"
              >
                ADMIN
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
