const natural = require('natural');
const { WordTokenizer, SentimentAnalyzer, PorterStemmer } = natural;
const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');
const nlp = winkNLP(model);
const its = nlp.its;
const as = nlp.as;
class ReviewAnalysisController {
  async analyzeReviews(req, res) {
    try {
      const { reviews } = req.body;
      if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
        return res.status(400).json({ 
          error: 'Valid reviews array is required' 
        });
      }
      const analysis = this.processReviews(reviews);
      return res.json(analysis);
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      return res.status(500).json({ 
        error: 'Failed to analyze reviews',
        details: error.message
      });
    }
  }
  processReviews(reviews) {
    const categories = {
      quality: ['quality', 'durable', 'sturdy', 'material', 'build', 'construction', 'made', 'solid', 'robust', 'reliable'],
      value: ['price', 'worth', 'value', 'expensive', 'cheap', 'affordable', 'cost', 'money', 'bargain', 'overpriced'],
      comfort: ['comfort', 'comfortable', 'soft', 'fit', 'ergonomic', 'wear', 'cozy', 'snug', 'plush', 'cushion'],
      appearance: ['look', 'design', 'style', 'appearance', 'color', 'aesthetic', 'beautiful', 'attractive', 'pretty', 'elegant'],
      functionality: ['function', 'feature', 'work', 'performance', 'use', 'practical', 'effective', 'efficient', 'useful', 'convenient']
    };
    const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
    const tokenizer = new WordTokenizer();
    const categoryData = {};
    Object.keys(categories).forEach(category => {
      categoryData[category] = {
        mentions: 0,
        score: 0,
        positiveCount: 0,
        negativeCount: 0,
        sentences: [],
        keywords: []
      };
    });
  const processedReviews = reviews.map(review => {
    const text = (review.content || review.text || '') + ' ' + (review.title || '');
    if (!text.trim()) return null;
    const doc = nlp.readDoc(text);
    const sentences = doc.sentences().out();
    const tokens = doc.tokens().out();
    const stems = tokens.map(token => PorterStemmer.stem(token.toLowerCase()));
    const sentiment = analyzer.getSentiment(tokenizer.tokenize(text));
    const entities = doc.entities().out(its.detail);
    const keywords = this.extractKeywords(doc);
    const categories = this.categorizeContent(text, stems, categoryData, review.rating || 3);
    return {
      text,
      sentiment,
      sentences,
      entities,
      keywords,
      categories,
      rating: review.rating || 3
    };
  }).filter(Boolean);
  const categoryRatings = {};
  const avgRating = reviews.reduce((sum, review) => sum + (review.rating || 3), 0) / reviews.length;
  const categorySentiments = {};
  Object.keys(categoryData).forEach(category => {
    const data = categoryData[category];
    if (data.mentions === 0) {
      categorySentiments[category] = 0; 
    } else {
      const positiveRatio = data.positiveCount / data.mentions;
      const negativeRatio = data.negativeCount / data.mentions;
      categorySentiments[category] = positiveRatio - negativeRatio;
    }
  });
  let minSentiment = 0;
  let maxSentiment = 0;
  Object.values(categorySentiments).forEach(sentiment => {
    if (sentiment < minSentiment) minSentiment = sentiment;
    if (sentiment > maxSentiment) maxSentiment = sentiment;
  });
  const sentimentRange = Math.max(0.5, maxSentiment - minSentiment);
  Object.keys(categoryData).forEach(category => {
    const data = categoryData[category];
    if (data.mentions > 0) {
      const scoreBasedRating = data.score / data.mentions;
      const sentiment = categorySentiments[category];
      const sentimentAdjustment = sentiment * 0.5; 
      categoryRatings[category] = parseFloat((scoreBasedRating + sentimentAdjustment).toFixed(1));
    } else {
      const categoryIndex = ['quality', 'value', 'comfort', 'appearance', 'functionality'].indexOf(category);
      const normalizedPosition = categoryIndex / 4; 
      const offset = (normalizedPosition - 0.5) * 0.8; 
      const randomFactor = (Math.random() * 0.4 - 0.2); 
      categoryRatings[category] = parseFloat((avgRating + offset + randomFactor).toFixed(1));
    }
    if (categoryRatings[category] < 1) categoryRatings[category] = 1;
    if (categoryRatings[category] > 5) categoryRatings[category] = 5;
  });
  const ratings = Object.values(categoryRatings);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  if (maxRating - minRating < 0.7) {
    const sortedCategories = Object.entries(categorySentiments)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id);
    const topCategory = sortedCategories[0];
    if (categoryRatings[topCategory] < 4.5) {
      categoryRatings[topCategory] = Math.min(5, categoryRatings[topCategory] + 0.4);
    }
    const bottomCategory = sortedCategories[sortedCategories.length - 1];
    if (categoryRatings[bottomCategory] > 2.5) {
      categoryRatings[bottomCategory] = Math.max(1, categoryRatings[bottomCategory] - 0.4);
    }
  }
    const summary = this.generateSummary(reviews, processedReviews, categoryRatings, categoryData);
    return {
      summary,
      categoryRatings,
      categoryInsights: categoryData,
      overallSentiment: this.calculateOverallSentiment(processedReviews),
      keyPhrases: this.extractTopKeyPhrases(processedReviews, categoryData)
    };
  }
  extractKeywords(doc) {
    const keywords = [];
    doc.tokens().each(token => {
      const pos = token.out(its.pos);
      const text = token.out();
      if (['NN', 'NNS', 'NNP', 'NNPS', 'JJ', 'JJR', 'JJS', 'VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ'].includes(pos) && 
          text.length > 2 && 
          !['the', 'and', 'but', 'or', 'this', 'that', 'these', 'those', 'its'].includes(text.toLowerCase())) {
        keywords.push(text.toLowerCase());
      }
    });
    return keywords;
  }
  categorizeContent(text, stems, categoryData, rating = 3) {
    const textLower = text.toLowerCase();
    const result = {};
    Object.entries(categoryData).forEach(([category, data]) => {
      const keywords = this.getCategoryKeywords(category);
      const foundKeywords = [];
      keywords.forEach(keyword => {
        const keywordStem = PorterStemmer.stem(keyword);
        if (textLower.includes(keyword) || stems.includes(keywordStem)) {
          foundKeywords.push(keyword);
        }
      });
      if (foundKeywords.length > 0) {
        const doc = nlp.readDoc(text);
        const relevantSentences = [];
        doc.sentences().each((sentence) => {
          const sentenceText = sentence.out();
          const sentenceLower = sentenceText.toLowerCase();
          if (foundKeywords.some(keyword => sentenceLower.includes(keyword))) {
            relevantSentences.push(sentenceText);
          }
        });
        let sentencesSentiment = 0;
        if (relevantSentences.length > 0) {
          const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
          const tokenizer = new WordTokenizer();
          sentencesSentiment = relevantSentences.reduce((sum, sentence) => {
            return sum + analyzer.getSentiment(tokenizer.tokenize(sentence));
          }, 0) / relevantSentences.length;
        }
        const sentimentModifier = sentencesSentiment * 2;
        const categoryScore = (rating * 0.7) + (((rating + sentimentModifier) / 2) * 0.3);
        categoryData[category].mentions++;
        categoryData[category].score += categoryScore;
        categoryData[category].keywords.push(...foundKeywords);
        categoryData[category].sentences.push(...relevantSentences);
        if (sentencesSentiment > 0.1) {
          categoryData[category].positiveCount++;
        } else if (sentencesSentiment < -0.1) {
          categoryData[category].negativeCount++;
        }
        result[category] = {
          found: true,
          keywords: foundKeywords,
          sentences: relevantSentences,
          sentiment: sentencesSentiment
        };
      } else {
        result[category] = {
          found: false
        };
      }
    });
    return result;
  }
  getCategoryKeywords(category) {
    const keywords = {
      quality: ['quality', 'durable', 'sturdy', 'material', 'build', 'construction', 'made', 'solid', 'robust', 'reliable', 'last', 'lasting', 'strong', 'weak', 'flimsy', 'break', 'broke', 'broken', 'craftsmanship'],
      value: ['price', 'worth', 'value', 'expensive', 'cheap', 'affordable', 'cost', 'money', 'bargain', 'overpriced', 'pricey', 'costly', 'budget', 'deal', 'worth', 'investment'],
      comfort: ['comfort', 'comfortable', 'soft', 'fit', 'ergonomic', 'wear', 'cozy', 'snug', 'plush', 'cushion', 'uncomfortable', 'hard', 'stiff', 'tight', 'loose', 'pain', 'hurt', 'sore'],
      appearance: ['look', 'design', 'style', 'appearance', 'color', 'aesthetic', 'beautiful', 'attractive', 'pretty', 'elegant', 'ugly', 'plain', 'stylish', 'fashionable', 'sleek', 'modern', 'outdated'],
      functionality: ['function', 'feature', 'work', 'performance', 'use', 'practical', 'effective', 'efficient', 'useful', 'convenient', 'works', 'working', 'broken', 'easy', 'difficult', 'complicated', 'simple', 'intuitive']
    };
    return keywords[category] || [];
  }
  calculateOverallSentiment(processedReviews) {
    const sentiments = processedReviews.map(review => review.sentiment);
    const avgSentiment = sentiments.reduce((sum, val) => sum + val, 0) / sentiments.length;
    let sentimentLabel = 'mixed';
    if (avgSentiment >= 0.6) sentimentLabel = 'very positive';
    else if (avgSentiment >= 0.2) sentimentLabel = 'positive';
    else if (avgSentiment >= -0.2) sentimentLabel = 'neutral';
    else if (avgSentiment >= -0.6) sentimentLabel = 'negative';
    else sentimentLabel = 'very negative';
    return {
      score: avgSentiment,
      label: sentimentLabel
    };
  }
  extractTopKeyPhrases(processedReviews, categoryData) {
    const result = {};
    Object.keys(categoryData).forEach(category => {
      const data = categoryData[category];
      if (data.sentences.length === 0) {
        result[category] = [];
        return;
      }
      const sentencesWithData = data.sentences.map(sentence => {
        const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
        const tokenizer = new WordTokenizer();
        const tokens = tokenizer.tokenize(sentence);
        const sentiment = analyzer.getSentiment(tokens);
        const keywords = this.getCategoryKeywords(category);
        const keywordCount = keywords.reduce((count, keyword) => {
          return count + (sentence.toLowerCase().includes(keyword) ? 1 : 0);
        }, 0);
        const wordCount = tokens.length;
        const keywordDensity = keywordCount / wordCount;
        const sentimentStrength = Math.abs(sentiment);
        const uniqueness = new Set(tokens).size / tokens.length; 
        const informativeness = 
          (wordCount * 0.3) + 
          (keywordDensity * 10) + 
          (sentimentStrength * 3) + 
          (uniqueness * 5);
        return {
          text: sentence.trim(),
          sentiment,
          sentimentAbs: Math.abs(sentiment),
          informativeness,
          length: sentence.length,
          keywordCount
        };
      });
      const validSentences = sentencesWithData
        .filter(s => s.text.length > 15 && s.text.length < 150)
        .filter((s, i, arr) => {
          for (let j = 0; j < i; j++) {
            const similarity = this.calculateSimilarity(s.text, arr[j].text);
            if (similarity > 0.7) return false;
          }
          return true;
        });
      const informativeSentences = [...validSentences]
        .sort((a, b) => b.informativeness - a.informativeness)
        .slice(0, 2);
      const positiveSentences = validSentences
        .filter(s => s.sentiment > 0.2)
        .sort((a, b) => b.sentiment - a.sentiment)
        .slice(0, 1);
      const negativeSentences = validSentences
        .filter(s => s.sentiment < -0.2)
        .sort((a, b) => a.sentiment - b.sentiment)
        .slice(0, 1);
      const selectedSentences = new Set();
      informativeSentences.forEach(s => selectedSentences.add(s.text));
      if (positiveSentences.length > 0) {
        selectedSentences.add(positiveSentences[0].text);
      }
      if (negativeSentences.length > 0) {
        selectedSentences.add(negativeSentences[0].text);
      }
      if (selectedSentences.size < 2 && validSentences.length > 0) {
        const strongestSentiments = [...validSentences]
          .sort((a, b) => b.sentimentAbs - a.sentimentAbs)
          .slice(0, 2);
        strongestSentiments.forEach(s => selectedSentences.add(s.text));
      }
      result[category] = [...selectedSentences];
    });
    return result;
  }
  calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.toLowerCase().split(/\W+/).filter(Boolean));
    const words2 = new Set(str2.toLowerCase().split(/\W+/).filter(Boolean));
    const intersection = new Set();
    words1.forEach(word => {
      if (words2.has(word)) intersection.add(word);
    });
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
  generateSummary(reviews, processedReviews, categoryRatings, categoryData) {
    const avgRating = reviews.reduce((sum, review) => sum + (review.rating || 3), 0) / reviews.length;
    let sentiment = 'mixed';
    if (avgRating >= 4.5) sentiment = 'excellent';
    else if (avgRating >= 4) sentiment = 'very positive';
    else if (avgRating >= 3.5) sentiment = 'positive';
    else if (avgRating >= 3) sentiment = 'somewhat positive';
    else if (avgRating >= 2.5) sentiment = 'neutral';
    else if (avgRating >= 2) sentiment = 'somewhat negative';
    else sentiment = 'negative';
    const categoryInsights = {};
    Object.keys(categoryData).forEach(category => {
      const data = categoryData[category];
      const positiveRatio = data.mentions > 0 ? data.positiveCount / data.mentions : 0;
      const negativeRatio = data.mentions > 0 ? data.negativeCount / data.mentions : 0;
      const sentimentScore = positiveRatio - negativeRatio;
      categoryInsights[category] = {
        mentions: data.mentions,
        sentimentScore,
        positiveRatio,
        negativeRatio,
        rating: categoryRatings[category] || 0
      };
    });
    const sortedCategories = Object.entries(categoryInsights)
      .sort(([, a], [, b]) => {
        if (a.mentions > 0 && b.mentions === 0) return -1;
        if (a.mentions === 0 && b.mentions > 0) return 1;
        return b.sentimentScore - a.sentimentScore;
      })
      .map(([id]) => id);
    const topCategory = sortedCategories[0];
    const secondTopCategory = sortedCategories[1];
    const sortedBottomCategories = Object.entries(categoryInsights)
      .sort(([, a], [, b]) => {
        if (a.mentions > 0 && b.mentions === 0) return -1;
        if (a.mentions === 0 && b.mentions > 0) return 1;
        return a.sentimentScore - b.sentimentScore;
      })
      .map(([id]) => id);
    const bottomCategory = sortedBottomCategories[0];
    const categoryNames = {
      quality: 'Quality',
      value: 'Value for Money',
      comfort: 'Comfort',
      appearance: 'Appearance',
      functionality: 'Functionality'
    };
    const allKeywords = [];
    Object.values(categoryData).forEach(data => {
      allKeywords.push(...data.keywords);
    });
    const keywordCounts = {};
    allKeywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
    const excludedTerms = ['good', 'bad', 'great', 'nice', 'poor', 'product', 'item', 'this', 'that', 'these', 'those', 'very', 'really'];
    const topKeywords = Object.entries(keywordCounts)
      .filter(([keyword]) => !excludedTerms.includes(keyword))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([keyword]) => keyword);
    let productDescriptor = '';
    if (topKeywords.length > 0) {
      const productTypeKeywords = ['phone', 'laptop', 'headphones', 'camera', 'tv', 'monitor', 'speaker', 'watch', 
                                  'shoes', 'shirt', 'pants', 'dress', 'jacket', 'furniture', 'chair', 'table', 'sofa'];
      const foundType = topKeywords.find(keyword => productTypeKeywords.includes(keyword));
      productDescriptor = foundType ? foundType : topKeywords[0];
    }
    let summary = '';
    const reviewCountPhrase = reviews.length === 1 ? 'one review' : 
                             reviews.length < 5 ? `${reviews.length} reviews` :
                             reviews.length < 20 ? `${reviews.length} customer reviews` :
                             `${reviews.length} extensive reviews`;
    if (productDescriptor) {
      summary = `Based on ${reviewCountPhrase}, this ${productDescriptor} is generally ${sentiment}. `;
    } else {
      summary = `Based on ${reviewCountPhrase}, customers find this product to be ${sentiment} overall. `;
    }
    const getCategoryDescription = (category) => {
      const data = categoryData[category];
      const insight = categoryInsights[category];
      if (data.mentions === 0) return null;
      const catKeywordCounts = {};
      data.keywords.forEach(keyword => {
        catKeywordCounts[keyword] = (catKeywordCounts[keyword] || 0) + 1;
      });
      const topCatKeywords = Object.entries(catKeywordCounts)
        .filter(([keyword]) => !excludedTerms.includes(keyword))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([keyword]) => keyword);
      const keywordPhrase = topCatKeywords.length > 0 ? 
        `especially the ${topCatKeywords.join(' and ')}` : '';
      return {
        category,
        keywords: topCatKeywords,
        keywordPhrase,
        sentimentScore: insight.sentimentScore,
        mentions: data.mentions
      };
    };
    if (topCategory) {
      const topDesc = getCategoryDescription(topCategory);
      if (topDesc && topDesc.sentimentScore > 0) {
        const positivePhrases = [
          'Customers particularly appreciate the', 
          'Reviewers consistently praise the', 
          'Users highlight the excellent', 
          'Many reviewers appreciate the'
        ];
        const randomPhrase = positivePhrases[Math.floor(Math.random() * positivePhrases.length)];
        summary += `${randomPhrase} ${categoryNames[topCategory].toLowerCase()}`;
        if (topDesc.keywordPhrase) {
          summary += `, ${topDesc.keywordPhrase}. `;
        } else {
          summary += '. ';
        }
      }
    }
    if (secondTopCategory && secondTopCategory !== topCategory) {
      const secondDesc = getCategoryDescription(secondTopCategory);
      if (secondDesc && secondDesc.sentimentScore > 0) {
        const secondaryPhrases = [
          'The product also receives good feedback for its',
          'Additionally, customers like the',
          'Reviewers also mention the good',
          'Users also appreciate the'
        ];
        const randomPhrase = secondaryPhrases[Math.floor(Math.random() * secondaryPhrases.length)];
        summary += `${randomPhrase} ${categoryNames[secondTopCategory].toLowerCase()}`;
        if (secondDesc.keywordPhrase) {
          summary += `, ${secondDesc.keywordPhrase}. `;
        } else {
          summary += '. ';
        }
      }
    }
    if (bottomCategory && categoryInsights[bottomCategory].sentimentScore < 0) {
      const bottomDesc = getCategoryDescription(bottomCategory);
      if (bottomDesc) {
        const improvementPhrases = [
          'Some customers mentioned concerns about the',
          'Areas for improvement include the',
          'A few reviewers noted issues with the',
          'Some feedback suggests the'
        ];
        const randomPhrase = improvementPhrases[Math.floor(Math.random() * improvementPhrases.length)];
        summary += `${randomPhrase} ${categoryNames[bottomCategory].toLowerCase()}`;
        if (bottomDesc.keywordPhrase) {
          summary += `, specifically regarding ${bottomDesc.keywordPhrase}. `;
        } else {
          summary += '. ';
        }
      }
    }
    if (summary.length < 100) {
      const overallPhrases = [
        `Overall, most reviewers ${avgRating >= 3.5 ? 'recommend' : 'have reservations about'} this product.`,
        `In general, customers ${avgRating >= 3.5 ? 'are satisfied with' : 'have mixed feelings about'} their purchase.`,
        `The majority of users ${avgRating >= 3.5 ? 'have had positive experiences' : 'note both pros and cons'} with this product.`
      ];
      const randomPhrase = overallPhrases[Math.floor(Math.random() * overallPhrases.length)];
      summary += randomPhrase;
    }
    return summary;
  }
}
module.exports = new ReviewAnalysisController(); 