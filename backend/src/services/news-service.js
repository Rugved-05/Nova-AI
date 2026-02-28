import Parser from 'rss-parser';

const parser = new Parser();

const RSS_FEEDS = {
  general: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
  technology: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
  science: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
  business: 'https://feeds.bbci.co.uk/news/business/rss.xml',
  sports: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
  health: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
};

export async function getNews(category = 'general', count = 5) {
  const feedUrl = RSS_FEEDS[category] || RSS_FEEDS.general;
  try {
    const feed = await parser.parseURL(feedUrl);
    const articles = feed.items.slice(0, count).map((item) => ({
      title: item.title,
      link: item.link,
      source: feed.title,
      pubDate: item.pubDate,
    }));
    return { category, articles };
  } catch (err) {
    return { category, articles: [], error: err.message };
  }
}
