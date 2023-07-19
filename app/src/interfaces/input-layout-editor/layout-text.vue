<template>
    <input
        v-bind:value="data.text"
        :disabled="disabled"
        @input="contentUpdated"
        @keydown="(e) => e.key == 'Enter' ? carriageReturn() : false"
        :class="classes"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        type: string,
        data: any, // JSON object
        disabled?: boolean;
    }>(), {
        type: 'text',
        data: { text: '' },
        disabled: false,
    }
);

let classes = computed({
    get () {
        return{
            base: true,
            paragraph: props.type == 'text',
            heading1: props.type == 'heading1',
            heading2: props.type == 'heading2',
            heading3: props.type == 'heading3',
        }
    },
    set () { /* */ }
});

const emit = defineEmits(['input', 'carriageReturn']);

function contentUpdated(event: any) {
    emit('input', {
        text: event.target.value
    });
}
function carriageReturn()
{
    emit('carriageReturn', 'text');
}
</script>

<style>
.base {
    border: none;
    background: none;
    width: 100%;
}
.heading1 {
    font-size: 2em;
}
.heading2 {
    font-size: 1.8em;
}
.heading3 {
    font-size: 1.4em;
}
</style>