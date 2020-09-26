// ================================================================
// DOM elements - Editor panes
// ================================================================
const editor = $("#jedi-editor")[0]
const writer = $("#jedi-writer")[0]

// ================================================================
// DOM elements - Editor menu buttons
// ================================================================
const upload_input = $("#upload-input")[0]
const add_block_btn = $("#add-block-btn")[0]
const remove_block_btn = $("#remove-block-btn")[0]
const move_block_up_btn = $("#move-block-up-btn")[0]
const move_block_down_btn = $("#move-block-down-btn")[0]
const split_block_btn = $("#split-block-btn")[0]
const formatting_btns = $("#jedi-menu button:not(.dropdown-toggle)")


const content_download_link = $("#download-content-html")[0]

// ================================================================
// Miscellaneous variables
// ================================================================
// Variable to track current block
let last_block_focussed = -1

// Ignore block operation buttons
const formatting_btns_index = 5

// Categories of styles
const block_styles = ["h1", "h2", "h3", "h4", "h5", "h6", "lead", "code"]
const text_styles = ["bold", "italic", "underline", "strikethrough",
	"justifyLeft", "justifyCenter", "justifyRight", "justifyFull",
	"subscript", "superscript", "indent", "outdent", "removeFormat"]

// ================================================================
// DOM functions
// ================================================================
// Appends a block to the writer
const add_block = function (event, pos=-1){
	const blocks = $("div.block")
	// Clone template to create a new blank block
	let temp = document.querySelector("template#block-template")
	temp = temp.content.cloneNode(true)
	temp = temp.querySelector("div.block")

	// Default - No style
	temp.setAttribute("data-style", "")

	// temp.children[0].innerText = blocks.length
	// Add to writer and re-render all blocks
	if (pos == -1) {
		// append
		writer.append(temp)
	} else {
		// at specific position except last
		writer.insertBefore(temp, blocks[pos])
	}
	re_render_blocks()
	last_block_focussed = $("div.block").length - 1

	// Highlight newly focussed element
	highlight_focussed()
}

// Removes currently selected block from writer
const remove_block = function (){
	// Get current block
	current_block = $("div.block")[last_block_focussed]
	// Remove
	current_block.remove()
	// Re-render all blocks
	re_render_blocks()
	// Reset last focussed block
	last_block_focussed = $("div.block").length - 1
	// Highlight newly focussed element
	highlight_focussed()
}

// Applies the given style according to the category
const apply_style = function (format_style){
	if (last_block_focussed != -1){
		// If a block is selected
		console.log(`Applying style : ${format_style}`)
		// console.log(`To block : ${last_block_focussed}`)
		current_block = $("div.block")[last_block_focussed]
		current_block_style = current_block.getAttribute("data-style") 
		if (block_styles.indexOf(format_style) != -1){
			// If the style is to be applied to the whole block
			if(current_block_style == format_style){
				// If style is already applied remove the style
				current_block.setAttribute("data-style",  "")
			} else {
				// Else remove all formatting and apply the style
			    document.execCommand("removeFormat", false);
				current_block.setAttribute("data-style",  format_style)
			}
		} else if (text_styles.indexOf(format_style) != -1){
			// If the style is to be applied on text
			if (!(format_style == "bold" && current_block_style != "")){
			    document.execCommand(format_style, false);}
		} else if (format_style.indexOf("forecolor") != -1){
			// In case of text color, slice the hex value to get color code
			color = format_style.split("_")[1]
		    document.execCommand("forecolor", false, color);
		} else if (format_style.indexOf("backcolor") != -1){
			// In case of highlight, slice the hex value to get color code
			color = format_style.split("_")[1]
		    document.execCommand("backcolor", false, color);
		} else if (format_style == "unordered-list"){
			// Insert unordered list at current select or pointer
		    document.execCommand("insertUnorderedList", false);
		}
		re_render_blocks()
	}
}

// Re-renders all blocks in the writer pane while:
// - applying block level style according to individual attributes
// - refreshing all event listeners
const re_render_blocks = function(){
	// Get all blocks
	const blocks=document.querySelectorAll("div.block")
	// Loop over them
	for (var i = 0; i < blocks.length; i++) {
		// Make block editable
		blocks[i].children[0].contentEditable = true
		
		// Set block index
		blocks[i].setAttribute("data-block-index", i)
		// Get block type
		block_type = blocks[i].getAttribute("data-style") 
		// Set block type as class of block's first(only) child
		if (blocks[i].children[0] != undefined) {
			blocks[i].children[0].classList = [block_type]
		}

		// Event listeners to update last block focussed on click and tabs
		blocks[i].onclick = function(){
			// Clicking focusses on the block
			last_block_focussed = Number(this.getAttribute("data-block-index"))
			// Highlight newly focussed element
			highlight_focussed()
		}

		blocks[i].onkeyup = function(event){
			if (last_block_focussed != -1){
				new_block_index = Number(this.getAttribute("data-block-index"))

				if (event.shiftKey && event.keyCode == 9){
					// Pressing shift + tab focusses on previous block if any
					last_block_focussed = new_block_index
				} else if (event.keyCode == 9 && new_block_index){
					// Pressing tab focusses on next block if any
					last_block_focussed = new_block_index
				}
			}
			// Highlight newly focussed element
			highlight_focussed()
		}

		blocks[i].onpaste = function(e) {
		    // Cancel paste
		    e.preventDefault();
		    // Get text representation of clipboard
			const text = (e.originalEvent || e).clipboardData.getData(
				'text/plain').split("\n").join("\r\n");
		    // Insert text manually
		    document.execCommand("insertText", false, text);
		}

		blocks[i].classList.remove("current")
	}

	save_content_to_localstorage()
}

