<!-- App.svelte -->
<!-- Main file, includes routing etc. for the ask.cr website -->
<script>
	// Import router
	import router from 'page'

	// Import routes
	import Home from './Home.svelte'

	import Questions from './questions/Questions.svelte'

	import PersonalProfile from './profiles/PersonalProfile.svelte'

	import Signup from './forms/Signup.svelte'
	import Login from './forms/Login.svelte'

	import EULA from './EULA/EULA.svelte'		// REALLY sucks right now

	// Set page variable
	let page
	let params

	// Set up pages to watch for
	router('/', () => page = Home)
	router('/signup', () => page = Signup)
	router('/login', () => page = Login)
	router('/terms', () => page = EULA)
	router('/questions', () => page = Questions)
	router('/profile', () => {
		page = PersonalProfile
		params = {
			name: 'gaetgu',
			title: 'Svelte Dude',
			bio: 'Just a normal ICE agent from Iceland.'
		}
	}) 

	// Set up the router to start and actively watch for changes
	router.start()
</script>

<svelte:component this="{page}" {params} />