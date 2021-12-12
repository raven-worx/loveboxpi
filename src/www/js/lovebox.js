
function isNumericInput(evt) {
	var charCode = (evt.which) ? evt.which : event.keyCode
	if (charCode > 31 && (charCode < 48 || charCode > 57))
		return false;
	return true;
}

function setInputValue(item, value) {
	var el = $(item)
	if( el ) {
		el.val(value)
		el.change()
		return true
	} else {
		return false
	}
}

function increaseInputValue(item) {
	var el = $(item)
	if( el ) {
		var value = parseInt(el.val(), 10);
		value = isNaN(value) ? 10 : value;
		value++;
		el.val(value)
		el.change()
		return true
	}
	return false
}

function decreaseInputValue(item) {
	var el = $(item)
	if( el ) {
		var value = parseInt(el.val(), 10);
		value = isNaN(value) ? 10 : value;
		value--;
		if( value > 0 ) {
			el.val(value)
			el.change()
			return true
		}
	}
	return false
}

function showSuccessMessage(msg) {
	var alertEl = $("<div class=\"alert alert-success alert-dismissible fade show hide position-fixed start-50 translate-middle-x\" style=\"bottom: 50px;\" role=\"alert\"><i class=\"bi bi-check-circle-fill\"></i> " + msg + "</div>")
	$("body").append(alertEl)
	setTimeout(function() {
		bootstrap.Alert.getOrCreateInstance( alertEl.get(0) ).close()
	}, 2000);
}

function showErrorMessage(msg) {
	var alertEl = $("<div class=\"alert alert-danger alert-dismissible fade show hide position-fixed start-50 translate-middle-x\" style=\"bottom: 50px;\" role=\"alert\"><i class=\"bi bi-exclamation-triangle-fill\"></i> " + msg + "</div>")
	$("body").append(alertEl)
	setTimeout(function() {
		bootstrap.Alert.getOrCreateInstance( alertEl.get(0) ).close()
	}, 3000);
}

function setMessage() {
	var c = $("#editor_canvas").prop("fabric")
	var imgData = c.toDataURL({format: 'png'}).replace(/^data:image\/png;base64,/, "")
	
	$.ajax({
		method: "POST",
		url: "api/v1/display",
		data: { image: imgData }
	})
	.done(function() {
		showSuccessMessage("Successfully set message")
	})
	.fail(function() {
		showErrorMessage("Failed to set message")
	})
	.always(function() {
		// clear spinning
	});
}

function clearMessage() {
	$.ajax({
		method: "DELETE",
		url: "api/v1/display"
	})
	.done(function() {
		showSuccessMessage("Successfully cleared message");
	})
	.fail(function() {
		showErrorMessage("Failed to clear message")
	})
	.always(function() {
		// clear spinning
	});
}

function saveSettings() {
	var formData = {
		"led": {
			"enabled": $("form#settings-form #led_enabled").is(":checked") ? 1 : 0,
			"color": $("form#settings-form #led_color").val()
		}
	}
	
	$.ajax({
		method: "POST",
		url: "api/v1/settings",
		data: JSON.stringify(formData),
		processData: false,
		contentType: "application/json"
	})
	.done(function() {
		showSuccessMessage("Successfully saved settings")
	})
	.fail(function() {
		showErrorMessage("Failed to save settings")
	})
	.always(function() {
		// clear spinning
	});
}

function retrieveSettings() {
	$.ajax({
		method: "GET",
		url: "api/v1/settings",
		cache: false,
		contentType: "application/json"
	})
	.done(function(data) {
		console.log( JSON.stringify(data) )
	})
	.fail(function() {
		console.error("Failed to retrieve settings")
	})
	.always(function() {
		// clear spinning
	});
}


$( document ).ready(function() {
	/*
		NAVIGATION
	*/
	function lb_navigate(item)
	{
		if( item.hasClass("active") )
			return;
		
		var target = item.data("bs-target")
		
		$("#navbarContent a.nav-link").each( function() {
		if( $(this).attr('data-bs-target') == target )
			$(this).addClass("active")
		else
			$(this).removeClass("active")
		});
		
		$("#pages .page").each(function() {
			if( $(this).attr('id') == target )
				$(this).show()
			else
				$(this).hide()
		})
	}
	$( "#navbarContent a.nav-link" ).bind( "click", function(event) {
		event.preventDefault();
		lb_navigate( $(this) )
	});
	lb_navigate( $("#navbarContent a.nav-link").first() )

	/*
		DISPLAY EDITOR (fabricjs)
	*/
	var canvas = new fabric.Canvas('editor_canvas', {
		backgroundColor: '#ffffff',
		selectionColor: "rgba(173, 216, 230,0.7)",
		selectionLineWidth: 1
	});
	$("#editor_canvas").prop("fabric", canvas)
	
	canvas.setEditorMode = function(mode) {
		switch(mode) {
			case "selection":
				this.isDrawingMode = false
				break;
			case "freedraw":
				this.freeDrawingBrush = new fabric.PencilBrush(this);
				this.freeDrawingBrush.width = parseInt($('#editor_brush_size').val())
				this.isDrawingMode = true
				break;
			case "eraser":
				this.freeDrawingBrush = new fabric.EraserBrush(this);
				this.freeDrawingBrush.width = parseInt($('#editor_brush_size').val())
				this.isDrawingMode = true
				break;
			case "inserttext":
				break;
		}
		
		var selectionMode = mode == "selection" || !mode
		this.forEachObject(function(obj) {
			obj.selectable = selectionMode;
		});
		this.requestRenderAll();
		
		this.editorMode = selectionMode ? "selection" : mode
		$("input[type=radio][name=editor_mode][value=" + mode + "]").prop("checked",true);
	}
	
	canvas.on('mouse:down', function(options) {
		switch(canvas.editorMode) {
			case "inserttext":
				var p = canvas.getPointer(options.e);
				var text = new fabric.Text('Text', {
					left: p.x,
					top: p.y,
					fontSize: 20,
					fill: '#000000'
				});
				canvas.add(text);
				canvas.requestRenderAll();
				canvas.setEditorMode("selection")
				break;
		}
	});
	
	canvas.setEditorMode("selection")
	
	$('input[type=radio][name=editor_mode]').change(function() {
		canvas.setEditorMode(this.value)
	});
	$('input#editor_brush_size').change(function() {
		canvas.setEditorMode(canvas.editorMode)
	});
	$("input#editor_brush_size").keydown(function(event) {
		if ( event.keyCode == 46 || event.keyCode == 8 ) {
			// allow backspace and delete
		} else {
			if (event.keyCode < 48 || event.keyCode > 57 ) // numbers only
				event.preventDefault()
		}
	});
});
