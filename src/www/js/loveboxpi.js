// h[0,360],s[0,1],v[0,1] -> r[0,1],g[0,1],b[0,1]
function hsv2rgb(hsv) 
{
	let f= (n,k=(n+hsv.h/60)%6) => hsv.v - hsv.v*hsv.s*Math.max( Math.min(k,4-k,1), 0)
	return {r: f(5), g: f(3), b: f(1)}
}

// r[0,1],g[0,1],b[0,1] -> h[0,360],s[0,1],v[0,1]
function rgb2hsv(rgb) {
	let v=Math.max(rgb.r,rgb.g,rgb.b), n=v-Math.min(rgb.r,rgb.g,rgb.b)
	let h= n && ((v==rgb.r) ? (rgb.g-rgb.b)/n : ((v==rgb.g) ? 2+(rgb.b-rgb.r)/n : 4+(rgb.r-rgb.g)/n))
	return {h: 60*(h<0?h+6:h), s: v&&n/v, v: v}
}

// r[0,1],g[0,1],b[0,1] -> '#rrggbb'
function rgb2hex(rgb) {
	r = Math.round(rgb.r*255).toString(16);
	if (r.length == 1) r = "0" + r;
	g = Math.round(rgb.g*255).toString(16);
	if (g.length == 1) g = "0" + g;
	b = Math.round(rgb.b*255).toString(16);
	if (b.length == 1) b = "0" + b;
	return "#"+r+g+b
}

// '#rrggbb' -> r[0,1],g[0,1],b[0,1]
function hex2rgb(hex) {
	r = +("0x"+hex[1]+hex[2])
	g = +("0x"+hex[3]+hex[4])
	b = +("0x"+hex[5]+hex[6])
	return {r: (r/255.0).toFixed(1), g: (g/255.0).toFixed(1), b: (b/255.0).toFixed(1)}
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
	var alertEl = $("<div class=\"alert alert-success alert-dismissible fade show hide position-fixed w-75 start-50 translate-middle-x\" style=\"bottom: 50px; z-index: 10000;\" role=\"alert\"><i class=\"bi bi-check-circle-fill\"></i> " + msg + "</div>")
	$("body").append(alertEl)
	setTimeout(function() {
		bootstrap.Alert.getOrCreateInstance( alertEl.get(0) ).close()
	}, 2000);
}

function showErrorMessage(msg) {
	var alertEl = $("<div class=\"alert alert-danger alert-dismissible fade show hide position-fixed w-75 start-50 translate-middle-x\" style=\"bottom: 50px; z-index: 10000;\" role=\"alert\"><i class=\"bi bi-exclamation-triangle-fill\"></i> " + msg + "</div>")
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
		timeout: 30000,
		processData: false,
		contentType: "application/json"
	})
	.done(function() {
		showSuccessMessage("Successfully executed command '" + cmd + "'")
	})
	.fail(function() {
		showErrorMessage("Failed to execute command '" + cmd + "'")
	})
	.always(function() {
		if( btn )
			setButtonLoading( btn, false )
	});
}

function retrieveLastMessageInfo()
{
	var loader = $('#last-message-dialog #last-message-loading-indicator')
	var info = $('#last-message-dialog #last-message-info-container')
	
	loader.show()
	info.hide()
	info.find('img').attr('src', '')
	info.find('#last-message-status').empty().append('<span class="badge bg-secondary">inactive</span>')
	
	$.ajax({
		method: "GET",
		url: "api/v1/message",
		cache: false,
		timeout: 10000
	})
	.done(function(data) {
		if( data.imageUrl.length != "" )
			info.find('img').attr('src', data.imageUrl)
		var contentBadge = data.active ? '<span class="badge bg-success">active</span>' : '<span class="badge bg-secondary">inactive</span>'
		if( data.readTimestamp != "" )
			contentBadge = '<span class="badge bg-success">read</span> <span>' + new Date(data.readTimestamp).toLocaleString() + '</span>'
		else
			contentBadge += ' <span class="badge bg-secondary">unread</span>'
		info.find('#last-message-status').empty().append( $(contentBadge) )
	})
	.fail(function() {
		showErrorMessage("Failed to get last message")
	})
	.always(function() {
		loader.hide()
		info.show()
	});
}

