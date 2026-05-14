import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website'
}) => {
  const { settings } = useSiteSettings();
  
  const siteName = settings?.storeName || 'عموري للتجميل';
  const defaultDescription = settings?.storeDescription || 'وجهتكم الأولى لمنتجات العناية بالبشرة والتجميل والساعات الفاخرة في اليمن.';
  const defaultKeywords = 'عموري للتجميل, عطور, ساعات, عناية بالبشرة, صنعاء, اليمن, تسوق اونلاين';
  
  const seoTitle = title ? `${title} | ${siteName}` : `${siteName} | المجر الإلكتروني المتكامل`;
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;
  const seoImage = image || settings?.logoUrl || '/logo.png';
  const seoUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta name="author" content={siteName} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* Language Alternates */}
      <link rel="canonical" href={seoUrl} />
      <html lang="ar" dir="rtl" />
    </Helmet>
  );
};
