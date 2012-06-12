// Topbar javascript for webpages

// TODO: Gradients for tints

if (forge.is.web()) {

	var topbar = null;

	forge.topbar.show = function (success, error) {
	        $(function () {
	                $('html').css('padding-top','40px');
	                if (topbar == null) {
	                        topbar = {};
	                        // Main bar
	                        topbar.bar = $('<div>');
	                        topbar.bar.css({
	                                position: "fixed",
	                                top: 0,
	                                left: 0,
	                                right: 0,
	                                width: "100%",
	                                height: "40px",
	                                background: "black",
	                                padding: 0,
	                                margin: 0,
	                                display: "block",
	                                "box-shadow": "0 0 2px 2px #000"
	                        });
                        
	                        // Title text
	                        topbar.title = $('<div>');
	                        topbar.title.css({
	                                position: 'absolute',
	                                'text-align': 'center',
	                                color: "#fff",
	                                padding: 0,
	                                margin: 0,
	                                height: "40px",
	                                top: 0,
	                                left: 0,
	                                right: 0,
	                                display: "block",
	                                font: "25px/40px Verdana, Arial"
	                        }).text("Title");
	                        topbar.bar.append(topbar.title);
                        
	                        $('html').append(topbar.bar);
	                } else {
	                        topbar.bar.show();
	                }
	                success && success();
	        });
	};

	forge.topbar.hide = function (success, error) {
	        $(function () {
	                $('html').css('padding-top','0');
	                if (topbar != null) {
	                        topbar.bar.hide();
	                }
	                success && success();
	        });
	};

	forge.topbar.setTitle = function (title, success, error) {
	        $(function () {
	                if (topbar != null) {
	                        topbar.title.text(title);
	                        success && success();
	                } else {
	                        error && error();
	                }
	        });
	};

	forge.topbar.setTitleImage = function (img, success, error) {
	        $(function () {
	                if (topbar != null) {
	                        forge.tools.getURL(img, function (url) {
	                                topbar.title.html('<img style="border: 0; padding: 0; margin: 0; max-height: 25px" src="'+url+'">');
	                                success && success();
	                        });
	                } else {
	                        error && error();
	                }
	        });
	};

	forge.topbar.setTint = function (tint, success, error) {
	        $(function () {
	                if (topbar != null) {
	                        topbar.bar.css("background", "rgba("+tint[0]+","+tint[1]+","+tint[2]+","+tint[3]/255+")");
	                        topbar.bar.css("box-shadow", "0 0 2px 2px rgba("+tint[0]+","+tint[1]+","+tint[2]+","+tint[3]/255+")");
	                } else {
	                        error && error();
	                }
	        });
	};

	forge.topbar.addButton = function (params, callback, error) {
	        $(function () {
	                if (topbar != null) {
	                        var position = "left";
	                        if (params.position != "left" && !topbar.right) {
	                                position = "right";
	                        }
                
	                        if (topbar[position]) {
	                                error && error();
	                        }
                
	                        topbar[position] = $('<div>');
	                        topbar[position].css({
	                                position: 'absolute',
	                                'text-align': 'left',
	                                padding: "0 10px",
	                                top: "5px",
	                                margin: 0,
	                                height: "30px",
	                                overflow: "hidden",
	                                display: "inline-block",
	                                color: "#fff",
	                                font: "15px Verdana, Arial",
	                                background: "black",
	                                border: "1px solid #666",
	                                "border-radius": "5px",
	                                "cursor": "pointer"
	                        }).css(position, "10px");
	                        if (params.icon) {
	                                forge.tools.getURL(params.icon, function (url) {
	                                        topbar[position].css({
	                                                display: "table-cell",
	                                                "font-size": "20px"
	                                        });
	                                        topbar[position].html('<img style="max-height: 30px; padding: 0; margin: 0; border: 0; vertical-align: middle" src="'+url+'">');
	                                });
	                        } else {
	                                topbar[position].css({
	                                        "line-height": "30px"
	                                });
	                                topbar[position].text(params.text);
	                        }
	                        if (params.tint) {
	                                topbar[position].css("background", "rgba("+params.tint[0]+","+params.tint[1]+","+params.tint[2]+","+params.tint[3]/255+")");
	                        }
	                        if (params.style == "done") {
	                                topbar[position].css("background", "#448");
	                        }
	                        topbar.bar.append(topbar[position]);
	                        topbar[position].click(function () {
	                                if (params.type == "back") {
	                                        window.history.go(-1);
	                                } else {
	                                        callback && callback();
	                                }
	                        });
	                } else {
	                        error && error();
	                }
	        });
	};

	forge.topbar.removeButtons = function (success, error) {
	        $(function () {
	                if (topbar.left) {
	                        topbar.left.remove();
	                        topbar.left = null;
	                }
	                if (topbar.right) {
	                        topbar.right.remove();
	                        topbar.right = null;
	                }
	        });
	};

}