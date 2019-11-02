
$(document).ready(function(){

    $("#success_alert").alert();
    window.setTimeout(function() { $("#success_alert").alert('close'); }, 4000);
    $("#error_alert").alert();
    window.setTimeout(function() { $("#error_alert").alert('close'); }, 4000);
    
    $("#register").submit(function(event){
        event.preventDefault(); 
        var post_url = $(this).attr("action"); 
        var request_method = $(this).attr("method");    
        $.ajax({
            url: post_url,
            type: request_method,
            contentType:"application/json; charset=utf-8",
            data: JSON.stringify({
                username: document.getElementById("username").value,
                password: document.getElementById("password").value,
                email: document.getElementById("email").value,
            }),
            success: function(data) {
                window.location.replace("/verify");    
            },
            error: function (msg) {
                location.reload();
            },
        });
    });

    $("#verify").submit(function(event){
        event.preventDefault(); 
        var post_url = $(this).attr("action"); 
        var request_method = $(this).attr("method");    
        $.ajax({
            url: post_url,
            type: request_method,
            contentType:"application/json; charset=utf-8",
            data: JSON.stringify({
                email: document.getElementById("email").value,
                key: document.getElementById("key").value,
            }),
            success: function(data) {
                window.location.replace("/login");    
            },
            error: function (msg) {
                location.reload();
            },
        });
    });

    $("#login").submit(function(event){
        event.preventDefault(); 
        var post_url = $(this).attr("action"); 
        var request_method = $(this).attr("method");    
        $.ajax({
            url: post_url,
            type: request_method,
            contentType:"application/json; charset=utf-8",
            data: JSON.stringify({
                username: document.getElementById("username").value,
                password: document.getElementById("password").value,
            }),
            
            success: function(data) {
                window.location.replace("/additem");    
                console.log("yay");
            },
            error: function (msg) {
                location.reload();
            },
        });
    });

    $("#logout").submit(function(event){
        event.preventDefault(); 
        var post_url = $(this).attr("action"); 
        var request_method = $(this).attr("method");    
        $.ajax({
            url: post_url,
            type: request_method,
            contentType:"application/json; charset=utf-8",
            data: JSON.stringify({
        
            }),
            success: function(data) {
                window.location.replace("/");    
            },
            error: function (msg) {
                location.reload();
            },
        });
    });

    $("#additem").submit(function(event){
        event.preventDefault(); 
        var post_url = $(this).attr("action"); 
        var request_method = $(this).attr("method");    
        $.ajax({
            url: post_url,
            type: request_method,
            contentType:"application/json; charset=utf-8",
            data: JSON.stringify({
                content: document.getElementById("content").value,
                childType: document.getElementById("childType").value,
            }),
            success: function(data) {
                console.log(data);
                window.location.replace("/post/" + data.id);    
            },
            error: function (msg) {
                location.reload();
            },
        });
    });

    $("#search").submit(function(event){
        event.preventDefault(); 
        var post_url = $(this).attr("action"); 
        var request_method = $(this).attr("method");    
        //console.log(post_url);
        //console.log(document.getElementById("timestamp"));
        //console.log(request_method);
        $.ajax({
            url: post_url,
            type: request_method,
            contentType:"application/json; charset=utf-8",
            data: JSON.stringify({
                timestamp: document.getElementById("timestamp").valueAsNumber,
                limit: document.getElementById("limit").valueAsNumber,
            }),
            success: function(data) {
                
                
                let html_result = "";
                let items = data.items;
                //console.log(items);
                for(let i = 0 ; i < items.length; i++)
                {
                   
                    html_result += "<div class='row mt-5'>" +
                    "<div class='col-md-6 m-auto'>" +
                    "<div class='card'>" +
                    "<div class='card-header'>"+
                    "<h5 class='card-title'>Username:  "+ items[i].username + "  ID:  " + items[i].id + "</h5></div>"+
                    "<div class='card-body'>"+
                    "<p class='card-text'>Content:  " + items[i].content + "</p></div>"+
                    "<div class='card-footer'>"+
                    "<p>Likes:  "+ items[i].property.likes + "  Retweets: "+ items[i].retweeted + " Timestamp: " + items[i].timestamp + "</p>"+
                    "</div> </div> </div> </div>";
                    //html_result += string;
                    //console.log(string);
                }
                //console.log(html_result);
                $("#result").html(html_result);
                
            },
            error: function (msg) {
                console.log("error in search " + msg);
                location.reload();
            },
        });
    });
    
    
});