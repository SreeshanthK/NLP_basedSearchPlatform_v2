function applyNLPScoring(products, filters, originalQuery) {
    if (!products || products.length === 0) {
        return products;
    }
    const semantic = filters.semantic_analysis || {};
    const queryLower = originalQuery.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    const categoryMappings = {
        shoes: ['Footwear', 'Casual Shoes', 'Sports Shoes', 'Formal Shoes', 'Sneakers'],
        electronics: ['Electronics', 'Mobiles & Accessories', 'Laptops & Accessories', 'Audio'],
        fashion: ['Fashion', 'Men', 'Women', 'Kids'],
        beauty: ['Beauty & Personal Care', 'Makeup', 'Skincare', 'Haircare'],
        home: ['Home & Kitchen', 'Furniture', 'Home Decor', 'Kitchen & Dining'],
        appliances: ['Appliances', 'Large Appliances', 'Small Appliances'],
        books: ['Books & Stationery', 'Academic Books', 'Novels'],
        sports: ['Sports & Outdoors', 'Cricket', 'Footballs', 'Bicycles'],
        baby: ['Baby & Kids', 'Baby Clothing', 'Toys'],
        automotive: ['Automotive', 'Car Accessories', 'Bike Accessories']
    };
    const productTypeDetectors = {
        shoes: ['shoes', 'shoe', 'footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats'],
        electronics: ['phone', 'mobile', 'smartphone', 'tablet', 'laptop', 'electronic', 'device', 'gadget', 'headphone'],
        fashion: ['shirt', 't-shirt', 'tshirt', 'pant', 'dress', 'jacket', 'clothing', 'apparel', 'jeans', 'kurti', 'saree'],
        beauty: ['makeup', 'foundation', 'lipstick', 'shampoo', 'perfume', 'skincare'],
        home: ['furniture', 'sofa', 'bed', 'table', 'lamp', 'cookware'],
        appliances: ['refrigerator', 'microwave', 'washing', 'iron', 'vacuum'],
        books: ['book', 'novel', 'notebook', 'academic'],
        sports: ['cricket', 'football', 'bicycle', 'yoga', 'sports'],
        baby: ['baby', 'diaper', 'toy', 'kids'],
        automotive: ['car', 'bike', 'auto', 'vehicle']
    };
    let detectedTypes = [];
    for (const [type, indicators] of Object.entries(productTypeDetectors)) {
        if (indicators.some(indicator => queryLower.includes(indicator))) {
            detectedTypes.push(type);
        }
    }
    for (const product of products) {
        let nlpScore = product._score || 1.0;
        const productCategory = (product.category || '').toLowerCase();
        const productSubcategory = (product.subcategory || '').toLowerCase();
        const productTitle = (product.title || '').toLowerCase();
        const productName = (product.name || '').toLowerCase();
        const productDescription = (product.description || '').toLowerCase();
        const productTags = (product.tags || []).map(tag => tag.toLowerCase());
        const productFeatures = (product.features || []).map(feature => feature.toLowerCase());
        const productBrand = (product.brand || '').toLowerCase();
        const productGender = (product.gender || '').toLowerCase();
        const productSeason = (product.season || '').toLowerCase();
        let keywordMatchScore = 0;
        let totalQueryWords = queryWords.length;
        let matchedWords = 0;
        for (const word of queryWords) {
            let wordMatched = false;
            if (productName.includes(word) || productTitle.includes(word)) {
                keywordMatchScore += 3.5;
                wordMatched = true;
            }
            if (productSubcategory.includes(word)) {
                keywordMatchScore += 3.0;
                wordMatched = true;
            }
            if (productFeatures.some(feature => feature.includes(word) || word.includes(feature))) {
                keywordMatchScore += 2.8;
                wordMatched = true;
            }
            if (productTags.some(tag => tag.includes(word) || word.includes(tag))) {
                keywordMatchScore += 2.5;
                wordMatched = true;
            }
            if (productBrand.includes(word) || word.includes(productBrand)) {
                keywordMatchScore += 2.3;
                wordMatched = true;
            }
            if (productCategory.includes(word) || word.includes(productCategory)) {
                keywordMatchScore += 2.0;
                wordMatched = true;
            }
            if (productDescription.includes(word)) {
                keywordMatchScore += 1.8;
                wordMatched = true;
            }
            if (productGender.includes(word) || productSeason.includes(word)) {
                keywordMatchScore += 1.0;
                wordMatched = true;
            }
            if (wordMatched) {
                matchedWords++;
            }
        }
        const matchPercentage = totalQueryWords > 0 ? (matchedWords / totalQueryWords) : 0;
        nlpScore += keywordMatchScore;
        if (matchPercentage >= 0.8) {
            nlpScore *= 1.6; 
        } else if (matchPercentage >= 0.5) {
            nlpScore *= 1.3; 
        }
        for (const detectedType of detectedTypes) {
            const relevantCategories = categoryMappings[detectedType] || [];
            const isRelevantProduct = relevantCategories.some(cat => 
                productCategory.includes(cat.toLowerCase()) || 
                productSubcategory.includes(cat.toLowerCase()) ||
                cat.toLowerCase().includes(productCategory) ||
                cat.toLowerCase().includes(productSubcategory)
            );
            if (isRelevantProduct) {
                nlpScore *= 1.4;
            }
        }
        const averageRating = product.averageRating || 0;
        const totalReviews = product.totalReviews || 0;
        if (averageRating >= 4.5) {
            nlpScore *= 1.3;
        } else if (averageRating >= 4.0) {
            nlpScore *= 1.2;
        } else if (averageRating >= 3.5) {
            nlpScore *= 1.1;
        }
        if (totalReviews >= 100) {
            nlpScore *= 1.2;
        } else if (totalReviews >= 50) {
            nlpScore *= 1.1;
        } else if (totalReviews >= 20) {
            nlpScore *= 1.05;
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
