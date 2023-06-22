import { ref } from 'vue';

export function useRelatedContentHandler() {
	return {
		showDrawer: ref<boolean>(false),
		selectedCollection: ref<any>(null),
		selectedContent: ref<any>(null),
	};
}
