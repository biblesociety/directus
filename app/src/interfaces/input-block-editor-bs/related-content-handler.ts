import { ref } from 'vue';

export function useRelatedContentHandler(getContentTypes: () => any, getContentInstance: (instance: any) => any) {
	return {
		showDraw: false,
		getContentTypes: getContentTypes,
		getContentInstance: getContentInstance,
	};
}
