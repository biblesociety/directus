<template>
	<div class="input-block-editor-bs">
		<div ref="editorElement" :class="{ [font]: true, disabled, bordered }"></div>
		
		<v-drawer
			v-if="haveFilesAccess && !disabled"
			:model-value="fileHandler !== null"
			icon="image"
			:title="t('upload_from_device')"
			:cancelable="true"
			@update:model-value="unsetFileHandler"
			@cancel="unsetFileHandler"
		>
			<div class="uploader-drawer-content">
				<div v-if="currentPreview" class="uploader-preview-image">
					<img :src="currentPreview" />
				</div>
				<v-upload
					:ref="uploaderComponentElement"
					:multiple="false"
					:folder="folder"
					from-library
					from-url
					@input="handleFile"
				/>
			</div>
		</v-drawer>

		<v-drawer
			v-if="!disabled"
			:model-value="showRelatedContentDrawer"
			icon="settings_ethernet"
			:title="t('Select related content')"
			:cancelable="true"
			@cancel="cancelRelatedContentDrawer"
		>
			<div class="uploader-drawer-content">
				<div class="label type-label">Collection</div>
				<system-collection :value="selectedCollection" include-system @input="relatedCollectionSelected"></system-collection>
				<div v-if="selectedCollection != null">
					<div class="label type-label">Related Content</div>
					<collection-item-dropdown :value="selectedContent" selected-collection="Content" @input="relatedContentSelected"></collection-item-dropdown>
				</div>
			</div>
		</v-drawer>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api, { addTokenToURL } from '@/api';
import EditorJS from '@editorjs/editorjs';
import { isEqual, cloneDeep } from 'lodash';
import { useFileHandler } from './use-file-handler';
import getTools from './tools';
import { useCollectionsStore } from '@/stores/collections';
import { unexpectedError } from '@/utils/unexpected-error';
import { useRelatedContentHandler } from './related-content-handler';
import CollectionItemDropdown from '@/interfaces/collection-item-dropdown/collection-item-dropdown.vue';
import SystemCollection from '@/interfaces/_system/system-collection/system-collection.vue';

const props = withDefaults(
	defineProps<{
		disabled?: boolean;
		autofocus?: boolean;
		value?: Record<string, any> | null;
		bordered?: boolean;
		placeholder?: string;
		tools?: string[];
		folder?: string;
		font?: 'sans-serif' | 'monospace' | 'serif';
	}>(),
	{
		disabled: false,
		autofocus: false,
		value: () => {
			return null;
		},
		bordered: true,
		tools: () => ['header', 'nestedlist', 'code', 'image', 'paragraph', 'checklist', 'quote', 'underline', 'related'],
		font: 'sans-serif',
	}
);

const emit = defineEmits(['input']);

const { t } = useI18n();

const collectionStore = useCollectionsStore();

const { currentPreview, setCurrentPreview, fileHandler, setFileHandler, unsetFileHandler, handleFile } =
	useFileHandler();

const editorjsRef = ref<EditorJS>();
const uploaderComponentElement = ref<HTMLElement>();
const editorElement = ref<HTMLElement>();
const haveFilesAccess = Boolean(collectionStore.getCollection('directus_files'));
const haveValuesChanged = ref<boolean>(false);

let showRelatedContentDrawer = ref(false);
let selectedCollection = ref<string | null>(null);
let selectedContent = ref<any | null>(null);

const relatedContentHandler = {
	openDrawer: function(collection: string | null, content: any| null) {
		showRelatedContentDrawer.value = true;
		selectedCollection.value = collection;
		selectedContent.value = content;
	},
	saveRelatedContent: function(selectedCollection: string | null, selectedContent: any | null)
	{
		if (selectedCollection)
		{
			const event = new CustomEvent("related-content-selected-event", { 
				detail: {
					collection: selectedCollection,
					content: selectedContent
				}
			});
			document.dispatchEvent(event);
		}
		else
		{
			const event = new CustomEvent("related-content-selected-event", {});
			document.dispatchEvent(event);
		}
	},
};

const cancelRelatedContentDrawer = function() {
	showRelatedContentDrawer.value = false;
	selectedCollection.value = null;
	selectedContent.value = null;
	relatedContentHandler.saveRelatedContent(null, null);
}

