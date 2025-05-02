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
		className = '',
	}: Props = $props();

	// Internal state to track content
	let contentDiv: HTMLDivElement;

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
		if (!event.isTrusted) return;


		// Dispatch the input event with details
		value = contentDiv.innerHTML
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
					const range = selection.getRangeAt(0);

					// Create a <br> element
					const br = document.createElement('br');

					// Insert the <br> at current position
					range.deleteContents();
					range.insertNode(br);

					// Move the caret after the <br>
					range.setStartAfter(br);
					range.setEndAfter(br);
					selection.removeAllRanges();
					selection.addRange(range);
				}
				break;
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={contentDiv}
	contenteditable="true"
	oninput={handleKeyUp}
	data-placeholder={placeholder}
	onkeydown={handleEvent}
	class="{className} content-editable border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm cursor-text"
></div>

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