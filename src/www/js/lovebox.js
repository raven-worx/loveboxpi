
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

function insertGpioOptions(selectEl) {
	var gpios = [
		"GPIO2","GPIO3","GPIO4","GPIO17","GPIO27","GPIO22","GPIO10","GPIO9","GPIO11","GPIO5","GPIO6","GPIO13","GPIO19",
		"GPIO26","GPIO14","GPIO15","GPIO18","GPIO23","GPIO24","GPIO25","GPIO8","GPIO7","GPIO12","GPIO16","GPIO20","GPIO21"
	]
	gpios.sort().forEach(item => {
		selectEl.append($("<option>", {
			value: item,
			text: item
		}));
	});
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

function sendCmd(cmd, params, btn) {
	if( btn )
		setButtonLoading( btn, true )
	
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
		if( btn )
			setButtonLoading( btn, false )
	});
}

function setMessage(btn) {
	var c = $("#editor_canvas").prop("fabric")
	var imgData = c.toDataURL({format: 'png'}).replace(/^data:image\/png;base64,/, "")
	
	if( btn )
		setButtonLoading( btn, true )
	
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
		if( btn )
			setButtonLoading( btn, false )
	});
}

function clearMessage(btn) {
	if( btn )
		setButtonLoading( btn, true )
	
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
		if( btn )
			setButtonLoading( btn, false )
	});
}

function saveSettings(btn) {
	var formData = {
		"led": {
			"enabled": $("form#settings-form input#led_enabled").is(":checked") ? 1 : 0,
			"color": $("form#settings-form input#led_color").val(),
			"pin_r": $("form#settings-form #led_gpio_r").val(),
			"pin_g": $("form#settings-form #led_gpio_g").val(),
			"pin_b": $("form#settings-form #led_gpio_b").val()
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
	
	if( btn )
		setButtonLoading( btn, true )
	
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
		if( btn )
			setButtonLoading( btn, false )
	});
}

function retrieveSettings(btn) {
	if( btn )
		setButtonLoading( btn, true )
	
	$.ajax({
		method: "GET",
		url: "api/v1/settings",
		cache: false,
		contentType: "application/json"
	})
	.done(function(data) {
		$("form#settings-form #led_enabled").prop('checked', data.led.enabled == "True" || data.led.enabled == "1")
		$("form#settings-form #led_color").val(data.led.color)
		$("form#settings-form #led_gpio_r").val(data.led.pin_r)
		$("form#settings-form #led_gpio_g").val(data.led.pin_g)
		$("form#settings-form #led_gpio_b").val(data.led.pin_b)
		
		$("form#settings-form #display_type").val(data.display.type).change();
		$("form#settings-form #display_rotation").val(data.display.rotation).change();
		
		$("form#settings-form #server_host").val(data.www.host);
		$("form#settings-form #server_port").val(data.www.port);
	})
	.fail(function() {
		console.error("Failed to retrieve settings")
	})
	.always(function() {
		if( btn )
			setButtonLoading( btn, false )
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
		
		// SETTINGS
		data.display.available.sort().forEach(item => {
			$("form#settings-form select#display_type").append($("<option>", {
				value: item,
				text: item
			}));
		});
		
		// CANVAS
		let canvas = $("#editor_canvas").prop("fabric")
		if( data.display.effectiveWidth > 0 && data.display.effectiveHeight > 0 ) {
			canvas.setWidth( data.display.effectiveWidth );
			canvas.setHeight( data.display.effectiveHeight );
			canvas.calcOffset();
		}
		
		// CLOUD
		function enableCloudNav(el,enabled) {
			if( enabled ) {
				el.removeClass('disabled')
				el.removeAttr('tabindex')
				el.attr('aria-disabled','false')
			} else {
				el.addClass('disabled')
				el.attr('tabindex', '-1')
				el.attr('aria-disabled','true')
			}
		}
		function showCloudEl(el,show) {
			show ? el.show() : el.hide()
		}
		function setCloudInfoValueIcon(el,check) {
			el.empty()
			el.append( check ?  $('<i class="bi bi-check-square-fill text-success" role="icon"></i>') : $('<i class="bi bi-x-square-fill text-danger" role="icon"></i>') )
		}
		let cloud = data.cloud
		enableCloudNav( $('#cloud-page ul.nav a#nav-cloud-login'), cloud.status.installed )
		enableCloudNav( $('#cloud-page ul.nav a#nav-cloud-register'), cloud.status.installed )
		$('#cloud-pane-login form#cloud-logout-form #cloud-logout-desc-username').text( cloud.data.username )
		$('#cloud-pane-register form#cloud-unregisterdevice-form #cloud-unregisterdevice-desc-name').text( cloud.data.device_name || cloud.data.device_id )
		
		showCloudEl( $('#cloud-page #cloud-pane-login form#cloud-login-form'), !cloud.status.loggedin )
		showCloudEl( $('#cloud-page #cloud-pane-login form#cloud-logout-form'), cloud.status.loggedin )
		showCloudEl( $('#cloud-page #cloud-pane-register form#cloud-registerdevice-form'), !cloud.status.device_registered )
		showCloudEl( $('#cloud-page #cloud-pane-register form#cloud-unregisterdevice-form'), cloud.status.device_registered )
		showCloudEl( $('#cloud-page #cloud-pane-info #cloud-info-install-button-row'), !cloud.status.installed )
		
		setCloudInfoValueIcon( $('#cloud-page #cloud-pane-info #cloud-info-value-installed'), cloud.status.installed)
		setCloudInfoValueIcon( $('#cloud-page #cloud-pane-info #cloud-info-value-loggedin'), cloud.status.loggedin)
		setCloudInfoValueIcon( $('#cloud-page #cloud-pane-info #cloud-info-value-deviceregistered'), cloud.status.device_registered)
		setCloudInfoValueIcon( $('#cloud-page #cloud-pane-info #cloud-info-value-serviceregistered'), cloud.status.service_registered)
	})
	.fail(function() {
		console.error("Failed to retrieve settings")
	})
	.always(function() {
	});
}

