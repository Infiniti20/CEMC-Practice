<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		className?: string;
	}

	interface InputEventDetail {
		html: string;
		text: string;
	}

	let {
		value = $bindable(''),
		placeholder = 'Type something...',
		className = ''
	}: Props = $props();

	// Internal state to track content
	let contentDiv: HTMLSpanElement;

	interface SavedSelection {
		startPath: number[] | null;
		endPath: number[] | null;
		startOffset: number;
		endOffset: number;
		textBefore: string;
		textAfter: string;
	}

	let lastCursorPosition: SavedSelection | null = null;

	function handleKeyUp(event: Event) {
		// if (!event.isTrusted) return;

		// Dispatch the input event with details
		if(contentDiv.innerHTML == "<br>"){
            contentDiv.innerHTML = ""
        }
		value = contentDiv.innerHTML;
	}

	function handleEvent(e: KeyboardEvent): void {
		switch (e.key) {
			case 'Tab':
				e.preventDefault();
				document.execCommand('insertHTML', false, '    '); //Insert a 4-space tab
				break;

			case 'Enter':
				e.preventDefault();
				const selection = window.getSelection();
				if (selection && selection.rangeCount > 0) {
					let range = selection.getRangeAt(0),
						br = document.createElement('br'),
						textNode = document.createTextNode('\u00a0'); //Passing " " directly will not end up being shown correctly
					range.deleteContents(); //required or not?
					range.insertNode(br);
					range.collapse(false);
					range.insertNode(textNode);
					range.selectNodeContents(textNode);

					selection.removeAllRanges();
					selection.addRange(range);
                    document.execCommand('delete')
				}
				break;
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
	bind:this={contentDiv}
	contenteditable="true"
	oninput={handleKeyUp}
	data-placeholder={placeholder}
	onkeydown={handleEvent}
	class="{className} content-editable border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm cursor-text"
></span>

<style>
	.content-editable:empty:before {
		content: attr(data-placeholder);
		color: hsl(var(--muted-foreground) / var(--tw-text-opacity, 1));
		/* font-style: italic; */
	}

	/* .content-editable:focus {
    border-color: #0066cc;
    box-shadow: 0 0 5px rgba(0, 102, 204, 0.5);
  } */
</style>
