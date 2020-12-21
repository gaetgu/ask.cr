<!-- App.svelte -->
<!-- Main file, includes routing etc. for the ask.cr website -->
<script>
	// Import router
	import router from 'page'

	// Import routes
	import Home from './Home.svelte'

	import Questions from './questions/Questions.svelte'
	import NewQuestion from './questions/NewQuestion.svelte'

	import PersonalProfile from './profiles/PersonalProfile.svelte'

	import Signup from './forms/Signup.svelte'
	import Login from './forms/Login.svelte'

	import EULA from './EULA/EULA.svelte'

	import fourOhFour from './globalSite/404.svelte'

	// Set page variable
	let page
	let params
 
	// Set up pages to watch for
	router('/', () => page = Home)
	router('/signup', () => page = Signup)
	router('/login', () => page = Login)
	router('/terms', () => page = EULA)
	router('/questions', () => page = Questions)
	router('/new-question', () => page = NewQuestion)
	router('/profile', () => {
		page = PersonalProfile
		params = {
			name: 'gaetgu',
			title: 'Svelte Dude',
			bio: 'Just a normal ICE agent from Iceland.'
		}
	}) 

	// Handle login/signup endpoint
	router('/api/*', () => page = Questions)

	// Handle a 404
	router('*', () => page = fourOhFour)

	// Set up the router to start and actively watch for changes
	router.start()
</script>

<svelte:component this="{page}" {params} />