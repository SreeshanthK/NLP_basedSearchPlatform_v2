function parseQueryFallback(queryLower) {
    const filters = {
        category: null,
        subcategory: null,
        brand: null,
        price_max: null,
        price_min: null,
        gender: null,
        season: null,
        rating_min: null,
        keywords: []
    };
    const words = queryLower.split(' ').filter(word => word.trim().length > 2);
    filters.keywords = words;
    const categorySynonyms = {
        "footwear": {
            main: ["footwear", "shoes", "boots", "sneakers", "sandals"],
            subcategories: {
                "sneakers": ["sneakers", "trainers", "athletic shoes", "sports shoes", "running shoes"],
                "flats": ["flats", "ballet flats", "loafers"],
                "boots": ["boots", "ankle boots", "combat boots", "winter boots"],
                "sandals": ["sandals", "flip flops", "slippers"],
                "heels": ["heels", "high heels", "stilettos", "pumps"],
                "casual": ["casual shoes", "everyday shoes", "walking shoes"],
                "formal": ["formal shoes", "dress shoes", "office shoes", "oxfords"]
            }
        },
        "electronics": {
            main: ["electronics", "gadgets", "devices"],
            subcategories: {
                "mobile": ["mobile phones", "smartphones", "phones", "cellphones", "mobiles"],
                "tablets": ["tablets", "ipads"],
                "laptops": ["laptops", "notebooks", "computers"],
                "headphones": ["headphones", "earphones", "earbuds"],
                "smartwatch": ["smartwatch", "fitness tracker", "wearable"]
            }
        },
        "clothing": {
            main: ["clothing", "apparel", "fashion"],
            subcategories: {
                "shirts": ["shirts", "t-shirts", "tees", "blouses"],
                "pants": ["pants", "trousers", "jeans"],
                "dresses": ["dresses", "gowns"],
                "jackets": ["jackets", "coats", "blazers"],
                "activewear": ["activewear", "gym wear", "sportswear"]
            }
        }
    };
    const brandSynonyms = {
        "nike": ["nike"],
        "adidas": ["adidas"],
        "puma": ["puma"],
        "reebok": ["reebok"],
        "converse": ["converse"],
        "vans": ["vans"],
        "new balance": ["new balance", "nb"],
        "skechers": ["skechers"],
        "wildcraft": ["wildcraft"],
        "bata": ["bata"],
        "apple": ["apple", "iphone", "ipad", "macbook"],
        "samsung": ["samsung", "galaxy"],
        "google": ["google", "pixel"],
        "oneplus": ["oneplus", "one plus"],
        "xiaomi": ["xiaomi", "mi", "redmi"],
        "oppo": ["oppo"],
        "vivo": ["vivo"],
        "realme": ["realme"],
        "motorola": ["motorola", "moto"],
        "nokia": ["nokia"],
        "huawei": ["huawei"],
        "lg": ["lg"],
        "sony": ["sony"],
        "dell": ["dell"],
        "hp": ["hp", "hewlett packard"],
        "lenovo": ["lenovo"],
        "asus": ["asus"],
        "acer": ["acer"]
    };
    const colorSynonyms = {
        "black": ["black", "dark"],
        "white": ["white", "cream"],
        "red": ["red", "crimson"],
        "blue": ["blue", "navy"],
        "green": ["green"],
        "yellow": ["yellow", "gold"],
        "pink": ["pink", "rose"],
        "purple": ["purple", "violet"],
        "brown": ["brown", "tan", "beige"],
        "grey": ["grey", "gray", "silver"],
        "orange": ["orange"]
    };
    const genderSynonyms = {
        "women": ["women", "female", "girls", "ladies", "womens"],
        "men": ["men", "male", "boys", "guys", "mens"],
        "unisex": ["unisex", "both", "all", "universal"]
    };
    const seasonSynonyms = {
        "summer": ["summer", "hot", "beach", "vacation"],
        "winter": ["winter", "cold", "snow", "warm"],
        "spring": ["spring", "fresh", "light"],
        "fall": ["fall", "autumn", "cool"],
        "all-season": ["all season", "year round", "versatile"]
    };
    for (const [mainCategory, categoryData] of Object.entries(categorySynonyms)) {
        if (categoryData.main.some(synonym => queryLower.includes(synonym))) {
            filters.category = mainCategory;
            break;
        }
        for (const [subcat, synonyms] of Object.entries(categoryData.subcategories || {})) {
            if (synonyms.some(synonym => queryLower.includes(synonym))) {
                filters.category = mainCategory;
                filters.subcategory = subcat;
                break;
            }
        }
        if (filters.category) break;
    }
    for (const [brand, synonyms] of Object.entries(brandSynonyms)) {
        if (synonyms.some(synonym => queryLower.includes(synonym))) {
            filters.brand = brand;
            break;
        }
    }
    for (const [gender, synonyms] of Object.entries(genderSynonyms)) {
        if (synonyms.some(synonym => queryLower.includes(synonym))) {
            filters.gender = gender;
            break;
        }
    }
    for (const [season, synonyms] of Object.entries(seasonSynonyms)) {
        if (synonyms.some(synonym => queryLower.includes(synonym))) {
            filters.season = season;
            break;
        }
    }
    const underPatterns = [
        /under\s+(\d+)/,
        /below\s+(\d+)/,
        /less\s+than\s+(\d+)/,
        /<\s*(\d+)/,
        /max\s+(\d+)/,
        /budget\s+(\d+)/,
        /within\s+(\d+)/,
        /up\s+to\s+(\d+)/
    ];
    const overPatterns = [
        /over\s+(\d+)/,
        /above\s+(\d+)/,
        /more\s+than\s+(\d+)/,
        />\s*(\d+)/,
        /min\s+(\d+)/,
        /minimum\s+(\d+)/,
        /starting\s+from\s+(\d+)/
    ];
    const ratingPatterns = [
        /(\d+)\s*star/,
        /rating\s+(\d+)/,
        /rated\s+(\d+)/,
        /(\d+)\s*\+\s*rating/
    ];
    for (const pattern of underPatterns) {
        const match = queryLower.match(pattern);
        if (match) {
            filters.price_max = parseInt(match[1]);
            break;
        }
    }
    if (!filters.price_max) {
        for (const pattern of overPatterns) {
            const match = queryLower.match(pattern);
            if (match) {
                filters.price_min = parseInt(match[1]);
                break;
            }
        }
    }
    for (const pattern of ratingPatterns) {
        const match = queryLower.match(pattern);
        if (match) {
            filters.rating_min = parseInt(match[1]);
            break;
        }
    }
    return filters;
}
module.exports = {
    parseQueryFallback
};
