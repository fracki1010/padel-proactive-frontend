import { api } from "../httpClient";
import type { CompanyImage, DigestBackground } from "./parsers";

const clientLog = (level: "log" | "error", message: string, data?: unknown) => {
  api.post("/config/client-log", { level, message, data }).catch(() => {});
};

const compressImage = (file: File, maxPx = 1200, quality = 0.8): Promise<File> =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

export const companyImagesService = {
  getCompanyImages: async (type?: "portal_cover" | "digest_background"): Promise<CompanyImage[]> => {
    const response = await api.get("/config/company-images", { params: type ? { type } : {} });
    return response.data?.data ?? [];
  },

  uploadCompanyImage: async (file: File, type: "portal_cover" | "digest_background", order = 1): Promise<CompanyImage> => {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("type", type);
    formData.append("order", String(order));
    const response = await api.post("/config/company-images", formData, { timeout: 120000 });
    return response.data.data;
  },

  deleteCompanyImage: async (id: string): Promise<void> => {
    await api.delete(`/config/company-images/${id}`);
  },

  getDigestBackgrounds: async (): Promise<DigestBackground[]> => {
    const response = await api.get("/config/company-images", { params: { type: "digest_background" } });
    return response.data?.data ?? [];
  },

  uploadDigestBackground: async (file: File, order: number): Promise<DigestBackground> => {
    clientLog("log", "uploadDigestBackground start", {
      name: file.name,
      type: file.type,
      size: file.size,
      order,
    });
    const compressed = await compressImage(file);
    clientLog("log", "uploadDigestBackground compressed", {
      originalSize: file.size,
      compressedSize: compressed.size,
    });
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("type", "digest_background");
    formData.append("order", String(order));
    try {
      const response = await api.post("/config/company-images", formData, { timeout: 120000 });
      clientLog("log", "uploadDigestBackground ok", { status: response.status });
      return response.data.data;
    } catch (err: any) {
      clientLog("error", "uploadDigestBackground error", {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        code: err?.code,
      });
      throw err;
    }
  },

  deleteDigestBackground: async (id: string): Promise<void> => {
    await api.delete(`/config/company-images/${id}`);
  },
};