<script>
    import NavBar from './globalSite/NavBar.svelte'
    import Footer from './globalSite/Footer.svelte'
</script>

<main>
    <NavBar current='none' />

    <div id="parrallax" class="content"><p>ask.cr</p></div>
    <div class="content"><h2>BY DEVELOPERS, FOR DEVELOPERS</h2></div>
    <div class="content"><h2>HAVE A QUESTION REGARDING A CRYSTAL FRAMWORK?<br>
                             HAVEN'T FOUND DECISIVE HELP ON OTHER SITES?<br>
                             READY TO GIVE UP?</h2></div>
    <div class="content"><h2>CHECK OUT ASK.CR! A COMMUNITY QUESTION-AND-ANSWER<br>
                             SITE SPECIFICALLY FOR CRYSTAL, YOU ARE SURE TO<br>
                             FIND AN ANSWER HERE!</h2></div>

    <Footer />
</main>

<style>
    @import url('https://fonts.googleapis.com/css?family=JetBrains+Mono');

    * {
        margin: 0;
        padding: 0;
        border: 00;
    }

    main {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color:rgb(45, 45, 45);
    }

    div {
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'JetBrains Mono', sans-serif;
        width: 100%;
        height: 100vh;
    }

    .content {
        text-align: center;
        font-size: 60px;
        background: rgb(63, 76, 95);
        color: #eee;
        padding: 8px 24px;
        /* border-radius: 16px; */
    }

    div:nth-child(2) {
        background: rgb(45, 45, 45);
    }

    div:nth-child(3) {
        background-image: url('https://i.ibb.co/vdH4sBk/Screen-Shot-2020-12-20-at-12-22-59-AM.png');
        background-attachment: fixed;
        background-size: cover;
    }

    div:nth-child(4) {
        background: rgb(49, 58, 71);
    }
</style>