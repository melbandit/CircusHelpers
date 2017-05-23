var api_url = "http://dev.melissasattler.com";
var id = this.id;

$.ajax({
	url: api_url + '/needs',
	method: 'GET'//,
	//dataType: 'json'//,
	//data: {param1: 'value1'},
})
.done(function(data, msg, xhr) {
	console.log("success", data);
	// $(data).each(function(i, message){
	// 	$('<li>' + message.content + "</li>".appendTo('.messages'));
	// })
	for (var i = 0; i < data.length; i++) {
		createNeedElement(data[i])
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
    console.log('post_message clicked', $(this).serialize());

    $.ajax( api_url +"/needs", { 
    	method: "post",
    	data: $(this).serialize()
    }).done(function(data){
    	console.log(data);
    	createNeedElement(data);
    });
});


var createNeedElement = function(messageData) {
    console.log(messageData);
	var date = new Date(messageData.created_at);
	var hours = date.getHours();
	var minutes = "0" + date.getMinutes();
	var formattedTime = hours + ':' + minutes.substr(-2);
	var ampm;
	if (hours >= 12){
		ampm = "PM";
	} else{
		ampm = "AM";
	}
    var $editButton = $('<button type="button" class="delete-need"> Edit </button>');
    var $deleteButton = $('<button type="button" class="delete-need"> X </button>');
    var $inputField = $("<input>").val(messageData.content);
    var $userTimeInfo = $("<p>" +formattedTime + " " + ampm + " " + "<span class='username'>" + messageData._id + '</span></p>');
    var $li = $('<li data-id="'+ messageData.id +'" class="need"></li>');
    
    $editButton.appendTo($li);
    $deleteButton.appendTo($li);
    $userTimeInfo.appendTo($li);
    $inputField.appendTo($li);
    $li.appendTo("#needs");

    // $deleteButton.on( "click", deleteNeedElement);
    // $editButton.on( "click", setUpEditElement);

    // $inputField.on( "keydown", preventTyping);
    // $inputField.on( "keyup", updateNeedElement);
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
            //console.log(data);
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
    console.log("start Editing");
    $(this).parents("li").find("input").focus();

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
            data: {
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



