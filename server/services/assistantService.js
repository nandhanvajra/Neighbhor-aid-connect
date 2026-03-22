const User = require('../models/userSchema');
const Request = require('../models/requestSchema');
const Rating = require('../models/ratingSchema');
const aiService = require('./aiService');

const DEFAULT_LIMIT = 5;

/** Maps natural / LLM job labels to Request + Rating category enum values (see server config serviceCategories). */
function resolveDbServiceCategory(intent) {
  const raw = (intent.category || intent.workerType || '').toLowerCase().trim();
  if (!raw) return null;

  const synonymMap = {
    plumber: 'plumbing',
    plumbing: 'plumbing',
    plumbr: 'plumbing',
    plumbrs: 'plumbing',
    electrician: 'electrical',
    electrical: 'electrical',
    electric: 'electrical',
    maid: 'maid',
    maids: 'maid',
    cook: 'cook',
    cooks: 'cook',
    cleaner: 'cleaning',
    cleaning: 'cleaning',
    gardener: 'gardening',
    gardening: 'gardening',
    security: 'security',
    maintenance: 'maintenance',
    driver: 'other',
    drivers: 'other'
  };

  if (synonymMap[raw]) return synonymMap[raw];

  const valid = [
    'plumbing',
    'electrical',
    'maid',
    'cook',
    'cleaning',
    'gardening',
    'security',
    'maintenance',
    'other'
  ];
  if (valid.includes(raw)) return raw;

  return null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeLimit(limit) {
  return Number.isInteger(limit) && limit > 0 ? Math.min(limit, 20) : DEFAULT_LIMIT;
}

async function getTopWorkersByRating(intent) {
  const limit = normalizeLimit(intent.limit);
  const query = { userType: 'worker' };

  if (intent.workerType) {
    query.job = { $regex: `^${escapeRegex(intent.workerType)}$`, $options: 'i' };
  }

  const workers = await User.find(query)
    .select('name job skills rating')
    .sort({ 'rating.average': -1, 'rating.totalRatings': -1, name: 1 })
    .limit(limit)
    .lean();

  return workers.map(worker => ({
    id: worker._id,
    name: worker.name,
    job: worker.job,
    averageRating: worker?.rating?.average || 0,
    totalRatings: worker?.rating?.totalRatings || 0,
    skills: worker.skills || []
  }));
}

async function getMostActiveWorkers(intent) {
  const limit = normalizeLimit(intent.limit);
  const match = {
    status: 'completed',
    completedBy: { $ne: null }
  };

  const dbCategory = resolveDbServiceCategory(intent);
  if (dbCategory) {
    match.category = { $regex: `^${escapeRegex(dbCategory)}$`, $options: 'i' };
  }

  const counts = await Request.aggregate([
    { $match: match },
    { $group: { _id: '$completedBy', completedCount: { $sum: 1 } } },
    { $sort: { completedCount: -1 } },
    { $limit: limit * 3 }
  ]);

  if (!counts.length) return [];

  const ids = counts.map(item => item._id);
  const workers = await User.find({
    _id: { $in: ids },
    userType: 'worker'
  })
    .select('name job rating')
    .lean();

  const workerMap = new Map(workers.map(worker => [String(worker._id), worker]));

  const merged = counts
    .map(item => {
      const worker = workerMap.get(String(item._id));
      if (!worker) return null;

      if (
        intent.workerType &&
        worker.job &&
        worker.job.toLowerCase() !== intent.workerType.toLowerCase()
      ) {
        return null;
      }

      return {
        id: worker._id,
        name: worker.name,
        job: worker.job,
        completedCount: item.completedCount,
        averageRating: worker?.rating?.average || 0,
        totalRatings: worker?.rating?.totalRatings || 0
      };
    })
    .filter(Boolean)
    .slice(0, limit);

  return merged;
}

async function resolveWorkerByName(workerName) {
  if (!workerName) return null;

  return User.findOne({
    userType: 'worker',
    name: { $regex: escapeRegex(workerName), $options: 'i' }
  })
    .select('name job skills rating')
    .lean();
}

async function getWorkerFeedbackSummary(intent) {
  if (!intent.workerName) return { worker: null, reviews: [] };

  const worker = await resolveWorkerByName(intent.workerName);
  if (!worker) return { worker: null, reviews: [] };

  const reviews = await Rating.find({ ratedUserId: worker._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('stars review qualityOfWork communication professionalism category createdAt')
    .lean();

  return {
    worker: {
      id: worker._id,
      name: worker.name,
      job: worker.job,
      averageRating: worker?.rating?.average || 0,
      totalRatings: worker?.rating?.totalRatings || 0
    },
    reviews: reviews.map(r => ({
      stars: r.stars,
      review: r.review || '',
      qualityOfWork: r.qualityOfWork,
      communication: r.communication,
      professionalism: r.professionalism,
      category: r.category,
      createdAt: r.createdAt
    }))
  };
}

async function getTopWorkersByFeedback(intent) {
  const limit = normalizeLimit(intent.limit);
  const match = {};

  const dbCategory = resolveDbServiceCategory(intent);
  if (dbCategory) {
    match.category = { $regex: `^${escapeRegex(dbCategory)}$`, $options: 'i' };
  }

  const grouped = await Rating.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$ratedUserId',
        averageStars: { $avg: '$stars' },
        reviewCount: { $sum: 1 }
      }
    },
    { $sort: { averageStars: -1, reviewCount: -1 } },
    { $limit: limit * 3 }
  ]);

  if (!grouped.length) return [];

  const ids = grouped.map(item => item._id);
  const workers = await User.find({
    _id: { $in: ids },
    userType: 'worker'
  })
    .select('name job rating')
    .lean();

  const workerMap = new Map(workers.map(worker => [String(worker._id), worker]));

  const merged = grouped
    .map(item => {
      const worker = workerMap.get(String(item._id));
      if (!worker) return null;

      if (
        intent.workerType &&
        worker.job &&
        worker.job.toLowerCase() !== intent.workerType.toLowerCase()
      ) {
        return null;
      }

      return {
        id: worker._id,
        name: worker.name,
        job: worker.job,
        averageFeedbackScore: Number(item.averageStars.toFixed(2)),
        reviewCount: item.reviewCount,
        averageRating: worker?.rating?.average || 0,
        totalRatings: worker?.rating?.totalRatings || 0
      };
    })
    .filter(Boolean)
    .slice(0, limit);

  return merged;
}

