import axios, { AxiosInstance } from 'axios';
import {
  Page,
  Element,
  ElementUsage,
  CreatePageRequest,
  CreateElementRequest,
  UpdatePageRequest,
  UpdateElementRequest,
  GenerateCodeRequest,
  ValidateSelectorRequest,
  ImportRequest,
  ExportResponse,
  StatisticsResponse,
} from '../types/objectRepository.types';

class ObjectRepositoryAPI {
  private api: AxiosInstance;

  constructor(baseURL: string = '/api/object-repository') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Pages API
  async getPages(projectId?: number): Promise<Page[]> {
    const params = projectId ? { projectId } : {};
    const response = await this.api.get('/pages', { params });
    return response.data;
  }

  async getPage(id: number): Promise<Page> {
    const response = await this.api.get(`/pages/${id}`);
    return response.data;
  }

  async createPage(data: CreatePageRequest): Promise<Page> {
    const response = await this.api.post('/pages', data);
    return response.data;
  }

  async updatePage(id: number, data: UpdatePageRequest): Promise<Page> {
    const response = await this.api.put(`/pages/${id}`, data);
    return response.data;
  }

  async deletePage(id: number): Promise<void> {
    await this.api.delete(`/pages/${id}`);
  }

  // Elements API
  async getElements(pageId?: number): Promise<Element[]> {
    const params = pageId ? { pageId } : {};
    const response = await this.api.get('/elements', { params });
    return response.data;
  }

  async getElementById(id: number): Promise<Element> {
    const response = await this.api.get(`/elements/${id}`);
    return response.data;
  }

  async getElementsByPage(pageId: number): Promise<Element[]> {
    const response = await this.api.get(`/elements/page/${pageId}`);
    return response.data;
  }

  async createElement(data: CreateElementRequest): Promise<Element> {
    const response = await this.api.post('/elements', data);
    return response.data;
  }

  async updateElement(id: number, data: UpdateElementRequest): Promise<Element> {
    const response = await this.api.put(`/elements/${id}`, data);
    return response.data;
  }

  async deleteElement(id: number): Promise<void> {
    await this.api.delete(`/elements/${id}`);
  }

  // Code Generation API
  async generatePageObject(pageId: number, request: GenerateCodeRequest): Promise<{ code: string }> {
    const response = await this.api.post(`/generate/page-object/${pageId}`, request);
    return response.data;
  }

  async generateAllPageObjects(request: GenerateCodeRequest): Promise<{ files: Array<{ filename: string; code: string }> }> {
    const response = await this.api.post('/generate/all-page-objects', request);
    return response.data;
  }

  // Validation API
  async validateSelector(request: ValidateSelectorRequest): Promise<{ valid: boolean; suggestion?: string }> {
    const response = await this.api.post('/validate-selector', request);
    return response.data;
  }

  // Statistics API
  async getStatistics(): Promise<StatisticsResponse> {
    const response = await this.api.get('/statistics');
    return response.data;
  }

  // Import/Export API
  async importElements(data: ImportRequest): Promise<{ imported: number }> {
    const response = await this.api.post('/import', data);
    return response.data;
  }

  async exportRepository(projectId?: number): Promise<ExportResponse> {
    const params = projectId ? { projectId } : {};
    const response = await this.api.post('/export', {}, { params });
    return response.data;
  }

  // Element Usage API
  async getElementUsages(elementId: number): Promise<ElementUsage[]> {
    const response = await this.api.get(`/elements/${elementId}/usages`);
    return response.data;
  }

  async trackElementUsage(elementId: number, scriptId: number): Promise<void> {
    await this.api.post(`/elements/${elementId}/track-usage`, { scriptId });
  }

  // Search API
  async searchElements(query: string): Promise<Element[]> {
    const response = await this.api.get('/elements/search', {
      params: { q: query },
    });
    return response.data;
  }

  async searchPages(query: string): Promise<Page[]> {
    const response = await this.api.get('/pages/search', {
      params: { q: query },
    });
    return response.data;
  }
}

// Export singleton instance
export const objectRepositoryAPI = new ObjectRepositoryAPI();
export default objectRepositoryAPI;