// Highlights last focussed block
const highlight_focussed = function(){
	// Remove class current from focussed element if any
	if (last_block_focussed != -1){
		prev_block = $("div.block.current")
		if (prev_block.length) {
			prev_block[0].classList.remove("current")}
		current_block = $("div.block")[last_block_focussed]
		if (current_block != undefined){
				current_block.classList.add("current")}
	}
}

// Move block up/down
const move_block = function(direction = ''){
	if (last_block_focussed != -1) {
		// Get current block
		current_block = $("div.block")[last_block_focussed]
		console.log(current_block)
		if (direction == "up" && last_block_focussed != 0) {
			// Move up
			current_block.after(current_block.previousSibling)
			last_block_focussed = last_block_focussed - 1
		} else if (direction == "down" &&
			last_block_focussed != $("div.block").length -1) {
			current_block.before(current_block.nextSibling)
			last_block_focussed = last_block_focussed + 1
		}
		re_render_blocks()
		highlight_focussed()
	}
}

// Split block at caret
const split_block =  function () {
	var blocks = $("div.block")
	const block_to_split = last_block_focussed
	let target = document.createTextNode("\u0001");
	document.getSelection().getRangeAt(0).insertNode(target);
	let caret_pos = blocks[block_to_split].outerHTML.indexOf("\u0001");
	target.parentNode.removeChild(target);

	// console.log(caret_pos)
	if(caret_pos != -1){
		// If block is not empty
		first_block = blocks[block_to_split].outerHTML.slice(0, caret_pos)
		second_block = blocks[block_to_split].outerHTML.slice(caret_pos)

		add_block(undefined, block_to_split + 1)
		add_block(undefined, block_to_split + 1)

		blocks = $("div.block")
		blocks[block_to_split + 1].outerHTML = first_block

		second_block_content = ""
		second_block_elements = $.parseHTML(second_block)
		if(second_block_elements != undefined){
			for (var i = 0; i < second_block_elements.length; i++) {
				const current_el = second_block_elements[i]
				if (current_el.nodeName == "#text") {
					current_content = current_el.textContent
					current_content = current_content.replace("\n", "")
					current_content = current_content.replace("\t", "")
					current_content = current_content.trimStart()
					current_content = current_content.trimEnd()
					second_block_content = second_block_content + current_content
				} else {
					second_block_content = second_block_content + current_el.outerHTML
				}
			}
			blocks[block_to_split + 2].children[0].innerHTML = second_block_content
			blocks[block_to_split].remove()
			last_block_focussed = block_to_split + 1
			re_render_blocks()
			highlight_focussed()
		}
	}
}

// Export all blocks in a preformatted HTML file
const export_doc = function(){
	blocks = $("div.block")
	content_body = ""
	for (var i = 0; i < blocks.length; i++) {
		content_body = content_body + blocks[i].outerHTML
	}
	let data = new Blob([content_body], {type: 'text/HTML'});
	let data_url  = window.URL.createObjectURL(data);
	content_download_link.href = data_url
	// console.log(data_url)
	content_download_link.click()
}

const save_content_to_localstorage = function(){
	blocks = $("div.block")
	content_body = ""
	for (var i = 0; i < blocks.length; i++) {
		content_body = content_body + blocks[i].outerHTML
	}
	localStorage.setItem("content", content_body);
}

const load_content_from_localstorage = function(){
	writer.innerHTML = localStorage.getItem("content")
	const blocks = $("div.block")
	last_block_focussed = blocks.length - 1
	highlight_focussed()
}

const load_content_from_file = function(){
	if (this.files && this.files[0]) {
		var uploaded_file = this.files[0];
		var reader = new FileReader();

		reader.addEventListener('load', function (e) {
			writer.innerHTML = e.target.result;
			const blocks = $("div.block")
			last_block_focussed = blocks.length - 1
			highlight_focussed()
		});

		reader.readAsBinaryString(uploaded_file);
	}
}

// ================================================================
// Bind functions to their respective buttons
// ================================================================
upload_input.onchange = load_content_from_file

add_block_btn.onclick = add_block
remove_block_btn.onclick = remove_block
move_block_up_btn.onclick = function(){move_block(direction = 'up')}
move_block_down_btn.onclick = function(){move_block(direction = 'down')}
split_block_btn.onclick = split_block


for (let i = formatting_btns_index; i < formatting_btns.length; i++) {
	formatting_btns[i].onclick = function(){
		apply_style(this.getAttribute("data-style") )
	}
}

// ================================================================
// Generic banner to debug if script is imported correctly
const __banner__ = "Jedi is a dynamic and embeddable rich text editor."
console.log(__banner__)


const edit_content_btn = $("#edit-content-btn")[0]
const save_content_btn = $("#save-content-btn")[0]
if (writer == undefined){
	const writer = $("#jedi-writer")}
// const content = document.getElementById("{{INPUT_ID}}")
const editor_modal = $("#jedi-editor-modal")


edit_content_btn.onclick = function(){
	console.log("Editing content!")
	writer.innerHTML = content.value
	re_render_blocks()
}

save_content_btn.onclick = function(){
	console.log("Saving content!")
	content.value = writer.innerHTML
	// re_render_blocks()
	editor_modal.close()
}