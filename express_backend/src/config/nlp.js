const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');

let winkNlp;
try {
    winkNlp = winkNLP(model);
} catch (error) {
    winkNlp = null;
}

function getNLPInstance() {
    return winkNlp;
}

module.exports = {
    getNLPInstance
};
