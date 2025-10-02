import Image from 'next/image'

export default function AddWordHeader() {
  return (
	<div className="flex h-full flex-col gap-12">
	  <div className="flex flex-row items-start justify-between gap-6 md:flex-col md:items-end md:gap-10">
		<Image
		  src="/ssm.svg"
		  alt="Śląski Słownik Majsterkowy"
		  width={216}
		  height={200}
		  priority
		  className="h-54 w-auto dark:invert md:h-auto md:w-full"
		/>
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
			  className="h-auto w-16 dark:invert md:w-24"
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
			  className="h-auto w-16 dark:invert md:w-24"
			/>
		  </a>
		</div>
	  </div>
	</div>
  )
}
