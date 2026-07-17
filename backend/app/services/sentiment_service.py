"""
Sentiment Analysis Service
Source: Finnhub Company News → VADER sentiment scoring
"""
import httpx
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.config import get_settings
from app.models.analysis import SentimentData

settings = get_settings()
analyzer = SentimentIntensityAnalyzer()


async def get_sentiment_data(ticker: str) -> SentimentData:
    if not settings.finnhub_token:
        return SentimentData(
            score=0.0,
            news_count=0,
            latest_headlines=["No Finnhub token — sentimiento no disponible"],
        )

    try:
        # Fetch last 30 days of news
        from datetime import datetime, timedelta
        end = datetime.now()
        start = end - timedelta(days=30)
        url = (
            f"https://finnhub.io/api/v1/company-news"
            f"?symbol={ticker}"
            f"&from={start.strftime('%Y-%m-%d')}"
            f"&to={end.strftime('%Y-%m-%d')}"
            f"&token={settings.finnhub_token}"
        )
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(url)
            if r.status_code != 200:
                return SentimentData(score=0.0, news_count=0)
            news_list = r.json()
    except Exception:
        return SentimentData(score=0.0, news_count=0)

    if not news_list:
        return SentimentData(score=0.0, news_count=0)

    scores = []
    headlines = []
    positive = negative = neutral = 0

    for article in news_list[:30]:  # Cap at 30 articles
        headline = article.get("headline", "")
        summary = article.get("summary", "")
        text = f"{headline}. {summary}"

        vs = analyzer.polarity_scores(text)
        compound = vs["compound"]  # -1 to +1
        scores.append(compound)

        if compound >= 0.05:
            positive += 1
        elif compound <= -0.05:
            negative += 1
        else:
            neutral += 1

        if headline:
            headlines.append(headline[:120])  # Truncate

    avg_score = sum(scores) / len(scores) if scores else 0.0

    return SentimentData(
        score=round(avg_score, 4),
        news_count=len(scores),
        positive=positive,
        negative=negative,
        neutral=neutral,
        latest_headlines=headlines[:5],  # Top 5 for display
    )
