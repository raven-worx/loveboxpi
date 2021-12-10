
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

function displayImage() {
	var imgData = $("#editor_canvas").prop("fabric").toDataURL({format: 'png'}).replace(/^data:image\/png;base64,/, "")
	
	$.ajax({
		method: "POST",
		url: "api/v1/display",
		data: { image: imgData }
	})
	.done(function( msg ) {
		alert( "Data Saved: " + msg );
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
