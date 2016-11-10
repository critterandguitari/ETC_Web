editor = null
currentPatch = ''
ajaxURL = 'http://' + location.host

//alert (ajaxURL)

function sendCmd(cmd) {
    $.post(ajaxURL + "/send_command", { data: cmd })
    .done(function(data) {
         // alert(data);
    });
}

function getPatch(patch) {
    $.get(ajaxURL + '/get_patch/' + patch, function(data) {
        editor.setValue(data)
        editor.gotoLine(1)
        currentPatch = patch
        $("#title").html(patch)
    });
}

function getPatchList() {
     $.getJSON(ajaxURL + '', function(data) {
        $("#patches").empty();
        $.each(data, function (i,v) {
          
            $patch = $('<div class="side-button"></div>').append(v);
            $patch.click(function () {
                getPatch(v);
            });
           $("#patches").append($patch);
        });
    });
}

function saveNewPatch() {
    
    newName = prompt('Enter New Name (No Spaces!)')

    if (newName == null) {
        alert('f');
    }

    $.post(ajaxURL + "/save_new", { name: newName, contents: editor.getValue() })
    .done(function(data) {
        // reload patch list
        getPatchList();
         // alert(data);
    });
}

function savePatch() {
    
    $.post(ajaxURL + "/save", { name: currentPatch, contents: editor.getValue() })
    .done(function(data) {
         // alert(data);
    });
}

$(document).ready(function() {


    // this disables page while loading things 
    $("body").on({
        // When ajaxStart is fired, add 'loading' to body class
        ajaxStart: function() { 
            $(this).addClass("loading"); 
        },
        // When ajaxStop is fired, rmeove 'loading' from body class
        ajaxStop: function() { 
            $(this).removeClass("loading"); 
        }    
    });

        
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/merbivore_soft");
    editor.getSession().setMode("ace/mode/python");
    //$("#editor").style.fontSize='16px';
    document.getElementById('editor').style.fontSize='14px';
    getPatchList();

    $("#clear-screen").click(function() {
        sendCmd("cs\n");
    });

    $("#screengrab").click(function() {
        sendCmd("screengrab\n");
    });


    $("#reload-patch").click(function() {
        sendCmd("rlp\n");
    });


    $("#osd-toggle").click(function() {
        sendCmd("osd\n");
    });

    $("#quit").click(function() {
        sendCmd("quit\n");
    });



    $("#save-new").click(function() {
        saveNewPatch();
    });



    $("#save").click(function() {
        savePatch();
    });

});