function setMessage(btn) {
	var c = $("#editor_canvas").prop("fabric")
	var imgData = c.toDataURL({format: 'png'}).replace(/^data:image\/png;base64,/, "")
	
	if( btn )
		setButtonLoading( btn, true )
	
	$.ajax({
		method: "POST",
		url: "api/v1/message",
		data: { image: imgData },
		timeout: 10000
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
		url: "api/v1/message",
		timeout: 10000
	})
	.done(function() {
		showSuccessMessage("Successfully cleared message");
		retrieveLastMessageInfo()
	})
	.fail(function() {
		showErrorMessage("Failed to clear message")
	})
	.always(function() {
		if( btn )
			setButtonLoading( btn, false )
	});
}

function validateSettingsForm() {
	function _setValid(el, valid, groupValid) {
		groupValid = typeof groupValid !== 'undefined' ? groupValid : valid;
		let validity = el.get(0).validity
		el.get(0).setCustomValidity( valid ? '' : 'invalid' )
		el.get(0).reportValidity()
		let formGroup = el.parents('.form-group')
		if( valid && groupValid )
			formGroup.removeClass( 'was-validated' )
		else
			formGroup.addClass( 'was-validated' )
	}
	function _checkNativeValidity(el) {
		let validity = el.get(0).validity
		let formGroup = el.parents('.form-group')
		if( validity.valid )
			formGroup.removeClass( 'was-validated' )
		else
			formGroup.addClass( 'was-validated' )
		return validity.valid
	}
	function _countElement(item,array) {
		var count = 0;
		$.each(array, function(i,v) { if (v === item) count++; });
		return count;
	}
	function _removeElement(item,array) {
		array = $.grep(array, function(value) {
			return value != item;
		});
	}
	
	let valid = true
	
	// GPIOS
	
	let selectedGpioValues = []
	let gpioSelects = $( 'form#settings-form select[data-role="gpio-select"]' )
	gpioSelects.each(function() {
		var enabledHander = $($(this).data('role-enabled-handler'))
		if( !enabledHander || enabledHander.is(":checked") ) {
			var val = $(this).val()
			if( val != "" ) selectedGpioValues.push( val )
		}
	})

	// LED
	let led_enabled = $("form#settings-form input#led_enabled").is(":checked")
	
	let led_r_gpio = $("form#settings-form #led_gpio_r")
	let led_r_valid = !led_enabled || _countElement(led_r_gpio.val(),selectedGpioValues) == 1
	let led_g_gpio = $("form#settings-form #led_gpio_g")
	let led_g_valid = !led_enabled || _countElement(led_g_gpio.val(),selectedGpioValues) == 1
	let led_b_gpio = $("form#settings-form #led_gpio_b")
	let led_b_valid = !led_enabled || _countElement(led_b_gpio.val(),selectedGpioValues) == 1
	let led_rgb_valid = led_r_valid && led_g_valid && led_b_valid
	
	_setValid(led_r_gpio, led_r_valid, led_rgb_valid)
	_setValid(led_g_gpio, led_g_valid, led_rgb_valid)
	_setValid(led_b_gpio, led_b_valid, led_rgb_valid)
	valid = led_rgb_valid && valid
	
	// BUTTON ACTIONS
	
	let btn1_enabled = $("form#settings-form input#button1_enabled").is(":checked")
	let btn1_gpio = $("form#settings-form #button1_gpio")
	let btn1_valid = !btn1_enabled || _countElement(btn1_gpio.val(),selectedGpioValues) == 1
	_setValid(btn1_gpio, btn1_valid)
	valid = btn1_valid && valid
	
	let btn2_enabled = $("form#settings-form input#button2_enabled").is(":checked")
	let btn2_gpio = $("form#settings-form #button2_gpio")
	let btn2_valid = !btn2_enabled || _countElement(btn2_gpio.val(),selectedGpioValues) == 1
	_setValid(btn2_gpio, btn2_valid)
	valid = btn2_valid && valid
	
	let btn3_enabled = $("form#settings-form input#button3_enabled").is(":checked")
	let btn3_gpio = $("form#settings-form #button3_gpio")
	let btn3_valid = !btn3_enabled || _countElement(btn3_gpio.val(),selectedGpioValues) == 1
	_setValid(btn3_gpio, btn3_valid)
	valid = btn3_valid && valid
	
	let btn4_enabled = $("form#settings-form input#button4_enabled").is(":checked")
	let btn4_gpio = $("form#settings-form #button4_gpio")
	let btn4_valid = !btn4_enabled || _countElement(btn4_gpio.val(),selectedGpioValues) == 1
	_setValid(btn4_gpio, btn4_valid)
	valid = btn4_valid && valid
	
	// DISPLAY
	
	valid = _checkNativeValidity( $("form#settings-form select#display_type") ) && valid
	
	// SERVER
	
	valid = _checkNativeValidity( $("form#settings-form #server_host") ) && valid
	valid = _checkNativeValidity( $("form#settings-form #server_port") ) && valid
	
	return valid
}

