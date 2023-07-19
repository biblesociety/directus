<template>
    <div :class="{ bordered: props.bordered && props.initial }" style="width:100%; margin-bottom: 0.5em;">
        <div :class="{ 
            'input-layout-editor-section': true, 
            'input-layout-editor-section-row': props.direction && props.direction == 'horizontal', 
        }">
            <layout-block
                v-for="(element, index) in elements"
                :index="index"
                :value="element"
                :allowedElements="allowedElements"
                :allowedRelatedContent="allowedRelatedContent"
                :can-move-up="direction == 'vertical' && index > 0"
                :can-move-down="direction == 'vertical' && index < elements.length"
                :can-move-left="direction == 'horizontal' && index > 0"
                :can-move-right="direction == 'horizontal' && index < elements.length"
                @input="contentUpdated"
                @remove="contentRemoved"
                @createBelow="createElement"
                @moveUp="moveUp"
                @moveDown="moveDown"
            ></layout-block>
        </div>

        <v-menu :disabled="disabled" show-arrow>
            <template #activator="{ toggle }">
                <v-button :disabled="disabled" @click="toggle" :small="true" :secondary="true" style="margin-top: 0.8em">
                    Add {{ direction == 'horizontal' ? ' Column' : '' }}
                    <v-icon name="arrow_drop_down" right />
                </v-button>
            </template>

            <v-list>
                <v-list-item
                    v-for="element of props.allowedElements"
                    :key="element.type"
                    clickable
                    @click="createElement(element.type, -1)"
                >
                    <v-list-item-icon>
                        <v-icon :name="element.icon" />
                    </v-list-item-icon>
                    <v-text-overflow :text="element.name" />
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { LayoutElement } from './layout-element';
import LayoutBlock from './layout-block.vue';

const props = withDefaults(
    defineProps<{
        index: number,
        value: any, // array of elements
        disabled?: boolean;
		autofocus?: boolean;
        direction?: 'horizontal' | 'vertical';
        allowedElements: any;
        allowedRelatedContent: any;
        bordered: boolean;
        initial?: boolean;
    }>(), {
        disabled: false,
        autofocus: false,
        direction: 'vertical',
        bordered: true,
        inital: false,
    }
);

const { t } = useI18n();

const elements = ref<Array<LayoutElement>>([]);
if (props.value.elements && Array.isArray(props.value.elements))
{
    for (let element of props.value.elements)
    {
        elements.value.push(element);
    }
}

const emit = defineEmits(['input']);

function contentUpdated(index: number, newValue: any) {
    elements.value[index] = newValue;
    emitUpdate();
}

function contentRemoved(index: number)
{
    if (index > -1) {
        elements.value.splice(index, 1);
    }
    emitUpdate();
}

function createElement(type: string, position: -1)
{
    console.log('createElement', type, position);
    const newElement = {
        type: type,
        data: {}
    };

    if (position >= 0)
    {
        elements.value.splice(position+1, 0, newElement)
    }
    else
    {
        elements.value.push(newElement);
    }

    emitUpdate();
}

function moveUp(index: number)
{
    if (index > 0) {
        const elementToMove = elements.value[index];
        elements.value.splice(index, 1);
        elements.value.splice(index-1, 0, elementToMove);

        emitUpdate();
    }
}

function moveDown(index: number)
{
    if (index < elements.value.length) {
        const elementToMove = elements.value[index];
        elements.value.splice(index, 1);
        elements.value.splice(index+1, 0, elementToMove);

        emitUpdate();
    }
}

function emitUpdate() {
    emit('input', {
        elements: elements.value,
    });
}

</script>

<style>
.input-layout-editor-section {
    display: flex;
    flex-direction: column;
}
.input-layout-editor-section .input-layout-editor-section-row {
    flex-direction: row;
    flex-wrap: nowrap;
}
.input-layout-editor-section .input-layout-editor-section-row > * {
    flex: 1;
    max-width: 50%;
}
.bordered {
    margin: 0;
    padding: 8px var(--input-padding);
    background-color: var(--v-list-item-background-color);
    border: var(--border-width) solid var(--v-list-item-border-color);
    border-radius: var(--border-radius);
    transition: border-color var(--fast) var(--transition);
}
</style>