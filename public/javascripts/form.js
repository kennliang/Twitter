
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
                
                
                //let x = document.getElementById("success_alert");
                //x.style.display = "block";
                /*
                console.log("executed");
                window.setTimeout(function() {
                    console.log("executed");
                    
                    $("#success_alert").fadeTo(500, 0).slideUp(500, function(){
                        
                        //$(this).hide(); 
                        //x.style.display = "none";  
                        console.log("executed2");  
                    });
                }, 2000);
                console.log("executed3");*/
                
            },
            error: function (msg) {
                location.reload();
            },
        });
    });
});