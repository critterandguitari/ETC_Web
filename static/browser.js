var appBaseURL = 'http://' + location.host
var fsurl = appBaseURL + '/fmdata'
var workingDir = '/sdcard/';
var baseDirLabel = 'Home';
var clipboard = {};

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
    return $('<div class="fname-icon"><img src="'+img+'" width=20/></div><div class="fname-name">' + basename + '</div><div style="clear:left;"/>');
}

function renderFilesTable(d){
    $("#ftable").empty();
    var path = '';
    d.forEach(function(c){
        var basename = c.path.split('/').pop();
        var sizeType = 'Folder'  // display size or Folder for folder
        if (c.type == 'folder'){
            sizeType = 'Folder'
            var trow = $('<tr class="fsdir">');
            var tdata = $('<td class="fsdirname"></td>');
            tdata.append(nodeNameWithIcon(c.path, c.type));
        } else {
            sizeType = c.size;
            var trow = $('<tr class="fsfile">');
            var tdata = $('<td class="fsfilename">');
            var dlButton = $('<a class="dl-but" href="'+appBaseURL+'/download?fpath='+encodeURIComponent(c.path)+'&cb=cool"><span class="glyphicon glyphicon-download-alt"></span></a>');
            tdata.append(dlButton);
            tdata.append(nodeNameWithIcon(c.path, c.type));
        }
        trow.data("path", c.path);
        trow.data("type", c.type);
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
            if (count == 0) var breadelement = $('<li class="fsdir">' + baseDirLabel + '/</li>');
            else var breadelement = $('<li class="fsdir">' + p + '/</li>');
            count++;
            breadelement.data("path", absPath);
            $("#fsbreadcrumb").append(breadelement);
        }
    });
}

// init the modal dialog with title
function newModal(title){
    $('#modal-dialog-contents').empty();
    $('#modal-dialog-contents').append('<div id="modal-dialog-title">'+title+'</div>');
    $('#modal-dialog-contents').append('<div id="modal-dialog-body"></div>');
}

// add to the modal body
function addModalBody(stuff){
    $('#modal-dialog-body').append(stuff);
}

// add button to the modal
function addModalButton(name, callback){
    button = $('<div id="modal-button-'+name+'"class="modal-button">'+name+'</div>').click(callback);
    $('#modal-dialog-contents').append(button);
}

function showModal(){
    // for the buttons floating left
    $('#modal-dialog-contents').append('<div style="clear:both"></div>');
    $('body').addClass("dialog");
}

function hideModal(){
    $('body').removeClass("dialog");
}

function alertDialog(msg){
    newModal('Atención');
    addModalBody('<p>'+msg+'</p>');
    addModalButton('Cancel', hideModal);
    showModal();
}

