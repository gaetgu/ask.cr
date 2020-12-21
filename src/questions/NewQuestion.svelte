<script>
    import NavBar from '../globalSite/NavBar.svelte'

    let simplemde = new SimpleMDE();
</script>

<main>
    <NavBar current='none' />

    <h3 class="new-question-title">
        Ask a new question
    </h3>

    <div class="float-container">
        <div class="question-body a-child-afloat">
            <div id="editor">
                <!-- Tips: Editor.md can auto append a `<textarea>` tag -->
                <textarea style="display:none;">### Hello Editor.md !</textarea>
            </div>
            <p class="style-guide">
                ```code```
                **bold**
                *italic*
                >quote
            </p>
        </div>
    </div>
</main>

<style>
    main {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background-color: rgb(45, 45, 45);
    }

    .float-container {
        width: 100%;
    }

    .new-question-title {
        font-weight: 200 !important;
        font-size: 2.1em;
        color: white;
        margin-left: 20%;
        margin-bottom: 20px;
    }

    .question-body {
        margin-left: 17%;
        background-color: rgb(32, 32, 32);
        border-radius: 10px;
        padding: 20px;
    }

    textarea#new-question-raw-txt {
        width: 50vw;
        resize: none;
        outline: none;
        /* overflow: auto; */
        background-color: rgb(32, 32, 32);
        color: white;
        border: none;
    }

    .a-child-afloat {
        float: left;
        padding: 20px;
    }

    .style-guide {
        color: white;
        font-family: monospace;
        font-size: 12px;
    }
</style>