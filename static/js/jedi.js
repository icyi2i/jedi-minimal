// alert("Jedi")

class Jedi{
    constructor(jediInputId, jediTogglerId) {
        this.jediInput = document.getElementById(jediInputId)
        this.jediToggler = document.getElementById(jediTogglerId)

        this.getJediModalHTML().then( jediModalHTML => {
            // console.log(jediEditorModal)
            this.jediToggler.insertAdjacentHTML("afterend", jediModalHTML)
            this.jediEditorModal = $("#jedi-editor-modal")
            this.blocks = this.jediInput.value
            this.jediToggler.addEventListener("click", () => {
                this.jediEditorModal.modal("show")
                this.blocks = this.jediInput.value ? JSON.parse(this.jediInput.value) : []
                this.renderBlocks()
            })

            this.lastBlockFocussed = null
            this.blockTemplateId = "block-template"

            this.jediWriter = document.getElementById("jedi-writer")

            // Editor buttons
            this.addBlockBtn = document.getElementById("add-block-btn")
            this.removeBlockBtn = document.getElementById("remove-block-btn")
            this.moveBlockUpBtn = document.getElementById("move-block-up-btn")
            this.moveBlockDownBtn = document.getElementById("move-block-down-btn")
            this.blockTypeSelector = document.getElementById("block-type-selector")
            this.blockAlignSelector = document.getElementById("block-align-selector")


            this.saveChangesButton = document.getElementById("jedi-save-changes-button")
            this.configure()
        })
    }

    getJediModalHTML = async () => (await fetch("./static/js/editor.html")).text()

    configure = () => {
        this.addBlockBtn.addEventListener("click", this.addBlock)
        this.removeBlockBtn.addEventListener("click", this.removeBlock)
        this.moveBlockUpBtn.addEventListener("click", () => {
            this.moveBlock("up")})
        this.moveBlockDownBtn.addEventListener("click", () => {
            this.moveBlock("down")})

        this.saveChangesButton.addEventListener("click", this.saveChangesToInput)
        
        Array.from(this.blockTypeSelector.querySelectorAll(".dropdown-item")).forEach(
            (blockTypeButton) => {
                // console.log(blockTypeButton)
                blockTypeButton.addEventListener("click", (event) => {
                    // console.log(event.target)
                    this.changeBlockType(event.target.getAttribute("data-block-type"))
                })
            }
        )

        Array.from(this.blockAlignSelector.querySelectorAll(".dropdown-item")).forEach(
            (blockAlignButton) => {
                // console.log(blockAlignButton)
                blockAlignButton.addEventListener("click", (event) => {
                    // console.log(event.target)
                    this.changeBlockAlign(event.target.getAttribute("data-block-align"))
                })
            }
        )

    }
    // ================================================================
    // DOM functions
    // ================================================================
    // Appends a block to the writer
    addBlock = (event) => {
        let emptyBlock = {type: "normal", content: ""}

        this.lastBlockFocussed = this.lastBlockFocussed === null ? this.blocks.length : this.lastBlockFocussed + 1
        this.blocks.splice(this.lastBlockFocussed, 0, emptyBlock)
        this.blocks.join()

        // console.log(this.blocks)
        // console.log(this.lastBlockFocussed)
        this.renderBlocks()
    }

    // Removes last selected block from writer
    removeBlock = () => {
        if (this.lastBlockFocussed === null) {
            alert("No block selected!")
        } else if (confirm("Are you sure you want to delete the selected block?")){
            this.blocks = this.blocks.slice(0,this.lastBlockFocussed).concat(this.blocks.slice(this.lastBlockFocussed + 1))
            this.lastBlockFocussed = this.lastBlockFocussed === 0 ? null : this.lastBlockFocussed - 1
        }

        // console.log(this.blocks)
        // console.log(this.lastBlockFocussed)
        this.renderBlocks()
    }

    // Move block up/down
    moveBlock = (direction='')=>{
        if (this.lastBlockFocussed === null) {
            alert("No block selected!")
        } else {
            if (direction === "up" && this.lastBlockFocussed !== 0) {
                // Move up
                [
                    this.blocks[this.lastBlockFocussed],
                    this.blocks[this.lastBlockFocussed - 1],
                    this.lastBlockFocussed
                ] = [
                    this.blocks[this.lastBlockFocussed - 1],
                    this.blocks[this.lastBlockFocussed],
                    this.lastBlockFocussed - 1
                ]

            } else if (direction === "down" &&
                this.lastBlockFocussed !== this.blocks.length - 1) {
                // Move down
                [
                    this.blocks[this.lastBlockFocussed],
                    this.blocks[this.lastBlockFocussed + 1],
                    this.lastBlockFocussed
                ] = [
                    this.blocks[this.lastBlockFocussed + 1],
                    this.blocks[this.lastBlockFocussed],
                    this.lastBlockFocussed + 1
                ]
            }
            this.renderBlocks()
        }
    }

