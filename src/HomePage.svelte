<script>
    import NavBar from './NavBar.svelte'

    let imgSrc = 'https://carbon.vercel.app/embed?bg=rgba%28255%2C255%2C255%2C1%29&t=seti&wt=none&l=javascript&ds=false&dsyoff=20px&dsblur=68px&wc=true&wa=true&pv=56px&ph=56px&ln=false&fl=1&fm=Hack&fs=14px&lh=133%25&si=false&es=2x&wm=false&code=function%2520press_brakes%28model%29%2520%257B%2520%250A%2520%2520var%2520x%2520%253D%252010%253B%250A%2520%2520%250A%2520%2520while%2520%28x%2520%253E%2520-1%29%2520%257B%250A%2520%2520%2520%2520print%2520x%2520%252B%2520%2522...%2522%253B%250A%2520%2520%257D%250A%2520%2520%250A%2520%2520return%2520%2522Pressing%2520brakes%2520on%2520your%2520%2522%2520%252B%2520model%2520%252B%2520%2522%21%21%21%2522%253B%250A%257D%250A%250Aprint%28press_brakes%29%28%2522Lamborghini%2522%29%253B%2520%252F%252F%253D%253E%2520Pressing%2520brakes%2520on%2520your%2520Lamborghini%21%21%21';
</script>

<NavBar current="Home" />

<main>
    <h1>Geo Lang</h1>

    <p>
        A functional programming language designed to get beginners started coding.
    </p>

	<iframe
		title="Code Example"
        src={imgSrc}
        style="width: 836px; height: 384px; border:0; transform: scale(1); overflow:hidden;"
        sandbox="allow-scripts allow-same-origin">
    </iframe>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
        background-color: rgb(255, 255, 255);
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
        margin: 20px;
		font-weight: 100;
	}

    img, p {
        margin: 0;
    }

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>