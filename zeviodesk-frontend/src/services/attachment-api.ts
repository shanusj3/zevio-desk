import { request, tokenStore } from '../lib/api';
import {
  InitiateUploadPayload,
  InitiateUploadResult,
  CompleteUploadResult,
  AttachmentItem,
} from '../types/attachment';

export const attachmentApi = {
  /**
   * Initiate upload session and receive S3 presigned URL
   */
  async initiateUpload(payload: InitiateUploadPayload): Promise<InitiateUploadResult> {
    return request<InitiateUploadResult>('/v1/attachments/initiate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Upload file binary directly from browser to S3 via presigned PUT URL
   */
  async uploadToS3Direct(
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Direct S3 upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Direct S3 upload network/CORS error'));
      xhr.send(file);
    });
  },

  /**
   * Fallback proxy upload via backend when direct S3 CORS is restricted
   */
  async uploadViaProxy(
    attachmentId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = tokenStore.get() || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      xhr.open('PUT', `http://localhost:3001/api/v1/attachments/${attachmentId}/upload`, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      const tenantKey = new URLSearchParams(window.location.search).get('tenant') || window.location.hostname;
      xhr.setRequestHeader('x-tenant-slug', tenantKey);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Proxy upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Proxy upload network error'));
      xhr.send(file);
    });
  },

  /**
   * Server-side S3 HEAD verification and promotion from quarantine to permanent storage
   */
  async completeUpload(attachmentId: string): Promise<CompleteUploadResult> {
    return request<CompleteUploadResult>(`/v1/attachments/${attachmentId}/complete`, {
      method: 'POST',
    });
  },

  /**
   * Full end-to-end direct upload pipeline helper
   */
  async uploadFile(
    file: File,
    entityType: InitiateUploadPayload['entityType'],
    entityId: string,
    category: InitiateUploadPayload['category'],
    onProgress?: (percent: number) => void
  ): Promise<string> {
    // Step 1: Initiate session
    const initiateRes = await this.initiateUpload({
      entityType,
      entityId,
      category,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    });

    // Step 2: Direct browser-to-S3 upload (with proxy fallback on CORS error)
    try {
      await this.uploadToS3Direct(initiateRes.uploadUrl, file, onProgress);
    } catch (err) {
      console.warn('Direct S3 upload failed or CORS blocked. Falling back to backend proxy upload...', err);
      await this.uploadViaProxy(initiateRes.attachmentId, file, onProgress);
    }

    // Step 3: Complete & verify promotion
    await this.completeUpload(initiateRes.attachmentId);

    return initiateRes.attachmentId;
  },

  /**
   * Get content URL (returns ZevioDesk authenticated URL that issues 302 redirect)
   */
  getContentUrl(attachmentId: string): string {
    return `http://localhost:3001/api/v1/attachments/${attachmentId}/content`;
  },

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(attachmentId: string): string {
    return `http://localhost:3001/api/v1/attachments/${attachmentId}/thumbnail`;
  },

  /**
   * Get metadata
   */
  async getMetadata(attachmentId: string): Promise<AttachmentItem> {
    return request<AttachmentItem>(`/v1/attachments/${attachmentId}`);
  },

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    return request<void>(`/v1/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  },
};
