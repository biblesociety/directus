<template>
    <div bubble-menu-should-show-here>
        <bubble-menu
            v-if="editor"
            class="bubble-menu"
            :tippy-options="{ duration: 100 }"
            :editor="editor"
        >
            <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
                Bold
            </button>
            <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }">
                Italic
            </button>
            <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }">
                Strike
            </button>
        </bubble-menu>

        <floating-menu
            v-if="editor"
            class="floating-menu"
            :tippy-options="{ duration: 100 }"
            :editor="editor"
        >
            <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">
                H1
            </button>
            <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">
                H2
            </button>
            <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }">
                Bullet List
            </button>
        </floating-menu>
    </div>

  <editor-content :editor="editor" style="width:100%;" />
</template>

<script lang="ts">
import StarterKit from '@tiptap/starter-kit'
import {
  BubbleMenu,
  Editor,
  EditorContent,
  FloatingMenu,
} from '@tiptap/vue-3'

export default {
  components: {
    EditorContent,
    BubbleMenu,
    FloatingMenu,
  },

  props: {
    type: String,
    data: Object,
    disabled: Boolean,
  },

  emits: [ 'input', 'tab' ],

  data() {
    return {
      editor: null,
    } as { editor: Editor | null}
  },

  mounted() {
    this.editor = new Editor({
      extensions: [
        StarterKit,
      ],
      content: this.data,
      onUpdate: (e: any) => {
        this.$emit('input', e.editor.getJSON());
      },
      editorProps: {
        handleKeyDown: (view, event) => {
          if (event.key == 'Tab')
          {
            this.$emit('tab');
          }
        }
      }
    })
  },

  beforeUnmount() {
    if (this.editor)
        this.editor.destroy()
  },
}
</script>

<style lang="scss">
/* Basic editor styles */
.ProseMirror {
  > * + * {
    margin-top: 0.75em;
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  blockquote {
    padding-left: 1rem;
    border-left: 2px solid rgba(#0D0D0D, 0.1);
  }

  h1 {
    font-size: 2.2em;
  }
  h2 {
    font-size: 1.8em;
  }
  h3 {
    font-size: 1.4em;
  }
}

.bubble-menu {
  display: flex;
  background-color: #0D0D0D;
  padding: 0.2rem;
  border-radius: 0.5rem;

  button {
    border: none;
    background: none;
    color: #FFF;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0 0.2rem;
    opacity: 0.6;

    &:hover,
    &.is-active {
      opacity: 1;
    }
  }
}

.floating-menu {
  display: flex;
  background-color: #0D0D0D10;
  padding: 0.2rem;
  border-radius: 0.5rem;

  button {
    border: none;
    background: none;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0 0.2rem;
    opacity: 0.6;

    &:hover,
    &.is-active {
      opacity: 1;
    }
  }
}
</style>
