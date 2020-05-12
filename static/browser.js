
var appBaseURL = 'http://' + location.host
var fsurl = appBaseURL + '/fmdata'
var workingDir = '/sdcard/';
var baseDirLabel = 'SD Card';
var clipboard = {};

function alertDialog(msg){
    $('#info-modal').modal({backdrop: false});
    $('#info-modal-msg').empty();   
    $('#info-modal-msg').append('<p>'+msg+'</p>');   
}

function refreshWorkingDir(){
    $.get(fsurl+'?operation=get_node', { 'path' : workingDir})
    .done(function (d) {
        renderFilesTable(d);
        renderBreadcrumb();
    })
    .fail(function () {
        console.log('problem refreshing');
        // if that was an attempt to load non existent sdcard folder set base back to usbdrive
        if (workingDir == '/sdcard/') {
            alertDialog('SD Card storage not available on this Organelle.');
            workingDir = '/usbdrive/';
            baseDirLabel = 'USB Drive';
        }
        else {
            alertDialog('Error loading file or folder.');
        }
    });
}

function getWorkingDir() {
    console.log("current dir:" + workingDir);
    return workingDir;
}

function getSelectedNodes(){
    var selectedNodes = [];
    $(".checkbox > input").each(function(){
        if ($(this).is(":checked")) {
            var node = {
                'path' : $(this).closest('tr').data('path'),
                'type' : $(this).closest('tr').data('type'),
            }
            selectedNodes.push(node);
        }
    });
    return selectedNodes
}

function selectedIsOneFile(){
    var selectedNodes = getSelectedNodes();
    console.log(selectedNodes);
    if (selectedNodes.length == 1 && selectedNodes[0].type == 'file') return true;
    else return false;
}

function nodeNameWithIcon(path, type){
    var basename = path.split('/').pop();

    console.log(type);
    if (type == "file"){
        var extension = basename.split('.').pop();
        var img = '';
        if (extension == 'pd') img = "./assets/pd.png";
        else if (extension == 'wav') img = "./assets/wav.png";
        else img = "./assets/txt.png";
    } else {
        img = "./assets/folder.png";
    }
    return $('<span class="fname-icon"><img src="'+img+'" width=20/>&nbsp;&nbsp;' + basename + '</span>');
}

function renderFilesTable(d){
    $("#ftable").empty();
    var path = '';
    d.forEach(function(c){
        var basename = c.path.split('/').pop();
        var sizeType = 'Folder'  // display size or Folder for folder
        if (c.type == 'folder'){
            sizeType = 'Folder'
            var trow = $('<tr class="">');
            var tdata = $('<td class="fsdirname fsdir"><span class="gspacer" /></td>');
            tdata.append(nodeNameWithIcon(c.path, c.type));
        } else {
            sizeType = c.size;
            var trow = $('<tr class="">');
            var tdata = $('<td class="fsfilename fsfile">');
            var dlButton = $('<a class="dl-but" href="'+appBaseURL+'/download?fpath='+encodeURIComponent(c.path)+'&cb=cool"><span class="glyphicon glyphicon-download-alt"></span></a>');
            tdata.append(dlButton);
            tdata.append(nodeNameWithIcon(c.path, c.type));
        }
        tdata.data("path", c.path);
        tdata.data("type", c.type);
        var checkbox = $('<td><div class="checkbox ff-select"><input type="checkbox" value=""></div></td>');
        trow.append(checkbox);
        trow.append(tdata);
        //trow.append('<td>'+sizeType+'</td>');
        $("#ftable").append(trow);
    });
    window.scrollTo(0,0);
}

function renderBreadcrumb () {
    $("#fsbreadcrumb").empty();
    var absPath = '';
    // NOTE hack for removing base dir and replacing with SD CARD or USB DRIVE for Organelle
    //var breadelement = $('<li class="fsdir"><a href="#">'+baseDirLabel+'</a></li>');
    //breadelement.data("path", absPath);
   // $("#fsbreadcrumb").append(breadelement);
    path = workingDir.split('/');
    var count = 0;
    path.forEach(function(p) {
        if (p) {
            absPath +=  p + '/';
            if (count == 0) var breadelement = $('<li class="fsdir">' + baseDirLabel + '</li>');
            else var breadelement = $('<li class="fsdir">' + p + '</li>');
            count++;
            breadelement.data("path", absPath);
            $("#fsbreadcrumb").append(breadelement);
        }
    });
}

