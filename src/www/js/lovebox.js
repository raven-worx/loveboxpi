
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

function setButtonLoading(btn, loading) {
	if( !btn ) return;
	
	let spinner = btn.find("span[role='status']")
	let icon = btn.find("i[role='icon']")
	
	if( loading ) {
		icon.hide()
		btn.prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
	} else {
		spinner.remove()
		icon.show()
	}
	btn.prop('disabled', loading);
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
	}, 3500);
}

function sendCmd(cmd, params) {
	$.ajax({
		method: "POST",
		url: "api/v1/cmd",
		data: JSON.stringify({
			"cmd": cmd,
			"params": params || {}
		}),
		processData: false,
		contentType: "application/json"
	})
	.done(function() {
		showSuccessMessage("Successfully initiated command '" + cmd + "'")
	})
	.fail(function() {
		showErrorMessage("Failed to initiate command '" + cmd + "'")
	})
	.always(function() {
	});
}

function setMessage() {
	var c = $("#editor_canvas").prop("fabric")
	var imgData = c.toDataURL({format: 'png'}).replace(/^data:image\/png;base64,/, "")
	
	setButtonLoading( $("button#send-message-button"), true )
	
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
		setButtonLoading( $("button#send-message-button"), false )
	});
}

function clearMessage() {
	setButtonLoading( $("button#nav-clear-message-button"), true )
	
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
		setButtonLoading( $("button#nav-clear-message-button"), false )
	});
}

function saveSettings() {
	var formData = {
		"led": {
			"enabled": $("form#settings-form input#led_enabled").is(":checked") ? 1 : 0,
			"color": $("form#settings-form input#led_color").val()
		},
		"display": {
			"type": $("form#settings-form #display_type").val(),
			"rotation": $("form#settings-form #display_rotation").val()
		},
		"www": {
			"host": $("form#settings-form #server_host").val(),
			"port": $("form#settings-form #server_port").val()
		}
	}
	
	setButtonLoading( $("button#save-settings-button"), true )
	
	$.ajax({
		method: "POST",
		url: "api/v1/settings",
		data: JSON.stringify(formData),
		processData: false,
		contentType: "application/json"
	})
	.done(function() {
		showSuccessMessage("Successfully saved settings")
		retrieveInfo()
	})
	.fail(function() {
		showErrorMessage("Failed to save settings")
	})
	.always(function() {
		setButtonLoading( $("button#save-settings-button"), false )
	});
}

function retrieveSettings() {
	setButtonLoading( $("button#load-settings-button"), true )
	
	$.ajax({
		method: "GET",
		url: "api/v1/settings",
		cache: false,
		contentType: "application/json"
	})
	.done(function(data) {
		$("form#settings-form #led_enabled").prop('checked', data.led.enabled == "True" || data.led.enabled == "1")
		$("form#settings-form #led_color").val(data.led.color)
		
		$("form#settings-form #display_type").val(data.display.type).change();
		$("form#settings-form #display_rotation").val(data.display.rotation).change();
		
		$("form#settings-form #server_host").val(data.www.host);
		$("form#settings-form #server_port").val(data.www.port);
	})
	.fail(function() {
		console.error("Failed to retrieve settings")
	})
	.always(function() {
		setButtonLoading( $("button#load-settings-button"), false )
	});
}

function retrieveInfo() {
	$.ajax({
		method: "GET",
		url: "api/v1/info",
		cache: false,
		contentType: "application/json"
	})
	.done(function(data) {
		$("#navbarContent #nav-version-text").text("v"+data.version)
		
		data.display.available.sort().forEach(item => {
			$("form#settings-form select#display_type").append($("<option>", {
				value: item,
				text: item
			}));
		});
		
		let canvas = $("#editor_canvas").prop("fabric")
		if( data.display.effectiveWidth > 0 && data.display.effectiveHeight > 0 ) {
			canvas.setWidth( data.display.effectiveWidth );
			canvas.setHeight( data.display.effectiveHeight );
			canvas.calcOffset();
		}
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
	var triggerTabList = [].slice.call(document.querySelectorAll('#navbarContent a.nav-link'))
	triggerTabList.forEach(function (triggerEl) {
		//var tabTrigger = new bootstrap.Tab(triggerEl)
		var tabTrigger = bootstrap.Tab.getOrCreateInstance(triggerEl)

		triggerEl.addEventListener('click', function (event){
			event.preventDefault()
			tabTrigger.show()
		})
	})

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
	$('button#editor_clear').on( "click", function (event){
		event.preventDefault()
		canvas.clear()
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
	
	// init
	retrieveInfo()
	retrieveSettings()
});
