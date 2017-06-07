$(document).ready(function() { 
    var buttons = document.querySelectorAll("button");

    for (var i = 0; i < buttons.length; i++) {
        $('button').removeClass('display-none');
    }
});
var api_url = "http://dev.melissasattler.com";
var id = this.id;

let loggedInUserData;

// get user login status and change UI to match
$.ajax(api_url + "/auth/status").done(function(data, textStatus, jqXHR) {
    console.log("data:", data, "text:" , textStatus, "jqx:" , jqXHR);
    loggedInUserData = data;
    console.log(data);
    if (!loggedInUserData.loggedIn) {
        $("header h3").text("Welcome stranger!");
        $(".link-log-out").hide();
        hideButtons();
    } else {
        if (loggedInUserData.displayName) {
            $("header h3").text("Hello, " + loggedInUserData.displayName);
        } else {
            $("header h3").text("Welcome back Buddy!");
        }
        $(".link-log-in").hide();
        showButtons();
        if (loggedInUserData.image){ 
            $("img.profile-image").attr("src", loggedInUserData.image);
        }
    }
})

$.ajax({
	url: api_url + '/needs',
	method: 'GET'
})
.done(function(data, msg, xhr) {
	for (var i = 0; i < data.length; i++) {
		createNeedElement(data[i]);
	}
})
.fail(function() {
	console.log("error");
})
.always(function() {
	console.log("complete");
});
	
$('.create-need-form').on("submit", function(e){
    e.preventDefault();
   // console.log('post_message clicked', $(this).serialize());

    $.ajax( api_url +"/needs", { 
    	method: "post",
    	data: $(this).serialize()
    }).done(function(data){
    	createNeedElement(data);
    });
});

var createNeedElement = function(needData) {
	var date = new Date(needData.created_at);
	var hours = date.getHours();
	var minutes = "0" + date.getMinutes();
	var formattedTime = hours + ':' + minutes.substr(-2);
	var ampm;
	if (hours >= 12){
		ampm = "PM";
	} else{
		ampm = "AM";
	}
    var $li = $('<li data-id="'+ needData._id +'" class="need need'+ needData.urgent +'"></li>');
    
    var $need = $('<input class="desc need-title" type="textarea">').val(needData.title);
    var $locationTitle = $('<h5 class="location-title">Location</h5>');
    var $location = $('<input class="desc need-location" type="textarea">').val(needData.location);
    var $editButton = $('<button class="btn btn-outline-secondary edit-need display-none" type="button" class="edit-need"> Edit </button>');
    var $deleteButton = $('<button class="btn btn-outline-secondary delete-need display-none" type="button"> X </button>');
    var $inputField = $("<input class='desc' type='textarea'>").val(needData.content);
    var $userTimeInfo = $("<p>" +formattedTime + " " + ampm + " need by " + "<span class='username'>" + needData.user + '</span></p>');
    var $ul = $('<ul class="messages"></ul>');
    var $messageUser = $('<form class="create-message input-group" method="post" action="http://dev.melissasattler.com/needs/messages">' 
        + '<input id="message" class="form-control" type="text" placeholder="how can you help me?..." name="message">' + '<input id="post_message" class="input-group-addon" type="submit">'
        +'</form>');

    $messageUser.appendTo($li);
    $ul.appendTo($li);
    $need.appendTo($li);
    $inputField.appendTo($li);
    $locationTitle.appendTo($li);
    $location.appendTo($li);
    $userTimeInfo.appendTo($li);
    $editButton.appendTo($li);
    $deleteButton.appendTo($li);
    
    $li.appendTo("#needs");

    $editButton.on("click", function() {
        if (!$li.hasClass("editing")) {
            $(this).text("Save");
            $li.addClass("editing");
        } else {
            console.log("send the updates to the back end");
            $.ajax({
                url: api_url + '/needs/' + needData._id,
                method: 'post',
                data: {
                    title: $need.val(),
                    content: $inputField.val(),
                    time: $userTimeInfo.val(),
                    location: $location.val()
                }
            }).done(function(data){
                console.log(data);
                //$edit.replaceWith(data); //remove deleted item from DOM
            }).fail(function() {
                console.log("error");
            })
            .always(function() {
                console.log("complete");
            }); 
            //createMessageElement()

           
        }
    })

    $deleteButton.on( "click", deleteNeedElement);

    for (var i = 0; i < needData.messages.length; i++) {
        createMessageElement(needData.messages[i], needData._id);
    }
}
// $("body").on("click", ".link-log-in", function(){
//     var buttons = document.querySelectorAll("button");
//     for (var i = 0; i < buttons.length; i++) {
//         console.log("buttons recognized");
//         //buttons[i].removeClass('display-none');
//         $('button').removeClass('display-none');
//     }
// });
var showButtons = function() {
    var buttons = document.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
        $('button').removeClass('display-none');
    }
}
var hideButtons = function() {
    var buttons = document.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
        $('button').addClass('display-none');
    }
}

$("body").on("submit", '.create-message', function(e){
    e.preventDefault();
    var $needLi = $(this).parents("li");
    var id = $needLi.attr("data-id");

   console.log("post message to ", api_url +"/needs/" + id + '/messages/');
    
    $.ajax( api_url +"/needs/" + id + '/messages/', { 
        method: "post",
        data: $(this).serialize()
    }).done(function(data){
        //console.log(data);
        createMessageElement(data, id);
    });
    
});

var createMessageElement = function(messageData, needID) {
    console.log(messageData, needID );
    
    var $messageUL = $(".need[data-id='"+needID+"'] ul.messages");

    console.log("message parent: ", $messageUL)
    
    var $li = $('<li data-id="'+ messageData._id +'" class="message">'+ messageData.user +' : '+messageData.text+'</li>');
    $li.appendTo( $messageUL );
    
}
 

var deleteNeedElement = function(){
    console.log("deleted need on", $(this).parents("li").attr("data-id"));
    var $needLi = $(this).parents("li");
    var id = $needLi.attr("data-id");
        $.ajax({
            url: api_url + '/needs/' + id,
            method: 'delete'//,
            //data: {content: edit}
        }).done(function(data){
            console.log(data);
            $needLi.fadeOut(); //remove deleted item from DOM
        }).fail(function() {
        console.log("error");
        })
        .always(function() {
            console.log("complete");
        }); 
        //createMessageElement()
}

var setUpEditElement = function(){
    //console.log("start Editing");
    $(this).parents("li").find("input.desc").focus();

    $(this).parents("li").addClass('editing').siblings().removeClass('editing');

}

var preventTyping = function() {
    if($(this).parents("li").hasClass('editing')){

    } else{
        event.preventDefault();
    }
}


var updateNeedElement = function(){
    console.log("edit item on type");

    var $edit = $(this).parents("li").hasClass('editing');
    var id = $(this).parents("li").attr("data-id");

    if($(this).parents("li").hasClass('editing')){
         $.ajax({
            url: api_url + '/needs/' + id,
            method: 'post',
            needs: {
                content: $(this).val()
            }
        }).done(function(data){
            console.log(data);
            //$edit.replaceWith(data); //remove deleted item from DOM
        }).fail(function() {
        console.log("error");
        })
        .always(function() {
            console.log("complete");
        }); 
        //createMessageElement()

    } else {
        event.preventDefault();
    }
}



