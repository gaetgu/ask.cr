<script>
    import NavBar from '../globalSite/NavBar.svelte'
    import SideBar from '../globalSite/SideBar.svelte'
    import Footer from '../globalSite/Footer.svelte'

    let questions = [
        {title: 'Why isn\'t it working?', tags: ['tags', 'just why', 'no context!!!'], content: 'I\'m sorry I can\'t give you code, but it isn\'t working! HELP!!!'},
        {title: 'Well this is embarrasing...', tags: ['this is a tag!', 'they be cool', 'just like me'], content: 'Yeah, I was too lazy to add different content XD'},
        {title: 'Why isn\'t it working?', tags: ['I was too', 'lazy to', 'change the titles'], content: 'I\'m sorry I can\'t give you code, but it isn\'t working! HELP!!!'},
        {title: 'Why isn\'t it working?', tags: ['tags', 'just why', 'no context!!!'], content: 'I\'m sorry I can\'t give you code, but it isn\'t working! HELP!!!'},
        {title: 'Why isn\'t it working?', tags: ['tags', 'just why', 'no context!!!'], content: 'I\'m sorry I can\'t give you code, but it isn\'t working! HELP!!!'},
    ]
</script>

<main>

    <NavBar current='Questions' />

    <h3 class="questions-title">
        Questions
    </h3>

    <div class="float-container">
        <div class="the-great-all-knowing-container">

        </div>
        <div class="questions a-child-afloat">
            {#each questions as question}
                <hr>
                <div>
                    <div class="title">
                        <h4>
                            <a href="/questions">{question.title}</a>
                        </h4>
                    </div>
                    {#each question.tags as tag}
                        <span class="tag">{tag}</span>
                    {/each}
        
                    <br>
                    <br>
                </div>
            {/each}
        </div>

        <SideBar />
    </div>

    <Footer />
</main>

<style>
    main {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background-color:rgb(45, 45, 45);
    }

    .float-container {
        overflow: hidden;
        width: 100%;
    }

    /* container is reserved by bootstrap */
    .the-great-all-knowing-container {
        margin: auto;
    }

    .questions-title {
        font-weight: 200 !important;
        font-size: 2.1em;
        color: white;
        margin-left: 20%;
        margin-bottom: 0px;
    }

    .questions {
        width: 40% !important;
        float: left;
        padding: 20px;
        width: 100%;
        margin-left: 17%;
        height: 79vh;
        overflow: auto;
        /* overflow: hidden; */
    }

    .a-child-afloat {
        float: left;
        padding: 20px;
    }

    a {
        text-decoration: none;
        color: rgb(148, 155, 161);
    }

    a:hover {
        color: rgb(87, 150, 106);
    }

    span.tag {
        background-color: rgb(62, 74, 82);
        color: rgb(142, 177, 199);
        font-size: 12px;
        border-radius: 5px;
        margin-right: 5px;
        padding-top: 3px;
        padding-bottom: 3px;
        padding-left: 5px;
        padding-right: 5px;
    }

    span.tag:hover {
        background-color: rgb(67, 82, 95);
        color: rgb(205, 225, 238);
    }

    hr {
        /* margin-right: 60%; */
        border-top: 0.01px solid grey;
    }
</style>