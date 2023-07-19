<template>
    <div class="layout-related">
        <v-list>
			<v-notice v-if="items?.length === 0 || false">{{ t('no_items') }}</v-notice>

			<draggable
				:force-fallback="true"
				:model-value="items"
				item-key="$index"
				:set-data="hideDragImage"
				:disabled="disabled"
				@update:model-value="sortItems"
			>
				<template #item="{ element }">
					<v-list-item
						block
						clickable
						@click="editItem(element)"
					>
						<v-icon v-if="disabled" class="drag-handle" left name="drag_handle" @click.stop />
						<span class="collection">{{ getCollectionName(element) }}:</span>
						<render-template
							:collection="element.collection"
							:template="templates[element.collection]"
							:item="itemData[element.collection+'.'+element.id]"
						/>
						<div class="spacer" />
						<v-icon
							v-if="!disabled"
							class="clear-icon"
							name="close"
							@click.stop="removeRelatedItem(element)"
						/>
					</v-list-item>
				</template>
			</draggable>
		</v-list>

        <div class="actions">
			<v-menu v-if="enableCreate && allowedCreateCollections.length > 0" :disabled="disabled" show-arrow>
				<template #activator="{ toggle }">
					<v-button :disabled="disabled" @click="toggle" :small="true" :secondary="true">
						Create new
						<v-icon name="arrow_drop_down" right />
					</v-button>
				</template>

				<v-list>
					<v-list-item
						v-for="availableCollection of allowedCreateCollections"
						:key="availableCollection.collection"
						clickable
						@click="openCreateItemDrawer(availableCollection.collection)"
					>
						<v-list-item-icon>
							<v-icon :name="availableCollection.icon" />
						</v-list-item-icon>
						<v-text-overflow :text="availableCollection.name" />
					</v-list-item>
				</v-list>
			</v-menu>
			<v-menu v-if="enableSelect" :disabled="disabled" show-arrow>
				<template #activator="{ toggle }">
					<v-button class="existing" :disabled="disabled" @click="toggle" :small="true" :secondary="true">
						Add existing
						<v-icon name="arrow_drop_down" right />
					</v-button>
				</template>

				<v-list>
					<v-list-item
						v-for="availableCollection of allowedExistingCollections"
						:key="availableCollection.collection"
						clickable
						@click="selectingFrom = availableCollection.collection"
					>
						<v-list-item-icon>
							<v-icon :name="availableCollection.icon" />
						</v-list-item-icon>
						<v-text-overflow :text="availableCollection.name" />
					</v-list-item>
				</v-list>
			</v-menu>

			<v-pagination v-if="pageCount > 1" v-model="page" :length="pageCount" :total-visible="5" />
		</div>

		<drawer-collection
			v-if="!disabled && selectingFrom"
			multiple
			:active="!!selectingFrom"
			:collection="selectingFrom"
			@input="selectItem($event!, selectingFrom ?? undefined)"
			@update:active="selectingFrom = null"
		/>

		<drawer-item
			v-if="currentlyEditing !== null || createItemInCollection !== null"
			v-model:active="editModalActive"
			:disabled="disabled"
			:collection="currentlyEditing?.collection || createItemInCollection || ''"
			:primary-key="currentlyEditing?.id || '+'"
			@input="updateItem"
		/>
    </div>
</template>

<script setup lang="ts">
import { ref, toRefs, computed, watch } from 'vue';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useI18n } from 'vue-i18n';
import { hideDragImage } from '@/utils/hide-drag-image';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { Collection } from '@/types/collections';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import api from '@/api';

import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import Draggable from 'vuedraggable';

type RelatedItem = {
	id: number;
	collection: string;
};

const props = withDefaults(
    defineProps<{
        type: string,
        data: Record<string,any>, // JSON object
        disabled?: boolean;
        allowedRelatedContent: any;
    }>(), {
        type: 'text',
        disabled: false,
        allowedRelatedContent: { new: [], existing: [] },
    }
);

console.log(props.allowedRelatedContent)

const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();
const emit = defineEmits(['input']);
const { t, te } = useI18n();

const items = ref<Array<RelatedItem>>([]);
if (props.data.items && Array.isArray(props.data.items))
{
    for (let item of props.data.items)
    {
		console.log(item);
        items.value.push(item);
    }
}

const enableCreate = true;
const enableSelect = true;
const limit = ref<number>(15);
const totalItemCount = ref<number>(10);

const editModalActive = ref(false);
const currentlyEditing = ref<RelatedItem | null>(null);
const createItemInCollection = ref<string | null>(null);

const selectingFrom = ref<string | null>(null);

const page = ref(1);

watch([limit], () => {
	page.value = 1;
});

const pageCount = computed(() => Math.ceil(totalItemCount.value / limit.value));

const allowedCreateCollections = computed(() => {
	return collectionsStore.visibleCollections.filter((collection) => 
        props.allowedRelatedContent.new.includes(collection.collection)
    );
});

