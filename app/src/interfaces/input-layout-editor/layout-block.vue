<template>
    <div class="input-layout-block">
        <div class="floating-controls">
            <v-menu :disabled="disabled" show-arrow v-model:modelValue="newItemMenu">
                <template #activator="{ toggle }">
                    <button @click="toggle" style="line-height: 1em;">
                        <v-list-item-icon style="margin:0">
							<v-icon name="add" :small="true"/>
						</v-list-item-icon>
                    </button>
                </template>

                <v-list>
                    <v-list-item
                        v-for="element of allowedElements"
                        :key="element.type"
                        clickable
                        @click="createBelow(element.type)"
                    >
                        <v-list-item-icon>
                            <v-icon :name="element.icon" />
                        </v-list-item-icon>
                        <v-text-overflow :text="element.name" />
                    </v-list-item>
                </v-list>
            </v-menu>
            <v-menu :disabled="disabled" show-arrow>
                <template #activator="{ toggle }">
                    <button @click="toggle" style="line-height: 1em;">
                        <v-list-item-icon style="margin:0">
							<v-icon name="edit_square" :small="true" />
						</v-list-item-icon>
                    </button>
                </template>

                <v-list>
                    <v-list-item @click="remove()">Remove</v-list-item>
                    <v-list-item>Move:</v-list-item>
                    <v-list-item v-if="canMoveUp || canMoveLeft" @click="moveUp">
                        <v-list-item-icon>
                            <v-icon v-if="canMoveUp" name="keyboard_arrow_up" />
                            <v-icon v-if="canMoveLeft" name="keyboard_arrow_left" />
                        </v-list-item-icon>
                        {{ canMoveUp ? 'Up' : 'Left' }}
                    </v-list-item>
                    <v-list-item v-if="canMoveDown || canMoveRight" @click="moveDown">
                        <v-list-item-icon>
                            <v-icon v-if="canMoveDown" name="keyboard_arrow_down" />
                            <v-icon v-if="canMoveRight" name="keyboard_arrow_right" />
                        </v-list-item-icon>
                        {{ canMoveDown ? 'Down' : 'Right' }}
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>
        <layout-text
            v-if="['text', 'heading1', 'heading2', 'heading3'].includes(value.type)"
            :type="value.type"
            :data="value.data"
            :disabled="disabled"
            @input="contentUpdated"
            @carriageReturn="createBelow"
        ></layout-text>

        <layout-richtext 
            v-if="value.type == 'richtext'"
            :type="value.type"
            :data="value.data"
            :disabled="disabled"
            @input="contentUpdated"
            @tab="toggleNewItemMenu"
        ></layout-richtext>

        <layout-related
            v-if="value.type == 'related'"
            :type="value.type"
            :data="value.data"
            :disabled="disabled"
            :allowedRelatedContent="allowedRelatedContent"
            @input="contentUpdated"
        ></layout-related>

        <layout-section
            v-if="value.type == 'row'"
            :index="index"
            :value="value.data"
            @input="contentUpdated"
            direction="horizontal"
            :disabled="props.disabled"
            :bordered="true"
            :allowedElements="allowedElements"
            :allowedRelatedContent="allowedRelatedContent"
        ></layout-section>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LayoutText from './layout-text.vue';
import LayoutSection from './layout-section.vue';
import LayoutRichtext from './layout-richtext.vue';
import LayoutRelated from './layout-related.vue';

const props = withDefaults(
    defineProps<{
        index: number,
        value: { type: string, data: any }, // JSON object
        disabled?: boolean;
		folder?: string;
        allowedElements: any;
        allowedRelatedContent: any;
        canMoveUp: boolean,
        canMoveDown: boolean,
        canMoveLeft: boolean,
        canMoveRight: boolean,
    }>(), {
        disabled: false,
        allowedElements: [],
        allowedRelatedContent: [],
        canMoveUp: false,
        canMoveDown: false,
        canMoveLeft: false,
        canMoveRight: false,
    }
);

let newItemMenu = ref<boolean>(false);

const emit = defineEmits(['input', 'remove', 'createBelow', 'moveUp', 'moveDown']);

function contentUpdated(newData: any) {
    console.log('update block', props.index, newData);
    emit('input', props.index, {
        type: props.value.type,
        data: newData
    });
}
function remove()
{
    console.log('remove', props.index);
    emit('remove', props.index);
}
function createBelow(type: string)
{
    emit('createBelow', type, props.index);
}
function moveUp()
{
    emit('moveUp', props.index);
}
function moveDown()
{
    emit('moveDown', props.index);
}
function toggleNewItemMenu()
{
    newItemMenu.value = !newItemMenu.value;
}
</script>

<style>
.input-layout-block {
    display: flex;
    position: relative;
    padding: 0.4em;
    padding-left: 1.4em;
}
.input-layout-editor-section .input-layout-block {
    border-bottom: 0.5px dashed var(--v-list-item-border-color);
}
.input-layout-editor-section .input-layout-editor-section-row .input-layout-block {
    border-bottom: none;
    border-right: 0.5px dashed var(--v-list-item-border-color);
}
.input-layout-block > .floating-controls {
    position: absolute;
    left: -25px;
    display: none;
}
.input-layout-block:hover {
    border-top: 0.5px dashed white;
    border-bottom: 0.5px dashed white;
}
.input-layout-editor-section .input-layout-editor-section-row .input-layout-block:hover {
    border-top: none;
    border-bottom: none;
    border-left: 0.5px dashed white;
    border-right: 0.5px dashed white;
}
.input-layout-block:hover > .floating-controls {
    display: block;
}
</style>