const PRODUCT_IMAGE_MAP = {
  'premium alphonso mangoes': 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=1200',
  'red onions (nashik quality)': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=1200',
  'green grapes (seedless)': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=1200',
  'organic tomatoes': 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&q=80&w=1200',
  'basmati rice (premium)': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=1200',
  'fresh cauliflower': 'https://images.unsplash.com/photo-1615485925873-5472d16d1882?auto=format&fit=crop&q=80&w=1200',
  'cow milk (a2)': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=1200',
  'sweet corn': 'https://images.unsplash.com/photo-1622484212850-6b4f0f8f1f0d?auto=format&fit=crop&q=80&w=1200',
  'banana (robusta)': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=1200',
  'groundnut (shelled)': 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=1200',
  'spinach bunch': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=1200',
  'organic turmeric': 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&q=80&w=1200',
};

const PRODUCT_KEYWORD_IMAGE_MAP = {
  mango: PRODUCT_IMAGE_MAP['premium alphonso mangoes'],
  onion: PRODUCT_IMAGE_MAP['red onions (nashik quality)'],
  onions: PRODUCT_IMAGE_MAP['red onions (nashik quality)'],
  grape: PRODUCT_IMAGE_MAP['green grapes (seedless)'],
  grapes: PRODUCT_IMAGE_MAP['green grapes (seedless)'],
  tomato: PRODUCT_IMAGE_MAP['organic tomatoes'],
  tomatoes: PRODUCT_IMAGE_MAP['organic tomatoes'],
  rice: PRODUCT_IMAGE_MAP['basmati rice (premium)'],
  cauliflower: PRODUCT_IMAGE_MAP['fresh cauliflower'],
  milk: PRODUCT_IMAGE_MAP['cow milk (a2)'],
  corn: PRODUCT_IMAGE_MAP['sweet corn'],
  banana: PRODUCT_IMAGE_MAP['banana (robusta)'],
  groundnut: PRODUCT_IMAGE_MAP['groundnut (shelled)'],
  peanut: PRODUCT_IMAGE_MAP['groundnut (shelled)'],
  spinach: PRODUCT_IMAGE_MAP['spinach bunch'],
  turmeric: PRODUCT_IMAGE_MAP['organic turmeric'],
};

const CATEGORY_IMAGE_MAP = {
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=1200',
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=1200',
  grains: 'https://images.unsplash.com/photo-1621955964441-c173e01c135b?auto=format&fit=crop&q=80&w=1200',
  dairy: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?auto=format&fit=crop&q=80&w=1200',
  organic: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=1200',
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=1200';

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const findImageByKeywords = (nameKey) => {
  if (!nameKey) return null;

  for (const [keyword, imageUrl] of Object.entries(PRODUCT_KEYWORD_IMAGE_MAP)) {
    if (nameKey.includes(keyword)) {
      return imageUrl;
    }
  }

  return null;
};

export const getProductImage = (productLike) => {
  if (!productLike) return DEFAULT_IMAGE;

  if (productLike.image) return productLike.image;
  if (productLike.product_image) return productLike.product_image;

  const nameKey = normalize(productLike.name || productLike.product_name);
  if (nameKey && PRODUCT_IMAGE_MAP[nameKey]) {
    return PRODUCT_IMAGE_MAP[nameKey];
  }

  const keywordImage = findImageByKeywords(nameKey);
  if (keywordImage) {
    return keywordImage;
  }

  const categoryKey = normalize(productLike.category);
  if (categoryKey && CATEGORY_IMAGE_MAP[categoryKey]) {
    return CATEGORY_IMAGE_MAP[categoryKey];
  }

  return DEFAULT_IMAGE;
};