    // Renders all blocks in the writer pane while:
    // - applying block level style according to individual attributes
    // - refreshing all event listeners
    renderBlocks = () => {
        this.jediWriter.innerHTML = ""

        for (let blockId = 0; blockId < this.blocks.length; blockId++) {
            var new_block = document
                            .getElementById(this.blockTemplateId)
                            .content
                            .querySelector('div.jedi-block')
                            .cloneNode(true);

            new_block.id = blockId

            new_block.classList.add(this.blocks[blockId].type)
            new_block.classList.add(this.blocks[blockId].align)
            // new_block.classList.add(this.blocks[blockId].font)

            if (this.lastBlockFocussed === blockId){
                new_block.classList.add("current")
            }

            new_block.contentEditable = true
            new_block.onpaste = (event) => {
                // Cancel paste
                event.preventDefault();
                // Get text representation of clipboard
                const text = (event.originalEvent || event).clipboardData.getData(
                    'text/plain').split("\n").join("\r\n");
                // Insert text manually
                document.execCommand("insertText", false, text);
                this.updateBlock(event)
            }

            if (this.blocks[blockId].type === "code") {
                new_block.innerHTML = this.blocks[blockId].content
            } else if (this.blocks[blockId].type == "link") {
                new_block.innerHTML = `<a target="_blank" href="${this.blocks[blockId].content.link}">${this.blocks[blockId].content.text}</a>`
                new_block.contentEditable = false

            } else if (this.blocks[blockId].type === "image") {
                new_block.innerHTML = `<div class="w-50 d-block">
                    <img class="w-100" src="${this.blocks[blockId].content.link}">
                    <figcaption>${this.blocks[blockId].content.text}</figcaption>
                </div>`
                new_block.contentEditable = false
            } else {
                new_block.innerHTML = this.blocks[blockId].content
            }

            this.jediWriter.appendChild(new_block)
        }

        this.setEventListeners()
    }

    // Change block type
    changeBlockType = (blockType="normal") => {
        // console.log(blockType)
        if (this.lastBlockFocussed === null) {
            alert("No block selected!")
        } else {
            this.blocks[this.lastBlockFocussed].type = blockType
            if (blockType === "link"){
                this.blocks[this.lastBlockFocussed].content = { 
                    link : "https://www.google.com",
                    text : "Google"
                }
            } else if (blockType === "image") {
                this.blocks[this.lastBlockFocussed].content = { 
                    link : "https://upload.wikimedia.org/wikipedia/commons/6/6a/A_blank_flag.png",
                    text : "Image with a question mark!"
                }
            }
    
            this.renderBlocks()
        }
    }
    // Change block align
    changeBlockAlign = (blockAlign="align-left") => {
        // console.log(blockAlign)
        if (this.lastBlockFocussed === null) {
            alert("No block selected!")
        } else {

            this.blocks[this.lastBlockFocussed].align = blockAlign

            this.renderBlocks()
        }
    }

    updateBlock = (event) => {
        // console.log(this.blocks[event.target.id].content)
        this.blocks[event.target.id].content = event.target.innerHTML
            .replaceAll("</div><br>", "\n").replaceAll("<br></div>", "\n")
            .replaceAll("<div>","").replaceAll("</div>","\n")
            .replaceAll("<br>", "\n").trim()
        // console.log(this.blocks[event.target.id].content)
    }

    setEventListeners = () => {
        const jediWriterBlocks = this.jediWriter.childNodes
        const linkInputModal = document.getElementById('link-input-modal')
        const linkInputModalText = document.getElementById('modal-text-input')
        const linkInputModalLink = document.getElementById('modal-link-input')
        const linkInputModalSave = document.getElementById("link-input-modal-save")
        const linkInputModalCancel = document.getElementById("link-input-modal-cancel")

        // Select block on click
        for (let blockId = 0; blockId < jediWriterBlocks.length; blockId++) {
            $(jediWriterBlocks[blockId]).off()
            jediWriterBlocks[blockId].addEventListener('click', (event)=>{
                if (this.lastBlockFocussed !== null){
                    jediWriterBlocks[this.lastBlockFocussed].classList.remove("current")}
                    this.lastBlockFocussed = Number(event.target.id)
                    // console.log(this.lastBlockFocussed)
                    jediWriterBlocks[this.lastBlockFocussed].classList.add("current")

                // this.renderBlocks()
                // jediWriterBlocks[this.lastBlockFocussed].focus()
            })
            jediWriterBlocks[blockId].addEventListener('input', this.updateBlock)

            if (this.blocks[blockId].type == 'link' || this.blocks[blockId].type == 'image'){
                jediWriterBlocks[blockId].addEventListener(
                'click', ()=> {
                    linkInputModalLink.value = this.blocks[blockId].content.link
                    linkInputModalText.value = this.blocks[blockId].content.text
                    if (this.blocks[blockId].type == 'link'){
                        linkInputModalLink.setAttribute("placeholder", "https://www.google.com")
                        linkInputModalText.setAttribute("placeholder", "Google")
                    } else if (this.blocks[blockId].type == 'image'){
                        linkInputModalLink.setAttribute("placeholder", "https://upload.wikimedia.org/wikipedia/commons/6/6a/A_blank_flag.png")
                        linkInputModalText.setAttribute("placeholder", "Image with a question mark!")
                    }

                    $(linkInputModal).modal("show")
                })
            }
        }

        $(linkInputModalSave).off()
        linkInputModalSave.addEventListener('click', ()=>{
            this.blocks[this.lastBlockFocussed].content = {
                text : linkInputModalText.value,
                link : linkInputModalLink.value
                }
            $(linkInputModal).modal("hide")
            this.renderBlocks()
        })
        $(linkInputModalCancel).off()
        linkInputModalCancel.addEventListener('click', ()=>{
            $(linkInputModal).modal("hide")
        })
    }

    saveChangesToInput = (event) =>{
        this.jediInput.value = JSON.stringify(this.blocks)
        document.getElementById("jedi-demo-output").innerText =  JSON.stringify(this.blocks, undefined, 4)

    }
}