const allowedExistingCollections = computed(() => {
	return collectionsStore.visibleCollections.filter((collection) => 
        props.allowedRelatedContent.existing.includes(collection.collection)
    );
});

const templates = computed(() => {
	const templates: Record<string, string> = {};

	for (const collection of collectionsStore.visibleCollections) {
		templates[collection.collection] = collection.meta?.display_template || `{{${collection.collection}}}`;
	}
	return templates;
});

const itemData = ref<Record<string, any>>({});
if (Array.isArray(items.value))
{
	items.value.forEach((item, index) => {
		getElementData(item).then((thisItemData) => {
			itemData.value[item.collection+'.'+item.id] = thisItemData;
		});
	});
}

function selectItem($event: any, selectingFrom: any)
{
    for (let i of $event)
    {
		addRelatedItem(selectingFrom, i);
    }
    
    update();
}

function addRelatedItem(collection: string, primaryKey: any)
{
	const newItem = {
        id: primaryKey,
        collection: collection,
    } as RelatedItem;
    items.value.push(newItem);

	getElementData(newItem).then((thisItemData) => {
		itemData.value[newItem.collection+'.'+newItem.id] = thisItemData;
	});
}

function removeRelatedItem(item: RelatedItem)
{
	items.value = items.value.filter((i: RelatedItem) => i !== item)
    update();
}

function editItem(item: RelatedItem)
{
	currentlyEditing.value = item;
	editModalActive.value = true;
}

async function updateItem(internalEdits: any)
{
	if (currentlyEditing.value !== null)
	{
		// Update item
		const item = currentlyEditing.value;
		const endpoint = getApiEndpoint(item.collection, item.id);

		try {
			await api.patch(endpoint, internalEdits);

			// Refresh the related item
			getElementData(item).then((thisItemData) => {
				itemData.value[item.collection+'.'+item.id] = thisItemData;
			});

		} catch (err: any) {
			console.log(err)
		}
	}
	else if (createItemInCollection.value !== null)
	{
		// Create item
		const collection = createItemInCollection.value;
		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(collection);
		const endpoint = getApiEndpoint(collection, null);

		if (primaryKeyField)
		{
			try {
				const result = await api.post(endpoint, internalEdits);
				if (result.data.data[primaryKeyField.field])
				{
					const primaryKey = result.data.data[primaryKeyField.field];

					// Add a new item
					addRelatedItem(collection, primaryKey);
					update();
				}

			} catch (err: any) {
					console.log(err)
			}
		}
	}
}

function openCreateItemDrawer(collection: string) {

	currentlyEditing.value = null;
	createItemInCollection.value = collection;
	editModalActive.value = true;
}

function sortItems(sortedItems: RelatedItem[]) {
	items.value = sortedItems;
	update();
}

function update()
{
	emit('input', {
		items: items.value,
	});
}

async function getElementData(item: RelatedItem) {

	const collection = (collectionsStore.visibleCollections.filter((collection) => 
		collection.collection == item.collection) as any
	) as Collection;
	const template = templates.value[item.collection];

	const _template = template || collection.meta?.display_template;
	if (!_template || !item.collection) return null;

	const fields = adjustFieldsForDisplays(getFieldsFromTemplate(_template), item.collection);

	const endpoint = getApiEndpoint(item.collection, item.id);

	try {
		const result = await api.get(endpoint, {
			params: {
				fields: fields,
			},
		});
		return result.data.data;

	} catch (err: any) {
		console.log(err)
	}

	const loadingData: Record<string, any> = {};
	for (let field of fields)
	{
		loadingData[field] = '';
	}
	return loadingData;
};

function getCollectionName(item: RelatedItem) {

    const collection = collectionsStore.visibleCollections.find((coll) => 
        coll.collection === item.collection
    );

	if (te(`collection_names_singular.${collection?.collection}`)) {
		return t(`collection_names_singular.${collection?.collection}`);
	}

	if (te(`collection_names_plural.${collection?.collection}`)) {
		return t(`collection_names_plural.${collection?.collection}`);
	}

	return collection?.name;
}

function getApiEndpoint(collection: string, primaryKey: any | null)
{
	const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(collection);

	const baseEndpoint = getEndpoint(collection);
	let endpoint: string = baseEndpoint;

	if (primaryKeyField != null && primaryKey != null) {
		endpoint = collection.startsWith('directus_')
			? `${baseEndpoint}/${primaryKeyField.name}`
			: `${baseEndpoint}/${encodeURIComponent(primaryKey)}`;
	}

	return endpoint;
}

</script>

<style>
.layout-related {
    width: 100%;
    margin: 0.5em 0;
    /*padding: 8px var(--input-padding);
    background-color: var(--v-list-item-background-color);
    border: var(--border-width) solid var(--v-list-item-border-color);
    border-radius: var(--border-radius);
    transition: border-color var(--fast) var(--transition);*/
}
</style>