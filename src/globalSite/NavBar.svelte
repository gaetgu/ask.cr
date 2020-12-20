<script>
    export let current = ''
</script>

<main>
    <nav class="navbar navbar-expand-lg navbar-light bg-dark">
        <a class="navbar-brand" href="/">ask.cr</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav mr-auto">
                <li class="nav-item">
                    <a class="nav-link {current === 'Questions' ? 'active' : ''}" href="/questions">Questions</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link {current === 'Profile' ? 'active' : ''}" href="/profile">Profile</a>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button"
                        data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Actions
                    </a>
                    <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item" href="#">Ask a question</a>
                        <a class="dropdown-item" href="#">See answered questions</a>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item" href="#">Contact us!</a>
                    </div>
                </li>
            </ul>
            <!-- I really need to add this, but not right now.... -->
            <!-- <form class="form-inline my-2 my-lg-0">
                <input class="form-control mr-sm-2" id="search" type="search" placeholder="Search" aria-label="Search">
                <button class="btn btn-dark btn-success my-2 my-sm-0" type="submit">Search</button>
            </form> -->
        </div>
    </nav>
</main>

<style>
    nav {
        padding-left: 18%;
        padding-right: 22%;
        margin-bottom: 30px; 
        background: grey !important;
    }

    .dropdown-menu {
        background: grey !important;
    }

    .dropdown-item {
        color: black;   
    }

    .dropdown-item:hover {
        background: lightgray;
        color: black
    }

    .form-control {
        background-color: darkslategray;
        border: none;
    }
</style>