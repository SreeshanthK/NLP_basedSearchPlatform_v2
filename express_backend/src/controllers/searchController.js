const { parseQueryWithNLP } = require('../services/nlpService');
const searchService = require('../services/searchService');
class SearchController {
    async search(req, res) {
        try {
            const { query } = req.body;
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }
            const filters = parseQueryWithNLP(query);
            const products = await searchService.searchProducts(query, filters);
            return res.json(products);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
module.exports = new SearchController();