$(function () {
    
    // button actions
    $("#resync-but").click(function(){
        $.get(appBaseURL+'/resync')
        .done(function (d) {
            console.log('resync done');
        })
        .fail(function () {
            console.log('problem with resync');
        });
    });

    $("#flash-but").click(function(){
        $.get(appBaseURL+'/flash')
        .done(function (d) {
            console.log('flashed');
        })
        .fail(function () {
            console.log('problem with flash');
        });
    });

    $('#fileupload').fileupload({
		// DISABLE drag and drop uploading
       	dropZone: null,  
		url: appBaseURL + '/upload',
        dataType: 'json',
        formData: function() {
            return [{'name':'dst', 'value':getWorkingDir()}];
        },
        done: function (e, data) {
            $.each(data.result.files, function (index, file) {
                //$('<p/>').text(file.name).appendTo('#files');
            });
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .progress-bar').css(
                'width',
                progress + '%'
            );
        }
    }).prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');
    $('#fileupload').bind('fileuploadstart', function (e) {$('#upload-modal').modal({backdrop: false});});
    $('#fileupload').bind('fileuploadstop', function (e, data) {
        $('#upload-modal').modal('hide');
        refreshWorkingDir()
        console.log(data);
    });

	$(document).bind('drop dragover', function (e) {
		e.preventDefault();
	});

    $("#usb-sel-but").click(function(){
        baseDirLabel = 'USB Drive';
        workingDir = '/usbdrive/';
        refreshWorkingDir();
    });

    $("#sd-sel-but").click(function(){
        baseDirLabel = 'SD Card';
        workingDir = '/sdcard/';
        refreshWorkingDir();
    });

    $("#new-folder-but").click(function(){
        $('#new-folder-modal').modal({backdrop: false});
    });

    $("#confirm-new-folder").click(function(){
        $('#new-folder-modal').modal('hide');
        $.get(fsurl+'?operation=create_node', { 'path' : workingDir, 'name' : $('#new-folder-name').val() })
        .done(function () {
            console.log('created 1');
        	refreshWorkingDir();
        })
        .fail(function () {
            console.log('problem creating folder');
        });
    });


    $("#rename-but").click(function(){
        var selectedNodes = getSelectedNodes();
        if (selectedNodes.length == 1) {
            var path = selectedNodes[0].path;
            var basename = path.split('/').pop();
            $('#rename-modal').modal({backdrop: false});
            $('#rename-text').val(basename);

        } 
        else {
            $('#info-modal').modal({backdrop: false});
            $('#info-modal-msg').empty();   
            $('#info-modal-msg').append('<p>Choose one item to rename.</p>');   
        }
    });

    $("#confirm-rename").click(function(){
        $('#rename-modal').modal('hide');
        var selectedNodes = getSelectedNodes();
        n = selectedNodes[0];
        $.get(fsurl+'?operation=rename_node', { 'path' : n.path, 'name' : $('#rename-text').val() })
        .done(function () {
            console.log('renamed 1');
        	refreshWorkingDir();
        })
        .fail(function () {
            console.log('problem moving');
        });
        clipboard = {};
    });

    $("#copy-but").click(function(){
        clipboard.operation = "copy";
        clipboard.nodes = getSelectedNodes();
        console.log(clipboard);
    });

    $("#cut-but").click(function(){
        clipboard.operation = "cut";
        clipboard.nodes = getSelectedNodes();
        console.log(clipboard);
    });

    $("#paste-but").click(function(){
        var selectedNodes = clipboard.nodes;
        if (clipboard.nodes && clipboard.nodes.length > 0 ){
            if (clipboard.operation == "copy") {
                $('#copy-modal').modal({backdrop: false});
                $('#copy-modal-msg').empty();   
                $('#copy-modal-msg').append('<p>Paste files: </p>');   
                selectedNodes.forEach(function(n) {
                    $('#copy-modal-msg').append('<p>').append(nodeNameWithIcon(n.path,n.type));   
                });       
                $('#copy-modal-msg').append('<p> <br /> to current folder?</p>');   
            }
            else if (clipboard.operation == "cut") {
                $('#move-modal').modal({backdrop: false});
                $('#move-modal-msg').empty();   
                $('#move-modal-msg').append('<p>Move files: </p>');   
                selectedNodes.forEach(function(n) {
                    $('#move-modal-msg').append('<p>').append(nodeNameWithIcon(n.path,n.type));  
                });       
                $('#move-modal-msg').append('<p> <br />to current folder?</p>');   
            }
        }
        else {
            $('#info-modal').modal({backdrop: false});
            $('#info-modal-msg').empty();   
            $('#info-modal-msg').append('<p>Choose files then select Copy or Cut to move.</p>');   
        }
    });

    $("#confirm-move").click(function(){
      
        $('#move-modal').modal('hide');
        var selectedNodes = clipboard.nodes;
        selectedNodes.forEach(function(n) {
            $.get(fsurl+'?operation=move_node', { 'src' : n.path, 'dst' : workingDir })
            .done(function () {
                console.log('moved 1');
				refreshWorkingDir();
            })
            .fail(function () {
                console.log('problem moving');
            });
        });
        clipboard = {};
    });

    $("#confirm-copy").click(function(){
        $('#copy-modal').modal('hide');
        var selectedNodes = clipboard.nodes;
        selectedNodes.forEach(function(n) {
            $.get(fsurl+'?operation=copy_node', { 'src' : n.path, 'dst' : workingDir })
            .done(function () {
                console.log('copied 1');
        		refreshWorkingDir();
            })
            .fail(function () {
                console.log('problem copying');
            });
        });
        clipboard = {};
    });

    $("#delete-but").click(function(){
        var selectedNodes = getSelectedNodes();
        $('#del-node-list').empty();
        $('#del-modal').modal({backdrop: false});
        selectedNodes.forEach(function(n) {
            $('#del-node-list').append('<p>').append(nodeNameWithIcon(n.path,n.type));   
        });
    });

    $("#confirm-delete").click(function(){
        $('#del-modal').modal('hide');
        var selectedNodes = getSelectedNodes();
        selectedNodes.forEach(function(n) {
            $.get(fsurl+'?operation=delete_node', { 'path' : n.path })
            .done(function () {
                console.log('deleted 1');
        		refreshWorkingDir();
            })
            .fail(function () {
                console.log('problem deleting');
            });
        });
    });

    $("#zip-but").click(function(){
        var selectedNodes = getSelectedNodes();
        var gotaZip = false;
        if (selectedNodes.length == 1) {
            var path = selectedNodes[0].path;
            var basename = path.split('/').pop();

            if (selectedNodes[0].type == 'folder') {
                gotaZip = true;
                $('#zip-modal').modal({backdrop: false});
                $('#zip-modal-msg').empty();   
                $('#zip-modal-msg').append('<p>Zip <b>'+basename+'?</b></p>');   
            }
        } 
        if (!gotaZip){
            $('#info-modal').modal({backdrop: false});
            $('#info-modal-msg').empty();   
            $('#info-modal-msg').append('<p>Choose one folder to zip.</p>');   
        }
    });

    $("#confirm-zip").click(function(){
        $('#zip-modal').modal('hide');
        var selectedNodes = getSelectedNodes();
        n = selectedNodes[0];
		$.get(fsurl+'?operation=zip_node', { 'path' : n.path })
        .done(function () {
            console.log('zipped 1');
        	refreshWorkingDir();
        })
        .fail(function () {
            console.log('problem zipping');
        });
    });

    $("#unzip-but").click(function(){
        var selectedNodes = getSelectedNodes();
        var gotaZip = false;
        if (selectedNodes.length == 1) {
            var path = selectedNodes[0].path;
            var basename = path.split('/').pop();
            var extension = basename.split('.').pop();

            if (extension == 'zip') {
                gotaZip = true;
                $('#unzip-modal').modal({backdrop: false});
                $('#unzip-modal-msg').empty();   
                $('#unzip-modal-msg').append('<p>Unzip <b>'+basename+'</b> into current folder?</p>');   
            }
        } 
        if (!gotaZip){
            $('#info-modal').modal({backdrop: false});
            $('#info-modal-msg').empty();   
            $('#info-modal-msg').append('<p>Choose one .zip file to unzip.</p>');   
        }
    });

    $("#confirm-unzip").click(function(){
        $('#unzip-modal').modal('hide');
        var selectedNodes = getSelectedNodes();
        n = selectedNodes[0];
        $.get(fsurl+'?operation=unzip_node', { 'path' : n.path })
        .done(function () {
 	        console.log('unzipped 1 going to refresh');
        	refreshWorkingDir();
        })
        .fail(function () {
            console.log('problem unzipping');
        });
    });

    // click on directory table row, excluding input elements
    $('body').on('click', '.fsdir', function(event) {
        var target = $(event.target);
        if (!target.is("input")) {
            workingDir = $(this).data("path");
            refreshWorkingDir();
        }
    });

    // click on file row, excluding input elements
    $('body').on('click', '.fsfile', function(event) {
            var path=$(this).data("path");
 	        console.log('going to get file: ' + path);
            getFile(path);
    });

    $.get(fsurl+'?operation=get_node', { 'path' : workingDir})
    .done(function (d) {
        renderFilesTable(d);
        renderBreadcrumb();
    })
    .fail(function () {
        console.log('oops');
    });    
});


