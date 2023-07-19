<template>
    <div class="input-layout-editor">
       <layout-section
            :index="0"
            :value="{ 'elements': elements }"
            @input="contentUpdated"
            direction="vertical"
            :disabled="props.disabled"
            :autofocus="props.autofocus"
            :bordered="false"
            :allowedElements="allowedElements"
            :allowedRelatedContent="allowedRelatedContent"
            :initial="true"
        ></layout-section>
    </div>
    <br>
    <pre>{{ elements }}</pre>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { LayoutElement } from './layout-element';
import LayoutSection from './layout-section.vue';

const props = withDefaults(
    defineProps<{
        disabled?: boolean;
		autofocus?: boolean;
        value?: any, // JSON object
        bordered?: boolean;
		placeholder?: string;
		tools?: string[];
		folder?: string;
        loading?: boolean;
        batchMode?: boolean;
        batchActive?: boolean;
        width?: string;
        type?: any;
        collection?: any;
        field?: any;
        fieldData?: any;
        primaryKey?: any;
        length?: any;
        direction?: any;
    }>(), {}
);

const { t } = useI18n();

const allowedElements = [
    {
        type: 'richtext',
        name: 'Rich Text',
        icon: 'format_align_left'
    },
    {
        type: 'row',
        name: 'Row',
        icon: 'table_rows'
    },
    {
        type: 'related',
        name: 'Related Content',
        icon: 'code'
    },
    {
        type: 'text',
        name: 'Simple Text',
        icon: 'format_align_justify'
    },
];
const allowedRelatedContent = {
    new: [ 'Content', ],
    existing: [ 'Pages', 'Content', ],
};

const elements = ref<Array<LayoutElement>>([]);
if (Array.isArray(props.value))
{
    for (let element of props.value)
    {
        elements.value.push(element);
    }
}

const emit = defineEmits(['input', 'setFieldValue']);

function contentUpdated(newValue: any) {
    if (newValue.elements) {
        elements.value = newValue.elements;
    }
    emit('input', elements.value);
}

</script>