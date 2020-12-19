<script>
	import router from 'page'

	// Import routes
	import HomePage from './HomePage.svelte'
	import Installation from './Installation.svelte'
	import Tutorials from './Tutorials.svelte'
	import Docs from './Docs.svelte'

	// Variables
	let page

	// Set up pages to watch for
	router('/', () => page = HomePage)
	router('/install', () => page = Installation)
	router('/tutorials', () => page = Tutorials)
	router('/docs', () => page = Docs)

	// Set up the router to start and actively watch for changes
	router.start()
</script>

<svelte:component this="{page}" />