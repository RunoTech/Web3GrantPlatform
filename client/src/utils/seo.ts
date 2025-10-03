interface SEOMetaTags {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}

export function updateMetaTags({ title, description, image, url, type = 'website' }: SEOMetaTags) {
  // Update document title
  document.title = title;

  // Update or create meta tags
  const metaTags = [
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: type },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ];

  if (image) {
    metaTags.push(
      { property: 'og:image', content: image },
      { name: 'twitter:image', content: image }
    );
  }

  if (url) {
    metaTags.push({ property: 'og:url', content: url });
  }

  metaTags.forEach(({ name, property, content }) => {
    const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
    let tag = document.querySelector(selector);

    if (!tag) {
      tag = document.createElement('meta');
      if (name) tag.setAttribute('name', name);
      if (property) tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }

    tag.setAttribute('content', content);
  });
}

export function truncateDescription(text: string, maxLength: number = 155): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
}

export function getCampaignMetaTags(campaign: { 
  title: string; 
  description: string; 
  imageUrl?: string;
  id: number;
}) {
  const baseUrl = window.location.origin;
  const campaignUrl = `${baseUrl}/campaign/${campaign.id}`;
  
  return {
    title: `${campaign.title} - DUXXAN`,
    description: truncateDescription(campaign.description),
    image: campaign.imageUrl,
    url: campaignUrl,
    type: 'article'
  };
}
