<script>
    let blog_content = [
        {permalink: '/questions', title: 'How to post'},
        {permalink: '/questions', title: 'Why are we here?'},
        {permalink: '/questions', title: 'Just launched!'},
    ]

    let featured_content = [
        {permalink: '/questions', title: 'How to set up lucky'},
        {permalink: '/questions', title: 'Why is Crystal better than Ruby'},
    ]

    let popular_content = [
        {permalink: '/questions', title: 'Convert float to integer'},
        {permalink: '/questions', title: 'Why am I getting a \'nil\' error?'},
        {permalink: '/questions', title: 'How to write a programming language'},
        {permalink: '/questions', title: 'What is the purpose of life?'},
    ]
</script>

<main>
    <div class="sidebar a-child-afloat">
        <!-- The Crystal Blog - random blog posts and tips from Crystal devs -->
        <h5>The Crystal Blog</h5>
        <div>
            {#each blog_content as blog}
                <p><a href="{blog.permalink}">{blog.title}</a></p>
            {/each}
        </div>

        <!-- Features posts - posts chosen as relevant by the mods -->
        <h5>Featured</h5>
        <div>
            {#each featured_content as feat}
                <p><a href="{feat.permalink}">{feat.title}</a></p>
            {/each}
        </div>

        <!-- Posts with a lot of upvotes or answers -->
        <h5>Popular Posts</h5>
        <div>
            {#each popular_content as pop}
                <p><a href="{pop.permalink}">{pop.title}</a></p>
            {/each}
        </div>
    </div>
</main>

<style>
    .sidebar {
        color: white;
        background-color: rgb(49, 58, 71);
        border-radius: 10px;
        padding-bottom: 20px;
    }

    .a-child-afloat {
        float: left;
        width: 20%;
        min-height: 60vh;
        padding-left: 20px;
        padding-right: 20px;
    }

    h5 {
        margin-top: 25px;
    }

    p {
        margin-top: 0px !important;
        margin-bottom: 4px !important;
    }

    a {
        text-decoration: none;
        color: rgb(212, 212, 212);
    }
    a:hover {
        color:rgb(1, 126, 68) !important;
    }

    @media all and (max-width: 1000px) {
        .sidebar { display: none; }
    }
</style>