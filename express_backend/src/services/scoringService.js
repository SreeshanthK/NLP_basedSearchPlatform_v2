function applyNLPScoring(products, filters, originalQuery) {
    if (!products || products.length === 0) {
        return products;
    }

    const semantic = filters.semantic_analysis || {};
    const queryLower = originalQuery.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    
    const shoeCategories = [
        'sneakers', 'running shoes', 'basketball shoes', 'tennis shoes', 'athletic shoes',
        'casual shoes', 'formal shoes', 'dress shoes', 'boots', 'ankle boots', 'hiking boots',
        'sandals', 'flip flops', 'heels', 'high heels', 'flats', 'loafers', 'oxfords'
    ];
    
    const electronicsCategories = [
        'mobile phones', 'smartphones', 'phones', 'tablets', 'laptops', 'headphones', 
        'smartwatches', 'electronics', 'gadgets', 'devices'
    ];
    
    const clothingCategories = [
        'clothing', 'shirts', 't-shirts', 'pants', 'jeans', 'dresses', 'jackets', 'apparel',
        'tops', 'bottoms', 'outerwear', 'activewear', 'sleepwear', 'underwear'
    ];
    
    const shoeIndicators = ['shoes', 'shoe', 'footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats'];
    const electronicsIndicators = ['phone', 'mobile', 'smartphone', 'tablet', 'laptop', 'electronic', 'device', 'gadget'];
    const clothingIndicators = ['shirt', 't-shirt', 'tshirt', 'pant', 'dress', 'jacket', 'clothing', 'apparel', 'wear', 'top', 'bottom', 'polo', 'blouse', 'hoodie', 'sweater', 'jean'];
    
    const isShoeQuery = shoeIndicators.some(indicator => queryLower.includes(indicator));
    const isElectronicsQuery = electronicsIndicators.some(indicator => queryLower.includes(indicator));
    const isClothingQuery = clothingIndicators.some(indicator => queryLower.includes(indicator));
    
    for (const product of products) {
        let nlpScore = product._score || 1.0;
        const productCategory = (product.category || '').toLowerCase();
        const productTitle = (product.title || '').toLowerCase();
        const productDescription = (product.description || '').toLowerCase();
        const productTags = (product.tags || []).map(tag => tag.toLowerCase());
        const productBrand = (product.brand || '').toLowerCase();
        const productColor = (product.color || '').toLowerCase();
        
        let keywordMatchScore = 0;
        let totalQueryWords = queryWords.length;
        let matchedWords = 0;
        
        for (const word of queryWords) {
            let wordMatched = false;
            
            if (productTitle.includes(word)) {
                keywordMatchScore += 3.0;
                wordMatched = true;
            }
            
            if (productTags.some(tag => tag.includes(word) || word.includes(tag))) {
                keywordMatchScore += 2.5;
                wordMatched = true;
            }
            
            if (productDescription.includes(word)) {
                keywordMatchScore += 2.0;
                wordMatched = true;
            }
            
            if (productBrand.includes(word) || word.includes(productBrand)) {
                keywordMatchScore += 2.0;
                wordMatched = true;
            }
            
            if (productCategory.includes(word) || word.includes(productCategory)) {
                keywordMatchScore += 1.5;
                wordMatched = true;
            }
            
            if (productColor.includes(word) || word.includes(productColor)) {
                keywordMatchScore += 1.5;
                wordMatched = true;
            }
            
            if (wordMatched) {
                matchedWords++;
            }
        }
        
        const matchPercentage = totalQueryWords > 0 ? (matchedWords / totalQueryWords) : 0;
        
        nlpScore += keywordMatchScore;
        
        if (matchPercentage >= 0.8) {
            nlpScore *= 1.5; 
        } else if (matchPercentage >= 0.5) {
            nlpScore *= 1.2; 
        }
        
        if (isShoeQuery) {
            const isShoeProduct = shoeCategories.some(cat => 
                productCategory.includes(cat.toLowerCase()) || 
                cat.toLowerCase().includes(productCategory) ||
                productTitle.includes('shoe') ||
                productTitle.includes('sneaker') ||
                productTitle.includes('boot') ||
                productTags.some(tag => ['shoes', 'sneakers', 'boots', 'footwear'].includes(tag))
            );
            
            if (isShoeProduct) {
                nlpScore *= 1.3; 
            } else {
                nlpScore *= 0.3; 
            }
        } else if (isElectronicsQuery) {
            const isElectronicsProduct = electronicsCategories.some(cat => 
                productCategory.includes(cat.toLowerCase()) || 
                cat.toLowerCase().includes(productCategory) ||
                productCategory.includes('phone') || productCategory.includes('mobile') ||
                productCategory.includes('tablet') || productCategory.includes('laptop') ||
                productTitle.includes('phone') ||
                productTitle.includes('mobile') ||
                productTitle.includes('smartphone') ||
                productTags.some(tag => ['android', 'ios', 'mobile', 'phone', 'smartphone', 'electronic', 'gadget'].includes(tag))
            );
            
            if (isElectronicsProduct) {
                nlpScore *= 1.3; 
            } else {
                nlpScore *= 0.3; 
            }
        } else if (isClothingQuery) {
            const isClothingProduct = clothingCategories.some(cat => 
                productCategory.includes(cat.toLowerCase()) || 
                cat.toLowerCase().includes(productCategory) ||
                productTitle.includes('shirt') ||
                productTitle.includes('t-shirt') ||
                productTitle.includes('dress') ||
                productTitle.includes('pant') ||
                productTitle.includes('jean') ||
                productTitle.includes('jacket') ||
                productTitle.includes('hoodie') ||
                productTags.some(tag => ['clothing', 'apparel', 'shirt', 'dress', 'pant', 'jean', 'jacket', 'top', 'bottom'].includes(tag))
            );
            
            if (isClothingProduct) {
                nlpScore *= 1.3; 
            } else {
                nlpScore *= 0.3; 
            }
        }

        if (filters.brand) {
            const targetBrand = filters.brand.toLowerCase();

            if (productBrand === targetBrand || productBrand.includes(targetBrand) || targetBrand.includes(productBrand)) {
                const brandConfidence = semantic.brand_confidence?.[targetBrand] || 1.0;
                nlpScore += brandConfidence * 1.5; 
            } else {
                nlpScore *= 0.8; 
            }
        }

        if (filters.color) {
            const targetColor = filters.color.toLowerCase();

            if (productColor === targetColor || productColor.includes(targetColor) || targetColor.includes(productColor)) {
                const colorConfidence = semantic.color_confidence?.[targetColor] || 1.0;
                nlpScore += colorConfidence * 1.5;
            } else {
                nlpScore *= 0.8; 
            }
        }

        if (filters.category) {
            const targetCategory = filters.category.toLowerCase();
            let categoryMatch = false;
            let categoryScore = 0;

            if (targetCategory === 'footwear') {
                const footwearCategories = ['sneakers', 'shoes', 'boots', 'sandals', 'heels', 'flats', 'footwear', 
                    'running shoes', 'athletic shoes', 'casual shoes', 'formal shoes'];
                
                categoryMatch = footwearCategories.some(cat => 
                    productCategory.includes(cat.toLowerCase()) || 
                    cat.toLowerCase().includes(productCategory) ||
                    productTitle.includes(cat.toLowerCase())
                );
                
                if (categoryMatch) {
                    categoryScore = 1.5;
                } else {
                    nlpScore *= 0.7; 
                }
            }
            else if (targetCategory === 'mobile phones') {
                const mobileCategories = ['mobile phones', 'smartphones', 'phones', 'mobile', 'smartphone', 'electronics'];
                
                categoryMatch = mobileCategories.some(cat => 
                    productCategory.includes(cat.toLowerCase()) || 
                    cat.toLowerCase().includes(productCategory) ||
                    productTitle.includes(cat.toLowerCase())
                );
                
                if (categoryMatch) {
                    categoryScore = 1.5;
                } else {
                    nlpScore *= 0.7; 
                }
            }
            else if (targetCategory === 'clothing') {
                const clothingCategories = ['clothing', 'shirts', 't-shirts', 'pants', 'jeans', 'dresses', 'jackets', 
                    'apparel', 'tops', 'bottoms', 'outerwear', 'activewear'];
                
                categoryMatch = clothingCategories.some(cat => 
                    productCategory.includes(cat.toLowerCase()) || 
                    cat.toLowerCase().includes(productCategory) ||
                    productTitle.includes(cat.toLowerCase()) ||
                    productTitle.includes('shirt') ||
                    productTitle.includes('t-shirt') ||
                    productTitle.includes('dress') ||
                    productTitle.includes('pant') ||
                    productTitle.includes('jean') ||
                    productTitle.includes('jacket')
                );
                
                if (categoryMatch) {
                    categoryScore = 1.5;
                } else {
                    nlpScore *= 0.7; 
                }
            }
            else {
                if (productCategory === targetCategory || 
                    productCategory.includes(targetCategory) || 
                    targetCategory.includes(productCategory)) {
                    categoryMatch = true;
                    categoryScore = 1.5;
                } else {
                    nlpScore *= 0.8; 
                }
            }

            if (categoryMatch) {
                const categoryConfidence = semantic.category_confidence?.[targetCategory] || 1.0;
                nlpScore += categoryConfidence * categoryScore;
            }
        }

        if (filters.gender) {
            const productGender = (product.gender || '').toLowerCase();
            const targetGender = filters.gender.toLowerCase();

            let genderMatch = false;
            if (targetGender === 'women' && ['women', 'girls', 'female'].includes(productGender)) {
                genderMatch = true;
            } else if (targetGender === 'men' && ['men', 'boys', 'male'].includes(productGender)) {
                genderMatch = true;
            } else if (targetGender === productGender || productGender === 'unisex') {
                genderMatch = true;
            }

            if (genderMatch) {
                nlpScore += 0.5; 
            } else {
                nlpScore *= 0.9; 
            }
        }

        const productPrice = product.price || 0;
        if (filters.price_max && productPrice <= filters.price_max) {
            nlpScore += 0.5; 
        } else if (filters.price_max && productPrice > filters.price_max) {
            nlpScore *= 0.5; 
        }

        if (filters.price_min && productPrice >= filters.price_min) {
            nlpScore += 0.5; 
        }

        if (filters.rating_min) {
            const productRating = product.rating || 0;
            if (productRating >= filters.rating_min) {
                nlpScore += 1.0; 
            } else {
                nlpScore *= 0.7; 
            }
        }

        if (filters.features && filters.features.length > 0) {
            
            for (const feature of filters.features) {
                let featureMatched = false;
                const featureLower = feature.toLowerCase();
                
                if (productTitle.includes(featureLower)) {
                    nlpScore += 3.0; 
                    featureMatched = true;
                }
                
                if (productDescription.includes(featureLower)) {
                    nlpScore += 2.5; 
                    featureMatched = true;
                }
                
                const productSubcategory = (product.subcategory || '').toLowerCase();
                if (productSubcategory.includes(featureLower) || featureLower.includes(productSubcategory)) {
                    nlpScore += 2.0; 
                    featureMatched = true;
                }
                
                if (productTags.some(tag => tag.includes(featureLower) || featureLower.includes(tag))) {
                    nlpScore += 2.0; 
                    featureMatched = true;
                }
                
            }
        }

        product.nlp_score = nlpScore;
        product.keyword_match_score = keywordMatchScore;
        product.match_percentage = matchPercentage;
    }

    products.sort((a, b) => (b.nlp_score || 0) - (a.nlp_score || 0));
    
    return products;
}

module.exports = {
    applyNLPScoring
};
