export default function HomePage() {
  return (
	<div className="container mx-auto px-4 py-8">
	  <header className="text-center mb-8">
		<h1 className="text-4xl font-bold text-gray-900 mb-2">
		  Śląski Słownik Majsterkowy
		</h1>
		<p className="text-xl text-gray-600">
		  Techniczny słownik śląsko-polski
		</p>
	  </header>

	  <main className="max-w-4xl mx-auto">
		<div className="bg-white rounded-lg shadow-md p-6 mb-8">
		  <h2 className="text-2xl font-semibold mb-4">Szukaj w słowniku</h2>
		  <div className="flex gap-4">
			<input
			  type="text"
			  placeholder="Wpisz słowo po śląsku lub polsku..."
			  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
			  Szukaj
			</button>
		  </div>
		</div>

		<div className="grid md:grid-cols-2 gap-6">
		  <div className="bg-white rounded-lg shadow-md p-6">
			<h3 className="text-lg font-semibold mb-3">Branże tradycyjne</h3>
			<ul className="space-y-2">
			  <li>
				<a href="#" className="text-blue-600 hover:underline">
				  Górnictwo
				</a>
			  </li>
			  <li>
				<a href="#" className="text-blue-600 hover:underline">
				  Hutnictwo
				</a>
			  </li>
			  <li>
				<a href="#" className="text-blue-600 hover:underline">
				  Inżynieria
				</a>
			  </li>
			  <li>
				<a href="#" className="text-blue-600 hover:underline">
				  Produkcja
				</a>
			  </li>
			</ul>
		  </div>

		  <div className="bg-white rounded-lg shadow-md p-6">
			<h3 className="text-lg font-semibold mb-3">Branże nowoczesne</h3>
			<ul className="space-y-2">
			  <li>
				<a href="#" className="text-blue-600 hover:underline">
				  Informatyka
				</a>
			  </li>
			  <li>
				<a href="#" className="text-blue-600 hover:underline">
				  Elektronika
				</a>
			  </li>
			  <li>
				<a href="#" className="text-blue-600 hover:underline">
				  Telekomunikacja
				</a>
			  </li>
			</ul>
		  </div>
		</div>

		<div className="mt-8 text-center">
		  <a
			href="#"
			className="inline-block px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
		  >
			Dodaj nowe słowo
		  </a>
		</div>
	  </main>

	  <footer className="text-center mt-12 text-gray-500">
		<p>© 2025 Śląski Słownik Majsterkowy - Zachowujemy śląską mowę techniczną</p>
	  </footer>
	</div>
  )
}