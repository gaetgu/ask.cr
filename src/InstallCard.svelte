<script>
    let osInfo = [
        {os: 'Linux', subtitle: '.deb, .rpm', fileExt: '.deb'},
        {os: 'Windows', subtitle: '.exe', fileExt: '.exe'},
        {os: 'macOS', subtitle: '.dmg, .pkg', fileExt: '.pkg'}
    ]
</script>

<main>
    {#each osInfo as info}
    <div class="card" style="width: 21rem;">
            <h5 class="card-title">{info.os}</h5>
            <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted">{info.subtitle}</h6>
                <p class="card-text">Download GeoLang for {info.os} operating systems.</p>
                <button class="btn btn-light">Download {info.fileExt}</button>
            </div>
    </div>
    {/each}
</main>

<style>
    main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
        background-color: rgb(255, 255, 255);
	}

	h5 {
		color: #ff3e00;
		/* text-transform: uppercase; */
		font-size: 4em;
        /* margin: 20px; */
		font-weight: 100;
    }

</style>