from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # Alpaca
    alpaca_api_key: str = ""
    alpaca_secret_key: str = ""
    alpaca_base_url: str = "https://data.alpaca.markets"

    # Finnhub
    finnhub_token: str = ""

    # FMP
    fmp_api_key: str = ""

    # Alpha Vantage
    alpha_vantage_key: str = ""

    # Twelve Data
    twelve_data_key: str = ""

    # Cache TTLs (seconds)
    price_cache_ttl: int = 30
    fundamental_cache_ttl: int = 86400

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:4173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
