import { api } from "./client";

export interface BrandSettings {
  name: string;
  shortName: string;
  tagline: string;
  monogram: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
}

export interface ContactSettings {
  email: string;
  phone: string;
  address: string;
  supportHours: string;
}

export interface SocialSettings {
  instagram: string | null;
  linkedin: string | null;
  twitter: string | null;
  youtube: string | null;
}

export interface SeoSettings {
  defaultTitle: string;
  defaultDescription: string;
  ogImage: string | null;
  twitterCard: string | null;
}

export interface FeatureFlags {
  enableDarkMode: boolean;
  enableMobileMenu: boolean;
  showWelcomeToast: boolean;
}

export interface SiteSetting<V = unknown> {
  key: string;
  value: V;
  description: string | null;
  updatedAt: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  parentId: string | null;
  requiredPermission: string | null;
  requiredRole: string | null;
  sortOrder: number;
  isExternal: boolean;
  isActive: boolean;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsSection {
  id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  imageUrl: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  storagePath: string;
  publicUrl: string;
  mimeType: string | null;
  sizeBytes: number;
  altText: string | null;
  createdAt: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

// ── Public reads (no auth required) ─────────────────────────────────────────
export async function fetchPublicSettings(): Promise<SiteSetting[]> {
  const { data } = await api.get<Envelope<SiteSetting[]>>("/cms/settings/public");
  return data.data;
}

export async function fetchPublicNavItems(): Promise<NavItem[]> {
  const { data } = await api.get<Envelope<NavItem[]>>("/cms/nav");
  return data.data;
}

export async function fetchPublicSections(): Promise<CmsSection[]> {
  const { data } = await api.get<Envelope<CmsSection[]>>("/cms/sections/public");
  return data.data;
}

// ── Authenticated reads ─────────────────────────────────────────────────────
export async function fetchAllSettings(): Promise<SiteSetting[]> {
  const { data } = await api.get<Envelope<SiteSetting[]>>("/cms/settings");
  return data.data;
}

export async function fetchAllNavItems(): Promise<NavItem[]> {
  const { data } = await api.get<Envelope<NavItem[]>>("/cms/nav/all");
  return data.data;
}

export async function fetchPages(): Promise<CmsPage[]> {
  const { data } = await api.get<Envelope<CmsPage[]>>("/cms/pages");
  return data.data;
}

export async function fetchSections(): Promise<CmsSection[]> {
  const { data } = await api.get<Envelope<CmsSection[]>>("/cms/sections");
  return data.data;
}

export async function fetchMedia(): Promise<MediaItem[]> {
  const { data } = await api.get<Envelope<MediaItem[]>>("/cms/media");
  return data.data;
}

// ── Mutations (require cms:manage) ──────────────────────────────────────────
export async function upsertSetting<V = unknown>(
  key: string,
  value: V,
  description?: string | null
): Promise<SiteSetting<V>> {
  const { data } = await api.put<Envelope<SiteSetting<V>>>(`/cms/settings/${encodeURIComponent(key)}`, {
    value,
    description: description ?? null
  });
  return data.data;
}

export async function createNavItem(input: Omit<NavItem, "id">): Promise<NavItem> {
  const { data } = await api.post<Envelope<NavItem>>("/cms/nav", input);
  return data.data;
}

export async function updateNavItem(id: string, input: Omit<NavItem, "id">): Promise<NavItem> {
  const { data } = await api.put<Envelope<NavItem>>(`/cms/nav/${id}`, input);
  return data.data;
}

export async function deleteNavItem(id: string): Promise<void> {
  await api.delete(`/cms/nav/${id}`);
}

export async function reorderNavItems(items: { id: string; sortOrder: number }[]): Promise<NavItem[]> {
  const { data } = await api.post<Envelope<NavItem[]>>("/cms/nav/reorder", { items });
  return data.data;
}

export async function createPage(input: Omit<CmsPage, "id" | "publishedAt" | "createdAt" | "updatedAt">): Promise<CmsPage> {
  const { data } = await api.post<Envelope<CmsPage>>("/cms/pages", input);
  return data.data;
}

export async function updatePage(id: string, input: Omit<CmsPage, "id" | "publishedAt" | "createdAt" | "updatedAt">): Promise<CmsPage> {
  const { data } = await api.put<Envelope<CmsPage>>(`/cms/pages/${id}`, input);
  return data.data;
}

export async function deletePage(id: string): Promise<void> {
  await api.delete(`/cms/pages/${id}`);
}

export async function upsertSection(
  key: string,
  input: Omit<CmsSection, "id" | "key" | "updatedAt">
): Promise<CmsSection> {
  const { data } = await api.put<Envelope<CmsSection>>(`/cms/sections/${encodeURIComponent(key)}`, input);
  return data.data;
}

export async function deleteSection(key: string): Promise<void> {
  await api.delete(`/cms/sections/${encodeURIComponent(key)}`);
}

export async function createMedia(input: Omit<MediaItem, "id" | "createdAt">): Promise<MediaItem> {
  const { data } = await api.post<Envelope<MediaItem>>("/cms/media", input);
  return data.data;
}

export async function deleteMedia(id: string): Promise<void> {
  await api.delete(`/cms/media/${id}`);
}
