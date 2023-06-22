import { ref } from 'vue';

export function useRelatedContentHandler(getContentInstance: (instance: any) => any, getSelectedCollectionOptions: (selectedCollection: string) => any) {
	return {
		showDraw: ref(false),
		checkShowDraw: function () {
			return this.showDraw;
		},
		cancelDraw: function () {
			this.showDraw = ref(false);
		},
		getContentInstance: getContentInstance,
		getSelectedCollectionOptions: getSelectedCollectionOptions,
		selectedCollection: ref<any>(null),
		setSelectedCollection: function (selectedCollection: string) {
			this.selectedCollection = selectedCollection;
		},
		selectedContent: ref<any>(null),
	};
}
