const articles = $(".article-container");


$(".save").on("click", function () {
    console.log("saving...");
    var articleData = $(this).parents(".card").data();
    $(this).parents(".card").remove();
    articleData.saved = true;
    $.ajax({
        method: "PUT",
        url: "/api/article/" + articleData._id,
        data: articleData
    }).then(function (data) {
        console.log(data);
    });
});

$(".clear").on("click", function () {
    $.get("api/clear").then(function () {
        articles.empty();
    });
});

$(".delete").on("click", function() {
    var articleToDelete = $(this).parents(".card").data();
    $(this).parents(".card").remove();
    $.ajax({
        method: "DELETE",
        url: "/api/articles/" + articleToDelete._id
    }).then(function (data) {
        // If this works out, run initPage again which will re-render our list of saved articles
        if (data.ok) {
            initPage();
        }
    });
});

$(".notes").on("click", function() {
    var currentArticle = $(this).parents(".card").data();
    $.get("/api/notes/" + currentArticle._id).then(function (data) {
        var modalText = $("<div class='container-fluid text-center'>").append(
            $("<h4>").text("Notes For Article: " + currentArticle._id),
            $("<hr>"),
            $("<ul class='list-group note-container'>"),
            $("<textarea placeholder='New Note' rows='4' cols='60'>"),
            $("<button class='btn btn-success save'>Save Note</button>")
        );
        
        bootbox.dialog({
            message: modalText,
            closeButton: true
        });
        var noteData = {
            _id: currentArticle._id,
            notes: data || []
        };
        $(".btn.save").data("article", noteData);
        renderNotesList(noteData);
    });
});
$(".save").on("click", function() {
    var noteData;
    var newNote = $(".bootbox-body textarea").val().trim();
    if (newNote) {
        noteData = {
            _articleId: $(this).data("article")._id,
            noteText: newNote
        };
        $.post("/api/notes", noteData).then(function () {
            bootbox.hideAll();
        });
    }
});
$(".note-delete").on("click", function() {
    var noteToDelete = $(this).data("_id");
    $.ajax({
        url: "/api/notes/" + noteToDelete,
        method: "DELETE"
    }).then(function () {
        bootbox.hideAll();
    });
});

function renderNotesList(data) {
    var notesToRender = [];
    var currentNote;
    if (!data.notes.length) {
        currentNote = $("<li class='list-group-item'>No notes for this article yet.</li>");
        notesToRender.push(currentNote);
    } else {
        for (var i = 0; i < data.notes.length; i++) {
            currentNote = $("<li class='list-group-item note'>")
                .text(data.notes[i].noteText)
                .append($("<button class='btn btn-danger note-delete'>x</button>"));
            currentNote.children("button").data("_id", data.notes[i]._id);
            notesToRender.push(currentNote);
        }
    }
    $(".note-container").append(notesToRender);
}