const relatedCollectionSelected = async function (collection: string | null) {
	selectedCollection.value = collection;
};
const relatedContentSelected = function (content: { collection: string, key: number }) {
	selectedContent.value = content.key;
	relatedContentHandler.saveRelatedContent(content.collection, content.key);
	showRelatedContentDrawer.value = false;
}

const tools = getTools(
	{
		addTokenToURL,
		baseURL: api.defaults.baseURL,
		setFileHandler,
		setCurrentPreview,
		getUploadFieldElement: () => uploaderComponentElement,
	},
	props.tools,
	haveFilesAccess,
	relatedContentHandler,
);

onMounted(async () => {
	const sanitizedValue = sanitizeValue(props.value);

	editorjsRef.value = new EditorJS({
		logLevel: 'ERROR' as EditorJS.LogLevels,
		holder: editorElement.value,
		readOnly: false,
		placeholder: props.placeholder,
		minHeight: 72,
		onChange: (api: any, event: any) => emitValue(api, event),
		tools: tools,
	});

	// we have initial data, so we render it once the editor is ready...
	await editorjsRef.value.isReady;

	if (sanitizedValue) {
		await editorjsRef.value.render(sanitizedValue);
	}

	if (props.autofocus) {
		editorjsRef.value.focus();
	}
});

onUnmounted(() => {
	if (!editorjsRef.value) return;

	editorjsRef.value.destroy();
});

watch(
	() => props.value,
	async (newVal: any, oldVal: any) => {
		if (!editorjsRef.value || !editorjsRef.value.isReady || haveValuesChanged.value) return;

		if (fileHandler.value !== null) return;

		if (isEqual(newVal?.blocks, oldVal?.blocks)) return;

		try {
			await editorjsRef.value.isReady;
			const sanitizedValue = sanitizeValue(newVal);

			if (sanitizedValue) {
				await editorjsRef.value.render(sanitizedValue);
			} else {
				editorjsRef.value.clear();
			}
		} catch (err: any) {
			unexpectedError(err);
		}

		haveValuesChanged.value = false;
	}
);

async function emitValue(context: EditorJS.API, _event: CustomEvent) {
	if (props.disabled || !context || !context.saver) return;
	haveValuesChanged.value = true;

	try {
		const result: EditorJS.OutputData = await context.saver.save();

		if (!result || result.blocks.length < 1) {
			emit('input', null);
			return;
		}

		if (isEqual(result.blocks, props.value?.blocks)) return;

		emit('input', result);
	} catch (err: any) {
		unexpectedError(err);
	}
}

function sanitizeValue(value: any): EditorJS.OutputData | null {
	if (!value || typeof value !== 'object' || !value.blocks || value.blocks.length < 1) return null;

	// we use cloneDeep to recursively clone the object
	return cloneDeep({
		time: value?.time || Date.now(),
		version: value?.version || '0.0.0',
		blocks: value.blocks,
	});
}
</script>

<style lang="scss">
@import './editorjs-overrides.css';
</style>

<style lang="scss" scoped>
.btn--default {
	color: #fff !important;
	background-color: #0d6efd;
	border-color: #0d6efd;
}
.btn--gray {
	color: #fff !important;
	background-color: #7c7c7c;
	border-color: #7c7c7c;
}

.disabled {
	color: var(--foreground-subdued);
	background-color: var(--background-subdued);
	border-color: var(--border-normal);
	pointer-events: none;
}

.bordered {
	padding: var(--input-padding) 4px var(--input-padding) calc(var(--input-padding) + 8px) !important;
	background-color: var(--background-page);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);

	&:hover {
		border-color: var(--border-normal-alt);
	}

	&:focus-within {
		border-color: var(--primary);
	}
}

.monospace {
	font-family: var(--family-monospace);
}

.serif {
	font-family: var(--family-serif);
}

.sans-serif {
	font-family: var(--family-sans-serif);
}

.uploader-drawer-content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}

.uploader-preview-image {
	margin-bottom: var(--form-vertical-gap);
	background-color: var(--background-normal);
	border-radius: var(--border-radius);
}

.uploader-preview-image img {
	display: block;
	width: auto;
	max-width: 100%;
	height: auto;
	max-height: 40vh;
	margin: 0 auto;
	object-fit: contain;
}
</style>
