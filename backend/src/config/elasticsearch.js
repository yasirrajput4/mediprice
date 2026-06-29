const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/logger');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

async function indexService(service) {
  await esClient.index({
    index: 'services',
    id: String(service.id),
    document: {
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description || '',
      suggest: {
        input: [service.name, ...service.name.split(' ')],
      },
    },
  });
}

async function searchServices(query, options = {}) {
  const { from = 0, size = 20 } = options;

  const response = await esClient.search({
    index: 'services',
    from,
    size,
    query: {
      multi_match: {
        query,
        fields: ['name^3', 'category^2', 'description'],
        fuzziness: 'AUTO',
        type: 'best_fields',
      },
    },
    suggest: {
      service_suggest: {
        prefix: query,
        completion: { field: 'suggest', size: 5 },
      },
    },
  });

  return {
    hits: response.hits.hits.map((h) => ({ ...h._source, score: h._score })),
    total: response.hits.total.value,
    suggestions: response.suggest?.service_suggest?.[0]?.options?.map((o) => o.text) || [],
  };
}

async function createServicesIndex() {
  const exists = await esClient.indices.exists({ index: 'services' });
  if (!exists) {
    await esClient.indices.create({
      index: 'services',
      mappings: {
        properties: {
          id: { type: 'integer' },
          name: { type: 'text', analyzer: 'standard' },
          category: { type: 'keyword' },
          description: { type: 'text' },
          suggest: { type: 'completion' },
        },
      },
    });
    logger.info('Elasticsearch services index created');
  }
}

module.exports = { esClient, indexService, searchServices, createServicesIndex };
