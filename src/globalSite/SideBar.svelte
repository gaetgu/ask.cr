<script>

</script>

<main>
    <div class="sidebar a-child-afloat">
        <!-- The Crystal Blog - random blog posts and tips from Crystal devs -->
        <h5>The Crystal Blog</h5>
        <div>
            <p>Content</p>
            <p>More Content</p>
        </div>

        <!-- Features posts - posts chosen as relevant by the mods -->
        <h5>Featured</h5>
        <div>
            <p>Content</p>
            <p>More Content</p>
        </div>

        <!-- Posts with a lot of upvotes or answers -->
        <h5>Popular Posts</h5>
        <div>
            <p>Why is Crystal so cool?</p>
            <p>XMas is almost here!</p>
            <p>These are mostly off-topic</p>
        </div>
    </div>
</main>

<style>
    .sidebar {
        color: white;
        background-color: rgb(49, 58, 71);
        border-radius: 10px;
    }

    .a-child-afloat {
        float: left;
        width: 20%;
        height: 60vh;
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

    @media all and (max-width: 1000px) {
        .sidebar { display: none; width: 12px !important; }
    }
</style>