import BaseAttachesTool from '@editorjs/attaches';
import BaseImageTool from '@editorjs/image';
import { unexpectedError } from '@/utils/unexpected-error';

/**
 * This file is a modified version of the attaches and image tool from editorjs to work with the Directus file manager.
 *
 * We include an uploader to directly use Directus file manager, along with a modified version of the attaches and image tools.
 */

class Uploader {
	getCurrentFile: any;
	config: any;
	onUpload: any;
	onError: any;
	constructor({
		config,
		getCurrentFile,
		onUpload,
		onError,
	}: {
		config: any;
		getCurrentFile?: any;
		onUpload: any;
		onError: any;
	}) {
		this.getCurrentFile = getCurrentFile;
		this.config = config;
		this.onUpload = onUpload;
		this.onError = onError;
	}

	async uploadByFile(file: any, { onPreview }: any) {
		try {
			await Promise.all([this.uploadSelectedFile({ onPreview }), onPreview()]);

			if (!this.config.uploader.getUploadFieldElement) return;

			this.config.uploader.getUploadFieldElement().onBrowseSelect({
				target: {
					files: [file],
				},
			});
		} catch (err: any) {
			unexpectedError(err);
		}
	}

	uploadByUrl(url: string) {
		this.onUpload({
			success: 1,
			file: {
				url: url,
			},
		});
	}

	uploadSelectedFile({ onPreview }: { onPreview: any }) {
		if (this.getCurrentFile) {
			const currentPreview = this.getCurrentFile();

			if (currentPreview) {
				this.config.uploader.setCurrentPreview(
					this.config.uploader.addTokenToURL(currentPreview) + '&key=system-large-contain'
				);
			}
		}

		this.config.uploader.setFileHandler(
			(file: { width: any; height: any; filesize: any; filename_download: string; title: any; id: string }) => {
				if (!file) {
					this.onError({
						success: 0,
						message: this.config.t.no_file_selected,
					});

					return;
				}

				const response = {
					success: 1,
					file: {
						width: file.width,
						height: file.height,
						size: file.filesize,
						name: file.filename_download,
						title: file.title,
						extension: file.filename_download.split('.').pop(),
						fileId: file.id,
						fileURL: this.config.uploader.baseURL + 'files/' + file.id,
						url: this.config.uploader.baseURL + 'assets/' + file.id,
					},
				};

				onPreview(this.config.uploader.addTokenToURL(response.file.fileURL));
				this.onUpload(response);
			}
		);
	}
}

export class AttachesTool extends BaseAttachesTool {
	constructor(params: {
		config: { uploader: any };
		block: { save: () => Promise<any> };
		api: { blocks: { update: (arg0: any, arg1: any) => void } };
	}) {
		super(params);

		this.config.uploader = params.config.uploader;

		this.uploader = new Uploader({
			config: this.config,
			onUpload: (response: any) => this.onUpload(response),
			onError: (error: any) => this.uploadingFailed(error),
		});

		this.onUpload = (response: any) => {
			super.onUpload(response);

			params.block.save().then((state) => {
				params.api.blocks.update(state.id, state.data);
			});
		};
	}

	showFileData() {
		super.showFileData();

		if (this.data.file && this.data.file.url) {
			const downloadButton = this.nodes.wrapper.querySelector('a.cdx-attaches__download-button');

			if (downloadButton) {
				downloadButton.href = this.config.uploader.addTokenToURL(this.data.file.url) + '&download';
			}
		}
	}
}

export class ImageTool extends BaseImageTool {
	constructor(params: any) {
		super(params);

		this.uploader = new Uploader({
			config: this.config,
			getCurrentFile: () => this.data?.file?.url,
			onUpload: (response: any) => this.onUpload(response),
			onError: (error: any) => this.uploadingFailed(error),
		});
	}

	set image(file: { url?: any }) {
		this._data.file = file || {};

		if (file && file.url) {
			const imageUrl = this.config.uploader.addTokenToURL(file.url) + '&key=system-large-contain';
			this.ui.fillImage(imageUrl);
		}
	}
}

export class RelatedTool {
	relatedContent: boolean;
	contentTypeSelect: any;
	api: any;
	handler: object;
	data: object;

	constructor({ data, config }) {
		this.relatedContent = false;
		this.contentTypeSelect = null;

		this.handler = config.handler;
		this.data = data;
	}

	static get toolbox() {
		return {
			title: 'Related content',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>',
		};
	}

	render() {

		const element = document.createElement('p');

		if (!this.relatedContent) {
			this.handler.showDraw = true;
		} else {
			element.innerText = 'content set!';
		}

		return element;
		/*this.contentTypeSelect = document.createElement('select');
		let that = this;

		this.handler.getContentTypes().then(function(types: Array) {
			for (let type of types) {
				const option = document.createElement('option');
				option.value = type.collection;
				option.innerText = type.collection;

				that.contentTypeSelect.appendChild(option);
				
			}
		});

		return this.contentTypeSelect;*/
	}

	save(blockContent: { value: any }) {
		return {
			id: blockContent.value,
		};
	}
}