function sendCloudCmd(cmd, params, btn) {
	if( btn )
		setButtonLoading( btn, true )
	
	$.ajax({
		method: "POST",
		url: "api/v1/cloud",
		data: JSON.stringify({
			"cmd": cmd,
			"params": params || {}
		}),
		processData: false,
		contentType: "application/json"
	})
	.done(function() {
		showSuccessMessage("Cloud '" + cmd + "' was successfull")
		retrieveInfo()
	})
	.fail(function() {
		showErrorMessage("Cloud '" + cmd + "' failed")
	})
	.always(function() {
		if( btn )
			setButtonLoading( btn, false )
	});
}

$( document ).ready(function() {
	/*
		NAVIGATION
	*/
	var triggerNavList = [].slice.call(document.querySelectorAll('#navbarContent a.nav-link'))
	triggerNavList.forEach(function (triggerEl) {
		var tabTrigger = bootstrap.Tab.getOrCreateInstance(triggerEl)

		triggerEl.addEventListener('click', function (event){
			event.preventDefault()
			tabTrigger.show()
		})
	})
	
	var triggerCloudNavList = [].slice.call(document.querySelectorAll('#cloud-page ul.nav a.nav-link'))
	triggerCloudNavList.forEach(function (triggerEl) {
		var tabTrigger = bootstrap.Tab.getOrCreateInstance(triggerEl)

		triggerEl.addEventListener('click', function (event){
			event.preventDefault()
			tabTrigger.show()
		})
	})
	
	/*
		BUTTONS
	*/
	$('button#nav-test-button').on( "click", function (event) {
		event.preventDefault()
		sendCmd('test', {}, $(this))
	});
	$('button#send-message-button').on( "click", function (event) {
		event.preventDefault()
		setMessage( $("button#send-message-button") )
	});
	$('button#clear-message-button').on( "click", function (event) {
		event.preventDefault()
		clearMessage( $("button#nav-clear-message-button") )
	});
	$('button#load-settings-button').on( "click", function (event) {
		event.preventDefault()
		retrieveSettings( $("button#load-settings-button") )
	});
	$('button#save-settings-dialog-button').on( "click", function (event) {
		event.preventDefault()
		saveSettings( $("button#save-settings-button") )
	});
	
	$('button#cloud-install-dialog-button').on( "click", function (event) {
		event.preventDefault()
		sendCloudCmd(
			'install',
			{},
			$('button#cloud-install-button')
		)
	});
	$('button#cloud-login-button').on( "click", function (event) {
		event.preventDefault()
		sendCloudCmd(
			'login',
			{'username': $('form#cloud-login-form #cloud-login-email').val(), 'password': $('form#cloud-login-form #cloud-login-password').val()},
			$(this)
		)
	});
	$('button#cloud-logout-dialog-button').on( "click", function (event) {
		event.preventDefault()
		sendCloudCmd(
			'logout',
			{},
			$('button#cloud-logout-button')
		)
	});
	$('button#cloud-registerdevice-button').on( "click", function (event) {
		event.preventDefault()
		sendCloudCmd(
			'register_device',
			{'name': $('form#cloud-registerdevice-form #cloud-registerdevice-name').val()},
			$(this)
		)
	});
	$('button#cloud-unregisterdevice-dialog-button').on( "click", function (event) {
		event.preventDefault()
		sendCloudCmd(
			'unregister_device',
			{},
			$('button#cloud-unregisterdevice-button')
		)
	});
	
	/*
		SETTINGS FORM
	*/
	insertGpioOptions( $("form#settings-form #led_gpio_r") )
	insertGpioOptions( $("form#settings-form #led_gpio_g") )
	insertGpioOptions( $("form#settings-form #led_gpio_b") )
	
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