function saveSettings(btn) {
	var formData = {
		"led": {
			"enabled": $("form#settings-form input#led_enabled").is(":checked") ? 1 : 0,
			"color": $("form#settings-form #led_color_value").text().trim(),
			"pin_r": $("form#settings-form #led_gpio_r").val(),
			"pin_g": $("form#settings-form #led_gpio_g").val(),
			"pin_b": $("form#settings-form #led_gpio_b").val()
		},
		"button1": {
			"enabled": $("form#settings-form input#button1_enabled").is(":checked") ? 1 : 0,
			"pin": $("form#settings-form #button1_gpio").val(),
			"action": $("form#settings-form #button1_action").val()
		},
		"button2": {
			"enabled": $("form#settings-form input#button2_enabled").is(":checked") ? 1 : 0,
			"pin": $("form#settings-form #button2_gpio").val(),
			"action": $("form#settings-form #button2_action").val()
		},
		"button3": {
			"enabled": $("form#settings-form input#button3_enabled").is(":checked") ? 1 : 0,
			"pin": $("form#settings-form #button3_gpio").val(),
			"action": $("form#settings-form #button3_action").val()
		},
		"button4": {
			"enabled": $("form#settings-form input#button4_enabled").is(":checked") ? 1 : 0,
			"pin": $("form#settings-form #button4_gpio").val(),
			"action": $("form#settings-form #button4_action").val()
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
		contentType: "application/json",
		timeout: 10000
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
		contentType: "application/json",
		timeout: 10000
	})
	.done(function(data) {
		$("form#settings-form #led_enabled").prop('checked', data.led.enabled == "True" || data.led.enabled == "1")
		$("form#settings-form #led_gpio_r").val(data.led.pin_r)
		$("form#settings-form #led_gpio_g").val(data.led.pin_g)
		$("form#settings-form #led_gpio_b").val(data.led.pin_b)
		
		let color_rgb = hex2rgb(data.led.color || '#ff0000')
		let color_hsv = rgb2hsv(color_rgb)
		$("form#settings-form #led_color_slider").val(color_hsv.h).change()
		
		$("form#settings-form input#button1_enabled").prop('checked', data.button1.enabled == "True" || data.button1.enabled == "1")
		$("form#settings-form #button1_gpio").val(data.button1.pin)
		$("form#settings-form #button1_action").val(data.button1.action)
		$("form#settings-form input#button2_enabled").prop('checked', data.button2.enabled == "True" || data.button2.enabled == "1")
		$("form#settings-form #button2_gpio").val(data.button2.pin)
		$("form#settings-form #button2_action").val(data.button2.action)
		$("form#settings-form input#button3_enabled").prop('checked', data.button3.enabled == "True" || data.button3.enabled == "1")
		$("form#settings-form #button3_gpio").val(data.button3.pin)
		$("form#settings-form #button3_action").val(data.button3.action)
		$("form#settings-form input#button4_enabled").prop('checked', data.button4.enabled == "True" || data.button4.enabled == "1")
		$("form#settings-form #button4_gpio").val(data.button4.pin)
		$("form#settings-form #button4_action").val(data.button4.action)
		
		$("form#settings-form #display_type").val(data.display.type).change();
		$("form#settings-form #display_rotation").val(data.display.rotation).change();
		
		$("form#settings-form #server_host").val(data.www.host);
		$("form#settings-form #server_port").val(data.www.port);
		
		validateSettingsForm()
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
		contentType: "application/json",
		timeout: 10000
	})
	.done(function(data) {
		$("#navbarContent #nav-version-text").text("v"+data.version)
		
		// SETTINGS
		data.display.availableTypes.sort().forEach(item => {
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
		setCloudInfoValueIcon( $('#cloud-page #cloud-pane-info #cloud-info-value-serviceadded'), cloud.status.service_added)
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
		contentType: "application/json",
		timeout: 10000
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

function addEmojiButton(emojiVal, parentElement, isRecentltyUsed)
{
	var btn = $('<input class="btn btn-outline-dark btn-lg emoji-button ratio ratio-1x1" type="button" value="&#x'+emojiVal+';" data-emoji="'+emojiVal+'">')
	if( isRecentltyUsed )
		parentElement.prepend( btn )
	else
		parentElement.append( btn )
	
	var canvas = $("#editor_canvas").prop("fabric")
	
	btn.on("click", function (event) {
		event.preventDefault()
		var emojiVal = $(this).data('emoji')
		var emojiTxt = String.fromCodePoint( Number.parseInt(emojiVal,16) )
		canvas.addEmojiItem(emojiTxt)
		$('#emoji-list-recent *[data-emoji="'+emojiVal+'"]').remove()
		addEmojiButton(emojiVal, $('#emoji-list-recent'), true)
		
		var recentlyEmojiList = []
		$('#emoji-list-recent .emoji-button').each(function( idx ) {
			if( idx >= 15 )
				$(this).remove()
			else
				recentlyEmojiList.unshift( $(this).data('emoji') )
		});
		Cookies.set('editor_recently_used_emojis', recentlyEmojiList.join(','))
		
		var popover = bootstrap.Popover.getInstance( $('#editor_emoji_button').get(0) )
		popover.hide()
	});
}

/*
==========================================
  INIT
==========================================
*/

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
	$('button#nav-test-button').on("click", function (event) {
		event.preventDefault()
		sendCmd('test', {}, $(this))
	});
	$('button#nav-restart-button').on("click", function (event) {
		event.preventDefault()
		sendCmd('restart', {}, $(this))
	});
	$('button#nav-last-message-button').on("click", function (event) {
		event.preventDefault()
		retrieveLastMessageInfo()
	});
	$('button#send-message-button').on("click", function (event) {
		event.preventDefault()
		setMessage( $("button#send-message-button") )
	});
	$('button#clear-message-confirm-button').on("click", function (event) {
		event.preventDefault()
		clearMessage( $("button#clear-message-button") )
	});
	$('button#load-settings-button').on("click", function (event) {
		event.preventDefault()
		retrieveSettings( $("button#load-settings-button") )
	});
	$('button#save-settings-dialog-button').on("click", function (event) {
		event.preventDefault()
		if( validateSettingsForm() )
			saveSettings( $("button#save-settings-button") )
	});
	
	$('button#cloud-install-dialog-button').on("click", function (event) {
		event.preventDefault()
		sendCloudCmd(
			'install',
			{},
			$('button#cloud-install-button')
		)
	});
	$('button#cloud-login-button').on("click", function (event) {
		event.preventDefault()
		sendCloudCmd(
			'login',
			{'username': $('form#cloud-login-form #cloud-login-email').val(), 'password': $('form#cloud-login-form #cloud-login-password').val()},
			$(this)
		)
	});
	$('button#cloud-logout-dialog-button').on("click", function (event) {
		event.preventDefault()
		sendCloudCmd(
			'logout',
			{},
			$('button#cloud-logout-button')
		)
	});
	$('button#cloud-registerdevice-button').on("click", function (event) {
		event.preventDefault()
		sendCloudCmd(
			'register_device',
			{'name': $('form#cloud-registerdevice-form #cloud-registerdevice-name').val()},
			$(this)
		)
	});
	$('button#cloud-unregisterdevice-dialog-button').on("click", function (event) {
		event.preventDefault()
		sendCloudCmd(
			'unregister_device',
			{},
			$('button#cloud-unregisterdevice-button')
		)
	});
	
	/*
		ELEMENTS
	*/
	$("form#settings-form #led_color_slider").on("input change", function (event) {
		event.preventDefault()
		
		let hsv = {h: $(this).val(), s: 1, v: 1}
		let hex = rgb2hex(hsv2rgb(hsv))
		$("form#settings-form #led_color_value").text(hex)
		$("form#settings-form #led_color_value").css('background-color', hex)
	});
	
	$( 'form#settings-form select[data-role="gpio-select"]' )
	.each(function() {
		$(this).append(
				$("<option>", {
					value: '',
					text: ''
				})
			);
		for(var i = 2; i <= 27; i++) {
			var val = "GPIO"+i
			$(this).append(
				$("<option>", {
					value: val,
					text: val
				})
			);
		}
	})
	
	$( 'form#settings-form select[data-role="action-select"]' )
	.each(function () {
		$(this).append(
				$("<option>", {
					disabled: true,
					value: '',
					text: ''
				})
			);
		var actions = {
			"readmsg": "Mark message read",
			"netinfo": "Display network info",
			"lastmsg": "Show last message",
			"clearmsg": "Clear message"
		}
		for(var a in actions) {
			$(this).append($("<option>", {
				value: a,
				text: actions[a]
			}));
		}
	})
	
	$( 'select[data-role="font-select"]' )
	.each(function () {

		var fonts = [
			'Arial', 'Times New Roman', 'Courier New', 'Courier', 'Verdana',
			'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Tahoma', 'Trebuchet MS',
			'Arial Black', 'Impact', 'Comic Sans MS'
		]
		
		for(var f in fonts) {
			$(this).append($("<option>", {
				value: fonts[f],
				text: fonts[f],
				selected: fonts[f] == Cookies.get('editor_selected_font')
			}));
		}
		
		$(this).on('change', function(event) {
			Cookies.set('editor_selected_font', $(this).val()) 
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
	var html_canvas = $("#editor_canvas")
	html_canvas.prop("fabric", canvas)
	
	canvas.setEditorMode = function(mode) {
		if( this.editorMode == mode )
			return
		
		switch(mode) {
			case "selection":
				this.isDrawingMode = false
				break;
			case "freedraw":
				this.freeDrawingBrush = new fabric.PencilBrush(this);
				this.freeDrawingBrush.width = this.brushSize
				this.isDrawingMode = true
				break;
			case "eraser":
				this.freeDrawingBrush = new fabric.EraserBrush(this);
				this.freeDrawingBrush.width = this.brushSize
				this.isDrawingMode = true
				break;
		}
		
		var selectionMode = mode == "selection" || !mode
		this.forEachObject(function(obj) {
			obj.selectable = selectionMode;
		});
		this.requestRenderAll();
		
		this.editorMode = selectionMode ? "selection" : mode
		var editorModeButton = $("input[type=radio][name=editor_mode][value=" + mode + "]")
		editorModeButton.prop("checked",true)
		editorModeButton[0].focus()
	}
	canvas.setActiveElementType = function(type) {
		// type == 'i-text'
		
		$('button#editor_delete_item').prop('disabled', !type )
	}
	canvas.addEmojiItem = function(emojiTxt) {
		var emoji = new fabric.Text(emojiTxt, {
				left: 30,
				top: 30,
				fontFamily: "EmojiSymbols",
				fontSize: 85,
				fill: '#000000'
			});
		this.add(emoji);
		this.setActiveObject(emoji)
		this.requestRenderAll();
		this.setEditorMode("selection")
	}
	canvas.setBrushSize = function(size) {
		this.brushSize = parseInt(size)
		if( this.isDrawingMode )
		{
			switch(canvas.editorMode) {
				case "freedraw":
					this.freeDrawingBrush = new fabric.PencilBrush(canvas);
					this.freeDrawingBrush.width = this.brushSize
				break;
				case "eraser":
					this.freeDrawingBrush = new fabric.EraserBrush(canvas);
					this.freeDrawingBrush.width = this.brushSize
				break;
			}
		}
	}
	
	canvas.on({
		'mouse:down': options => {
		},
		'selection:created': e => {
			var obj = canvas.getActiveObject()
			canvas.setActiveElementType( obj ? obj.get('type') : '' )
		},
		'selection:cleared': e => {
			canvas.setActiveElementType('')
		},
		'selection:updated': e => { // disable multi selection
			const activeSelection = e.target
			if (activeSelection) {
				canvas.discardActiveObject();
				canvas.setActiveElementType('')
			}
		}
	});
	
	canvas.setBrushSize( $('input#editor_brush_size_slider').val() )
	canvas.setEditorMode("selection")
	canvas.setActiveElementType('')
	
	$('input[type=radio][name=editor_mode]').change( function() {
		canvas.setEditorMode(this.value)
		this.focus()
	});
	$('button#clear-canvas-button').on( "click", function (event){
		event.preventDefault()
		canvas.clear()
	});
	$('button#editor_delete_item').on( "click", function (event){
		event.preventDefault()
		canvas.getActiveObjects().forEach((obj) => {
			canvas.remove(obj)
		});
		canvas.discardActiveObject().renderAll()
	});
	$('button#editor_insert_text').on( "click", function() {
		var text = new fabric.IText('Text', {
				left: 20,
				top: 20,
				fontFamily: $('select#editor_text_fontlist').val(),
				fontSize: 50,
				fill: '#000000'
			});
		canvas.add(text);
		canvas.setActiveObject(text);
		canvas.requestRenderAll();
		canvas.setEditorMode("selection")
		// hide text popover
		var popover = bootstrap.Popover.getInstance( $('#editor_text_button').get(0) )
		popover.hide()
	});
	$('input#editor_brush_size_slider').on('input change', function(event) {
		var val = $(this).val()
		$('span#editor_brush_size_value').text( val )
		canvas.setBrushSize( val );
	});
	$('select#editor_text_fontlist').change(function() {
		var obj = canvas.getActiveObject()
		if( obj ) {
			obj.set("fontFamily", $(this).val());
			canvas.requestRenderAll();
		}
	});
	
	var emojisList = ["1F520","1F521","1F524","1F300","1F301","1F302","1F303","1F304","1F305","1F306","1F307","1F308","1F309","1F30A","1F30B","1F30C","1F30D","1F30E","1F30F","1F310","1F311","1F312","1F313","1F314","1F315","1F316","1F317","1F318","1F319","1F31A","1F31B","1F31C","1F31D","1F31E","1F31F","1F320","1F330","1F331","1F332","1F333","1F334","1F335","1F337","1F338","1F339","1F33A","1F33B","1F33C","1F33D","1F33E","1F33F","1F340","1F341","1F342","1F343","1F344","1F345","1F346","1F347","1F348","1F349","1F34A","1F34B","1F34C","1F34D","1F34E","1F34F","1F350","1F351","1F352","1F353","1F354","1F355","1F356","1F357","1F358","1F359","1F35A","1F35B","1F35C","1F35D","1F35E","1F35F","1F360","1F361","1F362","1F363","1F364","1F365","1F366","1F367","1F368","1F369","1F36A","1F36B","1F36C","1F36D","1F36E","1F36F","1F370","1F371","1F372","1F373","1F374","1F375","1F376","1F377","1F378","1F379","1F37A","1F37B","1F37C","1F380","1F381","1F382","1F383","1F384","1F385","1F386","1F387","1F388","1F389","1F38A","1F38B","1F38C","1F38D","1F38E","1F38F","1F390","1F391","1F392","1F393","1F3A0","1F3A1","1F3A2","1F3A3","1F3A4","1F3A5","1F3A6","1F3A7","1F3A8","1F3A9","1F3AA","1F3AB","1F3AC","1F3AD","1F3AE","1F3AF","1F3B0","1F3B1","1F3B2","1F3B3","1F3B4","1F3B5","1F3B6","1F3B7","1F3B8","1F3B9","1F3BA","1F3BB","1F3BC","1F3BD","1F3BE","1F3BF","1F3C0","1F3C1","1F3C2","1F3C3","1F3C4","1F3C6","1F3C7","1F3C8","1F3C9","1F3CA","1F3E0","1F3E1","1F3E2","1F3E3","1F3E4","1F3E5","1F3E6","1F3E7","1F3E8","1F3E9","1F3EA","1F3EB","1F3EC","1F3ED","1F3EE","1F3EF","1F3F0","1F400","1F401","1F402","1F403","1F404","1F405","1F406","1F407","1F408","1F409","1F40A","1F40B","1F40C","1F40D","1F40E","1F40F","1F410","1F411","1F412","1F413","1F414","1F415","1F416","1F417","1F418","1F419","1F41A","1F41B","1F41C","1F41D","1F41E","1F41F","1F420","1F421","1F422","1F423","1F424","1F425","1F426","1F427","1F428","1F429","1F42A","1F42B","1F42C","1F42D","1F42E","1F42F","1F430","1F431","1F432","1F433","1F434","1F435","1F436","1F437","1F438","1F439","1F43A","1F43B","1F43C","1F43D","1F43E","1F440","1F442","1F443","1F444","1F445","1F446","1F447","1F448","1F449","1F44A","1F44B","1F44C","1F44D","1F44E","1F44F","1F450","1F451","1F452","1F453","1F454","1F455","1F456","1F457","1F458","1F459","1F45A","1F45B","1F45C","1F45D","1F45E","1F45F","1F460","1F461","1F462","1F463","1F464","1F465","1F466","1F467","1F468","1F469","1F46A","1F46B","1F46C","1F46D","1F46E","1F46F","1F470","1F471","1F472","1F473","1F474","1F475","1F476","1F477","1F478","1F479","1F47A","1F47B","1F47C","1F47D","1F47E","1F47F","1F480","1F481","1F482","1F483","1F484","1F485","1F486","1F487","1F488","1F489","1F48A","1F48B","1F48C","1F48D","1F48E","1F48F","1F490","1F491","1F492","1F493","1F494","1F495","1F496","1F497","1F498","1F499","1F49A","1F49B","1F49C","1F49D","1F49E","1F49F","1F4A0","1F4A1","1F4A2","1F4A3","1F4A4","1F4A5","1F4A6","1F4A7","1F4A8","1F4A9","1F4AA","1F4AB","1F4AC","1F4AD","1F4AE","1F4AF","1F4B0","1F4B1","1F4B2","1F4B3","1F4B4","1F4B5","1F4B6","1F4B7","1F4B8","1F4B9","1F4BA","1F4BB","1F4BC","1F4BD","1F4BE","1F4BF","1F4C0","1F4C1","1F4C2","1F4C3","1F4C4","1F4C5","1F4C6","1F4C7","1F4C8","1F4C9","1F4CA","1F4CB","1F4CC","1F4CD","1F4CE","1F4CF","1F4D0","1F4D1","1F4D2","1F4D3","1F4D4","1F4D5","1F4D6","1F4D7","1F4D8","1F4D9","1F4DA","1F4DB","1F4DC","1F4DD","1F4DE","1F4DF","1F4E0","1F4E1","1F4E2","1F4E3","1F4E4","1F4E5","1F4E6","1F4E7","1F4E8","1F4E9","1F4EA","1F4EB","1F4EC","1F4ED","1F4EE","1F4EF","1F4F0","1F4F1","1F4F2","1F4F3","1F4F4","1F4F5","1F4F6","1F4F7","1F4F9","1F4FA","1F4FB","1F4FC","1F500","1F501","1F502","1F503","1F504","1F505","1F506","1F507","1F508","1F509","1F50A","1F50B","1F50C","1F50D","1F50E","1F50F","1F510","1F511","1F512","1F513","1F514","1F515","1F516","1F517","1F518","1F519","1F51A","1F51B","1F51C","1F51D","1F51E","1F51F","1F522","1F523","1F525","1F526","1F527","1F528","1F529","1F52A","1F52B","1F52C","1F52D","1F52E","1F52F","1F530","1F531","1F532","1F533","1F534","1F535","1F536","1F537","1F538","1F539","1F53A","1F53B","1F53C","1F53D","1F550","1F551","1F552","1F553","1F554","1F555","1F556","1F557","1F558","1F559","1F55A","1F55B","1F55C","1F55D","1F55E","1F55F","1F560","1F561","1F562","1F563","1F564","1F565","1F566","1F567","1F5FB","1F5FC","1F5FD","1F5FE","1F5FF","1F600","1F601","1F602","1F603","1F604","1F605","1F606","1F607","1F608","1F609","1F60A","1F60B","1F60C","1F60D","1F60E","1F60F","1F610","1F611","1F612","1F613","1F614","1F615","1F616","1F617","1F618","1F619","1F61A","1F61B","1F61C","1F61D","1F61E","1F61F","1F620","1F621","1F622","1F623","1F624","1F625","1F626","1F627","1F628","1F629","1F62A","1F62B","1F62C","1F62D","1F62E","1F62F","1F630","1F631","1F632","1F633","1F634","1F635","1F636","1F637","1F638","1F639","1F63A","1F63B","1F63C","1F63D","1F63E","1F63F","1F640","1F645","1F646","1F647","1F648","1F649","1F64A","1F64B","1F64C","1F64D","1F64E","1F64F","1F680","1F681","1F682","1F683","1F684","1F685","1F686","1F687","1F688","1F689","1F68A","1F68B","1F68C","1F68D","1F68E","1F68F","1F690","1F691","1F692","1F693","1F694","1F695","1F696","1F697","1F698","1F699","1F69A","1F69B","1F69C","1F69D","1F69E","1F69F","1F6A0","1F6A1","1F6A2","1F6A3","1F6A4","1F6A5","1F6A6","1F6A7","1F6A8","1F6A9","1F6AA","1F6AB","1F6AC","1F6AD","1F6AE","1F6AF","1F6B0","1F6B1","1F6B2","1F6B3","1F6B4","1F6B5","1F6B6","1F6B7","1F6B8","1F6B9","1F6BA","1F6BB","1F6BC","1F6BD","1F6BE","1F6BF","1F6C0","1F6C1","1F6C2","1F6C3","1F6C4","1F6C5","00A9","00AE","1F004","1F0CF","1F170","1F171","1F17E","1F17F","1F18E","1F191","1F192","1F193","1F194","1F195","1F196","1F197","1F198","1F199","1F19A","1F201","1F202","1F21A","1F22F","1F232","1F233","1F234","1F235","1F236","1F237","1F238","1F239","1F23A","1F250","1F251","203C","2049","20E3","2122","2139","2194","2195","2196","2197","2198","2199","21A9","21AA","231A","231B","23E9","23EA","23EB","23EC","23F0","23F3","24C2","25AA","25AB","25B6","25C0","25FB","25FC","25FD","25FE","2600","2601","260E","2611","2614","2615","261D","263A","2648","2649","264A","264B","264C","264D","264E","264F","2650","2651","2652","2653","2660","2663","2665","2666","2668","267B","267F","2693","26A0","26A1","26AA","26AB","26BD","26BE","26C4","26C5","26CE","26D4","26EA","26F2","26F3","26F5","26FA","26FD","2702","2705","2708","2709","270A","270B","270C","270F","2712","2714","2716","2728","2733","2734","2744","2747","274C","274E","2753","2754","2755","2757","2764","2795","2796","2797","27A1","27B0","27BF","2934","2935","2B05","2B06","2B07","2B1B","2B1C","2B50","2B55","3030","303D","3297","3299","E50A"]
	emojisList.forEach(function(emoji) {
		addEmojiButton(emoji, $('#emoji-list-all'))
	})
	var recentlyUsedEmojis = Cookies.get('editor_recently_used_emojis')
	if( recentlyUsedEmojis ) {
		recentlyUsedEmojis.split(',').forEach(function(emoji) {
			addEmojiButton(emoji, $('#emoji-list-recent'), true)
		})
	}
	
	var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
	var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
		var contentEl = $($(popoverTriggerEl).data('popover-content')).get(0)
		var popover = new bootstrap.Popover(popoverTriggerEl, {
			container: 'body',
			placement: 'bottom',
			html: true,
			content: contentEl
		})
		popoverTriggerEl.addEventListener('show.bs.popover', function () {
			$('[data-bs-toggle="popover"][data-popover-visible="true"]').each(function() {
				var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
					var popover = bootstrap.Popover.getInstance(popoverTriggerEl)
					popover.hide()
				})
			})
			
			$(popoverTriggerEl).attr('data-popover-visible', 'true')
		})
		popoverTriggerEl.addEventListener('hide.bs.popover', function () {
			$(popoverTriggerEl).attr('data-popover-visible', 'false')
		})
		popover.show()
		popover.hide()
		return popover
	})
	
	$(document).click(function(e) {
		// click on popup button?
		var triggerEl = $(e.target).closest('[data-bs-toggle="popover"]')
		if( triggerEl.length > 0 ) // click on another popup button? if yes close the current
		{
			if( triggerEl.attr('data-popover-visible') == 'true' )
				return
		}
		// click inside popup content?
		if( $(e.target).parents('.popover').length == 0 ) // close all
		{
			var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
			var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
				var popover = bootstrap.Popover.getInstance(popoverTriggerEl)
				popover.hide()
			})
		}
	});
	
	// init
	retrieveInfo()
	retrieveSettings()
});
