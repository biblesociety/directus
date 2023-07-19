import { defineInterface } from '@directus/utils';
import InterfaceLayoutEditor from './input-layout-editor.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'input-layout-editor',
	name: '$t:interfaces.input-layout-editor.input-layout-editor',
	description: '$t:interfaces.input-layout-editor.description',
	icon: 'auto_awesome_mosaic',
	component: InterfaceLayoutEditor,
	types: ['json'],
	group: 'standard',
	preview: PreviewSVG,
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'font',
			name: '$t:font',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '$t:sans_serif',
							value: 'sans-serif',
						},
						{
							text: '$t:monospace',
							value: 'monospace',
						},
						{
							text: '$t:serif',
							value: 'serif',
						},
					],
				},
			},
			schema: {
				default_value: 'sans-serif',
			},
		},
		{
			field: 'tools',
			name: '$t:interfaces.input-block-editor.tools',
			type: 'json',
			schema: {
				default_value: [
					'header',
					'paragraph',
					'related',
				],
			},
			meta: {
				width: 'half',
				interface: 'select-multiple-dropdown',
				options: {
					choices: [
						{
							value: 'header',
							text: '$t:interfaces.input-block-editor.tools_options.header',
						},
						{
							value: 'paragraph',
							text: '$t:interfaces.input-block-editor.tools_options.paragraph',
						},
						{
							value: 'related',
							text: 'Related content',
						},
					],
				},
			},
		},
		{
			field: 'bordered',
			name: '$t:displays.formatted-value.border',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:displays.formatted-value.border_label',
				},
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'folder',
			name: '$t:interfaces.system-folder.folder',
			type: 'uuid',
			meta: {
				width: 'full',
				interface: 'system-folder',
				note: '$t:interfaces.system-folder.field_hint',
			},
		},
	],
});
