// Supabase Storage removed — file upload not yet reimplemented

export interface UploadResult {
	url: string | null;
	error: string | null;
	metadata?: {
		size: number;
		type: string;
		name: string;
	};
}

export interface UploadProgress {
	fileName: string;
	progress: number;
	status: 'uploading' | 'completed' | 'error';
}

export async function uploadFileToStorage(): Promise<UploadResult> {
	return { url: null, error: 'File upload not available' };
}

export async function uploadMultipleFiles(): Promise<UploadResult[]> {
	return [{ url: null, error: 'File upload not available' }];
}

export async function deleteFileFromStorage(): Promise<{ success: boolean; error: string | null }> {
	return { success: false, error: 'File upload not available' };
}

export function getFileInfo(file: File) {
	return {
		name: file.name,
		size: file.size,
		sizeFormatted: formatFileSize(file.size),
		type: file.type,
		isImage: file.type.startsWith('image/'),
		isVideo: file.type.startsWith('video/'),
		isDocument: !file.type.startsWith('image/') && !file.type.startsWith('video/')
	};
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
