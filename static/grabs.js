ajaxURL = 'http://' + location.host

//alert (ajaxURL)

function getPatch(img) {
        $("#editor").empty();
        $("#title").html(img);
        $("#editor").html( '<img height="360" width="640" src="' + ajaxURL + '/get_grab/' + img + '"></img>' );
}

function getPatchList() {
     $.getJSON(ajaxURL + '/get_grabs', function(data) {
        $("#patches").empty();
        $.each(data, function (i,v) {
          
            $patch = $('<img height="108" width="192" src="' + ajaxURL + '/get_grab/' + v + '"></img>').append(v);
            $patch.click(function () {
                getPatch(v);
            });
           $("#patches").append($patch);
        });
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

    getPatchList();


});
