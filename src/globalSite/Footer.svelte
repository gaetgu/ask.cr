<script>
    let categories = [
        {permalink: '/questions', title: 'Crystal'},
        {permalink: '/questions', title: 'Ruby'},
        {permalink: '/questions', title: 'Lucky'},
        {permalink: '/questions', title: 'Amber'},
        {permalink: '/questions', title: 'Axentro'},
    ]

    let quick_links = [
        {permalink: '', title: 'About'},
        {permalink: '', title: 'Contact Us'},
        {permalink: '', title: 'Open Source'},
        {permalink: '', title: 'Contribute'},
        {permalink: '', title: 'Privacy Policy'},
    ]

    let icons = [
        {permalink: 'https://github.com/gaetgu', icon: 'fa fa-github'}
    ]
</script>

<main>
    <!-- Site footer -->
    <footer class="site-footer">
        <div class="container">
            <div class="row">
                <div class="col-sm-12 col-md-6">
                    <h6>About</h6>
                    <p class="text-justify">
                        Ask.cr was created out of the need for a better forum for Crystal Developers.
                        While sites like StackOverflow and StackExchange are great, the Crystal community
                        is not very large there. And on the official Crystal forums, there are not many
                        people who can help with Crystal's various frameworks. Ask.cr intends to be a
                        replacement for those sites, providing a friendly and useful site to ask any 
                        Crystal-related questions.
                    </p>
                </div>

                <div class="col-xs-6 col-md-3">
                    <h6>Categories</h6>
                    <ul class="footer-links">
                        {#each categories as category}
                        <li><a href="{category.permalink}">{category.title}</a></li>
                        {/each}
                    </ul>
                </div>

                <div class="col-xs-6 col-md-3">
                    <h6>Quick Links</h6>
                    <ul class="footer-links">
                        {#each quick_links as qlink}
                        <li><a href="{qlink.permalink}">{qlink.title}</a></li>
                        {/each}
                    </ul>
                </div>
            </div>
            <hr>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-md-8 col-sm-6 col-xs-12">
                    <p class="copyright-text">Copyright &copy; 2020 All Rights Reserved by
                        <a href="/">ask.cr</a>.
                    </p>
                </div>

                <div class="col-md-4 col-sm-6 col-xs-12">
                    <ul class="social-icons">
                        {#each icons as icon}
                        <li><a href="{icon.permalink}"><i class="{icon.icon}" /></a></li>
                        {/each}
                    </ul>
                </div>
            </div>
        </div>
    </footer>
</main>

<style>
    .site-footer {
        background-color: rgb(45, 45, 45);
        padding: 45px 0 20px;
        margin-top: 40px;
        font-size: 15px;
        line-height: 24px;
        color: #737373;
    }

    .site-footer hr {
        border-top-color: #bbb;
        opacity: 0.5
    }

    .site-footer h6 {
        color: #fff;
        font-size: 16px;
        text-transform: uppercase;
        margin-top: 5px;
        letter-spacing: 2px
    }

    .site-footer a {
        color: #737373;
    }

    .site-footer a:hover {
        color: #3366cc;
        text-decoration: none;
    }

    .footer-links {
        padding-left: 0;
        list-style: none
    }

    .footer-links li {
        display: block
    }

    .footer-links a {
        color: #737373
    }

    .footer-links a:active,
    .footer-links a:focus,
    .footer-links a:hover {
        color: #3366cc;
        text-decoration: none;
    }

    .site-footer .social-icons {
        text-align: right
    }

    .site-footer .social-icons a {
        width: 40px;
        height: 40px;
        line-height: 40px;
        margin-left: 6px;
        margin-right: 0;
        border-radius: 100%;
        background-color: #33353d
    }

    .copyright-text {
        margin: 0
    }

    @media (max-width:991px) {
        .site-footer [class^=col-] {
            margin-bottom: 30px
        }
    }

    @media (max-width:767px) {
        .site-footer {
            padding-bottom: 0
        }

        .site-footer .copyright-text,
        .site-footer .social-icons {
            text-align: center
        }
    }

    .social-icons {
        padding-left: 0;
        margin-bottom: 0;
        list-style: none
    }

    .social-icons li {
        display: inline-block;
        margin-bottom: 4px
    }

    .social-icons a {
        background-color: #eceeef;
        color: #818a91;
        font-size: 16px;
        display: inline-block;
        line-height: 44px;
        width: 44px;
        height: 44px;
        text-align: center;
        margin-right: 8px;
        border-radius: 100%;
        -webkit-transition: all .2s linear;
        -o-transition: all .2s linear;
        transition: all .2s linear
    }

    .social-icons a:active,
    .social-icons a:focus,
    .social-icons a:hover {
        color: #fff;
        background-color: #29aafe
    }

    /* @media (max-width:767px) {
        .social-icons li.title {
            display: block;
            margin-right: 0;
            font-weight: 600
        }
    } */
</style>