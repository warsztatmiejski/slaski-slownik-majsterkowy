import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
	<div className="flex h-full flex-col gap-12">
	  <div className="flex flex-row items-start justify-between gap-6 md:flex-col md:items-end">
		<Link href="/" className="block w-auto md:w-full transition-opacity hover:opacity-90">
		  <Image
			src="/ssm.svg"
			alt="Śląski Słownik Majsterkowy"
			width={216}
			height={200}
			priority
			className="h-48 w-auto max-w-full object-contain md:h-auto md:w-full"
		  />
		</Link>
		<div className="flex flex-col items-end gap-6 md:gap-8">
		  <a
			href="https://warsztatmiejski.org/nowezpt"
			target="_blank"
			rel="noopener noreferrer"
			className="transition-opacity hover:opacity-80"
		  >
			<Image
			  src="/nowe-zpt.svg"
			  alt="Nowe ZPT"
			  width={100}
			  height={140}
			  className="h-auto w-16 md:w-20"
			/>
		  </a>
		  <a
			href="https://warsztatmiejski.org"
			target="_blank"
			rel="noopener noreferrer"
			className="transition-opacity hover:opacity-80"
		  >
			<Image
			  src="/wm-symbol.svg"
			  alt="Warsztat Miejski"
			  width={100}
			  height={100}
			  className="h-auto w-16 md:w-20"
			/>
		  </a>
		</div>
	  </div>
	</div>
  )
}
