export interface CreateBrandDTO {
    name: string;
    slug?: string;
    logoUrl?: string;
    coverImage?: string;
    website?: string;
    description?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    metaImage?: string;
}

export interface UpdateBrandDTO {
    name?: string;
    logoUrl?: string;
    coverImage?: string;
    website?: string;
    description?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    metaImage?: string;
}