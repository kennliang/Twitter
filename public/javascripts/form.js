
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
                //console.log(data.items);
                //window.location.replace("");    
                //location.reload();
                let data_array = data.items;
                let x = document.body.querySelectorAll("div.special");
                //console.log(x);
                for(let i = 0; i < x.length; i++)
                    document.body.removeChild(x[i]);
                for(let i = 0; i < data_array.length; i++)
                {
                    let row = document.createElement("div");
                    row.setAttribute("class","row mt-5 special");
                    let col = document.createElement("div");
                    col.setAttribute("class","col-md-6 m-auto");
                    let card = document.createElement("div");
                    card.setAttribute("class","card");
                    let cardheader = document.createElement("div");
                    cardheader.setAttribute("class","card-header");
                    let headertext = document.createElement("h5");
                    headertext.setAttribute("class","card-title");
                    headertext.innerHTML = 'POST #' + (i+1) + '  Username: ' + data_array[i].username + '   ID: ';
                    let linktext = document.createElement("a");
                    linktext.setAttribute("href","/post/"+ data_array[i].id);
                    linktext.innerHTML = data_array[i].id;
                    cardheader.appendChild(headertext);
                    headertext.appendChild(linktext);
                    let cardbody = document.createElement("div");
                    cardbody.setAttribute("class","card-body");
                    let cardtext = document.createElement("p");
                    cardtext.setAttribute("class","card-text");
                    cardtext.innerHTML = 'Content: ' + data_array[i].content;
                    cardbody.appendChild(cardtext);
                    let cardfooter = document.createElement("div");
                    cardfooter.setAttribute("class","card-footer");
                    let footertext = document.createElement("p");
                    footertext.innerHTML = 'Likes: ' + data_array[i].property.likes  + '    Retweets: ' + data_array[i].retweeted + '   Timestamp: ' + data_array[i].timestamp;
                    //cardtext.setAttribute("class","card-text");
                    cardfooter.appendChild(footertext);
                    row.appendChild(col);
                    col.appendChild(card);
                    card.appendChild(cardheader);
                    card.appendChild(cardbody);
                    card.appendChild(cardfooter);
                    document.body.appendChild(row);
                }
            },
            error: function (msg) {
                console.log("error in search " + msg);
                location.reload();
            },
        });
    });
    
});