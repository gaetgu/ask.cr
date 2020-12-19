<script>
  export let current = ''
</script>

<style>
</style>

<main>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation">
        <span class="navbar-toggler-icon" />
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <a class="nav-link {current === 'Home' ? 'active' : ''}" on:click="{() => current = 'Home'}" aria-current="page" href="/">Home</a>
          </li>
          <li class="nav-item">
            <a class="nav-link {current === 'Installation' ? 'active' : ''}" on:click="{() => current = 'Installation'}" href="/install">Installation</a>
          </li>
          <li>
            <a class="nav-link {current === 'Tutorials' ? 'active' : ''}" on:click="{() => current = 'Tutorials'}" href="/tutorials">Tutorials</a>
          </li>
          <li>
            <a class="nav-link {current === 'Docs' ? 'active' : ''}" on:click="{() => current = 'Docs'}" href="/docs">Docs</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</main>
