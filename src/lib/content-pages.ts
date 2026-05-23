import { adminApiRequest } from "@/lib/admin-auth";

export type ContentPageKey =
  | "landing-page"
  | "privacy-policy"
  | "terms-conditions"
  | "about-us";

export type LandingPageContent = {
  heroHeadline: string;
  subheading: string;
  primaryButtonLabel: string;
  primaryButtonUrl: string;
  secondaryButtonLabel?: string;
  secondaryButtonUrl?: string;
  backgroundVisualsEnabled: boolean;
};

export type LegalDocumentContent = {
  contentHtml: string;
  imageOriginalFileName?: string;
};

export type AboutPageContent = {
  eyebrow: string;
  title: string;
  body: string;
  commitments: string[];
};

export type ContentPageContent =
  | LandingPageContent
  | LegalDocumentContent
  | AboutPageContent;

export type AdminContentPage<TContent extends ContentPageContent> = {
  key: ContentPageKey;
  draft: TContent;
  published: TContent;
  version: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAdminContentPage<TContent extends ContentPageContent>(
  key: ContentPageKey,
): Promise<AdminContentPage<TContent>> {
  const response = await adminApiRequest<{ contentPage: AdminContentPage<TContent> }>(
    `/admin/content-pages/${key}`,
  );

  return response.data.contentPage;
}

export async function saveAdminContentPage<TContent extends ContentPageContent>(
  key: ContentPageKey,
  content: Partial<TContent>,
): Promise<AdminContentPage<TContent>> {
  const response = await adminApiRequest<{ contentPage: AdminContentPage<TContent> }>(
    `/admin/content-pages/${key}`,
    {
      method: "PATCH",
      body: {
        content,
      },
    },
  );

  return response.data.contentPage;
}