function pasteCopyDialog(){
    newModal('Copy');
    addModalBody('<p>Copy files: </p>');   
    clipboard.nodes.forEach(function(n) {
        addModalBody(nodeNameWithIcon(n.path,n.type));   
    });       
    addModalBody('<p>to current folder?</p>');   
    addModalButton('Cancel', hideModal)
    addModalButton('Paste', function(){
        hideModal();
        clipboard.nodes.forEach(function(n) {
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
    showModal();
}

function pasteMoveDialog(){
    newModal('Move');
    addModalBody('<p>Move files: </p>');   
    clipboard.nodes.forEach(function(n) {
        addModalBody(nodeNameWithIcon(n.path,n.type));  
    });       
    addModalBody('<p>to current folder?</p>');  
    addModalButton('Cancel', hideModal);
    addModalButton('Move',  function(){
        hideModal();
        clipboard.nodes.forEach(function(n) {
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
    showModal();
}

function deleteDialog(){
    var selectedNodes = getSelectedNodes(); 
    
    if (selectedNodes.length > 0) {
        newModal('Delete');
        addModalBody('<p>Permanentamentally remove these files?</p>');
        
        selectedNodes.forEach(function(n) {
            addModalBody(nodeNameWithIcon(n.path,n.type));   
        });

        addModalButton('Cancel', hideModal);
        addModalButton('Delete', function(){
            hideModal();
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
        showModal();
    }
    else alertDialog("Choose one or more files to delete.");
}

function zipDialog(){
    var selectedNodes = getSelectedNodes();
    var gotaZip = false;
    if (selectedNodes.length == 1) {
        var path = selectedNodes[0].path;
        var basename = path.split('/').pop();
        if (selectedNodes[0].type == 'folder') {
            gotaZip = true;
            newModal('Zip Folder');
            addModalBody('<p>Zip <b>'+basename+'?</b></p>');   
            addModalButton('Cancel', hideModal)
            addModalButton('Zip', function(){
                hideModal();
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
            showModal();
        }
    } 
    if (!gotaZip) alertDialog('<p>Choose one folder to zip.</p>');   
}

function unzipDialog(){
    var selectedNodes = getSelectedNodes();
    var gotaZip = false;
    if (selectedNodes.length == 1) {
        var path = selectedNodes[0].path;
        var basename = path.split('/').pop();
        var extension = basename.split('.').pop();

        if (extension == 'zip') {
            gotaZip = true;
            newModal('Unzip');
            addModalBody('<p>Unzip <b>'+basename+'</b> into current folder?</p>');   
            addModalButton('Cancel', hideModal)
            addModalButton('Unzip', function(){
                hideModal();
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
            showModal();
        }
    } 
    if (!gotaZip) alertDialog('<p>Choose one .zip file to unzip.</p>');   
}

function renameDialog() {
    var selectedNodes = getSelectedNodes();
    if (selectedNodes.length == 1) {
        var path = selectedNodes[0].path;
        var basename = path.split('/').pop();
        newModal('Rename');
        addModalBody('<input type="text" id="rename-node" value="'+basename+'"></input>');
        addModalButton('Cancel', hideModal);
        addModalButton('Rename', function(){
            hideModal();
            var selectedNodes = getSelectedNodes();
            n = selectedNodes[0];
            $.get(fsurl+'?operation=rename_node', { 'path' : n.path, 'name' : $('#rename-node').val() })
            .done(function () {
                console.log('renamed 1');
                refreshWorkingDir();
            })
            .fail(function () {
                console.log('problem moving');
            });
            clipboard = {};
        });
        showModal();
    } 
    else alertDialog('<p>Choose one item to rename.</p>');  
}

function newFolderDialog() {
    newModal('New Folder');
    addModalBody('<input type="text" id="new-folder-name" value="Untitled"></input>');
    addModalButton('Cancel', hideModal);
    addModalButton('New Folder', function(){
        hideModal();
        $.get(fsurl+'?operation=create_node', { 'path' : workingDir, 'name' : $('#new-folder-name').val() })
        .done(function () {
            console.log('created 1');
        	refreshWorkingDir();
        })
        .fail(function () {
            console.log('problem creating folder');
        });
    });
    showModal();
}

function openFileDialog(path) {
    newModal('Open File');
    addModalBody('Are you sure you want to open this file? Unsaved changes to the current file will be lost!');
    addModalButton('Cancel', hideModal);
    addModalButton('Open', function () {
        hideModal();
        console.log('going to get file: ' + path);
        getFile(path);
    });
    showModal();
}

$(function () {

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
            $('#progress-bar-progress').css(
                'width',
                progress + '%'
            );
        }
    }).prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');
    $('#fileupload').bind('fileuploadstart', function (e) {
        newModal('Uploading...');
        addModalBody('<div id="progress-bar"><div id="progress-bar-progress"></div></div>');
        showModal();
    });
    $('#fileupload').bind('fileuploadstop', function (e, data) {
        hideModal();
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

    $("#new-folder-but").click(newFolderDialog);


    $("#rename-but").click(renameDialog);

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
        if (clipboard.nodes && clipboard.nodes.length > 0 ){
            if (clipboard.operation == "copy") pasteCopyDialog();
            else if (clipboard.operation == "cut") pasteMoveDialog();
        }
        else alertDialog('<p>Choose files then select Copy or Cut to move.</p>');   
    });
   
    $("#delete-but").click(deleteDialog);

    $("#zip-but").click(zipDialog);

    $("#unzip-but").click(unzipDialog);

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
        var target = $(event.target);
        if (!target.is("input")) {
            var path=$(this).data("path");
            openFileDialog(path);
        }
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