async function getWorkerLookup(intent) {
  if (!intent.workerName) return null;
  const worker = await resolveWorkerByName(intent.workerName);
  if (!worker) return null;

  return {
    id: worker._id,
    name: worker.name,
    job: worker.job,
    skills: worker.skills || [],
    averageRating: worker?.rating?.average || 0,
    totalRatings: worker?.rating?.totalRatings || 0,
    ratingBreakdown: worker?.rating?.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
}

async function buildResultsByIntent(intent) {
  if (intent.intent === 'unsupported') {
    return { count: 0, items: [] };
  }

  // "Top" phrasing but ranked by completed jobs — same data as most_active_workers
  if (intent.intent === 'top_workers' && intent.rankingBy === 'request_count') {
    const items = await getMostActiveWorkers(intent);
    return { count: items.length, items };
  }

  if (intent.intent === 'top_workers' && intent.rankingBy === 'feedback') {
    const items = await getTopWorkersByFeedback(intent);
    return { count: items.length, items };
  }

  if (intent.intent === 'top_workers') {
    const items = await getTopWorkersByRating(intent);
    return { count: items.length, items };
  }

  if (intent.intent === 'most_active_workers') {
    const items = await getMostActiveWorkers(intent);
    return { count: items.length, items };
  }

  if (intent.intent === 'worker_feedback_summary') {
    const details = await getWorkerFeedbackSummary(intent);
    return {
      count: details.reviews.length,
      worker: details.worker,
      reviews: details.reviews
    };
  }

  if (intent.intent === 'worker_lookup') {
    const worker = await getWorkerLookup(intent);
    return {
      count: worker ? 1 : 0,
      worker
    };
  }

  return { count: 0, items: [] };
}

async function handleResidentAssistantQuery(message) {
  if (!message || typeof message !== 'string' || !message.trim()) {
    return {
      success: false,
      message: 'Please provide a message for the assistant.'
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      message: 'AI assistant is not configured. Please set GEMINI_API_KEY.'
    };
  }

  const intent = await aiService.extractIntent(message);
  const results = await buildResultsByIntent(intent);

  if (intent.intent === 'unsupported') {
    return {
      success: true,
      intent,
      data: results,
      reply: 'I can help with worker rankings, activity, and feedback insights. Try asking about top workers, completed jobs, or reviews.'
    };
  }

  const reply = await aiService.summarizeResults(message, intent, results);

  return {
    success: true,
    intent,
    data: results,
    reply
  };
}

module.exports = {
  handleResidentAssistantQuery
};
