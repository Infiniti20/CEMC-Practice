<script lang="ts">
	import { run } from 'svelte/legacy';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		value?: string;
		processText?: (text: string) => string;
		placeholder?: string;
		className?: string;
	}

	interface InputEventDetail {
		html: string;
		text: string;
	}

	const dispatch = createEventDispatcher<{
		input: InputEventDetail;
	}>();

	let {
		value = '',
		processText = (text: string) => text,
		placeholder = 'Type something...',
		className = ''
	}: Props = $props();

	// Internal state to track content
	let contentDiv: HTMLDivElement;
	let isInitialized = false;
	let isUserTyping = $state(false);

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
		isUserTyping = true;

		const currentHTML = contentDiv.innerHTML;
		lastCursorPosition = saveSelection();
		const processed = processText(currentHTML);

		if (processed !== currentHTML) {
			contentDiv.innerHTML = processed;

			setTimeout(() => {
				restoreSelection(lastCursorPosition);
			}, 0);
		}

		// Dispatch the input event with details
		dispatch('input', {
			html: contentDiv.innerHTML,
			text: contentDiv.textContent || ''
		});
	}

	function saveSelection(): SavedSelection | null {
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const startNode = range.startContainer;
			const endNode = range.endContainer;

			const startPath = getNodePath(contentDiv, startNode);
			const endPath = getNodePath(contentDiv, endNode);

			return {
				startPath,
				endPath,
				startOffset: range.startOffset,
				endOffset: range.endOffset,
				textBefore: startNode.textContent
					? startNode.textContent.substring(0, range.startOffset)
					: '',
				textAfter: endNode.textContent ? endNode.textContent.substring(range.endOffset) : ''
			};
		}
		return null;
	}

	function getNodePath(parent: Node, node: Node): number[] | null {
		const path: number[] = [];
		let current: Node | null = node;

		while (current && current !== parent) {
			const index = getNodeIndex(current);
			path.unshift(index);
			current = current.parentNode;
		}

		return current ? path : null;
	}

	function getNodeIndex(node: Node): number {
		let index = 0;
		let sibling: Node | null = node;

		while (sibling.previousSibling) {
			sibling = sibling.previousSibling;
			index++;
		}

		return index;
	}

	function restoreSelection(savedSelection: SavedSelection | null): void {
		if (!savedSelection) return;

		try {
			const selection = window.getSelection();
			if (!selection) return;

			selection.removeAllRanges();

			const startNode = getNodeByPath(contentDiv, savedSelection.startPath);
			const endNode = getNodeByPath(contentDiv, savedSelection.endPath);

			if (startNode && endNode) {
				const range = document.createRange();

				const startOffset = Math.min(
					savedSelection.startOffset,
					startNode.textContent?.length || 0
				);
				const endOffset = Math.min(savedSelection.endOffset, endNode.textContent?.length || 0);

				range.setStart(startNode, startOffset);
				range.setEnd(endNode, endOffset);

				selection.addRange(range);
			} else {
				fallbackRestoreSelection(savedSelection);
			}
		} catch (e) {
			console.warn('Failed to restore selection, using fallback', e);
			fallbackRestoreSelection(savedSelection);
		}
	}

	function getNodeByPath(parent: Node, path: number[] | null): Node | null {
		if (!path) return null;

		let current: Node = parent;

		for (const index of path) {
			if (!current.childNodes || index >= current.childNodes.length) {
				return null;
			}
			current = current.childNodes[index];
		}

		return current;
	}

	function fallbackRestoreSelection(savedSelection: SavedSelection): void {
		if (!savedSelection) return;

		try {
			const textNodes: Node[] = [];
			const walker = document.createTreeWalker(contentDiv, NodeFilter.SHOW_TEXT, null);

			let node: Node | null;
			while ((node = walker.nextNode())) {
				textNodes.push(node);
			}

			for (const textNode of textNodes) {
				if (textNode.textContent?.includes(savedSelection.textBefore)) {
					const index =
						textNode.textContent.indexOf(savedSelection.textBefore) +
						savedSelection.textBefore.length;

					const range = document.createRange();
					range.setStart(textNode, index);
					range.setEnd(textNode, index);

					const selection = window.getSelection();
					if (selection) {
						selection.removeAllRanges();
						selection.addRange(range);
					}
					return;
				}
			}

			if (textNodes.length > 0) {
				const lastNode = textNodes[textNodes.length - 1];
				const range = document.createRange();
				range.setStart(lastNode, lastNode.textContent?.length || 0);
				range.setEnd(lastNode, lastNode.textContent?.length || 0);

				const selection = window.getSelection();
				if (selection) {
					selection.removeAllRanges();
					selection.addRange(range);
				}
			}
		} catch (e) {
			console.warn('Fallback selection restoration failed', e);
		}
	}

	function init(node: HTMLDivElement) {
		contentDiv = node;

		if (value && !isInitialized) {
			contentDiv.innerHTML = value;
			isInitialized = true;

			const processed = processText(contentDiv.innerHTML);
			if (processed !== contentDiv.innerHTML) {
				contentDiv.innerHTML = processed;
			}
		}

		return {
			destroy() {
				// Cleanup if needed
			}
		};
	}

	run(() => {
		if (contentDiv && value && !isUserTyping) {
			contentDiv.innerHTML = value;
			const processed = processText(value);
			if (processed !== value) {
				contentDiv.innerHTML = processed;
			}
		}
	});

	function handleBlur() {
		isUserTyping = false;
		handleKeyUp({ type: 'blur', isTrusted: true } as Event);
	}
</script>

<div
	bind:this={contentDiv}
	contenteditable="true"
	oninput={handleKeyUp}
	onblur={handleBlur}
	data-placeholder={placeholder}
	use:init
	class="content-editable border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
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
