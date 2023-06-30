import { ref } from 'vue';
import type { Ref } from 'vue';

import { ContentSelector } from './plugins';

export type RelatedContentHandler = {
	//showDrawer: Ref<boolean>;
	selectedCollection: Ref<object | null>;
	selectedContent: Ref<object | null>;

	openDrawer: any;
	selector: ContentSelector | null;
	contentSavedCallback: any;
	saveRelatedContent: any;
};

export function useRelatedContentHandler(showDrawerFunction: any) {
	return {
		//showDrawer: ref<boolean>(false),
		selectedCollection: ref<any>(null),
		selectedContent: ref<any>(null),

		openDrawer: showDrawerFunction,
		contentSavedCallback: function(a,b) {},
	};
}
